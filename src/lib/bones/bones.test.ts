import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { BONE_BY_ID, BONES, bonesForDifficulty, type BoneId } from "./bones.ts";
import {
  BONE_PATHS,
  bbox,
  boneIdFromPath,
  pathsForBone,
  pathsForView,
  viewsForBone,
} from "./paths.ts";
import { isCorrectWhack, makeBoneQuestion, makeBoneSpeedPrompt } from "./game.ts";

const REQUIRED: BoneId[] = [
  "skull",
  "mandible",
  "clavicle",
  "scapula",
  "sternum",
  "ribs",
  "vertebral_column",
  "pelvis",
  "humerus",
  "radius",
  "ulna",
  "carpals",
  "metacarpals",
  "phalanges_hand",
  "femur",
  "patella",
  "tibia",
  "fibula",
  "tarsals",
  "metatarsals",
  "phalanges_foot",
];

describe("catalog", () => {
  it("covers the required bone set", () => {
    const ids = BONES.map((b) => b.id);
    for (const id of REQUIRED) assert.ok(ids.includes(id), id);
    assert.equal(BONES.length, REQUIRED.length);
  });

  it("marks groups clearly", () => {
    for (const id of [
      "ribs",
      "vertebral_column",
      "pelvis",
      "carpals",
      "metacarpals",
      "phalanges_hand",
      "tarsals",
      "metatarsals",
      "phalanges_foot",
    ] as BoneId[]) {
      assert.equal(BONE_BY_ID[id].group, true, id);
    }
    assert.equal(BONE_BY_ID.femur.group, false);
    assert.equal(BONE_BY_ID.tibia.group, false);
  });
});

describe("paths", () => {
  it("every bone has paths on at least its primary view", () => {
    for (const b of BONES) {
      const paths = pathsForBone(b.id, b.view);
      assert.ok(paths.length >= 1, b.id);
    }
  });

  it("every path maps to a known bone", () => {
    const ids = new Set<string>();
    for (const p of BONE_PATHS) {
      assert.ok(p.boneId in BONE_BY_ID, p.id);
      assert.equal(ids.has(p.id + p.view), false, "dup " + p.id + p.view);
      ids.add(p.id + p.view);
      assert.match(p.d, /^M/);
      assert.match(p.d, /Z$/);
    }
  });

  it("hit mapping uses canonical bone id not laterality", () => {
    assert.equal(boneIdFromPath("femur_l"), "femur");
    assert.equal(boneIdFromPath("femur_r"), "femur");
    assert.equal(boneIdFromPath("radius_l"), "radius");
    assert.equal(boneIdFromPath("ulna_r"), "ulna");
    assert.equal(boneIdFromPath("skull"), "skull");
    assert.equal(boneIdFromPath("nope"), null);
  });

  it("patella is anterior only", () => {
    assert.ok(viewsForBone("patella").includes("front"));
    assert.equal(viewsForBone("patella").includes("back"), false);
    assert.equal(pathsForView("back").some((p) => p.boneId === "patella"), false);
  });

  it("scapula and spine are posterior", () => {
    assert.deepEqual(viewsForBone("scapula"), ["back"]);
    assert.deepEqual(viewsForBone("vertebral_column"), ["back"]);
    assert.equal(pathsForView("front").some((p) => p.boneId === "scapula"), false);
  });

  it("mandible and sternum are anterior", () => {
    assert.deepEqual(viewsForBone("mandible"), ["front"]);
    assert.deepEqual(viewsForBone("sternum"), ["front"]);
  });

  it("radius is lateral of ulna on the figure's right arm", () => {
    const radius = BONE_PATHS.find((p) => p.id === "radius_l" && p.view === "front")!;
    const ulna = BONE_PATHS.find((p) => p.id === "ulna_l" && p.view === "front")!;
    const r = bbox(radius.d);
    const u = bbox(ulna.d);
    assert.ok(r.maxX <= u.minX + 0.5, `radius ${r.maxX} should be lateral of ulna ${u.minX}`);
  });

  it("fibula is lateral of tibia on the figure's right leg", () => {
    const fibula = BONE_PATHS.find((p) => p.id === "fibula_l" && p.view === "front")!;
    const tibia = BONE_PATHS.find((p) => p.id === "tibia_l" && p.view === "front")!;
    const f = bbox(fibula.d);
    const t = bbox(tibia.d);
    assert.ok(f.maxX <= t.minX + 0.5, `fibula ${f.maxX} should be lateral of tibia ${t.minX}`);
  });

  it("femur sits above the knee, tibia below, patella at the joint", () => {
    const femur = bbox(pathsForBone("femur", "front")[0]!.d);
    const tibia = bbox(pathsForBone("tibia", "front")[0]!.d);
    const patella = bbox(pathsForBone("patella", "front")[0]!.d);
    const pelvis = bbox(pathsForBone("pelvis", "front")[0]!.d);
    assert.ok(femur.maxY < tibia.minY + 8, "femur should not swallow tibia");
    assert.ok(patella.minY >= femur.maxY - 6, "patella at distal femur");
    assert.ok(patella.maxY <= tibia.minY + 6, "patella at proximal tibia");
    assert.ok(pelvis.maxY <= femur.minY + 8, "femur distinct from pelvis");
  });

  it("hand bones stack wrist → palm → fingers", () => {
    const carpals = bbox(pathsForBone("carpals", "front")[0]!.d);
    const metas = bbox(pathsForBone("metacarpals", "front")[0]!.d);
    const phal = bbox(pathsForBone("phalanges_hand", "front")[0]!.d);
    assert.ok(carpals.maxY <= metas.minY + 4);
    assert.ok(metas.maxY <= phal.minY + 4);
  });

  it("foot bones stack ankle → midfoot → toes", () => {
    const tarsals = bbox(pathsForBone("tarsals", "front")[0]!.d);
    const metas = bbox(pathsForBone("metatarsals", "front")[0]!.d);
    const phal = bbox(pathsForBone("phalanges_foot", "front")[0]!.d);
    assert.ok(tarsals.maxY <= metas.minY + 4);
    assert.ok(metas.maxY <= phal.minY + 4);
  });

  it("forearm stays lateral of the thigh", () => {
    const ulna = bbox(pathsForBone("ulna", "front")[0]!.d);
    const femur = bbox(pathsForBone("femur", "front")[0]!.d);
    const hand = bbox(pathsForBone("phalanges_hand", "front")[0]!.d);
    assert.ok(ulna.maxX <= femur.minX - 2, `ulna ${ulna.maxX} vs femur ${femur.minX}`);
    assert.ok(hand.maxX <= femur.minX - 2, `hand ${hand.maxX} vs femur ${femur.minX}`);
  });

  it("clavicle is distinct from scapula views", () => {
    assert.ok(viewsForBone("clavicle").includes("front"));
    assert.equal(viewsForBone("clavicle").includes("back"), false);
    const clav = bbox(pathsForBone("clavicle", "front")[0]!.d);
    const sternum = bbox(pathsForBone("sternum", "front")[0]!.d);
    assert.ok(clav.maxY <= sternum.minY + 8);
  });
});

describe("validation", () => {
  it("correct whack matches either side of the same bone", () => {
    assert.equal(isCorrectWhack("femur", "femur"), true);
    assert.equal(isCorrectWhack("femur", "tibia"), false);
    assert.equal(isCorrectWhack("femur", null), false);
  });

  it("difficulty filters the pool", () => {
    const rookie = bonesForDifficulty("rookie").map((b) => b.id);
    assert.ok(rookie.includes("femur"));
    assert.ok(rookie.includes("skull"));
    assert.ok(rookie.includes("clavicle"));
    assert.equal(rookie.includes("radius"), false);
    assert.equal(rookie.includes("fibula"), false);
    const athlete = bonesForDifficulty("athlete").map((b) => b.id);
    assert.ok(athlete.includes("fibula"));
    assert.ok(athlete.includes("sternum"));
    assert.equal(athlete.includes("radius"), false);
    const coach = bonesForDifficulty("coach").map((b) => b.id);
    assert.ok(coach.includes("radius"));
    assert.ok(coach.includes("ulna"));
    assert.ok(coach.includes("carpals"));
    assert.ok(coach.includes("tarsals"));
  });

  it("name mode always includes the correct answer among four unique labels", () => {
    for (const d of ["rookie", "athlete", "coach", "elite"] as const) {
      for (let i = 0; i < 8; i++) {
        const q = makeBoneQuestion(d, "name");
        assert.equal(q.choices?.length, 4);
        const labels = new Set(q.choices!.map((c) => c.label));
        assert.equal(labels.size, 4);
        assert.ok(q.choices!.some((c) => c.id === q.boneId));
      }
    }
  });

  it("whack prompts stay view-accurate", () => {
    const q = makeBoneQuestion("athlete", "whack");
    assert.ok(viewsForBone(q.boneId).includes(q.view));
    const speed = makeBoneSpeedPrompt("athlete");
    assert.match(speed.prompt, /^WHACK THE /);
  });
});
