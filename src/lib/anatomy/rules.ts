import type { Difficulty } from "../game/types.ts";

/**
 * How the anatomy games tighten as difficulty rises. The roster itself grows
 * via `min` on each muscle/bone; these are the rules around a question.
 */
export interface LabRules {
  /** Offer a "Show me" reveal after the first miss. */
  showMe: boolean;
  /** Misses before the answer is revealed. */
  revealAfterMisses: number;
  /** A reveal ends the question (no retry on the highlighted region). */
  oneShot: boolean;
  /** Per-question shot clock; null = untimed. */
  shotClockMs: number | null;
  /** Fat tap targets. */
  fatHit: boolean;
}

export function labRules(difficulty: Difficulty): LabRules {
  switch (difficulty) {
    case "rookie":
      return {
        showMe: true,
        revealAfterMisses: 2,
        oneShot: false,
        shotClockMs: null,
        fatHit: true,
      };
    case "athlete":
      return {
        showMe: true,
        revealAfterMisses: 2,
        oneShot: false,
        shotClockMs: null,
        fatHit: false,
      };
    case "coach":
      return {
        showMe: false,
        revealAfterMisses: 2,
        oneShot: false,
        shotClockMs: 12000,
        fatHit: false,
      };
    case "elite":
      return {
        showMe: false,
        revealAfterMisses: 1,
        oneShot: true,
        shotClockMs: 7000,
        fatHit: false,
      };
  }
}
