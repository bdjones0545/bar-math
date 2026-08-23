export type ConvertCategory = "mass" | "length" | "volume";

export type MassUnit = "kg" | "lb" | "g" | "oz";
export type LengthUnit = "m" | "ft" | "yd" | "km" | "mi" | "cm" | "in";
export type VolumeUnit = "ml" | "l" | "floz" | "cup" | "gal";
export type ConvertUnit = MassUnit | LengthUnit | VolumeUnit;

export interface UnitDef {
  id: ConvertUnit;
  category: ConvertCategory;
  label: string;
  name: string;
  /** Multiply by this to reach grams, meters, or milliliters. */
  toCanonical: number;
}

/** International avoirdupois pound, exact. */
export const LB_IN_KG = 0.45359237;
/** Documented kg→lb factor (1 / 0.45359237 truncated). */
export const KG_IN_LB = 2.2046226218;

export const UNITS: Record<ConvertUnit, UnitDef> = {
  kg: { id: "kg", category: "mass", label: "KG", name: "Kilograms", toCanonical: 1000 },
  g: { id: "g", category: "mass", label: "G", name: "Grams", toCanonical: 1 },
  lb: { id: "lb", category: "mass", label: "LB", name: "Pounds", toCanonical: LB_IN_KG * 1000 },
  oz: { id: "oz", category: "mass", label: "OZ", name: "Ounces", toCanonical: (LB_IN_KG * 1000) / 16 },
  m: { id: "m", category: "length", label: "M", name: "Meters", toCanonical: 1 },
  ft: { id: "ft", category: "length", label: "FT", name: "Feet", toCanonical: 0.3048 },
  yd: { id: "yd", category: "length", label: "YD", name: "Yards", toCanonical: 0.9144 },
  km: { id: "km", category: "length", label: "KM", name: "Kilometers", toCanonical: 1000 },
  mi: { id: "mi", category: "length", label: "MI", name: "Miles", toCanonical: 1609.344 },
  cm: { id: "cm", category: "length", label: "CM", name: "Centimeters", toCanonical: 0.01 },
  in: { id: "in", category: "length", label: "IN", name: "Inches", toCanonical: 0.0254 },
  ml: { id: "ml", category: "volume", label: "ML", name: "Milliliters", toCanonical: 1 },
  l: { id: "l", category: "volume", label: "L", name: "Liters", toCanonical: 1000 },
  floz: { id: "floz", category: "volume", label: "FL OZ", name: "Fluid ounces", toCanonical: 29.5735295625 },
  cup: { id: "cup", category: "volume", label: "CUP", name: "Cups", toCanonical: 236.5882365 },
  gal: { id: "gal", category: "volume", label: "GAL", name: "Gallons", toCanonical: 3785.411784 },
};

export const CATEGORY_UNITS: Record<ConvertCategory, ConvertUnit[]> = {
  mass: ["kg", "lb", "g", "oz"],
  length: ["m", "ft", "yd", "km", "mi", "cm", "in"],
  volume: ["ml", "l", "floz", "cup", "gal"],
};

export const CATEGORY_META: Record<ConvertCategory, { name: string; from: ConvertUnit; to: ConvertUnit }> = {
  mass: { name: "Weight", from: "kg", to: "lb" },
  length: { name: "Distance", from: "yd", to: "m" },
  volume: { name: "Volume", from: "ml", to: "l" },
};

export const MAX_INPUT = 1e12;

export function convert(value: number, from: ConvertUnit, to: ConvertUnit): number {
  const a = UNITS[from];
  const b = UNITS[to];
  if (a.category !== b.category) {
    throw new Error("Cannot convert across measurement types");
  }
  return (value * a.toCanonical) / b.toCanonical;
}

export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return "";
  const abs = Math.abs(n);
  let places = 2;
  if (abs >= 10000) places = 0;
  else if (abs >= 1000) places = 1;
  else if (abs > 0 && abs < 0.01) places = 4;
  else if (abs > 0 && abs < 0.1) places = 3;
  const rounded = Number(n.toFixed(places));
  const v = Object.is(rounded, -0) ? 0 : rounded;
  return String(v);
}

export function roundTo(n: number, places: number): number {
  const f = 10 ** places;
  const rounded = Math.round((n + Number.EPSILON) * f) / f;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export type ParseReason = "empty" | "invalid" | "negative" | "huge";

export function parseInput(raw: string): { ok: true; value: number } | { ok: false; reason: ParseReason } {
  const t = raw.trim().replace(/,/g, "");
  if (t === "" || t === "." || t === "-" || t === "-.") return { ok: false, reason: "empty" };
  if (!/^-?\d*\.?\d+$/.test(t)) return { ok: false, reason: "invalid" };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, reason: "invalid" };
  if (n < 0) return { ok: false, reason: "negative" };
  if (n > MAX_INPUT) return { ok: false, reason: "huge" };
  return { ok: true, value: n };
}

export const PARSE_MESSAGE: Record<ParseReason, string> = {
  empty: "—",
  invalid: "Enter a number",
  negative: "Use a positive number",
  huge: "Too large",
};

export interface QuickRef {
  title: string;
  rows: { left: string; right: string }[];
}

export function quickRefs(): QuickRef[] {
  const kgLb = (kg: number) => ({
    left: `${kg} KG`,
    right: `${formatResult(convert(kg, "kg", "lb"))} LB`,
  });
  const ydM = (yd: number) => ({
    left: `${yd} YD`,
    right: `${formatResult(convert(yd, "yd", "m"))} M`,
  });
  const mYd = (m: number) => ({
    left: `${m} M`,
    right: `${formatResult(convert(m, "m", "yd"))} YD`,
  });
  return [
    {
      title: "Weight",
      rows: [60, 80, 100, 120, 140].map(kgLb),
    },
    {
      title: "Sprinting",
      rows: [10, 20, 40, 100].map(ydM),
    },
    {
      title: "Track",
      rows: [100, 200, 400].map(mYd),
    },
  ];
}
