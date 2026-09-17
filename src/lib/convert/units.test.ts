import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CATEGORY_UNITS,
  UNITS,
  convert,
  formatIn,
  formatResult,
  formatTime,
  parseInput,
  quickRefs,
  roundTo,
  KG_IN_LB,
  type ConvertCategory,
  type ConvertUnit,
} from "./units.ts";
import { CHALLENGE_BANK, expectedAnswer, makeChallengeQuestion } from "./challenge.ts";

function close(actual: number, expected: number, eps = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= eps, `${actual} not within ${eps} of ${expected}`);
}

describe("mass", () => {
  it("kg → lb matches documented factor", () => {
    close(convert(1, "kg", "lb"), KG_IN_LB, 1e-10);
    assert.equal(formatResult(convert(100, "kg", "lb")), "220.46");
    assert.equal(formatResult(convert(60, "kg", "lb")), "132.28");
    assert.equal(formatResult(convert(80, "kg", "lb")), "176.37");
    assert.equal(formatResult(convert(120, "kg", "lb")), "264.55");
    assert.equal(formatResult(convert(140, "kg", "lb")), "308.65");
  });

  it("lb → kg", () => {
    close(convert(1, "lb", "kg"), 0.45359237, 1e-12);
    assert.equal(formatResult(convert(45, "lb", "kg")), "20.41");
    assert.equal(formatResult(convert(225, "lb", "kg")), "102.06");
  });

  it("g ↔ oz", () => {
    close(convert(28.349523125, "g", "oz"), 1, 1e-9);
    close(convert(1, "oz", "g"), 28.349523125, 1e-9);
    assert.equal(formatResult(convert(100, "g", "oz")), "3.53");
  });

  it("kg ↔ g", () => {
    assert.equal(convert(1, "kg", "g"), 1000);
    assert.equal(convert(500, "g", "kg"), 0.5);
  });
});

describe("length", () => {
  it("meters ↔ feet", () => {
    close(convert(1, "m", "ft"), 1 / 0.3048, 1e-12);
    close(convert(1, "ft", "m"), 0.3048, 1e-12);
  });

  it("meters ↔ yards", () => {
    assert.equal(formatResult(convert(40, "yd", "m")), "36.58");
    assert.equal(formatResult(convert(100, "m", "yd")), "109.36");
    assert.equal(formatResult(convert(200, "m", "yd")), "218.72");
    assert.equal(formatResult(convert(400, "m", "yd")), "437.45");
    assert.equal(formatResult(convert(10, "yd", "m")), "9.14");
    assert.equal(formatResult(convert(20, "yd", "m")), "18.29");
    assert.equal(formatResult(convert(100, "yd", "m")), "91.44");
  });

  it("km ↔ miles", () => {
    close(convert(1, "mi", "km"), 1.609344, 1e-12);
    assert.equal(formatResult(convert(1, "km", "mi")), "0.62");
    assert.equal(formatResult(convert(5, "km", "mi")), "3.11");
  });

  it("cm ↔ inches", () => {
    close(convert(2.54, "cm", "in"), 1, 1e-12);
    close(convert(1, "in", "cm"), 2.54, 1e-12);
    assert.equal(formatResult(convert(100, "cm", "in")), "39.37");
  });
});

describe("volume", () => {
  it("mL ↔ L", () => {
    assert.equal(convert(1000, "ml", "l"), 1);
    assert.equal(convert(2.5, "l", "ml"), 2500);
    assert.equal(formatResult(convert(1000, "ml", "l")), "1");
  });

  it("mL ↔ fluid ounces", () => {
    close(convert(1, "floz", "ml"), 29.5735295625, 1e-12);
    assert.equal(formatResult(convert(500, "ml", "floz")), "16.91");
  });

  it("gallons ↔ liters", () => {
    close(convert(1, "gal", "l"), 3.785411784, 1e-12);
    assert.equal(formatResult(convert(1, "gal", "l")), "3.79");
  });
});

describe("temperature (affine)", () => {
  it("freezing, boiling, body temp", () => {
    close(convert(0, "c", "f"), 32);
    close(convert(100, "c", "f"), 212);
    close(convert(98.6, "f", "c"), 37);
    close(convert(-40, "c", "f"), -40);
  });
  it("accepts negative input only for temperature", () => {
    assert.deepEqual(parseInput("-10", "c"), { ok: true, value: -10 });
    assert.deepEqual(parseInput("-10", "kg"), { ok: false, reason: "negative" });
  });
});

describe("speed and pace (inverse units)", () => {
  it("mph ↔ km/h ↔ m/s", () => {
    close(convert(10, "mph", "kmh"), 16.09344);
    close(convert(36, "kmh", "ms"), 10);
    close(convert(20, "mph", "ms"), 8.9408);
  });
  it("pace is the inverse of speed", () => {
    close(convert(6, "mph", "minmi"), 10); // 6 mph = 10:00/mi
    close(convert(10, "minmi", "mph"), 6);
    close(convert(5, "minkm", "kmh"), 12); // 5:00/km = 12 km/h
  });
  it("min/mi ↔ min/km", () => {
    // 8:00/mi is 4:58/km
    assert.equal(formatIn(convert(8, "minmi", "minkm"), "minkm"), "4:58");
    assert.equal(formatIn(convert(5, "minkm", "minmi"), "minmi"), "8:03");
  });
  it("zero pace does not divide by zero into NaN", () => {
    assert.equal(formatIn(convert(0, "minmi", "mph"), "mph"), "");
  });
});

describe("erg (Concept2 cubic)", () => {
  it("2:00/500m is about 203 W and round-trips", () => {
    const w = convert(2, "split500", "watts");
    close(w, 202.55, 0.01);
    assert.equal(formatIn(convert(w, "watts", "split500"), "split500"), "2:00");
  });
  it("1:45 split is the elite ~304 W", () => {
    close(convert(1.75, "split500", "watts"), 302.3, 0.1);
  });
});

describe("energy and force", () => {
  it("kcal ↔ kJ and N ↔ kgf ↔ lbf", () => {
    close(convert(500, "kcal", "kj"), 2092);
    close(convert(100, "kgf", "n"), 980.665);
    close(convert(1, "lbf", "n"), 4.4482216152605, 1e-9);
  });
});

describe("athlete input formats", () => {
  it("m:ss parses to decimal minutes", () => {
    assert.deepEqual(parseInput("7:30", "minmi"), { ok: true, value: 7.5 });
    assert.deepEqual(parseInput("1:45.5", "split500"), { ok: true, value: 1.7583333333333333 });
    assert.equal(parseInput("7:75", "minmi").ok, false);
  });
  it("feet and inches parse only when the unit is feet", () => {
    const fiveEleven = 5 + 11 / 12;
    assert.deepEqual(parseInput(`5'11"`, "ft"), { ok: true, value: fiveEleven });
    assert.deepEqual(parseInput("5'11", "ft"), { ok: true, value: fiveEleven });
    assert.deepEqual(parseInput("5 ft 11 in", "ft"), { ok: true, value: fiveEleven });
    assert.equal(parseInput("5'11", "m").ok, false);
    assert.equal(formatResult(convert(fiveEleven, "ft", "cm")), "180.34");
  });
  it("formats time to the nearest second", () => {
    assert.equal(formatTime(7.5), "7:30");
    assert.equal(formatTime(4.9667), "4:58");
    assert.equal(formatTime(0), "0:00");
    assert.equal(formatTime(Infinity), "");
  });
});

describe("catalog", () => {
  it("every category lists units of its own type, with a valid default pair", () => {
    for (const cat of Object.keys(CATEGORY_UNITS) as ConvertCategory[]) {
      for (const u of CATEGORY_UNITS[cat]) assert.equal(UNITS[u].category, cat, u);
    }
    assert.throws(() => convert(1, "kg", "m"));
    assert.throws(() => convert(1, "mph", "minmi") && convert(1, "mph", "c"));
  });
});

describe("round-trip", () => {
  const pairs: [ConvertUnit, ConvertUnit, number][] = [
    ["kg", "lb", 100],
    ["g", "oz", 50],
    ["m", "ft", 10],
    ["m", "yd", 100],
    ["km", "mi", 5],
    ["cm", "in", 30],
    ["ml", "l", 750],
    ["ml", "floz", 250],
    ["gal", "l", 2],
    ["mph", "minmi", 7.5],
    ["minkm", "ms", 4.5],
    ["f", "c", 72],
    ["split500", "watts", 2.1],
    ["kcal", "kj", 350],
    ["lbf", "kgf", 225],
  ];
  for (const [a, b, value] of pairs) {
    it(`${value} ${a} ↔ ${b}`, () => {
      const forth = convert(value, a, b);
      const back = convert(forth, b, a);
      close(back, value, 1e-9);
    });
  }
});

describe("format and parse", () => {
  it("never prints NaN or Infinity", () => {
    assert.equal(formatResult(Number.NaN), "");
    assert.equal(formatResult(Number.POSITIVE_INFINITY), "");
    assert.equal(formatResult(Number.NEGATIVE_INFINITY), "");
  });

  it("handles blank, invalid, negative, huge", () => {
    assert.equal(parseInput("").ok, false);
    assert.equal(parseInput("abc").ok, false);
    assert.deepEqual(parseInput("-4"), { ok: false, reason: "negative" });
    assert.deepEqual(parseInput("1e99"), { ok: false, reason: "invalid" });
    assert.equal(parseInput("1e99").ok, false);
    const huge = parseInput("1000000000001");
    assert.equal(huge.ok, false);
    assert.deepEqual(parseInput("220.46"), { ok: true, value: 220.46 });
  });
});

describe("quick refs", () => {
  it("uses the same engine as live conversion", () => {
    const refs = quickRefs();
    const weight = refs.find((g) => g.title === "Weight")!;
    assert.equal(weight.rows[2]?.right, "220.46 LB");
    const sprint = refs.find((g) => g.title === "Sprinting")!;
    assert.equal(sprint.rows[2]?.right, "36.58 M");
  });
});

describe("challenge", () => {
  it("every bank prompt has a finite practical answer", () => {
    for (const p of CHALLENGE_BANK) {
      const ans = expectedAnswer(p);
      assert.notEqual(ans, "");
      assert.notEqual(ans, "NaN");
      if (UNITS[p.to].format === "time")
        assert.match(ans, /^\d+:[0-5]\d$/, `${p.value} ${p.from}→${p.to}`);
      else assert.ok(Number.isFinite(Number(ans)), `${p.value} ${p.from}→${p.to}`);
    }
  });

  it("time-format prompts offer four distinct m:ss choices with the answer", () => {
    for (let i = 0; i < 40; i++) {
      const q = makeChallengeQuestion("elite");
      const labels = q.choices.map((c) => c.label);
      assert.equal(new Set(labels).size, 4, labels.join(","));
      assert.equal(q.choices.filter((c) => c.correct).length, 1);
      if (q.toLabel === "MIN/KM" || q.toLabel === "MIN/MI" || q.toLabel === "/500M") {
        for (const l of labels) assert.match(l, /^\d+:[0-5]\d$/, l);
      }
    }
  });

  it("builds four unique choices including the answer", () => {
    for (const d of ["rookie", "athlete", "coach", "elite"] as const) {
      const q = makeChallengeQuestion(d);
      assert.equal(q.choices.length, 4);
      const labels = new Set(q.choices.map((c) => c.label));
      assert.equal(labels.size, 4);
      assert.equal(q.choices.filter((c) => c.correct).length, 1);
      assert.ok(q.choices.some((c) => c.label === q.answerLabel));
    }
  });

  it("rookie 100 kg prompt rounds to a practical 1-decimal answer", () => {
    assert.equal(formatResult(roundTo(convert(100, "kg", "lb"), 1)), "220.5");
    assert.equal(formatResult(roundTo(convert(40, "yd", "m"), 1)), "36.6");
  });
});
