export type Unit = "lb" | "kg";
export type Difficulty = "rookie" | "athlete" | "coach" | "elite";
export type Mode = "load" | "identify" | "speed" | "trainer";
export type Screen = "home" | "tutorial" | "play" | "stats" | "settings" | "convert";
export type RoundKind = "load" | "identify";

export type PlateSize = "xl" | "lg" | "md" | "sm" | "xs" | "mini";

export interface PlateSpec {
  cents: number;
  label: string;
  size: PlateSize;
  ring: string;
}

export interface UnitSpec {
  id: Unit;
  barCents: number;
  barLabel: string;
  suffix: string;
  plates: PlateSpec[];
}

export interface LoadedPlate {
  id: string;
  cents: number;
}

export interface Round {
  id: string;
  kind: RoundKind;
  mode: Mode;
  targetCents: number;
  shownPlates: number[];
  startedAt: number;
  attempts: number;
  timedMs: number | null;
  hint: string | null;
  trainerTitle: string | null;
}

export interface SpeedSession {
  remainingMs: number;
  correct: number;
  incorrect: number;
  score: number;
  streak: number;
  bestStreak: number;
  running: boolean;
}

export interface Feedback {
  kind: "correct" | "wrong" | "timeout" | "math";
  loadedCents?: number;
  targetCents?: number;
  deltaCents?: number;
  xpGained?: number;
  streak?: number;
  explanation?: {
    lines: string[];
    shortcut: string;
  };
}

export interface AchievementDef {
  id: string;
  name: string;
  detail: string;
}

export const SAVE_VERSION = 1;
