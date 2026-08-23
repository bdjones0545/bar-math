export const LB_MODES = ["bar", "muscle", "bone"] as const;
export type LbMode = (typeof LB_MODES)[number];

export const LB_PERIODS = ["today", "week", "all"] as const;
export type LbPeriod = (typeof LB_PERIODS)[number];

export const LB_DIFFICULTIES = ["rookie", "athlete", "coach", "elite"] as const;
export type LbDifficulty = (typeof LB_DIFFICULTIES)[number];

export const LB_TZ = "UTC";
export const LB_LIMIT = 40;
export const NAME_MAX = 16;
export const ROUND_MIN_MS = 50_000;
export const ROUND_MAX_MS = 15 * 60_000;
export const STARTS_PER_HOUR = 20;
export const SUBMITS_PER_HOUR = 10;

const BLOCKED = [
  "fuck",
  "shit",
  "nigger",
  "nigga",
  "faggot",
  "rape",
  "porn",
  "slut",
  "cunt",
  "kike",
  "retard",
];

export function isLbMode(v: unknown): v is LbMode {
  return LB_MODES.includes(v as LbMode);
}

export function isLbPeriod(v: unknown): v is LbPeriod {
  return LB_PERIODS.includes(v as LbPeriod);
}

export function isLbDifficulty(v: unknown): v is LbDifficulty {
  return LB_DIFFICULTIES.includes(v as LbDifficulty);
}

export function periodStartUtc(period: LbPeriod, now = new Date()): Date | null {
  if (period === "all") return null;
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (period === "today") return start;
  const weekday = now.getUTCDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  start.setUTCDate(start.getUTCDate() - mondayOffset);
  return start;
}

export function hourWindowId(now = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}T${String(now.getUTCHours()).padStart(2, "0")}`;
}

export function sanitizeName(raw: unknown): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof raw !== "string") return { ok: false, error: "name" };
  const stripped = raw.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
  if (stripped.length < 2 || stripped.length > NAME_MAX) return { ok: false, error: "name" };
  if (!/^[\p{L}\p{N} .'_-]+$/u.test(stripped)) return { ok: false, error: "name" };
  const compact = stripped.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (BLOCKED.some((w) => compact.includes(w))) return { ok: false, error: "name" };
  return { ok: true, name: stripped };
}

export function accuracyOf(correct: number, incorrect: number): number {
  const asked = correct + incorrect;
  return asked === 0 ? 0 : Math.round((correct / asked) * 100);
}

export function scoreBounds(mode: LbMode): { maxCorrect: number; maxIncorrect: number; maxScore: number; minPer: number; maxPer: number } {
  if (mode === "bar") {
    return { maxCorrect: 50, maxIncorrect: 80, maxScore: 20000, minPer: 80, maxPer: 900 };
  }
  return { maxCorrect: 80, maxIncorrect: 80, maxScore: 2500, minPer: 8, maxPer: 35 };
}

export function validateResult(input: {
  mode: LbMode;
  score: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}): { ok: true } | { ok: false; error: string } {
  const { mode, score, correct, incorrect, accuracy } = input;
  if (![score, correct, incorrect, accuracy].every((n) => Number.isInteger(n))) {
    return { ok: false, error: "invalid" };
  }
  const b = scoreBounds(mode);
  if (correct < 0 || correct > b.maxCorrect) return { ok: false, error: "invalid" };
  if (incorrect < 0 || incorrect > b.maxIncorrect) return { ok: false, error: "invalid" };
  if (score < 0 || score > b.maxScore) return { ok: false, error: "invalid" };
  if (accuracy !== accuracyOf(correct, incorrect)) return { ok: false, error: "invalid" };
  if (correct === 0) {
    return score === 0 ? { ok: true } : { ok: false, error: "invalid" };
  }
  if (score < correct * b.minPer || score > correct * b.maxPer) return { ok: false, error: "invalid" };
  return { ok: true };
}

export function validateElapsed(ms: number): boolean {
  return ms >= ROUND_MIN_MS && ms <= ROUND_MAX_MS;
}

export interface BoardRow {
  rank: number;
  name: string;
  score: number;
  correct: number;
  accuracy: number;
  mine: boolean;
}

export interface Rankable {
  correct: number;
  accuracy: number;
  createdAt: number;
}

export function compareRank(a: Rankable, b: Rankable): number {
  if (b.correct !== a.correct) return b.correct - a.correct;
  if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
  return a.createdAt - b.createdAt;
}

export function rankIndex(entries: Rankable[], target: Rankable): number {
  const sorted = [...entries].sort(compareRank);
  return sorted.findIndex(
    (e) => e.correct === target.correct && e.accuracy === target.accuracy && e.createdAt === target.createdAt,
  );
}

export const MODE_LABEL: Record<LbMode, string> = {
  bar: "BAR MATH SPEED",
  muscle: "MUSCLE SPEED",
  bone: "BONE SPEED",
};

export const PERIOD_LABEL: Record<LbPeriod, string> = {
  today: "TODAY",
  week: "THIS WEEK",
  all: "ALL TIME",
};
