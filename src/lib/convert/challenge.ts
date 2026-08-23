import type { Difficulty } from "../game/types.ts";
import { convert, formatResult, roundTo, UNITS, type ConvertUnit } from "./units.ts";

export interface ChallengePrompt {
  value: number;
  from: ConvertUnit;
  to: ConvertUnit;
  places: 0 | 1 | 2;
  min: Difficulty;
}

const RANK: Record<Difficulty, number> = {
  rookie: 0,
  athlete: 1,
  coach: 2,
  elite: 3,
};

const BANK: ChallengePrompt[] = [
  { value: 1, from: "kg", to: "lb", places: 1, min: "rookie" },
  { value: 10, from: "kg", to: "lb", places: 1, min: "rookie" },
  { value: 45, from: "lb", to: "kg", places: 1, min: "rookie" },
  { value: 100, from: "kg", to: "lb", places: 1, min: "rookie" },
  { value: 40, from: "yd", to: "m", places: 1, min: "rookie" },
  { value: 100, from: "m", to: "yd", places: 1, min: "rookie" },
  { value: 1000, from: "ml", to: "l", places: 0, min: "rookie" },
  { value: 1, from: "l", to: "ml", places: 0, min: "rookie" },
  { value: 1, from: "km", to: "mi", places: 1, min: "rookie" },
  { value: 60, from: "kg", to: "lb", places: 1, min: "athlete" },
  { value: 80, from: "kg", to: "lb", places: 1, min: "athlete" },
  { value: 120, from: "kg", to: "lb", places: 1, min: "athlete" },
  { value: 140, from: "kg", to: "lb", places: 1, min: "athlete" },
  { value: 225, from: "lb", to: "kg", places: 1, min: "athlete" },
  { value: 10, from: "yd", to: "m", places: 2, min: "athlete" },
  { value: 20, from: "yd", to: "m", places: 2, min: "athlete" },
  { value: 100, from: "yd", to: "m", places: 2, min: "athlete" },
  { value: 200, from: "m", to: "yd", places: 2, min: "athlete" },
  { value: 400, from: "m", to: "yd", places: 2, min: "athlete" },
  { value: 100, from: "kg", to: "lb", places: 2, min: "coach" },
  { value: 315, from: "lb", to: "kg", places: 2, min: "coach" },
  { value: 405, from: "lb", to: "kg", places: 2, min: "coach" },
  { value: 5, from: "km", to: "mi", places: 2, min: "coach" },
  { value: 26.2, from: "mi", to: "km", places: 2, min: "coach" },
  { value: 100, from: "cm", to: "in", places: 2, min: "coach" },
  { value: 12, from: "in", to: "cm", places: 1, min: "coach" },
  { value: 500, from: "g", to: "oz", places: 2, min: "coach" },
  { value: 16, from: "oz", to: "g", places: 0, min: "coach" },
  { value: 500, from: "ml", to: "floz", places: 1, min: "coach" },
  { value: 8, from: "floz", to: "ml", places: 0, min: "coach" },
  { value: 1, from: "gal", to: "l", places: 2, min: "coach" },
  { value: 2, from: "l", to: "gal", places: 2, min: "elite" },
  { value: 1, from: "cup", to: "ml", places: 0, min: "elite" },
  { value: 250, from: "ml", to: "cup", places: 2, min: "elite" },
  { value: 100, from: "ft", to: "m", places: 2, min: "elite" },
  { value: 6, from: "ft", to: "cm", places: 1, min: "elite" },
  { value: 2.5, from: "kg", to: "lb", places: 2, min: "elite" },
  { value: 2.2, from: "lb", to: "kg", places: 2, min: "elite" },
];

export interface ChallengeChoice {
  label: string;
  correct: boolean;
}

export interface ChallengeQuestion {
  id: string;
  valueLabel: string;
  fromLabel: string;
  toLabel: string;
  choices: ChallengeChoice[];
  answerLabel: string;
}

function poolFor(difficulty: Difficulty): ChallengePrompt[] {
  const rank = RANK[difficulty];
  const eligible = BANK.filter((p) => RANK[p.min] <= rank);
  if (difficulty === "rookie") return eligible.filter((p) => RANK[p.min] === 0);
  if (difficulty === "athlete") return eligible.filter((p) => RANK[p.min] <= 1);
  return eligible;
}

function uniqueChoices(correct: number, places: number): number[] {
  const base = roundTo(correct, places);
  const seen = new Set<string>([formatResult(base)]);
  const out = [base];
  const steps =
    places === 0
      ? [1, 2, 5, 10, -1, -2, 20]
      : places === 1
        ? [10, 20, 30, -10, 5, 15, -20]
        : [0.5, 1, 2, 5, 10, -1, -5, 0.25];
  for (const step of steps) {
    if (out.length >= 4) break;
    const next = roundTo(Math.max(0, base + step), places);
    const key = formatResult(next);
    if (seen.has(key) || next === base) continue;
    seen.add(key);
    out.push(next);
  }
  let bump = places === 0 ? 3 : places === 1 ? 7.5 : 0.75;
  while (out.length < 4) {
    const next = roundTo(Math.max(0, base + bump), places);
    const key = formatResult(next);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(next);
    }
    bump += places === 0 ? 2 : places === 1 ? 2.5 : 0.35;
  }
  return out.slice(0, 4);
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

export function makeChallengeQuestion(
  difficulty: Difficulty,
  avoidId?: string,
): ChallengeQuestion {
  const pool = poolFor(difficulty);
  const usable = avoidId ? pool.filter((p) => promptId(p) !== avoidId) : pool;
  const pick = usable[Math.floor(Math.random() * usable.length)] ?? pool[0]!;
  const raw = convert(pick.value, pick.from, pick.to);
  const answer = roundTo(raw, pick.places);
  const answerLabel = formatResult(answer);
  const nums = uniqueChoices(answer, pick.places);
  const choices = shuffle(nums).map((n) => ({
    label: formatResult(n),
    correct: formatResult(n) === answerLabel,
  }));
  if (!choices.some((c) => c.correct)) {
    choices[0] = { label: answerLabel, correct: true };
  }
  return {
    id: promptId(pick),
    valueLabel: formatResult(pick.value),
    fromLabel: UNITS[pick.from].label,
    toLabel: UNITS[pick.to].label,
    choices,
    answerLabel,
  };
}

function promptId(p: ChallengePrompt): string {
  return `${p.value}-${p.from}-${p.to}-${p.places}`;
}

export function expectedAnswer(p: ChallengePrompt): string {
  return formatResult(roundTo(convert(p.value, p.from, p.to), p.places));
}

export const CHALLENGE_BANK = BANK;
