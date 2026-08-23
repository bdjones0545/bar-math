import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { explainLoad, makeRound, trainerCurriculum, tutorialTarget } from "./math";
import {
  barTotal,
  parseWeightInput,
  specFor,
} from "./plates";
import {
  ACHIEVEMENTS,
  DIFFICULTY_META,
  formatDelta,
  plateClubId,
  xpForCorrect,
} from "./progression";
import { sfx } from "./audio";
import type {
  Difficulty,
  Feedback,
  LoadedPlate,
  Mode,
  Round,
  Screen,
  SpeedSession,
  Unit,
} from "./types";
import { SAVE_VERSION } from "./types";
import type { LbMode } from "@/lib/leaderboard/rules";

const DIFFICULTIES: Difficulty[] = ["rookie", "athlete", "coach", "elite"];

function isDifficulty(v: unknown): v is Difficulty {
  return DIFFICULTIES.includes(v as Difficulty);
}

function isUnit(v: unknown): v is Unit {
  return v === "lb" || v === "kg";
}

function asCount(v: unknown, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;
}

let plateSeq = 1;

function newPlate(cents: number): LoadedPlate {
  plateSeq += 1;
  return { id: `p${plateSeq}`, cents };
}

export interface Toast {
  id: string;
  title: string;
  detail: string;
}

export interface GameState {
  hydrated: boolean;
  screen: Screen;
  tutorialStep: number;
  mode: Mode;
  unit: Unit;
  difficulty: Difficulty;
  muted: boolean;
  xp: number;
  gamesPlayed: number;
  correct: number;
  incorrect: number;
  currentStreak: number;
  longestStreak: number;
  fastestMs: number | null;
  bestSpeedScore: number;
  achievements: string[];
  tutorialComplete: boolean;
  round: Round | null;
  sidePlates: LoadedPlate[];
  identifyInput: string;
  feedback: Feedback | null;
  toasts: Toast[];
  speed: SpeedSession | null;
  trainerIndex: number;
  impact: number;
  roundStartedAt: number;
  eliteRemainingMs: number | null;
  anatomyCorrect: number;
  anatomyIncorrect: number;
  anatomyBestStreak: number;
  anatomyBestSpeed: number;
  boneCorrect: number;
  boneIncorrect: number;
  boneBestStreak: number;
  boneBestSpeed: number;
  clientId: string;
  playerName: string;
  lbFocus: LbMode | null;

  hydrateDone: () => void;
  setScreen: (screen: Screen) => void;
  setUnit: (unit: Unit) => void;
  setDifficulty: (d: Difficulty) => void;
  setMuted: (muted: boolean) => void;
  startTutorial: () => void;
  nextTutorial: () => void;
  skipTutorial: () => void;
  startMode: (mode: Mode) => void;
  goHome: () => void;
  addPlate: (cents: number) => void;
  removePlate: (id: string) => void;
  clearBar: () => void;
  setIdentifyInput: (v: string) => void;
  checkAnswer: () => void;
  dismissFeedback: () => void;
  nextRound: () => void;
  tick: (dtMs: number) => void;
  finishSpeed: () => void;
  dismissToast: (id: string) => void;
  resetProgress: () => void;
  recordAnatomyAnswer: (opts: { hit: boolean; xp: number; streak: number }) => void;
  setAnatomySpeedBest: (score: number) => void;
  recordBoneAnswer: (opts: { hit: boolean; xp: number; streak: number }) => void;
  setBoneSpeedBest: (score: number) => void;
  setClientId: (id: string) => void;
  setPlayerName: (name: string) => void;
  setLbFocus: (mode: LbMode | null) => void;
}

const emptySpeed = (): SpeedSession => ({
  remainingMs: 60000,
  correct: 0,
  incorrect: 0,
  score: 0,
  streak: 0,
  bestStreak: 0,
  running: true,
});

function beginRound(state: GameState, mode: Mode): Partial<GameState> {
  const kind = mode === "identify" || mode === "trainer" ? "identify" : "load";
  let round: Round;
  if (mode === "trainer") {
    const curriculum = trainerCurriculum(state.unit);
    const item = curriculum[state.trainerIndex % curriculum.length]!;
    round = makeRound({
      unit: state.unit,
      difficulty: state.difficulty,
      mode,
      kind: "identify",
      shownPlates: item.plates,
      trainerTitle: item.title,
      hintChance: 0,
    });
  } else if (mode === "speed") {
    const speedKind = Math.random() < 0.5 ? "load" : "identify";
    round = makeRound({
      unit: state.unit,
      difficulty: state.difficulty,
      mode,
      kind: speedKind,
      avoidCents: state.round?.targetCents,
    });
  } else {
    round = makeRound({
      unit: state.unit,
      difficulty: state.difficulty,
      mode,
      kind,
      avoidCents: state.round?.targetCents,
    });
  }
  round.startedAt = Date.now();
  return {
    round,
    sidePlates: [],
    identifyInput: "",
    feedback: null,
    roundStartedAt: Date.now(),
    eliteRemainingMs: round.timedMs,
    impact: 0,
  };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      screen: "home",
      tutorialStep: 0,
      mode: "load",
      unit: "lb",
      difficulty: "rookie",
      muted: false,
      xp: 0,
      gamesPlayed: 0,
      correct: 0,
      incorrect: 0,
      currentStreak: 0,
      longestStreak: 0,
      fastestMs: null,
      bestSpeedScore: 0,
      achievements: [],
      tutorialComplete: false,
      round: null,
      sidePlates: [],
      identifyInput: "",
      feedback: null,
      toasts: [],
      speed: null,
      trainerIndex: 0,
      impact: 0,
      roundStartedAt: 0,
      eliteRemainingMs: null,
      anatomyCorrect: 0,
      anatomyIncorrect: 0,
      anatomyBestStreak: 0,
      anatomyBestSpeed: 0,
      boneCorrect: 0,
      boneIncorrect: 0,
      boneBestStreak: 0,
      boneBestSpeed: 0,
      clientId: "",
      playerName: "",
      lbFocus: null,

      hydrateDone: () => set({ hydrated: true }),

      setScreen: (screen) => set({ screen }),

      setUnit: (unit) => {
        const s = get();
        if (s.screen === "play") {
          const next = {
            ...s,
            unit,
            sidePlates: [],
            identifyInput: "",
            feedback: null,
            trainerIndex: 0,
          };
          set({
            unit,
            sidePlates: [],
            identifyInput: "",
            feedback: null,
            trainerIndex: 0,
            ...beginRound(next as GameState, s.mode),
          });
          return;
        }
        set({
          unit,
          sidePlates: [],
          identifyInput: "",
          feedback: null,
          trainerIndex: 0,
        });
      },

      setDifficulty: (difficulty) => {
        const s = get();
        if (s.screen === "play" && s.mode !== "trainer") {
          set({
            difficulty,
            ...beginRound({ ...s, difficulty } as GameState, s.mode),
          });
          return;
        }
        set({ difficulty });
      },

      setMuted: (muted) => set({ muted }),

      startTutorial: () =>
        set({
          screen: "tutorial",
          tutorialStep: 0,
          mode: "load",
          sidePlates: [],
          feedback: null,
          identifyInput: "",
        }),

      nextTutorial: () => {
        const step = get().tutorialStep;
        if (step >= 1) {
          const unit = get().unit;
          const t = tutorialTarget(unit);
          const round = makeRound({
            unit,
            difficulty: "rookie",
            mode: "load",
            kind: "load",
            shownPlates: t.plates,
            trainerTitle: "Now you try",
            hintChance: 1,
          });
          round.targetCents = t.total;
          round.startedAt = Date.now();
          set({
            screen: "play",
            mode: "load",
            tutorialStep: 2,
            round,
            sidePlates: [],
            feedback: null,
            roundStartedAt: Date.now(),
            eliteRemainingMs: null,
          });
          return;
        }
        set({ tutorialStep: step + 1 });
      },

      skipTutorial: () =>
        set({
          tutorialComplete: true,
          screen: "home",
          tutorialStep: 0,
        }),

      startMode: (mode) => {
        const s = get();
        if (!s.tutorialComplete && mode === "load") {
          get().startTutorial();
          return;
        }
        const next = {
          ...s,
          screen: "play" as const,
          mode,
          gamesPlayed: s.gamesPlayed + 1,
          currentStreak: mode === "speed" ? 0 : s.currentStreak,
          speed: mode === "speed" ? emptySpeed() : null,
          trainerIndex: mode === "trainer" ? 0 : s.trainerIndex,
          feedback: null,
        };
        set({
          screen: "play",
          mode,
          gamesPlayed: next.gamesPlayed,
          currentStreak: next.currentStreak,
          speed: next.speed,
          trainerIndex: next.trainerIndex,
          feedback: null,
          ...beginRound(next as GameState, mode),
        });
      },

      goHome: () =>
        set({
          screen: "home",
          round: null,
          feedback: null,
          speed: null,
          sidePlates: [],
          identifyInput: "",
          eliteRemainingMs: null,
        }),

      addPlate: (cents) => {
        const s = get();
        if (s.sidePlates.length >= 7) return;
        const allowed = specFor(s.unit).plates;
        if (!allowed.some((p) => p.cents === cents)) return;
        sfx.plate();
        set({
          sidePlates: [...s.sidePlates, newPlate(cents)],
          impact: s.impact + 1,
        });
      },

      removePlate: (id) => {
        sfx.remove();
        set({ sidePlates: get().sidePlates.filter((p) => p.id !== id) });
      },

      clearBar: () => {
        sfx.click();
        set({ sidePlates: [] });
      },

      setIdentifyInput: (identifyInput) => set({ identifyInput }),

      checkAnswer: () => {
        const s = get();
        const round = s.round;
        if (!round || s.feedback) return;
        const spec = specFor(s.unit);
        let loadedCents: number;
        if (round.kind === "load") {
          loadedCents = barTotal(
            spec.barCents,
            s.sidePlates.map((p) => p.cents),
          );
        } else {
          const parsed = parseWeightInput(s.identifyInput);
          if (parsed === null) return;
          loadedCents = parsed;
        }

        const attempts = round.attempts + 1;
        set({ round: { ...round, attempts } });

        if (loadedCents === round.targetCents) {
          const elapsed = Date.now() - (s.roundStartedAt || Date.now());
          const nextStreak = (s.speed?.running ? s.speed.streak : s.currentStreak) + 1;
          const xp = xpForCorrect({
            difficulty: s.difficulty,
            attempts,
            elapsedMs: elapsed,
            streak: nextStreak,
          });
          const platesForExplain =
            round.kind === "load"
              ? s.sidePlates.map((p) => p.cents)
              : round.shownPlates;
          const explanation = explainLoad(s.unit, platesForExplain);
          const unlocked: string[] = [];
          const club = plateClubId(s.unit, round.targetCents);
          if (club && !s.achievements.includes(club)) unlocked.push(club);
          if (nextStreak >= 10 && !s.achievements.includes("perfect-10")) {
            unlocked.push("perfect-10");
          }
          if (nextStreak >= 25 && !s.achievements.includes("human-calculator")) {
            unlocked.push("human-calculator");
          }
          const newAchievements = [...s.achievements, ...unlocked];
          const toasts = [
            ...s.toasts,
            ...unlocked.map((id) => {
              const def = ACHIEVEMENTS.find((a) => a.id === id)!;
              return { id: `${id}-${Date.now()}`, title: def.name, detail: def.detail };
            }),
          ];
          sfx.correct();
          if (nextStreak > 0 && nextStreak % 5 === 0) sfx.streak();

          const speedPatch: Partial<GameState> = {};
          if (s.speed?.running) {
            const scoreGain = 100 + nextStreak * 10 + Math.max(0, 40 - Math.floor(elapsed / 200));
            const bestStreak = Math.max(s.speed.bestStreak, nextStreak);
            speedPatch.speed = {
              ...s.speed,
              correct: s.speed.correct + 1,
              score: s.speed.score + scoreGain,
              streak: nextStreak,
              bestStreak,
            };
          }

          const showMath =
            s.mode !== "speed" &&
            s.difficulty !== "elite" &&
            (s.difficulty === "rookie" ||
              (s.difficulty === "athlete" && nextStreak < 8) ||
              (s.difficulty === "coach" && nextStreak < 3));

          set({
            correct: s.correct + 1,
            xp: s.xp + xp,
            currentStreak: s.speed?.running ? s.currentStreak : nextStreak,
            longestStreak: Math.max(s.longestStreak, nextStreak, s.speed?.bestStreak ?? 0),
            fastestMs:
              attempts === 1
                ? s.fastestMs === null
                  ? elapsed
                  : Math.min(s.fastestMs, elapsed)
                : s.fastestMs,
            achievements: newAchievements,
            toasts,
            tutorialComplete: s.tutorialStep >= 2 ? true : s.tutorialComplete,
            feedback: {
              kind: showMath ? "math" : "correct",
              loadedCents,
              targetCents: round.targetCents,
              deltaCents: 0,
              xpGained: xp,
              streak: nextStreak,
              explanation,
            },
            impact: s.impact + 1,
            ...speedPatch,
          });
          return;
        }

        sfx.wrong();
        const delta = loadedCents - round.targetCents;
        const speedPatch: Partial<GameState> = {};
        if (s.speed?.running) {
          speedPatch.speed = {
            ...s.speed,
            incorrect: s.speed.incorrect + 1,
            streak: 0,
          };
        }
        set({
          incorrect: s.incorrect + 1,
          currentStreak: 0,
          feedback: {
            kind: "wrong",
            loadedCents,
            targetCents: round.targetCents,
            deltaCents: delta,
          },
          impact: s.impact + 1,
          ...speedPatch,
        });
      },

      dismissFeedback: () => {
        const s = get();
        if (!s.feedback) return;
        if (s.feedback.kind === "wrong" || s.feedback.kind === "timeout") {
          set({
            feedback: null,
            identifyInput: "",
            eliteRemainingMs: s.round?.timedMs ?? null,
            roundStartedAt: Date.now(),
          });
          return;
        }
        get().nextRound();
      },

      nextRound: () => {
        const s = get();
        if (s.mode === "trainer") {
          const curriculum = trainerCurriculum(s.unit);
          const nextIndex = (s.trainerIndex + 1) % curriculum.length;
          set({ trainerIndex: nextIndex, tutorialStep: 0 });
        }
        if (s.speed && !s.speed.running) {
          set({ feedback: null });
          return;
        }
        set(beginRound(get() as GameState, get().mode));
      },

      tick: (dtMs) => {
        const s = get();
        if (s.speed?.running) {
          const remaining = s.speed.remainingMs - dtMs;
          if (remaining <= 0) {
            get().finishSpeed();
            return;
          }
          set({ speed: { ...s.speed, remainingMs: remaining } });
        }
        if (s.eliteRemainingMs !== null && s.round && !s.feedback && s.mode !== "speed") {
          const left = s.eliteRemainingMs - dtMs;
          if (left <= 0) {
            sfx.wrong();
            set({
              eliteRemainingMs: 0,
              incorrect: s.incorrect + 1,
              currentStreak: 0,
              feedback: {
                kind: "timeout",
                targetCents: s.round.targetCents,
                loadedCents: barTotal(
                  specFor(s.unit).barCents,
                  s.sidePlates.map((p) => p.cents),
                ),
              },
            });
            return;
          }
          set({ eliteRemainingMs: left });
        }
      },

      finishSpeed: () => {
        const s = get();
        if (!s.speed) return;
        const best = Math.max(s.bestSpeedScore, s.speed.score);
        set({
          speed: { ...s.speed, remainingMs: 0, running: false },
          bestSpeedScore: best,
          longestStreak: Math.max(s.longestStreak, s.speed.bestStreak),
          feedback: null,
        });
      },

      dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

      resetProgress: () =>
        set({
          xp: 0,
          gamesPlayed: 0,
          correct: 0,
          incorrect: 0,
          currentStreak: 0,
          longestStreak: 0,
          fastestMs: null,
          bestSpeedScore: 0,
          achievements: [],
          tutorialComplete: false,
          trainerIndex: 0,
          screen: "home",
          round: null,
          sidePlates: [],
          feedback: null,
          speed: null,
          anatomyCorrect: 0,
          anatomyIncorrect: 0,
          anatomyBestStreak: 0,
          anatomyBestSpeed: 0,
          boneCorrect: 0,
          boneIncorrect: 0,
          boneBestStreak: 0,
          boneBestSpeed: 0,
        }),

      recordAnatomyAnswer: ({ hit, xp, streak }) => {
        const s = get();
        if (hit) {
          set({
            anatomyCorrect: s.anatomyCorrect + 1,
            xp: s.xp + xp,
            anatomyBestStreak: Math.max(s.anatomyBestStreak, streak),
          });
          return;
        }
        set({ anatomyIncorrect: s.anatomyIncorrect + 1 });
      },

      setAnatomySpeedBest: (score) =>
        set({ anatomyBestSpeed: Math.max(get().anatomyBestSpeed, score) }),

      recordBoneAnswer: ({ hit, xp, streak }) => {
        const s = get();
        if (hit) {
          set({
            boneCorrect: s.boneCorrect + 1,
            xp: s.xp + xp,
            boneBestStreak: Math.max(s.boneBestStreak, streak),
          });
          return;
        }
        set({ boneIncorrect: s.boneIncorrect + 1 });
      },

      setBoneSpeedBest: (score) =>
        set({ boneBestSpeed: Math.max(get().boneBestSpeed, score) }),

      setClientId: (id) => {
        if (get().clientId) return;
        if (typeof id === "string" && id.length >= 8) set({ clientId: id });
      },

      setPlayerName: (name) => set({ playerName: name }),

      setLbFocus: (mode) => set({ lbFocus: mode }),
    }),
    {
      name: "bar-math-save",
      version: SAVE_VERSION,
      skipHydration: true,
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s) => ({
        unit: s.unit,
        difficulty: s.difficulty,
        muted: s.muted,
        xp: s.xp,
        gamesPlayed: s.gamesPlayed,
        correct: s.correct,
        incorrect: s.incorrect,
        longestStreak: s.longestStreak,
        fastestMs: s.fastestMs,
        bestSpeedScore: s.bestSpeedScore,
        achievements: s.achievements,
        tutorialComplete: s.tutorialComplete,
        trainerIndex: s.trainerIndex,
        anatomyCorrect: s.anatomyCorrect,
        anatomyIncorrect: s.anatomyIncorrect,
        anatomyBestStreak: s.anatomyBestStreak,
        anatomyBestSpeed: s.anatomyBestSpeed,
        boneCorrect: s.boneCorrect,
        boneIncorrect: s.boneIncorrect,
        boneBestStreak: s.boneBestStreak,
        boneBestSpeed: s.boneBestSpeed,
        clientId: s.clientId,
        playerName: s.playerName,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        return {
          ...current,
          ...p,
          unit: isUnit(p.unit) ? p.unit : current.unit,
          difficulty: isDifficulty(p.difficulty) ? p.difficulty : current.difficulty,
          anatomyCorrect: asCount(p.anatomyCorrect, current.anatomyCorrect),
          anatomyIncorrect: asCount(p.anatomyIncorrect, current.anatomyIncorrect),
          anatomyBestStreak: asCount(p.anatomyBestStreak, current.anatomyBestStreak),
          anatomyBestSpeed: asCount(p.anatomyBestSpeed, current.anatomyBestSpeed),
          boneCorrect: asCount(p.boneCorrect, current.boneCorrect),
          boneIncorrect: asCount(p.boneIncorrect, current.boneIncorrect),
          boneBestStreak: asCount(p.boneBestStreak, current.boneBestStreak),
          boneBestSpeed: asCount(p.boneBestSpeed, current.boneBestSpeed),
          clientId:
            typeof p.clientId === "string" && p.clientId.length >= 8 ? p.clientId : current.clientId,
          playerName: typeof p.playerName === "string" ? p.playerName : current.playerName,
        };
      },
    },
  ),
);

export function currentTotalCents(): number {
  const s = useGameStore.getState();
  return barTotal(
    specFor(s.unit).barCents,
    s.sidePlates.map((p) => p.cents),
  );
}

export { formatDelta, DIFFICULTY_META };
