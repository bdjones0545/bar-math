import { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Bone,
  Dumbbell,
  Eye,
  GraduationCap,
  Medal,
  PersonStanding,
  Timer,
  Volume2,
  VolumeX,
  Settings,
  Trophy,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UnitToggle } from "@/components/game/UnitToggle";
import { Barbell } from "@/components/game/Barbell";
import { useGameStore } from "@/lib/game/store";
import { formatWeight, specFor } from "@/lib/game/plates";
import { LEVELS, levelForXp } from "@/lib/game/progression";
import { CANONICAL_LOADS, comboPhrase } from "@/lib/game/math";
import type { Mode, Unit } from "@/lib/game/types";

const MODES: {
  id: Mode;
  name: string;
  detail: string;
  icon: typeof Dumbbell;
}[] = [
  { id: "load", name: "Load the Bar", detail: "Hit the target weight", icon: Dumbbell },
  {
    id: "identify",
    name: "What's on the Bar?",
    detail: "Read the plates. Call the total.",
    icon: Eye,
  },
  { id: "speed", name: "Speed Round", detail: "60 seconds. Stay accurate.", icon: Timer },
  {
    id: "trainer",
    name: "Plate Math Trainer",
    detail: "Memorize the standards",
    icon: GraduationCap,
  },
];

const HERO_STEP_MS = 2600;

/** Cycles the hero barbell through the standard loads for the current unit. */
function useHeroLoad(unit: Unit) {
  const loads = CANONICAL_LOADS.filter((l) => l.unit === unit);
  const [i, setI] = useState(1);
  useEffect(() => {
    setI(1);
  }, [unit]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setI((n) => (n + 1) % loads.length);
    }, HERO_STEP_MS);
    return () => window.clearInterval(id);
  }, [loads.length]);
  return loads[i % loads.length]!;
}

export function HomeScreen() {
  const unit = useGameStore((s) => s.unit);
  const xp = useGameStore((s) => s.xp);
  const longestStreak = useGameStore((s) => s.longestStreak);
  const bestSpeedScore = useGameStore((s) => s.bestSpeedScore);
  const fastestMs = useGameStore((s) => s.fastestMs);
  const trainerIndex = useGameStore((s) => s.trainerIndex);
  const anatomyBestSpeed = useGameStore((s) => s.anatomyBestSpeed);
  const boneBestSpeed = useGameStore((s) => s.boneBestSpeed);
  const muted = useGameStore((s) => s.muted);
  const startMode = useGameStore((s) => s.startMode);
  const setMuted = useGameStore((s) => s.setMuted);
  const setScreen = useGameStore((s) => s.setScreen);
  const spec = specFor(unit);
  const hero = useHeroLoad(unit);
  const level = levelForXp(xp);
  const cardStat: Partial<Record<Mode, string | null>> = {
    load: fastestMs !== null ? `Fastest ${(fastestMs / 1000).toFixed(1)}s` : null,
    identify: longestStreak > 0 ? `Best streak ${longestStreak}` : null,
    speed: bestSpeedScore > 0 ? `Best ${bestSpeedScore}` : null,
    trainer: trainerIndex > 0 ? `Lesson ${trainerIndex + 1}` : null,
  };

  return (
    <div className="gym-shell flex flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <button type="button" className="stat-chip pl-1.5" onClick={() => setScreen("stats")}>
          <span
            className="bm-level-ring"
            style={{ ["--pct" as string]: level.pct }}
            aria-hidden="true"
          >
            <span className="text-[9px] font-bold text-fg">
              {LEVELS.findIndex((l) => l.id === level.current.id) + 1}
            </span>
          </span>
          {level.current.name}
        </button>
        <div className="flex items-center gap-2">
          <UnitToggle compact />
          <button
            type="button"
            className="size-11 bm-card rounded-2xl grid place-items-center text-muted"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <button
            type="button"
            className="size-11 bm-card rounded-2xl grid place-items-center text-muted"
            onClick={() => setScreen("settings")}
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="bm-hero mt-7 text-center">
        <p className="font-display text-[0.68rem] tracking-[0.3em] text-accent">OLYMPIC LOADING</p>
        <h1 className="mt-1 font-display text-[3.4rem] sm:text-7xl leading-[0.95] tracking-[-0.03em] text-fg">
          BAR MATH
        </h1>
        <p className="mt-3 text-muted text-pretty max-w-sm mx-auto">
          How fast can you load the bar?
        </p>

        <div className="mt-7">
          <Barbell key={`${unit}-${hero.label}`} unit={unit} plates={hero.plates} animate />
          <div className="gym-floor mt-4" />
          <div key={hero.label} className="bm-hero-caption mt-4">
            <p className="font-display text-4xl tabular-nums leading-none">
              {formatWeight(spec.barCents + hero.plates.reduce((a, b) => a + b, 0) * 2)}
              <span className="ml-1.5 text-base text-muted font-semibold">{spec.suffix}</span>
            </p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-subtle">
              {comboPhrase(unit, hero.plates)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 max-w-md mx-auto w-full">
        <Button className="w-full h-14 text-base rounded-3xl" onClick={() => startMode("load")}>
          Start Training
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        <p className="col-span-2 text-[11px] uppercase tracking-[0.04em] text-muted">Play</p>
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => startMode(m.id)}
              className="bm-tile text-left bm-card rounded-3xl p-4 min-h-28"
            >
              <span className="bm-icon-chip">
                <Icon className="size-4" />
              </span>
              <p className="mt-3 font-display text-[15px] leading-tight text-fg text-balance">
                {m.name}
              </p>
              <p className="mt-1 text-xs text-muted text-pretty">{m.detail}</p>
              {cardStat[m.id] ? <p className="bm-card-stat">{cardStat[m.id]}</p> : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 max-w-md mx-auto w-full">
        <p className="text-[11px] uppercase tracking-[0.04em] text-muted">Tools & training</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setScreen("convert")}
            className="bm-tile col-span-2 text-left bm-card rounded-3xl p-4 min-h-24"
          >
            <span className="bm-icon-chip">
              <ArrowLeftRight className="size-4" />
            </span>
            <p className="mt-3 font-display text-base leading-tight text-fg">
              Conversion Measurements
            </p>
            <p className="mt-1 text-xs text-muted text-pretty">
              Convert the measurements athletes use every day.
            </p>
          </button>
          <button
            type="button"
            onClick={() => setScreen("anatomy")}
            className="bm-tile text-left bm-card rounded-3xl p-4 min-h-28"
          >
            <span className="bm-icon-chip">
              <PersonStanding className="size-4" />
            </span>
            <p className="mt-3 font-display text-base leading-tight text-fg">Poke a Muscle</p>
            <p className="mt-1 text-xs text-muted text-pretty">
              See the name. Tap the right place.
            </p>
            {anatomyBestSpeed > 0 ? (
              <p className="bm-card-stat">Speed best {anatomyBestSpeed}</p>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setScreen("bones")}
            className="bm-tile text-left bm-card rounded-3xl p-4 min-h-28"
          >
            <span className="bm-icon-chip">
              <Bone className="size-4" />
            </span>
            <p className="mt-3 font-display text-base leading-tight text-fg">Whack a Bone</p>
            <p className="mt-1 text-xs text-muted text-pretty">See the name. Tap the right bone.</p>
            {boneBestSpeed > 0 ? <p className="bm-card-stat">Speed best {boneBestSpeed}</p> : null}
          </button>
        </div>
      </div>

      <div className="mt-6 max-w-md mx-auto w-full">
        <button
          type="button"
          onClick={() => setScreen("leaderboards")}
          className="bm-tile w-full text-left bm-card rounded-3xl p-4 flex items-center gap-4"
        >
          <span className="bm-icon-chip shrink-0">
            <Medal className="size-4" />
          </span>
          <span className="min-w-0">
            <p className="font-display text-base leading-tight text-fg">Leaderboards</p>
            <p className="mt-1 text-xs text-muted text-pretty">
              See how fast you load against other athletes.
            </p>
          </span>
        </button>
      </div>

      <div className="mt-6 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.1em] text-muted">
          <span>XP {xp}</span>
          <span>{level.next ? `Next ${level.next.name}` : "Maxed"}</span>
        </div>
        <div className="mt-2 bm-progress !mt-2">
          <div className="bm-progress-fill" style={{ width: `${level.pct}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="stat-chip">
            <Flame className="size-3.5 text-accent" />
            Best streak {longestStreak}
          </p>
          <button type="button" className="stat-chip" onClick={() => setScreen("stats")}>
            <Trophy className="size-3.5 text-accent" />
            Record
          </button>
        </div>
      </div>

      <p className="mt-10 text-center text-[11px] uppercase tracking-[0.04em] text-subtle">
        Load both sides. Count the bar.
      </p>
    </div>
  );
}
