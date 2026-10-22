import type { Difficulty } from "../game/types.ts";
import type { Rng } from "../rng.ts";
import type { AnatomyView } from "../anatomy/muscles.ts";
import {
  BONE_BY_ID,
  BONES,
  bonesForDifficulty,
  displayBoneName,
  type BoneDef,
  type BoneId,
} from "./bones.ts";
import { viewsForBone } from "./paths.ts";

export type BoneKind = "whack" | "name";

export interface BoneChoice {
  id: BoneId;
  label: string;
}

export interface BoneQuestion {
  id: string;
  boneId: BoneId;
  kind: BoneKind;
  view: AnatomyView;
  prompt: string;
  fact: string;
  cue: string;
  choices: BoneChoice[] | null;
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

function labelFor(bone: BoneDef, difficulty: Difficulty): string {
  return displayBoneName(bone, difficulty);
}

function choicesFor(target: BoneDef, difficulty: Difficulty, rng: Rng): BoneChoice[] {
  const pool = bonesForDifficulty(difficulty).filter((b) => b.id !== target.id);
  const neighborIds = new Set(target.neighbors);
  const neighbors = pool.filter((b) => neighborIds.has(b.id));
  const rest = pool.filter((b) => !neighborIds.has(b.id));
  const picked: BoneDef[] = [];
  for (const n of shuffle(neighbors, rng)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  for (const n of shuffle(rest, rng)) {
    if (picked.length >= 3) break;
    picked.push(n);
  }
  const options = shuffle([target, ...picked.slice(0, 3)], rng);
  return options.map((b) => ({ id: b.id, label: labelFor(b, difficulty) }));
}

function viewFor(bone: BoneDef, difficulty: Difficulty, rng: Rng): AnatomyView {
  const available = viewsForBone(bone.id);
  if (available.length === 0) return bone.view;
  if (difficulty === "elite" && available.length > 1) return pick(available, rng);
  return available.includes(bone.view) ? bone.view : available[0]!;
}

export function makeBoneQuestion(
  difficulty: Difficulty,
  kind: BoneKind,
  avoidId?: BoneId,
  rng: Rng = Math.random,
): BoneQuestion {
  const pool = bonesForDifficulty(difficulty);
  const usable = avoidId ? pool.filter((b) => b.id !== avoidId) : pool;
  const bone = pick(usable.length ? usable : pool, rng);
  const view = viewFor(bone, difficulty, rng);
  if (kind === "name") {
    return {
      id: `name-${bone.id}`,
      boneId: bone.id,
      kind,
      view,
      prompt: "WHAT BONE IS THIS?",
      fact: bone.fact,
      cue: bone.cue,
      choices: choicesFor(bone, difficulty, rng),
    };
  }
  const name = difficulty === "rookie" ? bone.gymName : bone.name;
  return {
    id: `whack-${bone.id}`,
    boneId: bone.id,
    kind: "whack",
    view,
    prompt: `WHACK THE ${name.toUpperCase()}`,
    fact: bone.fact,
    cue: bone.cue,
    choices: null,
  };
}

export function makeBoneSpeedPrompt(
  difficulty: Difficulty,
  avoidId?: BoneId,
  rng: Rng = Math.random,
): BoneQuestion {
  const q = makeBoneQuestion(difficulty, "whack", avoidId, rng);
  const bone = BONE_BY_ID[q.boneId];
  return {
    ...q,
    prompt: `WHACK THE ${bone.speedName}`,
  };
}

/** A whack on a part (ilium) satisfies its parent prompt (pelvis). */
export function isCorrectWhack(target: BoneId, tapped: BoneId | null): boolean {
  if (tapped === null) return false;
  return tapped === target || BONE_BY_ID[tapped].parent === target;
}

export { BONES, BONE_BY_ID };
