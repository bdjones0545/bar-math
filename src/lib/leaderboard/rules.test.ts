import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  accuracyOf,
  compareRank,
  periodStartUtc,
  sanitizeName,
  validateElapsed,
  validateResult,
} from "./rules.ts";

describe("leaderboard names", () => {
  it("accepts short gym names", () => {
    assert.equal(sanitizeName("Bryan").ok, true);
    const spaced = sanitizeName("  SPEED LAB ");
    assert.equal(spaced.ok, true);
    if (spaced.ok) assert.equal(spaced.name, "SPEED LAB");
  });
  it("rejects blank, long, and control characters", () => {
    assert.equal(sanitizeName("").ok, false);
    assert.equal(sanitizeName("A").ok, false);
    assert.equal(sanitizeName("x".repeat(17)).ok, false);
    assert.equal(sanitizeName("hi<script>").ok, false);
    assert.equal(sanitizeName("@@@").ok, false);
  });
  it("rejects blocked words", () => {
    assert.equal(sanitizeName("fuckthis").ok, false);
  });
});

describe("leaderboard scoring", () => {
  it("checks accuracy consistency", () => {
    assert.equal(accuracyOf(18, 1), 95);
    assert.deepEqual(validateResult({ mode: "muscle", score: 200, correct: 18, incorrect: 1, accuracy: 95 }), {
      ok: true,
    });
    assert.equal(
      validateResult({ mode: "muscle", score: 200, correct: 18, incorrect: 1, accuracy: 100 }).ok,
      false,
    );
  });
  it("rejects impossible scores", () => {
    assert.equal(validateResult({ mode: "bar", score: 999999, correct: 3, incorrect: 0, accuracy: 100 }).ok, false);
    assert.equal(validateResult({ mode: "muscle", score: 10, correct: 0, incorrect: 4, accuracy: 0 }).ok, false);
    assert.equal(validateResult({ mode: "bone", score: 1.5 as unknown as number, correct: 1, incorrect: 0, accuracy: 100 }).ok, false);
  });
  it("accepts plausible bar and muscle scores", () => {
    assert.equal(validateResult({ mode: "bar", score: 150, correct: 1, incorrect: 2, accuracy: 33 }).ok, true);
    assert.equal(validateResult({ mode: "muscle", score: 12, correct: 1, incorrect: 0, accuracy: 100 }).ok, true);
  });
  it("enforces round duration window", () => {
    assert.equal(validateElapsed(10_000), false);
    assert.equal(validateElapsed(60_000), true);
    assert.equal(validateElapsed(20 * 60_000), false);
  });
});

describe("leaderboard periods", () => {
  it("uses UTC day and Monday week starts", () => {
    const wed = new Date(Date.UTC(2026, 7, 19, 18, 0, 0));
    const today = periodStartUtc("today", wed);
    const week = periodStartUtc("week", wed);
    assert.equal(today?.toISOString(), "2026-08-19T00:00:00.000Z");
    assert.equal(week?.toISOString(), "2026-08-17T00:00:00.000Z");
    assert.equal(periodStartUtc("all", wed), null);
  });
});

describe("ranking", () => {
  it("orders by correct, then accuracy, then earlier time", () => {
    const a = { correct: 18, accuracy: 90, createdAt: 2 };
    const b = { correct: 18, accuracy: 94, createdAt: 3 };
    const c = { correct: 20, accuracy: 80, createdAt: 9 };
    const d = { correct: 18, accuracy: 94, createdAt: 1 };
    const list = [a, b, c, d].sort(compareRank);
    assert.deepEqual(list, [c, d, b, a]);
  });
});
