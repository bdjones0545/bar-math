import { formatWeight, specFor } from "./plates";
import type { AchievementDef, Difficulty, Unit } from "./types";

export const LEVELS = [
  { id: "beginner", name: "Beginner", xp: 0 },
  { id: "gym-rookie", name: "Gym Rookie", xp: 100 },
  { id: "athlete", name: "Athlete", xp: 350 },
  { id: "strength-athlete", name: "Strength Athlete", xp: 750 },
  { id: "bar-math-pro", name: "Bar Math Pro", xp: 1300 },
  { id: "coach", name: "Coach", xp: 2000 },
  { id: "bar-math-master", name: "Bar Math Master", xp: 3000 },
] as const;

export function levelForXp(xp: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  let next: (typeof LEVELS)[number] | null = LEVELS[1] ?? null;
  for (let i = 0; i < LEVELS.length; i++) {
    const lvl = LEVELS[i]!;
    if (xp >= lvl.xp) {
      current = lvl;
      next = LEVELS[i + 1] ?? null;
    }
  }
  const span = next ? next.xp - current.xp : 1;
  const into = xp - current.xp;
  const pct = next ? Math.min(100, Math.round((into / span) * 100)) : 100;
  return { current, next, pct, into, span };
}

export const DIFFICULTY_META: Record<
  Difficulty,
  { name: string; detail: string; xpMult: number }
> = {
  rookie: {
    name: "Rookie",
    detail: "Common gym weights. Calculation assistance on.",
    xpMult: 1,
  },
  athlete: {
    name: "Athlete",
    detail: "All standard plates. Less assistance.",
    xpMult: 1.5,
  },
  coach: {
    name: "Coach",
    detail: "Unusual combinations. Minimal hints.",
    xpMult: 2,
  },
  elite: {
    name: "Elite",
    detail: "Timed questions. No hints. Fast recognition.",
    xpMult: 2.5,
  },
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "one-plate", name: "One Plate Club", detail: "Hit the first big plate load." },
  { id: "two-plate", name: "Two Plate Club", detail: "Recognize the two-plate standard." },
  { id: "three-plate", name: "Three Plate Club", detail: "Lock in the three-plate total." },
  { id: "four-plate", name: "Four Plate Club", detail: "Call the four-plate load." },
  { id: "perfect-10", name: "Perfect 10", detail: "10 correct answers in a row." },
  {
    id: "human-calculator",
    name: "Human Calculator",
    detail: "25 questions with a perfect streak.",
  },
];

export function plateClubId(unit: Unit, targetCents: number): string | null {
  const spec = specFor(unit);
  const big = spec.plates.find((p) => p.cents === spec.barCents) ?? spec.plates[0]!;
  const one = spec.barCents + big.cents * 2;
  const two = spec.barCents + big.cents * 4;
  const three = spec.barCents + big.cents * 6;
  const four = spec.barCents + big.cents * 8;
  if (targetCents === one) return "one-plate";
  if (targetCents === two) return "two-plate";
  if (targetCents === three) return "three-plate";
  if (targetCents === four) return "four-plate";
  return null;
}

export function xpForCorrect(opts: {
  difficulty: Difficulty;
  attempts: number;
  elapsedMs: number;
  streak: number;
}): number {
  const base = opts.attempts === 1 ? 15 : 8;
  const mult = DIFFICULTY_META[opts.difficulty].xpMult;
  const speed = opts.attempts === 1 && opts.elapsedMs < 5000 ? 5 : 0;
  const streakBonus = Math.min(20, Math.max(0, opts.streak - 1) * 2);
  return Math.round(base * mult + speed + streakBonus);
}

export function formatDelta(deltaCents: number, unit: Unit): string {
  const spec = specFor(unit);
  const abs = formatWeight(Math.abs(deltaCents));
  if (deltaCents === 0) return "Exact.";
  if (deltaCents > 0) return `You need ${abs} ${spec.suffix} less.`;
  return `You need ${abs} ${spec.suffix} more.`;
}
