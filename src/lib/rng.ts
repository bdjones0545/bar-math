/** A source of uniform numbers in [0, 1) — `Math.random`, or a seeded stream. */
export type Rng = () => number;

/**
 * Seeded generator (mulberry32). A speed round draws every question from one of
 * these, so the server can regenerate the exact same questions from the seed
 * and grade the round itself instead of trusting the totals a browser reports.
 * Integer-only arithmetic: identical on every JS engine.
 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const isSeed = (v: unknown): v is number =>
  typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 0xffffffff;

export function newSeed(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return buf[0]!;
}
