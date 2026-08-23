import type { Difficulty } from "../game/types.ts";
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

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

function labelFor(muscle: MuscleDef, difficulty: Difficulty): string {
  return displayName(muscle, difficulty);
}

function choicesFor(target: MuscleDef, difficulty: Difficulty): AnatomyChoice[] {
  const pool = musclesForDifficulty(difficulty).filter((m) => m.id !== target.id);
  const neighborIds = new Set(target.neighbors);
  const neighbors = pool.filter((m) => neighborIds.has(m.id));
  const rest = pool.filter((m) => !neighborIds.has(m.id));
  const picked: MuscleDef[] = [];
  for (const n of shuffle(neighbors)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  for (const n of shuffle(rest)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  const options = shuffle([target, ...picked.slice(0, 3)]);
  return options.map((m) => ({ id: m.id, label: labelFor(m, difficulty) }));
}

export function makeAnatomyQuestion(
  difficulty: Difficulty,
  kind: AnatomyKind,
  avoidId?: MuscleId,
): AnatomyQuestion {
  const pool = musclesForDifficulty(difficulty);
  const usable = avoidId ? pool.filter((m) => m.id !== avoidId) : pool;
  const muscle = pick(usable.length ? usable : pool);
  if (kind === "name") {
    return {
      id: `name-${muscle.id}`,
      muscleId: muscle.id,
      kind,
      prompt: "WHAT MUSCLE IS THIS?",
      fact: muscle.fact,
      cue: muscle.cue,
      choices: choicesFor(muscle, difficulty),
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

export function makeSpeedPrompt(difficulty: Difficulty, avoidId?: MuscleId): AnatomyQuestion {
  const q = makeAnatomyQuestion(difficulty, "poke", avoidId);
  const muscle = MUSCLE_BY_ID[q.muscleId];
  return {
    ...q,
    prompt: `POKE THE ${muscle.speedName}`,
  };
}

export function isCorrectPoke(target: MuscleId, tapped: MuscleId | null): boolean {
  return tapped !== null && tapped === target;
}

export { MUSCLES, MUSCLE_BY_ID };
