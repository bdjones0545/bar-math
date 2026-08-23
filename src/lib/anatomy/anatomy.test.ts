import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { MUSCLE_BY_ID, MUSCLES, musclesForDifficulty, type MuscleId } from "./muscles.ts";
import { MUSCLE_PATHS, muscleIdFromPath, pathsForMuscle, pathsForView } from "./paths.ts";
import { isCorrectPoke, makeAnatomyQuestion, makeSpeedPrompt } from "./game.ts";

describe("catalog", () => {
  it("covers the required front and back set", () => {
    const ids = MUSCLES.map((m) => m.id);
    for (const id of [
      "deltoid",
      "pectoralis_major",
      "biceps_brachii",
      "rectus_abdominis",
      "external_obliques",
      "quadriceps",
      "tibialis_anterior",
      "forearm_flexors",
      "trapezius",
      "posterior_deltoid",
      "triceps_brachii",
      "latissimus_dorsi",
      "erector_spinae",
      "gluteus_maximus",
      "hamstrings",
      "gastrocnemius",
      "soleus",
      "forearm_extensors",
    ] as MuscleId[]) {
      assert.ok(ids.includes(id), id);
    }
    assert.equal(MUSCLES.filter((m) => m.view === "front").length, 8);
    assert.equal(MUSCLES.filter((m) => m.view === "back").length, 10);
  });

  it("marks groups clearly", () => {
    for (const id of ["quadriceps", "hamstrings", "forearm_flexors", "forearm_extensors", "erector_spinae"] as MuscleId[]) {
      assert.equal(MUSCLE_BY_ID[id].group, true);
    }
    assert.equal(MUSCLE_BY_ID.deltoid.group, false);
  });
});

describe("paths", () => {
  it("every muscle has paths on its view", () => {
    for (const m of MUSCLES) {
      const paths = pathsForMuscle(m.id, m.view);
      assert.ok(paths.length >= 1, m.id);
    }
  });

  it("every path maps to a known muscle on the matching view", () => {
    const ids = new Set<string>();
    for (const p of MUSCLE_PATHS) {
      assert.ok(p.muscleId in MUSCLE_BY_ID, p.id);
      assert.equal(MUSCLE_BY_ID[p.muscleId].view, p.view, p.id);
      assert.equal(ids.has(p.id), false, "dup " + p.id);
      ids.add(p.id);
      assert.match(p.d, /^M/);
      assert.match(p.d, /Z$/);
    }
  });

  it("front and back path sets are disjoint by view", () => {
    const front = new Set(pathsForView("front").map((p) => p.muscleId));
    const back = new Set(pathsForView("back").map((p) => p.muscleId));
    for (const id of front) assert.equal(back.has(id), false, String(id));
  });

  it("hit mapping uses muscle id not path id", () => {
    assert.equal(muscleIdFromPath("deltoid_l"), "deltoid");
    assert.equal(muscleIdFromPath("deltoid_r"), "deltoid");
    assert.equal(muscleIdFromPath("rectus_abdominis"), "rectus_abdominis");
    assert.equal(muscleIdFromPath("nope"), null);
  });
});

describe("validation", () => {
  it("correct poke matches either side of the same muscle", () => {
    assert.equal(isCorrectPoke("deltoid", "deltoid"), true);
    assert.equal(isCorrectPoke("deltoid", "pectoralis_major"), false);
    assert.equal(isCorrectPoke("deltoid", null), false);
  });

  it("difficulty filters the pool", () => {
    const rookie = musclesForDifficulty("rookie").map((m) => m.id);
    assert.ok(rookie.includes("deltoid"));
    assert.ok(rookie.includes("gluteus_maximus"));
    assert.equal(rookie.includes("soleus"), false);
    assert.equal(rookie.includes("tibialis_anterior"), false);
    const athlete = musclesForDifficulty("athlete").map((m) => m.id);
    assert.ok(athlete.includes("latissimus_dorsi"));
    assert.equal(athlete.includes("soleus"), false);
    const coach = musclesForDifficulty("coach").map((m) => m.id);
    assert.ok(coach.includes("soleus"));
    assert.ok(coach.includes("posterior_deltoid"));
  });

  it("name mode always includes the correct answer among four unique labels", () => {
    for (const d of ["rookie", "athlete", "coach", "elite"] as const) {
      const q = makeAnatomyQuestion(d, "name");
      assert.equal(q.choices?.length, 4);
      const labels = new Set(q.choices!.map((c) => c.label));
      assert.equal(labels.size, 4);
      assert.ok(q.choices!.some((c) => c.id === q.muscleId));
    }
  });

  it("poke prompts stay view-accurate", () => {
    const q = makeAnatomyQuestion("athlete", "poke");
    assert.equal(MUSCLE_BY_ID[q.muscleId].view === "front" || MUSCLE_BY_ID[q.muscleId].view === "back", true);
    const speed = makeSpeedPrompt("athlete");
    assert.match(speed.prompt, /^POKE THE /);
  });
});
