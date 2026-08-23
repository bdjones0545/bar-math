import type { Difficulty, PlateSpec, PlateSize, Unit, UnitSpec } from "./types";

export const LB: UnitSpec = {
  id: "lb",
  barCents: 4500,
  barLabel: "45",
  suffix: "LB",
  plates: [
    { cents: 4500, label: "45", size: "xl", ring: "#7a2e28" },
    { cents: 3500, label: "35", size: "lg", ring: "#2c4066" },
    { cents: 2500, label: "25", size: "md", ring: "#3d5a40" },
    { cents: 1000, label: "10", size: "sm", ring: "#c4bfb4" },
    { cents: 500, label: "5", size: "xs", ring: "#7a2e28" },
    { cents: 250, label: "2.5", size: "mini", ring: "#3d5a40" },
  ],
};

export const KG: UnitSpec = {
  id: "kg",
  barCents: 2000,
  barLabel: "20",
  suffix: "KG",
  plates: [
    { cents: 2500, label: "25", size: "xl", ring: "#7a2e28" },
    { cents: 2000, label: "20", size: "lg", ring: "#2c4066" },
    { cents: 1500, label: "15", size: "md", ring: "#8a7348" },
    { cents: 1000, label: "10", size: "sm", ring: "#3d5a40" },
    { cents: 500, label: "5", size: "xs", ring: "#c4bfb4" },
    { cents: 250, label: "2.5", size: "mini", ring: "#7a2e28" },
    { cents: 125, label: "1.25", size: "mini", ring: "#3d5a40" },
  ],
};

export function specFor(unit: Unit): UnitSpec {
  return unit === "kg" ? KG : LB;
}

export function formatWeight(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  if (frac === 0) return `${sign}${whole}`;
  if (frac === 50) return `${sign}${whole}.5`;
  if (frac === 25) return `${sign}${whole}.25`;
  if (frac === 75) return `${sign}${whole}.75`;
  const fracStr = frac.toString().padStart(2, "0").replace(/0+$/, "");
  return `${sign}${whole}.${fracStr}`;
}

export function parseWeightInput(raw: string): number | null {
  const t = raw.trim();
  if (!t || !/^\d+(\.\d{0,2})?$/.test(t)) return null;
  const [w, f = ""] = t.split(".");
  const whole = Number.parseInt(w, 10);
  if (!Number.isFinite(whole)) return null;
  const frac = Number.parseInt((f + "00").slice(0, 2), 10);
  if (!Number.isFinite(frac)) return null;
  return whole * 100 + frac;
}

export function plateByCents(unit: Unit, cents: number): PlateSpec | undefined {
  return specFor(unit).plates.find((p) => p.cents === cents);
}

export function sizeRank(size: PlateSize): number {
  const order: PlateSize[] = ["xl", "lg", "md", "sm", "xs", "mini"];
  return order.indexOf(size);
}

export function platesForDifficulty(unit: Unit, _difficulty?: Difficulty): PlateSpec[] {
  return specFor(unit).plates;
}

export function platesForUnit(unit: Unit): PlateSpec[] {
  return specFor(unit).plates;
}

export function sideTotal(plates: number[]): number {
  return plates.reduce((sum, c) => sum + c, 0);
}

export function barTotal(barCents: number, plates: number[]): number {
  return barCents + sideTotal(plates) * 2;
}

export function platesAreValid(unit: Unit, plates: number[]): boolean {
  const allowed = new Set(specFor(unit).plates.map((p) => p.cents));
  return plates.every((c) => allowed.has(c));
}

export const MAX_PLATES_PER_SIDE = 7;
