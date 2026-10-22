// One speed round, as the server can check it.
//
// A browser can say anything about its own score, so the leaderboard does not
// take the totals it is sent. A speed round draws every question from a seeded
// stream (src/lib/rng.ts) and records what the player answered. The server
// replays that log against the same generators, with the same grading and the
// same points, and the totals it posts are the ones IT computed. The game uses
// these functions too, so the two cannot drift: there is one definition of a
// question, a right answer, and the points it is worth.
//
// What this does not stop: a program that plays the round itself, answering
// correctly within the caps in rules.ts. It does stop numbers typed into a
// request, and answers that do not match the questions asked.

import { makeRound } from "../game/math.ts";
import { barTotal, MAX_PLATES_PER_SIDE, specFor } from "../game/plates.ts";
import type { Difficulty, Round, Unit } from "../game/types.ts";
import { isCorrectPoke, makeSpeedPrompt, MUSCLE_BY_ID } from "../anatomy/game.ts";
import type { AnatomyQuestion } from "../anatomy/game.ts";
import type { MuscleId } from "../anatomy/muscles.ts";
import { isCorrectWhack, makeBoneSpeedPrompt, BONE_BY_ID } from "../bones/game.ts";
import type { BoneQuestion } from "../bones/game.ts";
import type { BoneId } from "../bones/bones.ts";
import { seededRng, isSeed, type Rng } from "../rng.ts";
import { accuracyOf, scoreBounds, type LbMode } from "./rules.ts";

/** More entries than any real 60-second round produces; caps replay work. */
export const SPEED_LOG_MAX = 240;
/** A single answer that took longer than this did not happen inside a round. */
export const SPEED_ANSWER_MAX_MS = 120_000;

/**
 * One event in a speed round's log.
 *  - an answer: `a` is the loaded side's plates (load) or the total in cents
 *    (identify) for Bar Math, or the tapped muscle/bone id (null = missed) for
 *    the anatomy games; `ms` is how long that attempt took.
 *  - a unit switch (Bar Math only): the game regenerates the question in the
 *    new unit, so the replay must too.
 */
export type SpeedLogEntry = { a: number | number[] | string | null; ms: number } | { u: Unit };

// --- shared rules: the game and the replay both call these ------------------

export function barSpeedPoints(streak: number, elapsedMs: number): number {
  return 100 + streak * 10 + Math.max(0, 40 - Math.floor(elapsedMs / 200));
}

export function tapSpeedPoints(streak: number): number {
  return 10 + Math.min(20, streak * 2);
}

/** The next Bar Math speed question. `avoidCents` is the previous target. */
export function nextBarSpeedRound(
  rng: Rng,
  unit: Unit,
  difficulty: Difficulty,
  avoidCents?: number,
): Round {
  const kind = rng() < 0.5 ? "load" : "identify";
  return makeRound({ unit, difficulty, mode: "speed", kind, avoidCents, rng });
}

export const nextMuscleSpeedQuestion = (rng: Rng, difficulty: Difficulty, avoid?: MuscleId) =>
  makeSpeedPrompt(difficulty, avoid, rng);
export const nextBoneSpeedQuestion = (rng: Rng, difficulty: Difficulty, avoid?: BoneId) =>
  makeBoneSpeedPrompt(difficulty, avoid, rng);

// --- the replay -------------------------------------------------------------

export type ReplayResult =
  | {
      ok: true;
      correct: number;
      incorrect: number;
      score: number;
      accuracy: number;
      answeredMs: number;
    }
  | { ok: false; reason: string };

const isMs = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= SPEED_ANSWER_MAX_MS;

export function replaySpeedRound(input: {
  mode: LbMode;
  difficulty: Difficulty;
  unit: Unit;
  seed: number;
  log: unknown;
}): ReplayResult {
  const { mode, difficulty, seed, log } = input;
  if (!isSeed(seed)) return { ok: false, reason: "seed" };
  if (input.unit !== "lb" && input.unit !== "kg") return { ok: false, reason: "unit" };
  if (!Array.isArray(log) || log.length > SPEED_LOG_MAX) return { ok: false, reason: "log-size" };

  const rng = seededRng(seed);
  let correct = 0;
  let incorrect = 0;
  let score = 0;
  let streak = 0;
  let answeredMs = 0;

  if (mode === "bar") {
    let unit: Unit = input.unit;
    let round = nextBarSpeedRound(rng, unit, difficulty);
    for (const e of log as SpeedLogEntry[]) {
      if (e && typeof e === "object" && "u" in e) {
        if (e.u !== "lb" && e.u !== "kg") return { ok: false, reason: "unit" };
        unit = e.u;
        round = nextBarSpeedRound(rng, unit, difficulty, round.targetCents);
        continue;
      }
      if (!e || typeof e !== "object" || !("a" in e) || !isMs(e.ms))
        return { ok: false, reason: "entry" };
      const spec = specFor(unit);
      let loaded: number;
      if (round.kind === "load") {
        const plates = e.a;
        const real = new Set(spec.plates.map((p) => p.cents));
        if (
          !Array.isArray(plates) ||
          plates.length > MAX_PLATES_PER_SIDE ||
          !plates.every((c) => typeof c === "number" && real.has(c))
        ) {
          return { ok: false, reason: "answer-shape" };
        }
        loaded = barTotal(spec.barCents, plates);
      } else {
        if (typeof e.a !== "number" || !Number.isInteger(e.a) || e.a < 0 || e.a > 1e9) {
          return { ok: false, reason: "answer-shape" };
        }
        loaded = e.a;
      }
      answeredMs += e.ms;
      if (loaded === round.targetCents) {
        streak += 1;
        correct += 1;
        score += barSpeedPoints(streak, e.ms);
        round = nextBarSpeedRound(rng, unit, difficulty, round.targetCents);
      } else {
        incorrect += 1;
        streak = 0;
      }
    }
  } else {
    const isMuscle = mode === "muscle";
    const known: Record<string, unknown> = isMuscle ? MUSCLE_BY_ID : BONE_BY_ID;
    let q: AnatomyQuestion | BoneQuestion = isMuscle
      ? nextMuscleSpeedQuestion(rng, difficulty)
      : nextBoneSpeedQuestion(rng, difficulty);
    for (const e of log as SpeedLogEntry[]) {
      if (!e || typeof e !== "object" || !("a" in e) || !isMs(e.ms))
        return { ok: false, reason: "entry" };
      const tapped = e.a;
      if (tapped !== null && (typeof tapped !== "string" || !Object.hasOwn(known, tapped))) {
        return { ok: false, reason: "answer-shape" };
      }
      answeredMs += e.ms;
      const hit = isMuscle
        ? isCorrectPoke((q as AnatomyQuestion).muscleId, tapped as MuscleId | null)
        : isCorrectWhack((q as BoneQuestion).boneId, tapped as BoneId | null);
      if (hit) {
        streak += 1;
        correct += 1;
        score += tapSpeedPoints(streak);
        q = isMuscle
          ? nextMuscleSpeedQuestion(rng, difficulty, (q as AnatomyQuestion).muscleId)
          : nextBoneSpeedQuestion(rng, difficulty, (q as BoneQuestion).boneId);
      } else {
        incorrect += 1;
        streak = 0;
      }
    }
  }

  const b = scoreBounds(mode);
  if (correct > b.maxCorrect || incorrect > b.maxIncorrect || score > b.maxScore) {
    return { ok: false, reason: "over-cap" };
  }
  return {
    ok: true,
    correct,
    incorrect,
    score,
    accuracy: accuracyOf(correct, incorrect),
    answeredMs,
  };
}
