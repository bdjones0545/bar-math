import { createHash, randomBytes, randomUUID } from "node:crypto";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getSql } from "../db.ts";
import {
  hourWindowId,
  periodStartUtc,
  sanitizeName,
  STARTS_PER_HOUR,
  SUBMITS_PER_HOUR,
  validateElapsed,
  validateResult,
  type BoardRow,
  type LbDifficulty,
  type LbMode,
  type LbPeriod,
} from "./rules.ts";

function requireDurableDb(): { ok: false; error: string } | null {
  const onVercel = process.env.VERCEL_ENV === "production" || process.env.VERCEL === "1";
  if (onVercel && !process.env.DATABASE_URL?.trim()) {
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

function callerIp(): string {
  try {
    const fwd = getRequestHeader("x-forwarded-for") || getRequestHeader("x-real-ip") || "";
    const ip = String(fwd).split(",")[0]?.trim() || "unknown";
    return ip.slice(0, 64);
  } catch {
    return "unknown";
  }
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
    const ipAllowed = await bumpRate(`start-ip:${callerIp()}`, 60);
    if (!ipAllowed) return { ok: false, error: "rate" };
    const sql = await getSql();
    const roundId = newId();
    const token = randomBytes(24).toString("base64url");
    await sql`
      insert into lb_rounds (id, token_hash, mode, difficulty, client_id)
      values (${roundId}, ${hashToken(token)}, ${input.mode}, ${input.difficulty}, ${input.clientId})
    `;
    return { ok: true, roundId, token };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function submitRoundRow(input: {
  token: string;
  clientId: string;
  name: unknown;
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}): Promise<
  | { ok: true; rank: number; period: "today"; name: string; score: number; correct: number }
  | { ok: false; error: string }
> {
  const blocked = requireDurableDb();
  if (blocked) return blocked;
  try {
    if (!/^[A-Za-z0-9_-]{8,64}$/.test(input.clientId)) return { ok: false, error: "invalid" };
    const named = sanitizeName(input.name);
    if (!named.ok) return named;
    const allowed = await bumpRate(`submit:${input.clientId}`, SUBMITS_PER_HOUR);
    if (!allowed) return { ok: false, error: "rate" };
    const ipAllowed = await bumpRate(`submit-ip:${callerIp()}`, 30);
    if (!ipAllowed) return { ok: false, error: "rate" };

    const sql = await getSql();
    const tokenHash = hashToken(input.token);
    const rounds = await sql<{
      id: string;
      mode: string;
      difficulty: string;
      client_id: string;
      started_at: string;
      submitted_at: string | null;
    }>`
      select id, mode, difficulty, client_id, started_at::text, submitted_at::text
      from lb_rounds
      where token_hash = ${tokenHash}
      limit 1
    `;
    const round = rounds[0];
    if (!round) return { ok: false, error: "invalid" };
    if (round.client_id !== input.clientId) return { ok: false, error: "invalid" };
    if (round.submitted_at) return { ok: false, error: "duplicate" };

    const started = Date.parse(String(round.started_at).replace(" ", "T"));
    if (!Number.isFinite(started) || !validateElapsed(Date.now() - started)) {
      return { ok: false, error: "invalid" };
    }

    const mode = round.mode as LbMode;
    const check = validateResult({
      mode,
      score: input.score,
      correct: input.correct,
      incorrect: input.incorrect,
      accuracy: input.accuracy,
    });
    if (!check.ok) return check;

    const claimed = await sql<{ id: string }>`
      update lb_rounds
      set submitted_at = now()
      where id = ${round.id} and submitted_at is null
      returning id
    `;
    if (!claimed[0]) return { ok: false, error: "duplicate" };

    const scoreId = newId();
    await sql`
      insert into lb_scores (
        id, round_id, client_id, display_name, mode, difficulty,
        score, correct, incorrect, accuracy
      )
      values (
        ${scoreId}, ${round.id}, ${input.clientId}, ${named.name}, ${round.mode}, ${round.difficulty},
        ${input.score}, ${input.correct}, ${input.incorrect}, ${input.accuracy}
      )
    `;

    const since = periodStartUtc("today")!.toISOString();
    const ranks = await sql<{ r: number }>`
      select r from (
        select id, rank() over (
          order by correct desc, accuracy desc, created_at asc
        ) as r
        from lb_scores
        where mode = ${round.mode}
          and difficulty = ${round.difficulty}
          and created_at >= ${since}::timestamptz
      ) ranked
      where id = ${scoreId}
    `;
    return {
      ok: true,
      rank: Number(ranks[0]?.r ?? 1),
      period: "today",
      name: named.name,
      score: input.score,
      correct: input.correct,
    };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}

export async function listBoard(input: {
  mode: LbMode;
  difficulty: LbDifficulty;
  period: LbPeriod;
  clientId: string;
  limit: number;
}): Promise<
  | { ok: true; rows: BoardRow[]; you: { rank: number; name: string; score: number } | null; generatedAt: string }
  | { ok: false; error: string }
> {
  const blocked = requireDurableDb();
  if (blocked) return blocked;
  try {
    const sql = await getSql();
    const since = periodStartUtc(input.period);
    const rows = since
      ? await sql<{
          id: string;
          client_id: string;
          display_name: string;
          score: number;
          correct: number;
          accuracy: number;
        }>`
          select id, client_id, display_name, score, correct, accuracy
          from lb_scores
          where mode = ${input.mode}
            and difficulty = ${input.difficulty}
            and created_at >= ${since.toISOString()}::timestamptz
          order by correct desc, accuracy desc, created_at asc
          limit ${input.limit}
        `
      : await sql<{
          id: string;
          client_id: string;
          display_name: string;
          score: number;
          correct: number;
          accuracy: number;
        }>`
          select id, client_id, display_name, score, correct, accuracy
          from lb_scores
          where mode = ${input.mode}
            and difficulty = ${input.difficulty}
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
      const found = since
        ? await sql<{ r: number; display_name: string; score: number }>`
            select r, display_name, score from (
              select client_id, display_name, score,
                rank() over (order by correct desc, accuracy desc, created_at asc) as r
              from lb_scores
              where mode = ${input.mode}
                and difficulty = ${input.difficulty}
                and created_at >= ${since.toISOString()}::timestamptz
            ) ranked
            where client_id = ${input.clientId}
            order by r asc
            limit 1
          `
        : await sql<{ r: number; display_name: string; score: number }>`
            select r, display_name, score from (
              select client_id, display_name, score,
                rank() over (order by correct desc, accuracy desc, created_at asc) as r
              from lb_scores
              where mode = ${input.mode}
                and difficulty = ${input.difficulty}
            ) ranked
            where client_id = ${input.clientId}
            order by r asc
            limit 1
          `;
      if (found[0]) {
        you = { rank: Number(found[0].r), name: found[0].display_name, score: found[0].score };
      }
    }

    return { ok: true, rows: board, you, generatedAt: new Date().toISOString() };
  } catch {
    return { ok: false, error: "unavailable" };
  }
}
