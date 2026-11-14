import type { Difficulty } from "../game/types.ts";
import type { Rng } from "../rng.ts";
import {
  MUSCLE_BY_ID,
  MUSCLES,
  displayName,
  musclesForDifficulty,
  type MuscleDef,
  type MuscleId,
} from "./muscles.ts";

export type AnatomyKind = "poke" | "name";

export interface AnatomyChoice {
  id: MuscleId;
  label: string;
}

export interface AnatomyQuestion {
  id: string;
  muscleId: MuscleId;
  kind: AnatomyKind;
  prompt: string;
  fact: string;
  cue: string;
  choices: AnatomyChoice[] | null;
}

function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pick<T>(items: T[], rng: Rng = Math.random): T {
  return items[Math.floor(rng() * items.length)]!;
}

function labelFor(muscle: MuscleDef, difficulty: Difficulty): string {
  return displayName(muscle, difficulty);
}

function choicesFor(target: MuscleDef, difficulty: Difficulty, rng: Rng): AnatomyChoice[] {
  const pool = musclesForDifficulty(difficulty).filter((m) => m.id !== target.id);
  const neighborIds = new Set(target.neighbors);
  const neighbors = pool.filter((m) => neighborIds.has(m.id));
  const rest = pool.filter((m) => !neighborIds.has(m.id));
  const picked: MuscleDef[] = [];
  for (const n of shuffle(neighbors, rng)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  for (const n of shuffle(rest, rng)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  const options = shuffle([target, ...picked.slice(0, 3)], rng);
  return options.map((m) => ({ id: m.id, label: labelFor(m, difficulty) }));
}

export function makeAnatomyQuestion(
  difficulty: Difficulty,
  kind: AnatomyKind,
  avoidId?: MuscleId,
  rng: Rng = Math.random,
): AnatomyQuestion {
  const pool = musclesForDifficulty(difficulty);
  const usable = avoidId ? pool.filter((m) => m.id !== avoidId) : pool;
  const muscle = pick(usable.length ? usable : pool, rng);
  if (kind === "name") {
    return {
      id: `name-${muscle.id}`,
      muscleId: muscle.id,
      kind,
      prompt: "WHAT MUSCLE IS THIS?",
      fact: muscle.fact,
      cue: muscle.cue,
      choices: choicesFor(muscle, difficulty, rng),
    };
  }
  const name = difficulty === "rookie" ? muscle.gymName : muscle.name;
  return {
    id: `poke-${muscle.id}`,
    muscleId: muscle.id,
    kind: "poke",
    prompt: `POKE THE ${name.toUpperCase()}`,
    fact: muscle.fact,
    cue: muscle.cue,
    choices: null,
  };
}

export function makeSpeedPrompt(
  difficulty: Difficulty,
  avoidId?: MuscleId,
  rng: Rng = Math.random,
): AnatomyQuestion {
  const q = makeAnatomyQuestion(difficulty, "poke", avoidId, rng);
  const muscle = MUSCLE_BY_ID[q.muscleId];
  return {
    ...q,
    prompt: `POKE THE ${muscle.speedName}`,
  };
}

/** A tap on a sub-muscle (rectus femoris) satisfies its parent prompt (quadriceps). */
export function isCorrectPoke(target: MuscleId, tapped: MuscleId | null): boolean {
  if (tapped === null) return false;
  return tapped === target || MUSCLE_BY_ID[tapped].parent === target;
}

export { MUSCLES, MUSCLE_BY_ID };
