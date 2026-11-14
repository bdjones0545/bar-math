import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LB_LIMIT, isLbDifficulty, isLbMode, isLbPeriod } from "./rules";
import { SPEED_LOG_MAX } from "./speed";

const modeZ = z.enum(["bar", "muscle", "bone"]);
const diffZ = z.enum(["rookie", "athlete", "coach", "elite"]);
const unitZ = z.enum(["lb", "kg"]);
// The shape only; what each answer MEANS is decided by the replay
// (src/lib/leaderboard/speed.ts), which rejects anything the game cannot send.
const logEntryZ = z.union([
  z.object({
    a: z.union([z.number(), z.array(z.number()).max(7), z.string().max(40), z.null()]),
    ms: z.number(),
  }),
  z.object({ u: unitZ }),
]);

export const startLbRound = createServerFn({ method: "POST" })
  .validator(
    z.object({
      mode: modeZ,
      difficulty: diffZ,
      clientId: z.string().min(8).max(64),
    }),
  )
  .handler(async ({ data }) => {
    const { startRoundRow } = await import("./db.server");
    return startRoundRow(data);
  });

export const submitLbScore = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(16).max(80),
      clientId: z.string().min(8).max(64),
      name: z.string().max(24),
      seed: z.number().int().min(0).max(0xffffffff),
      unit: unitZ,
      log: z.array(logEntryZ).max(SPEED_LOG_MAX),
    }),
  )
  .handler(async ({ data }) => {
    const { submitRoundRow } = await import("./db.server");
    return submitRoundRow(data);
  });

export const listLbBoard = createServerFn({ method: "GET" })
  .validator(
    z.object({
      mode: z.string(),
      difficulty: z.string(),
      period: z.string(),
      clientId: z.string().max(64),
    }),
  )
  .handler(async ({ data }) => {
    if (!isLbMode(data.mode) || !isLbDifficulty(data.difficulty) || !isLbPeriod(data.period)) {
      return { ok: false as const, error: "invalid" };
    }
    const { listBoard } = await import("./db.server");
    return listBoard({
      mode: data.mode,
      difficulty: data.difficulty,
      period: data.period,
      clientId: data.clientId,
      limit: LB_LIMIT,
    });
  });
