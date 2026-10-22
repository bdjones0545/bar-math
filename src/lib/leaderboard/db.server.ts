import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getSql, dbRelatedEnvKeys } from "../db.ts";
import {
  hourWindowId,
  periodStartUtc,
  RATE_RETAIN_HOURS,
  ROUND_MAX_MS,
  ROUND_MIN_MS,
  ROUND_RETAIN_MS,
  sanitizeName,
  STARTS_PER_HOUR,
  SUBMITS_PER_HOUR,
  validateResult,
  type BoardRow,
  type LbDifficulty,
  type LbMode,
  type LbPeriod,
} from "./rules.ts";
import { replaySpeedRound } from "./speed.ts";
import type { Difficulty, Unit } from "../game/types.ts";

/**
 * Answer time the log claims beyond the time the ticket was actually out, by
 * the database clock. Covers the gap between the ticket request and GO.
 */
const ANSWER_SLACK_MS = 5_000;

function redactDbError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw.replace(/postgres(?:ql)?:\/\/\S+/gi, "postgres://[redacted]");
}

function requireDurableDb(): { ok: false; error: string } | null {
  const onVercel = process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1";
  const present = Boolean(
    process.env.DATABASE_URL?.trim() ||
    process.env["DATABASE_URL"]?.trim() ||
    process.env.POSTGRES_URL?.trim(),
  );
  if (onVercel && !present) {
    const keys = dbRelatedEnvKeys();
    console.warn(
      `[lb] DATABASE_URL missing at runtime vercel=${process.env.VERCEL || "0"} env=${process.env.VERCEL_ENV || "none"} envCount=${Object.keys(process.env).length} dbKeys=${keys.join(",") || "(none)"}`,
    );
    return { ok: false, error: "unavailable" };
  }
  return null;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newId(): string {
  return randomUUID();
}

async function bumpRate(bucket: string, limit: number): Promise<boolean> {
  const sql = await getSql();
  const windowId = hourWindowId();
  const rows = await sql<{ count: number }>`
    insert into lb_rate (bucket, window_id, count)
    values (${bucket}, ${windowId}, 1)
    on conflict (bucket, window_id)
    do update set count = lb_rate.count + 1
    returning count
  `;
  return (rows[0]?.count ?? 1) <= limit;
}

/**
 * Rate-limit key for the caller's network address. Vercel sets x-real-ip
 * itself, so it wins over x-forwarded-for, which a client can prepend to.
 * The address is hashed with the hour so the table never holds raw IPs and
 * the key rotates with the window.
 */
function callerIpKey(): string {
  let ip = "unknown";
  try {
    const real = getRequestHeader("x-real-ip") || getRequestHeader("x-vercel-forwarded-for") || "";
    const fwd = getRequestHeader("x-forwarded-for") || "";
    ip = String(real).trim() || String(fwd).split(",")[0]?.trim() || "unknown";
  } catch {
    /* no request context (tests) */
  }
  return createHash("sha256").update(`${hourWindowId()}|${ip}`).digest("hex").slice(0, 32);
}

/**
 * Opportunistic housekeeping on the start path: drop rate windows older than
 * the retention and rounds that were started but never submitted. Cheap
 * (indexed), and it keeps both tables from growing without bound.
 */
async function purgeStale(): Promise<void> {
  const sql = await getSql();
  const keep = new Date(Date.now() - RATE_RETAIN_HOURS * 60 * 60_000);
  const keepWindow = hourWindowId(keep);
  await sql`delete from lb_rate where window_id < ${keepWindow}`;
  const deadBefore = new Date(Date.now() - ROUND_RETAIN_MS).toISOString();
  await sql`
    delete from lb_rounds
    where submitted_at is null and started_at < ${deadBefore}::timestamptz
  `;
}

export async function startRoundRow(input: {
  mode: LbMode;
  difficulty: LbDifficulty;
  clientId: string;
}): Promise<{ ok: true; roundId: string; token: string } | { ok: false; error: string }> {
  const blocked = requireDurableDb();
  if (blocked) return blocked;
  try {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.clientId)) return { ok: false, error: "invalid" };
    const allowed = await bumpRate(`start:${input.clientId}`, STARTS_PER_HOUR);
    if (!allowed) return { ok: false, error: "rate" };
    const ipAllowed = await bumpRate(`start-ip:${callerIpKey()}`, 60);
    if (!ipAllowed) return { ok: false, error: "rate" };
    const sql = await getSql();
    // Once in a while, not every start: the purge is idempotent and cheap.
    if (Math.random() < 0.1) await purgeStale().catch(() => undefined);
    const roundId = newId();
    const token = randomBytes(24).toString("base64url");
    await sql`
      insert into lb_rounds (id, token_hash, mode, difficulty, client_id)
      values (${roundId}, ${hashToken(token)}, ${input.mode}, ${input.difficulty}, ${input.clientId})
    `;
    return { ok: true, roundId, token };
  } catch (err) {
    console.error("[lb] startRound failed:", redactDbError(err));
    return { ok: false, error: "unavailable" };
  }
}

export async function submitRoundRow(input: {
  token: string;
  clientId: string;
  name: unknown;
  seed: number;
  unit: Unit;
  log: unknown;
}): Promise<
  | {
      ok: true;
      rank: number;
      period: "today";
      name: string;
      score: number;
      correct: number;
      incorrect: number;
    }
  | { ok: false; error: string }
> {
  const blocked = requireDurableDb();
  if (blocked) return blocked;
  try {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.clientId)) return { ok: false, error: "invalid" };
    // The name is checked before the ticket is spent, so a bad name can be fixed and resent.
    const named = sanitizeName(input.name);
    if (!named.ok) return named;
    const allowed = await bumpRate(`submit:${input.clientId}`, SUBMITS_PER_HOUR);
    if (!allowed) return { ok: false, error: "rate" };
    const ipAllowed = await bumpRate(`submit-ip:${callerIpKey()}`, 30);
    if (!ipAllowed) return { ok: false, error: "rate" };

    const sql = await getSql();
    const tokenHash = hashToken(input.token);
    // Spend the ticket FIRST and atomically, before judging anything: a round
    // that fails verification cannot be resent with edited answers. Elapsed
    // time is measured entirely on the database clock.
    const claimed = await sql<{
      id: string;
      mode: string;
      difficulty: string;
      elapsed_ms: number | string;
    }>`
      update lb_rounds
      set submitted_at = now()
      where token_hash = ${tokenHash}
        and client_id = ${input.clientId}
        and submitted_at is null
      returning id, mode, difficulty,
        (extract(epoch from (now() - started_at)) * 1000)::bigint as elapsed_ms
    `;
    const round = claimed[0];
    if (!round) {
      const seen = await sql<{ client_id: string; submitted: boolean }>`
        select client_id, (submitted_at is not null) as submitted
        from lb_rounds where token_hash = ${tokenHash} limit 1
      `;
      const mine = seen[0] && seen[0].client_id === input.clientId && seen[0].submitted;
      return { ok: false, error: mine ? "duplicate" : "invalid" };
    }

    const elapsed = Number(round.elapsed_ms);
    if (!Number.isFinite(elapsed) || elapsed < ROUND_MIN_MS) return { ok: false, error: "invalid" };
    if (elapsed > ROUND_MAX_MS) return { ok: false, error: "expired" };

    // The board's mode and difficulty come from the ticket, never the request.
    const mode = round.mode as LbMode;
    const replay = replaySpeedRound({
      mode,
      difficulty: round.difficulty as Difficulty,
      unit: input.unit,
      seed: input.seed,
      log: input.log,
    });
    if (!replay.ok) {
      console.warn(`[lb] unverified round ${round.id}: ${replay.reason}`);
      return { ok: false, error: "unverified" };
    }
    if (replay.answeredMs > elapsed + ANSWER_SLACK_MS) {
      console.warn(
        `[lb] unverified round ${round.id}: answers ${replay.answeredMs}ms > ticket ${elapsed}ms`,
      );
      return { ok: false, error: "unverified" };
    }
    const check = validateResult({ mode, ...replay });
    if (!check.ok) {
      console.warn(`[lb] unverified round ${round.id}: totals out of bounds`);
      return { ok: false, error: "unverified" };
    }

    const scoreId = newId();
    await sql`
      insert into lb_scores (
        id, round_id, client_id, display_name, mode, difficulty,
        score, correct, incorrect, accuracy
      )
      values (
        ${scoreId}, ${round.id}, ${input.clientId}, ${named.name}, ${round.mode}, ${round.difficulty},
        ${replay.score}, ${replay.correct}, ${replay.incorrect}, ${replay.accuracy}
      )
    `;

    const since = periodStartUtc("today")!;
    const rank = await bestRank({
      mode,
      difficulty: round.difficulty,
      since,
      clientId: input.clientId,
    });
    return {
      ok: true,
      rank: rank ?? 1,
      period: "today",
      name: named.name,
      score: replay.score,
      correct: replay.correct,
      incorrect: replay.incorrect,
    };
  } catch (err) {
    console.error("[lb] submitRound failed:", redactDbError(err));
    return { ok: false, error: "unavailable" };
  }
}

/**
 * Where a player's BEST run in a window ranks among every player's best: one
 * plus the number of other players with any run that beats it. Null when the
 * player has no run in the window.
 */
async function bestRank(input: {
  mode: string;
  difficulty: string;
  since: Date;
  clientId: string;
}): Promise<number | null> {
  const sql = await getSql();
  const since = input.since.toISOString();
  const rows = await sql<{ better: number | string }>`
    with mine as (
      select correct, accuracy, created_at from lb_scores
      where mode = ${input.mode} and difficulty = ${input.difficulty}
        and created_at >= ${since}::timestamptz and client_id = ${input.clientId}
      order by correct desc, accuracy desc, created_at asc
      limit 1
    )
    select count(distinct s.client_id) as better
    from lb_scores s, mine m
    where s.mode = ${input.mode} and s.difficulty = ${input.difficulty}
      and s.created_at >= ${since}::timestamptz
      and s.client_id <> ${input.clientId}
      and (s.correct > m.correct
        or (s.correct = m.correct and s.accuracy > m.accuracy)
        or (s.correct = m.correct and s.accuracy = m.accuracy and s.created_at < m.created_at))
  `;
  const exists = await sql<{ n: number | string }>`
    select count(*) as n from lb_scores
    where mode = ${input.mode} and difficulty = ${input.difficulty}
      and created_at >= ${since}::timestamptz and client_id = ${input.clientId}
  `;
  if (!Number(exists[0]?.n ?? 0)) return null;
  return Number(rows[0]?.better ?? 0) + 1;
}

export async function listBoard(input: {
  mode: LbMode;
  difficulty: LbDifficulty;
  period: LbPeriod;
  clientId: string;
  limit: number;
}): Promise<
  | {
      ok: true;
      rows: BoardRow[];
      you: { rank: number; name: string; score: number } | null;
      generatedAt: string;
    }
  | { ok: false; error: string }
> {
  const blocked = requireDurableDb();
  if (blocked) return blocked;
  try {
    const sql = await getSql();
    // "All time" is simply a window that starts at the epoch.
    const since = periodStartUtc(input.period) ?? new Date(0);
    // One row per player — their best run in the window — so a player who
    // plays twenty rounds holds one place, not twenty.
    const rows = await sql<{
      client_id: string;
      display_name: string;
      score: number;
      correct: number;
      accuracy: number;
    }>`
      select client_id, display_name, score, correct, accuracy from (
        select distinct on (client_id)
          client_id, display_name, score, correct, accuracy, created_at
        from lb_scores
        where mode = ${input.mode}
          and difficulty = ${input.difficulty}
          and created_at >= ${since.toISOString()}::timestamptz
        order by client_id, correct desc, accuracy desc, created_at asc
      ) best
      order by correct desc, accuracy desc, created_at asc
      limit ${input.limit}
    `;

    const board: BoardRow[] = rows.map((row, i) => ({
      rank: i + 1,
      name: row.display_name,
      score: row.score,
      correct: row.correct,
      accuracy: row.accuracy,
      mine: row.client_id === input.clientId,
    }));

    let you: { rank: number; name: string; score: number } | null = null;
    const mineOnBoard = board.find((r) => r.mine);
    if (mineOnBoard) {
      you = { rank: mineOnBoard.rank, name: mineOnBoard.name, score: mineOnBoard.score };
    } else if (/^[A-Za-z0-9_-]{8,64}$/.test(input.clientId)) {
      const rank = await bestRank({
        mode: input.mode,
        difficulty: input.difficulty,
        since,
        clientId: input.clientId,
      });
      if (rank !== null) {
        const best = await sql<{ display_name: string; score: number }>`
          select display_name, score from lb_scores
          where mode = ${input.mode} and difficulty = ${input.difficulty}
            and created_at >= ${since.toISOString()}::timestamptz
            and client_id = ${input.clientId}
          order by correct desc, accuracy desc, created_at asc
          limit 1
        `;
        if (best[0]) you = { rank, name: best[0].display_name, score: best[0].score };
      }
    }

    return { ok: true, rows: board, you, generatedAt: new Date().toISOString() };
  } catch (err) {
    console.error("[lb] listBoard failed:", redactDbError(err));
    return { ok: false, error: "unavailable" };
  }
}
