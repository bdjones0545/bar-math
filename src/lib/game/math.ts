import {
  MAX_PLATES_PER_SIDE,
  barTotal,
  formatWeight,
  platesAreValid,
  sideTotal,
  specFor,
} from "./plates";
import type { Difficulty, Mode, Round, RoundKind, Unit } from "./types";

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function chance(p: number): boolean {
  return Math.random() < p;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function plateGroups(unit: Unit) {
  if (unit === "lb") {
    return {
      standardBig: 4500,
      big: [4500],
      mid: [3500, 2500],
      ten: 1000,
      five: 500,
      micro: [250],
    };
  }
  return {
    standardBig: 2000,
    big: [2500, 2000],
    mid: [1500],
    ten: 1000,
    five: 500,
    micro: [250, 125],
  };
}

export function randomSide(unit: Unit, difficulty: Difficulty): number[] {
  const g = plateGroups(unit);
  const plates: number[] = [];

  const maxBig = difficulty === "rookie" ? 3 : difficulty === "athlete" ? 4 : 5;
  const nBig = Math.floor(Math.random() * (maxBig + 1));
  for (let i = 0; i < nBig; i++) {
    if (unit === "kg" && chance(0.32)) plates.push(2500);
    else plates.push(g.standardBig);
  }

  if (chance(difficulty === "rookie" ? 0.42 : 0.5)) {
    if (unit === "lb" && difficulty === "rookie") plates.push(2500);
    else plates.push(pick(g.mid));
  }

  const tenChance = difficulty === "rookie" ? 0.38 : difficulty === "athlete" ? 0.52 : 0.42;
  if (chance(tenChance)) plates.push(g.ten);

  const fiveChance = difficulty === "rookie" ? 0.3 : difficulty === "athlete" ? 0.52 : 0.72;
  if (chance(fiveChance)) plates.push(g.five);

  const microChance =
    difficulty === "rookie" ? 0.06 : difficulty === "athlete" ? 0.34 : 0.74;
  if (chance(microChance)) {
    plates.push(g.micro[0]!);
    if (g.micro[1] && difficulty !== "rookie" && chance(0.4)) plates.push(g.micro[1]);
  }

  if ((difficulty === "coach" || difficulty === "elite") && !plates.some((c) => c <= g.five)) {
    plates.push(chance(0.55) ? g.five : g.micro[0]!);
  }
  if (difficulty === "elite" && !plates.some((c) => g.micro.includes(c)) && chance(0.6)) {
    plates.push(g.micro[0]!);
  }

  if (plates.length === 0) plates.push(g.standardBig);
  plates.sort((a, b) => b - a);
  const next = plates.slice(0, MAX_PLATES_PER_SIDE);
  return platesAreValid(unit, next) ? next : [g.standardBig];
}

function smallPlateHint(unit: Unit, plates: number[]): string | null {
  const has = (cents: number) => plates.includes(cents);
  if (unit === "lb") {
    if (has(250)) {
      return "SMALL PLATES MATTER. Adding a 2.5 LB plate to each side adds 5 LB TOTAL.";
    }
    if (has(500)) {
      return "SMALL PLATES MATTER. Adding a 5 LB plate to each side adds 10 LB TOTAL.";
    }
  } else {
    if (has(125)) {
      return "SMALL PLATES MATTER. Adding a 1.25 KG plate to each side adds 2.5 KG TOTAL.";
    }
    if (has(250)) {
      return "SMALL PLATES MATTER. Adding a 2.5 KG plate to each side adds 5 KG TOTAL.";
    }
  }
  return null;
}

export function makeRound(opts: {
  unit: Unit;
  difficulty: Difficulty;
  mode: Mode;
  kind: RoundKind;
  avoidCents?: number;
  shownPlates?: number[];
  trainerTitle?: string | null;
  hintChance?: number;
}): Round {
  const spec = specFor(opts.unit);
  let plates = opts.shownPlates?.slice() ?? [];
  if (!opts.shownPlates) {
    plates = randomSide(opts.unit, opts.difficulty);
    let tries = 0;
    while (
      opts.avoidCents !== undefined &&
      barTotal(spec.barCents, plates) === opts.avoidCents &&
      tries++ < 12
    ) {
      plates = randomSide(opts.unit, opts.difficulty);
    }
  }
  if (!platesAreValid(opts.unit, plates)) {
    plates = randomSide(opts.unit, opts.difficulty);
  }
  const targetCents = barTotal(spec.barCents, plates);
  const timedMs =
    opts.mode === "speed" ? null : opts.difficulty === "elite" ? 12000 : null;

  let hint: string | null = null;
  const smallHint = smallPlateHint(opts.unit, plates);
  const smallChance =
    opts.difficulty === "rookie" ? 1 : opts.difficulty === "athlete" ? 0.4 : 0.14;
  const genericChance =
    opts.hintChance ??
    (opts.difficulty === "rookie" ? 0.4 : opts.difficulty === "athlete" ? 0.1 : 0);

  if (opts.kind === "load" && smallHint && Math.random() < smallChance) {
    hint = smallHint;
  } else if (opts.kind === "load" && genericChance > 0 && Math.random() < genericChance) {
    const big = spec.plates.find((p) => p.cents === spec.barCents) ?? spec.plates[0]!;
    hint = `Remember: adding one ${big.label} ${spec.suffix} plate means adding ${big.label} ${spec.suffix} to EACH SIDE = ${formatWeight(big.cents * 2)} ${spec.suffix} total.`;
  } else if (opts.kind === "identify" && opts.difficulty === "rookie" && Math.random() < 0.4) {
    hint = `Count one side, double it, add the ${spec.barLabel} ${spec.suffix} bar.`;
  }

  return {
    id: uid(),
    kind: opts.kind,
    mode: opts.mode,
    targetCents,
    shownPlates: plates,
    startedAt: 0,
    attempts: 0,
    timedMs,
    hint,
    trainerTitle: opts.trainerTitle ?? null,
  };
}

export function explainLoad(
  unit: Unit,
  plates: number[],
): {
  lines: string[];
  shortcut: string;
} {
  const spec = specFor(unit);
  const side = sideTotal(plates);
  const total = barTotal(spec.barCents, plates);
  const s = spec.suffix;
  return {
    lines: [
      `${formatWeight(total)} ${s}`,
      `${spec.barLabel} ${s} bar`,
      `+ ${formatWeight(side)} ${s} left side`,
      `+ ${formatWeight(side)} ${s} right side`,
      `= ${formatWeight(total)} ${s}`,
    ],
    shortcut: `${spec.barLabel} + (${formatWeight(side)} × 2) = ${formatWeight(total)}`,
  };
}

export function comboPhrase(unit: Unit, plates: number[]): string {
  const spec = specFor(unit);
  if (plates.length === 0) return `Bar only`;
  const counts = new Map<string, number>();
  for (const c of plates) {
    const p = spec.plates.find((x) => x.cents === c);
    const label = p?.label ?? formatWeight(c);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [label, n] of counts) {
    parts.push(n === 1 ? label : `${n}×${label}`);
  }
  return `Each side: ${parts.join(" + ")}`;
}

export function commonLbLoads(): { title: string; plates: number[] }[] {
  return [
    { title: "Bar only", plates: [] },
    { title: "One plate", plates: [4500] },
    { title: "Two plates", plates: [4500, 4500] },
    { title: "Three plates", plates: [4500, 4500, 4500] },
    { title: "Four plates", plates: [4500, 4500, 4500, 4500] },
    { title: "Five plates", plates: [4500, 4500, 4500, 4500, 4500] },
    { title: "95", plates: [2500] },
    { title: "105", plates: [2500, 500] },
    { title: "115", plates: [2500, 1000] },
    { title: "125", plates: [2500, 1000, 500] },
    { title: "145", plates: [4500, 500] },
    { title: "150", plates: [4500, 500, 250] },
    { title: "155", plates: [4500, 1000] },
    { title: "165", plates: [4500, 1000, 500] },
    { title: "185", plates: [4500, 2500] },
    { title: "195", plates: [4500, 2500, 500] },
    { title: "205", plates: [4500, 2500, 1000] },
    { title: "215", plates: [4500, 2500, 1000, 500] },
    { title: "245", plates: [4500, 4500, 1000] },
    { title: "275", plates: [4500, 4500, 2500] },
    { title: "295", plates: [4500, 4500, 2500, 1000] },
    { title: "315", plates: [4500, 4500, 4500] },
    { title: "335", plates: [4500, 4500, 4500, 1000] },
    { title: "365", plates: [4500, 4500, 4500, 2500] },
    { title: "385", plates: [4500, 4500, 4500, 2500, 1000] },
    { title: "425", plates: [4500, 4500, 4500, 4500, 1000] },
  ];
}

export function commonKgLoads(): { title: string; plates: number[] }[] {
  return [
    { title: "Bar only", plates: [] },
    { title: "One plate", plates: [2000] },
    { title: "Two plates", plates: [2000, 2000] },
    { title: "Three plates", plates: [2000, 2000, 2000] },
    { title: "Four plates", plates: [2000, 2000, 2000, 2000] },
    { title: "Five plates", plates: [2000, 2000, 2000, 2000, 2000] },
    { title: "65", plates: [2000, 250] },
    { title: "70", plates: [2000, 500] },
    { title: "80", plates: [2000, 1000] },
    { title: "90", plates: [2000, 1000, 500] },
    { title: "100", plates: [2000, 1500, 500] },
    { title: "102.5", plates: [2000, 1500, 500, 125] },
    { title: "110", plates: [2000, 2000, 500] },
    { title: "120", plates: [2000, 2000, 1000] },
    { title: "150", plates: [2000, 2000, 2000, 500] },
    { title: "160", plates: [2000, 2000, 2000, 1000] },
    { title: "170", plates: [2500, 2500, 2500] },
    { title: "200", plates: [2500, 2500, 2500, 1500] },
  ];
}

export function trainerCurriculum(unit: Unit): { title: string; plates: number[] }[] {
  return unit === "kg" ? commonKgLoads() : commonLbLoads();
}

export function tutorialTarget(unit: Unit): { plates: number[]; total: number } {
  const spec = specFor(unit);
  const big = spec.plates.find((p) => p.cents === spec.barCents) ?? spec.plates[0]!;
  const plates = [big.cents, big.cents];
  return { plates, total: barTotal(spec.barCents, plates) };
}

export function tutorialDemo(unit: Unit): { plates: number[]; total: number } {
  const spec = specFor(unit);
  const big = spec.plates.find((p) => p.cents === spec.barCents) ?? spec.plates[0]!;
  const plates = [big.cents];
  return { plates, total: barTotal(spec.barCents, plates) };
}

export const CANONICAL_LOADS: { unit: Unit; label: string; plates: number[] }[] = [
  { unit: "lb", label: "45", plates: [] },
  { unit: "lb", label: "95", plates: [2500] },
  { unit: "lb", label: "135", plates: [4500] },
  { unit: "lb", label: "150", plates: [4500, 500, 250] },
  { unit: "lb", label: "185", plates: [4500, 2500] },
  { unit: "lb", label: "225", plates: [4500, 4500] },
  { unit: "lb", label: "275", plates: [4500, 4500, 2500] },
  { unit: "lb", label: "315", plates: [4500, 4500, 4500] },
  { unit: "lb", label: "405", plates: [4500, 4500, 4500, 4500] },
  { unit: "kg", label: "20", plates: [] },
  { unit: "kg", label: "60", plates: [2000] },
  { unit: "kg", label: "70", plates: [2000, 500] },
  { unit: "kg", label: "100", plates: [2000, 1500, 500] },
  { unit: "kg", label: "102.5", plates: [2000, 1500, 500, 125] },
  { unit: "kg", label: "140", plates: [2000, 2000, 2000] },
  { unit: "kg", label: "180", plates: [2000, 2000, 2000, 2000] },
  { unit: "kg", label: "220", plates: [2000, 2000, 2000, 2000, 2000] },
];
