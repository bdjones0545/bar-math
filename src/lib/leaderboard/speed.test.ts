import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { seededRng } from "../rng.ts";
import { barTotal, specFor } from "../game/plates.ts";
import type { Difficulty, Round, Unit } from "../game/types.ts";
import { MUSCLE_BY_ID } from "../anatomy/game.ts";
import { musclesForDifficulty } from "../anatomy/muscles.ts";
import { BONE_BY_ID } from "../bones/game.ts";
import { bonesForDifficulty } from "../bones/bones.ts";
import {
  barSpeedPoints,
  nextBarSpeedRound,
  nextBoneSpeedQuestion,
  nextMuscleSpeedQuestion,
  replaySpeedRound,
  SPEED_LOG_MAX,
  tapSpeedPoints,
  type SpeedLogEntry,
} from "./speed.ts";

const DIFFS: Difficulty[] = ["rookie", "athlete", "coach", "elite"];

/**
 * A player who answers the questions the GAME shows them — drawn from the
 * same seeded stream the store uses — and gets some wrong. Returns the log the
 * game would record and the totals the game would display.
 */
function playBar(
  seed: number,
  unit: Unit,
  difficulty: Difficulty,
  answers: number,
  missEvery: number,
) {
  const rng = seededRng(seed);
  let round: Round = nextBarSpeedRound(rng, unit, difficulty);
  const log: SpeedLogEntry[] = [];
  let correct = 0,
    incorrect = 0,
    score = 0,
    streak = 0;
  for (let i = 1; i <= answers; i++) {
    const ms = 900 + ((i * 37) % 1400);
    const wantWrong = missEvery > 0 && i % missEvery === 0;
    const spec = specFor(unit);
    let loaded: number;
    if (round.kind === "load") {
      // A real player can load the side the question shows, or some other set.
      let plates = round.shownPlates;
      if (wantWrong) {
        plates = [spec.plates[0]!.cents];
        if (barTotal(spec.barCents, plates) === round.targetCents) plates = [spec.plates[1]!.cents];
      }
      log.push({ a: plates, ms });
      loaded = barTotal(spec.barCents, plates);
    } else {
      loaded = wantWrong ? round.targetCents + 500 : round.targetCents;
      log.push({ a: loaded, ms });
    }
    if (loaded !== round.targetCents) {
      incorrect++;
      streak = 0;
    } else {
      streak++;
      correct++;
      score += barSpeedPoints(streak, ms);
      round = nextBarSpeedRound(rng, unit, difficulty, round.targetCents);
    }
  }
  return { log, correct, incorrect, score };
}

function playTaps(
  mode: "muscle" | "bone",
  seed: number,
  difficulty: Difficulty,
  answers: number,
  missEvery: number,
) {
  const rng = seededRng(seed);
  const pool =
    mode === "muscle" ? musclesForDifficulty(difficulty) : bonesForDifficulty(difficulty);
  let target =
    mode === "muscle"
      ? nextMuscleSpeedQuestion(rng, difficulty).muscleId
      : nextBoneSpeedQuestion(rng, difficulty).boneId;
  const log: SpeedLogEntry[] = [];
  let correct = 0,
    incorrect = 0,
    score = 0,
    streak = 0;
  for (let i = 1; i <= answers; i++) {
    const wrong = missEvery > 0 && i % missEvery === 0;
    const decoy = pool.find(
      (p) =>
        p.id !== target &&
        (p as { parent?: string }).parent !== target &&
        (mode === "muscle" ? MUSCLE_BY_ID : BONE_BY_ID)[target as never],
    );
    const tapped = wrong ? (i % (missEvery * 2) === 0 ? null : decoy!.id) : target;
    log.push({ a: tapped, ms: 400 + (i % 5) * 120 });
    if (wrong) {
      incorrect++;
      streak = 0;
    } else {
      streak++;
      correct++;
      score += tapSpeedPoints(streak);
      target =
        mode === "muscle"
          ? nextMuscleSpeedQuestion(rng, difficulty, target as never).muscleId
          : nextBoneSpeedQuestion(rng, difficulty, target as never).boneId;
    }
  }
  return { log, correct, incorrect, score };
}

describe("seeded questions", () => {
  it("the same seed asks the same questions, a different seed does not", () => {
    const a = seededRng(42),
      b = seededRng(42),
      c = seededRng(43);
    const qa = Array.from({ length: 20 }, () => nextBarSpeedRound(a, "lb", "coach").targetCents);
    const qb = Array.from({ length: 20 }, () => nextBarSpeedRound(b, "lb", "coach").targetCents);
    const qc = Array.from({ length: 20 }, () => nextBarSpeedRound(c, "lb", "coach").targetCents);
    assert.deepEqual(qa, qb);
    assert.notDeepEqual(qa, qc);
  });

  it("stays inside [0, 1) and spreads out", () => {
    const r = seededRng(7);
    const xs = Array.from({ length: 5000 }, r);
    assert.ok(xs.every((x) => x >= 0 && x < 1));
    const mean = xs.reduce((s, x) => s + x, 0) / xs.length;
    assert.ok(Math.abs(mean - 0.5) < 0.02, `mean ${mean}`);
  });
});

describe("replaying an honest round gives the totals the game showed", () => {
  for (const difficulty of DIFFS) {
    for (const unit of ["lb", "kg"] as Unit[]) {
      it(`bar · ${difficulty} · ${unit}`, () => {
        for (let seed = 1; seed <= 40; seed++) {
          const played = playBar((seed * 2654435761) >>> 0, unit, difficulty, 30, 4);
          const r = replaySpeedRound({
            mode: "bar",
            difficulty,
            unit,
            seed: (seed * 2654435761) >>> 0,
            log: played.log,
          });
          assert.ok(r.ok, JSON.stringify(r));
          if (r.ok) {
            assert.equal(r.correct, played.correct);
            assert.equal(r.incorrect, played.incorrect);
            assert.equal(r.score, played.score);
          }
        }
      });
    }
    for (const mode of ["muscle", "bone"] as const) {
      it(`${mode} · ${difficulty}`, () => {
        for (let seed = 1; seed <= 40; seed++) {
          const played = playTaps(mode, seed, difficulty, 45, 5);
          const r = replaySpeedRound({ mode, difficulty, unit: "lb", seed, log: played.log });
          assert.ok(r.ok, JSON.stringify(r));
          if (r.ok) {
            assert.deepEqual(
              [r.correct, r.incorrect, r.score],
              [played.correct, played.incorrect, played.score],
            );
          }
        }
      });
    }
  }

  it("a unit switch mid-round regenerates the question exactly like the game", () => {
    const rng = seededRng(99);
    let round = nextBarSpeedRound(rng, "lb", "athlete");
    const log: SpeedLogEntry[] = [];
    const answer = (r: Round) => (r.kind === "load" ? r.shownPlates : r.targetCents);
    log.push({ a: answer(round), ms: 1500 });
    round = nextBarSpeedRound(rng, "lb", "athlete", round.targetCents);
    log.push({ u: "kg" });
    round = nextBarSpeedRound(rng, "kg", "athlete", round.targetCents);
    log.push({ a: answer(round), ms: 1500 });
    const r = replaySpeedRound({ mode: "bar", difficulty: "athlete", unit: "lb", seed: 99, log });
    assert.ok(r.ok && r.correct === 2 && r.incorrect === 0, JSON.stringify(r));
  });
});

describe("a forged round is not believed", () => {
  it("right answers to someone else's questions are graded as wrong", () => {
    const played = playBar(1234, "lb", "elite", 30, 0);
    const r = replaySpeedRound({
      mode: "bar",
      difficulty: "elite",
      unit: "lb",
      seed: 4321,
      log: played.log,
    });
    // Usually the answer TYPES stop lining up (a plate list where the real
    // question wants a number) and the round is refused outright. If they do
    // line up, an answer only scores when its total happens to equal the
    // question actually being asked — a few land by luck, not thirty.
    if (r.ok)
      assert.ok(
        r.correct <= 8 && r.correct < played.correct / 3,
        `matched ${r.correct} of ${played.correct}`,
      );
    else assert.equal(r.reason, "answer-shape");
    let refused = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const forged = replaySpeedRound({
        mode: "bar",
        difficulty: "elite",
        unit: "lb",
        seed: seed + 9000,
        log: played.log,
      });
      if (!forged.ok) refused++;
      else
        assert.ok(forged.correct < played.correct / 3, `seed ${seed}: matched ${forged.correct}`);
    }
    assert.ok(refused > 25, `only ${refused}/50 forged logs refused outright`);
  });

  it("the replay ignores what the client claims and grades the answers", () => {
    const played = playBar(5, "lb", "rookie", 10, 2);
    const r = replaySpeedRound({
      mode: "bar",
      difficulty: "rookie",
      unit: "lb",
      seed: 5,
      log: played.log,
    });
    assert.ok(r.ok && r.incorrect === played.incorrect && r.incorrect > 0);
  });

  it("answers the game could not have sent end the round as unverified", () => {
    const base = {
      mode: "bar" as const,
      difficulty: "coach" as const,
      unit: "lb" as const,
      seed: 8,
    };
    const first = nextBarSpeedRound(seededRng(8), "lb", "coach");
    const wrongShape = first.kind === "load" ? { a: 13500, ms: 900 } : { a: [4500], ms: 900 };
    for (const log of [
      [wrongShape],
      [{ a: first.kind === "load" ? [4500, 9999] : -5, ms: 900 }],
      [{ a: first.kind === "load" ? Array(8).fill(4500) : 1.5, ms: 900 }],
      [{ a: 13500, ms: -1 }],
      [{ a: 13500, ms: 999_999 }],
      [{ u: "stone" }],
      [{ nope: true }],
      "not a log",
    ]) {
      assert.equal(replaySpeedRound({ ...base, log }).ok, false, JSON.stringify(log));
    }
    assert.equal(replaySpeedRound({ ...base, seed: -1, log: [] }).ok, false);
    assert.equal(replaySpeedRound({ ...base, unit: "st" as Unit, log: [] }).ok, false);
  });

  it("a tap on something that is not in the body is refused", () => {
    for (const a of ["__proto__", "constructor", "not_a_muscle", 7]) {
      assert.equal(
        replaySpeedRound({
          mode: "muscle",
          difficulty: "rookie",
          unit: "lb",
          seed: 1,
          log: [{ a, ms: 500 }],
        }).ok,
        false,
        String(a),
      );
      assert.equal(
        replaySpeedRound({
          mode: "bone",
          difficulty: "rookie",
          unit: "lb",
          seed: 1,
          log: [{ a, ms: 500 }],
        }).ok,
        false,
        String(a),
      );
    }
  });

  it("more right answers than a person could give in a minute is over the cap", () => {
    const played = playBar(77, "lb", "rookie", 51, 0);
    const r = replaySpeedRound({
      mode: "bar",
      difficulty: "rookie",
      unit: "lb",
      seed: 77,
      log: played.log,
    });
    assert.deepEqual(r, { ok: false, reason: "over-cap" });
    const huge = Array.from({ length: SPEED_LOG_MAX + 1 }, () => ({ a: null, ms: 1 }));
    assert.equal(
      replaySpeedRound({ mode: "muscle", difficulty: "rookie", unit: "lb", seed: 1, log: huge }).ok,
      false,
    );
  });

  it("reports the answer time the log claims, for the server's wall-clock check", () => {
    const played = playTaps("muscle", 3, "athlete", 20, 0);
    const r = replaySpeedRound({
      mode: "muscle",
      difficulty: "athlete",
      unit: "lb",
      seed: 3,
      log: played.log,
    });
    assert.ok(r.ok);
    if (r.ok)
      assert.equal(
        r.answeredMs,
        played.log.reduce((s, e) => s + ("ms" in e ? e.ms : 0), 0),
      );
  });
});
