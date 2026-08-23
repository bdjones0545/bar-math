import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { LB_LIMIT, isLbDifficulty, isLbMode, isLbPeriod } from "./rules";

const modeZ = z.enum(["bar", "muscle", "bone"]);
const diffZ = z.enum(["rookie", "athlete", "coach", "elite"]);
const periodZ = z.enum(["today", "week", "all"]);

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
      score: z.number(),
      correct: z.number(),
      incorrect: z.number(),
      accuracy: z.number(),
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
