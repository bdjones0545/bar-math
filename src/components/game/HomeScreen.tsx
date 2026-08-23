import {
  Dumbbell,
  Eye,
  GraduationCap,
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
import { specFor } from "@/lib/game/plates";
import { levelForXp } from "@/lib/game/progression";
import type { Mode } from "@/lib/game/types";

const MODES: {
  id: Mode;
  name: string;
  detail: string;
  icon: typeof Dumbbell;
}[] = [
  { id: "load", name: "Load the Bar", detail: "Hit the target weight", icon: Dumbbell },
  { id: "identify", name: "What's on the Bar?", detail: "Read the plates. Call the total.", icon: Eye },
  { id: "speed", name: "Speed Round", detail: "60 seconds. Stay accurate.", icon: Timer },
  { id: "trainer", name: "Plate Math Trainer", detail: "Memorize the standards", icon: GraduationCap },
];

export function HomeScreen() {
  const unit = useGameStore((s) => s.unit);
  const xp = useGameStore((s) => s.xp);
  const longestStreak = useGameStore((s) => s.longestStreak);
  const muted = useGameStore((s) => s.muted);
  const startMode = useGameStore((s) => s.startMode);
  const setMuted = useGameStore((s) => s.setMuted);
  const setScreen = useGameStore((s) => s.setScreen);
  const spec = specFor(unit);
  const big = spec.plates[0]!.cents;
  const hero = [big, big];
  const level = levelForXp(xp);

  return (
    <div className="gym-shell flex flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <p className="stat-chip">{level.current.name}</p>
        <div className="flex items-center gap-2">
          <UnitToggle compact />
          <button
            type="button"
            className="size-11 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
            onClick={() => setMuted(!muted)}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
          <button
            type="button"
            className="size-11 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
            onClick={() => setScreen("settings")}
            aria-label="Settings"
          >
            <Settings className="size-5" />
          </button>
        </div>
      </header>

      <div className="mt-6 text-center">
        <p className="font-display text-[0.7rem] tracking-[0.42em] text-muted">OLYMPIC LOADING</p>
        <h1 className="mt-2 font-display text-6xl sm:text-7xl tracking-[0.12em] text-fg">BAR MATH</h1>
        <p className="mt-3 text-muted text-pretty max-w-sm mx-auto">
          How fast can you load the bar?
        </p>
      </div>

      <div className="mt-6">
        <Barbell unit={unit} plates={hero} />
        <div className="gym-floor mt-4" />
      </div>

      <div className="mt-6 max-w-md mx-auto w-full">
        <Button className="w-full h-14 text-base rounded-3xl" onClick={() => startMode("load")}>
          Start Training
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 max-w-md mx-auto w-full">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => startMode(m.id)}
              className="text-left rounded-3xl border border-border bg-surface p-4 hover:bg-surface-2 transition-colors duration-150 min-h-28"
            >
              <Icon className="size-5 text-accent" />
              <p className="mt-3 font-display text-base leading-tight tracking-wide text-fg">{m.name}</p>
              <p className="mt-1 text-xs text-muted text-pretty">{m.detail}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-6 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
          <span>XP {xp}</span>
          <span>{level.next ? `Next ${level.next.name}` : "Maxed"}</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${level.pct}%` }} />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="stat-chip">
            <Flame className="size-3.5 text-accent" />
            Best streak {longestStreak}
          </p>
          <button
            type="button"
            className="stat-chip"
            onClick={() => setScreen("stats")}
          >
            <Trophy className="size-3.5 text-accent" />
            Record
          </button>
        </div>
      </div>

      <p className="mt-10 text-center text-[11px] uppercase tracking-[0.18em] text-subtle">
        Load both sides. Count the bar.
      </p>
    </div>
  );
}
