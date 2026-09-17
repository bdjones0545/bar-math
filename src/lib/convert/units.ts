export type ConvertCategory =
  "mass" | "length" | "volume" | "speed" | "temperature" | "erg" | "energy" | "force";

export type MassUnit = "kg" | "lb" | "g" | "oz";
export type LengthUnit = "m" | "ft" | "yd" | "km" | "mi" | "cm" | "in";
export type VolumeUnit = "ml" | "l" | "floz" | "cup" | "gal";
/** Speed and pace share a dimension; pace units are the inverse of speed. */
export type SpeedUnit = "mph" | "kmh" | "ms" | "minmi" | "minkm";
export type TemperatureUnit = "f" | "c";
/** Rowing erg: Concept2's split ↔ watts relationship. */
export type ErgUnit = "split500" | "watts";
export type EnergyUnit = "kcal" | "kj";
export type ForceUnit = "n" | "lbf" | "kgf";
export type ConvertUnit =
  | MassUnit
  | LengthUnit
  | VolumeUnit
  | SpeedUnit
  | TemperatureUnit
  | ErgUnit
  | EnergyUnit
  | ForceUnit;

/** How a unit's value is written: a plain number, or minutes:seconds. */
export type UnitFormat = "number" | "time";

export interface UnitDef {
  id: ConvertUnit;
  category: ConvertCategory;
  label: string;
  name: string;
  format: UnitFormat;
  /** Fixed decimal places for display, when the unit is conventionally whole (watts). */
  places?: number;
  /** Value in this unit → the category's base unit. */
  toBase: (v: number) => number;
  /** Base unit → this unit. */
  fromBase: (v: number) => number;
}

/** International avoirdupois pound, exact. */
export const LB_IN_KG = 0.45359237;
/** Documented kg→lb factor (1 / 0.45359237 truncated). */
export const KG_IN_LB = 2.2046226218;
/** Standard gravity, exact. */
export const G0 = 9.80665;

const MILE_M = 1609.344;

function linear(factor: number) {
  return { toBase: (v: number) => v * factor, fromBase: (v: number) => v / factor };
}

/** Pace in minutes per `distanceM` ↔ metres per second. Zero pace is infinite speed; keep it finite. */
function pace(distanceM: number) {
  return {
    toBase: (v: number) => (v <= 0 ? Infinity : distanceM / (v * 60)),
    fromBase: (v: number) => (v <= 0 ? Infinity : distanceM / (v * 60)),
  };
}

function def(
  id: ConvertUnit,
  category: ConvertCategory,
  label: string,
  name: string,
  fns: { toBase: (v: number) => number; fromBase: (v: number) => number },
  format: UnitFormat = "number",
): UnitDef {
  return { id, category, label, name, format, ...fns };
}

/** Base units: g, m, mL, m/s, °C, watts, kJ, N. */
export const UNITS: Record<ConvertUnit, UnitDef> = {
  kg: def("kg", "mass", "KG", "Kilograms", linear(1000)),
  g: def("g", "mass", "G", "Grams", linear(1)),
  lb: def("lb", "mass", "LB", "Pounds", linear(LB_IN_KG * 1000)),
  oz: def("oz", "mass", "OZ", "Ounces", linear((LB_IN_KG * 1000) / 16)),

  m: def("m", "length", "M", "Meters", linear(1)),
  ft: def("ft", "length", "FT", "Feet", linear(0.3048)),
  yd: def("yd", "length", "YD", "Yards", linear(0.9144)),
  km: def("km", "length", "KM", "Kilometers", linear(1000)),
  mi: def("mi", "length", "MI", "Miles", linear(MILE_M)),
  cm: def("cm", "length", "CM", "Centimeters", linear(0.01)),
  in: def("in", "length", "IN", "Inches", linear(0.0254)),

  ml: def("ml", "volume", "ML", "Milliliters", linear(1)),
  l: def("l", "volume", "L", "Liters", linear(1000)),
  floz: def("floz", "volume", "FL OZ", "Fluid ounces", linear(29.5735295625)),
  cup: def("cup", "volume", "CUP", "Cups", linear(236.5882365)),
  gal: def("gal", "volume", "GAL", "Gallons", linear(3785.411784)),

  ms: def("ms", "speed", "M/S", "Meters per second", linear(1)),
  kmh: def("kmh", "speed", "KM/H", "Kilometers per hour", linear(1000 / 3600)),
  mph: def("mph", "speed", "MPH", "Miles per hour", linear(MILE_M / 3600)),
  minmi: def("minmi", "speed", "MIN/MI", "Minutes per mile", pace(MILE_M), "time"),
  minkm: def("minkm", "speed", "MIN/KM", "Minutes per kilometer", pace(1000), "time"),

  c: def("c", "temperature", "°C", "Celsius", { toBase: (v) => v, fromBase: (v) => v }),
  f: def("f", "temperature", "°F", "Fahrenheit", {
    toBase: (v) => ((v - 32) * 5) / 9,
    fromBase: (v) => (v * 9) / 5 + 32,
  }),

  // Concept2: watts = 2.80 / (seconds per metre)^3, with the split as the
  // time for 500 m. Written in minutes so it formats as m:ss like the monitor.
  watts: { ...def("watts", "erg", "W", "Watts", linear(1)), places: 0 },
  split500: def(
    "split500",
    "erg",
    "/500M",
    "Split per 500 m",
    {
      toBase: (v) => (v <= 0 ? Infinity : 2.8 / Math.pow((v * 60) / 500, 3)),
      fromBase: (v) => (v <= 0 ? Infinity : (500 * Math.cbrt(2.8 / v)) / 60),
    },
    "time",
  ),

  kj: def("kj", "energy", "KJ", "Kilojoules", linear(1)),
  kcal: def("kcal", "energy", "KCAL", "Kilocalories", linear(4.184)),

  n: def("n", "force", "N", "Newtons", linear(1)),
  kgf: def("kgf", "force", "KGF", "Kilograms-force", linear(G0)),
  lbf: def("lbf", "force", "LBF", "Pounds-force", linear(LB_IN_KG * G0)),
};

export const CATEGORY_UNITS: Record<ConvertCategory, ConvertUnit[]> = {
  mass: ["kg", "lb", "g", "oz"],
  length: ["m", "ft", "yd", "km", "mi", "cm", "in"],
  volume: ["ml", "l", "floz", "cup", "gal"],
  speed: ["mph", "kmh", "ms", "minmi", "minkm"],
  temperature: ["f", "c"],
  erg: ["split500", "watts"],
  energy: ["kcal", "kj"],
  force: ["n", "lbf", "kgf"],
};

export const CATEGORY_META: Record<
  ConvertCategory,
  { name: string; from: ConvertUnit; to: ConvertUnit; seed: string }
> = {
  mass: { name: "Weight", from: "kg", to: "lb", seed: "100" },
  length: { name: "Distance", from: "yd", to: "m", seed: "40" },
  speed: { name: "Pace", from: "minmi", to: "minkm", seed: "8:00" },
  temperature: { name: "Temp", from: "f", to: "c", seed: "98.6" },
  erg: { name: "Erg", from: "split500", to: "watts", seed: "2:00" },
  volume: { name: "Volume", from: "ml", to: "l", seed: "750" },
  energy: { name: "Energy", from: "kcal", to: "kj", seed: "500" },
  force: { name: "Force", from: "n", to: "kgf", seed: "2000" },
};

export const MAX_INPUT = 1e12;

export function convert(value: number, from: ConvertUnit, to: ConvertUnit): number {
  const a = UNITS[from];
  const b = UNITS[to];
  if (a.category !== b.category) {
    throw new Error("Cannot convert across measurement types");
  }
  if (from === to) return value;
  return b.fromBase(a.toBase(value));
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

/** Decimal minutes → m:ss (7.5 → "7:30"). Rounds to the nearest second. */
export function formatTime(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "";
  const total = Math.round(minutes * 60);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Format a value in a unit the way that unit is written. */
export function formatIn(n: number, unit: ConvertUnit): string {
  const u = UNITS[unit];
  if (u.format === "time") return formatTime(n);
  if (u.places !== undefined && Number.isFinite(n)) return String(roundTo(n, u.places));
  return formatResult(n);
}

export function roundTo(n: number, places: number): number {
  const f = 10 ** places;
  const rounded = Math.round((n + Number.EPSILON) * f) / f;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export type ParseReason = "empty" | "invalid" | "negative" | "huge";

/**
 * Parse what an athlete types. Besides plain numbers:
 *   "7:30"    → 7.5     (m:ss, for pace and split units)
 *   "5'11"    → 5.9167  (feet and inches; also 5'11" and 5 ft 11)
 * Temperature units accept negatives; nothing else does.
 */
export function parseInput(
  raw: string,
  unit?: ConvertUnit,
): { ok: true; value: number } | { ok: false; reason: ParseReason } {
  const t = raw.trim().replace(/,/g, "");
  if (t === "" || t === "." || t === "-" || t === "-.") return { ok: false, reason: "empty" };

  const time = t.match(/^(\d+):([0-5]?\d(?:\.\d+)?)$/);
  if (time) {
    const n = Number(time[1]) + Number(time[2]) / 60;
    return n > MAX_INPUT ? { ok: false, reason: "huge" } : { ok: true, value: n };
  }

  const feet = t.match(/^(\d+)\s*(?:'|ft)\s*(\d{1,2}(?:\.\d+)?)?\s*(?:"|in)?$/i);
  if (feet && unit === "ft") {
    const n = Number(feet[1]) + Number(feet[2] ?? 0) / 12;
    return n > MAX_INPUT ? { ok: false, reason: "huge" } : { ok: true, value: n };
  }

  if (!/^-?\d*\.?\d+$/.test(t)) return { ok: false, reason: "invalid" };
  const n = Number(t);
  if (!Number.isFinite(n)) return { ok: false, reason: "invalid" };
  const signed = unit !== undefined && UNITS[unit].category === "temperature";
  if (n < 0 && !signed) return { ok: false, reason: "negative" };
  if (Math.abs(n) > MAX_INPUT) return { ok: false, reason: "huge" };
  return { ok: true, value: n };
}

export const PARSE_MESSAGE: Record<ParseReason, string> = {
  empty: "—",
  invalid: "Enter a number",
  negative: "Use a positive number",
  huge: "Too large",
};

/** Placeholder hint for the input, per unit. */
export function inputHint(unit: ConvertUnit): string {
  if (UNITS[unit].format === "time") return "m:ss";
  if (unit === "ft") return `5'11"`;
  return "";
}

export interface QuickRef {
  title: string;
  rows: { left: string; right: string }[];
}

export function quickRefs(): QuickRef[] {
  const row = (value: number, from: ConvertUnit, to: ConvertUnit) => ({
    left: `${formatIn(value, from)} ${UNITS[from].label}`,
    right: `${formatIn(convert(value, from, to), to)} ${UNITS[to].label}`,
  });
  const feet = (ft: number, inches: number) => ({
    left: `${ft}'${inches}"`,
    right: `${formatResult(convert(ft + inches / 12, "ft", "cm"))} CM`,
  });
  return [
    { title: "Weight", rows: [60, 80, 100, 120, 140].map((v) => row(v, "kg", "lb")) },
    { title: "Bar loads", rows: [135, 185, 225, 275, 315, 405].map((v) => row(v, "lb", "kg")) },
    { title: "Sprinting", rows: [10, 20, 40, 100].map((v) => row(v, "yd", "m")) },
    { title: "Track", rows: [100, 200, 400].map((v) => row(v, "m", "yd")) },
    { title: "Pace", rows: [6, 7, 8, 9, 10].map((v) => row(v, "minmi", "minkm")) },
    { title: "Treadmill", rows: [6, 7.5, 9, 10, 12].map((v) => row(v, "mph", "minmi")) },
    {
      title: "Erg splits",
      rows: [1.75, 1.833, 2, 2.167, 2.5].map((v) => row(v, "split500", "watts")),
    },
    {
      title: "Heights",
      rows: [
        [5, 4],
        [5, 8],
        [5, 11],
        [6, 2],
        [6, 5],
      ].map(([f, i]) => feet(f!, i!)),
    },
    { title: "Heat", rows: [70, 80, 90, 100].map((v) => row(v, "f", "c")) },
  ];
}
