import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";
import { DIFFICULTY_META } from "@/lib/game/progression";
import { NAME_MAX, sanitizeName } from "@/lib/leaderboard/rules";
import { cn } from "@/lib/utils";
import type { Difficulty, Unit } from "@/lib/game/types";

const UNITS: Unit[] = ["lb", "kg"];
const DIFFS: Difficulty[] = ["rookie", "athlete", "coach", "elite"];

export function SettingsScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const unit = useGameStore((s) => s.unit);
  const difficulty = useGameStore((s) => s.difficulty);
  const muted = useGameStore((s) => s.muted);
  const setUnit = useGameStore((s) => s.setUnit);
  const setDifficulty = useGameStore((s) => s.setDifficulty);
  const setMuted = useGameStore((s) => s.setMuted);
  const resetProgress = useGameStore((s) => s.resetProgress);
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);

  return (
    <div className="gym-shell px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-12">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={goHome}
          className="size-11 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="flex-1 text-center font-display tracking-[0.22em] text-sm">SETTINGS</h1>
        <span className="size-11" />
      </header>

      <div className="mt-8 max-w-md mx-auto space-y-8">
        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Units</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-3xl bg-surface p-1.5 border border-border">
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className={cn(
                  "h-11 rounded-2xl font-display tracking-wide",
                  unit === u ? "bg-accent text-accent-fg" : "text-muted",
                )}
              >
                {u === "lb" ? "Pounds (LB)" : "Kilograms (KG)"}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Difficulty</h2>
          <div className="mt-3 space-y-2">
            {DIFFS.map((d) => {
              const meta = DIFFICULTY_META[d];
              const on = difficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d)}
                  aria-pressed={on}
                  className={cn(
                    "w-full text-left rounded-2xl border p-4",
                    on ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface",
                  )}
                >
                  <p className="font-display text-lg tracking-wide">{meta.name}</p>
                  <p className={cn("text-sm mt-1", on ? "text-accent-fg/80" : "text-muted")}>
                    {meta.detail}
                  </p>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-subtle">Saved on this device.</p>
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Player name</h2>
          <input
            defaultValue={playerName}
            maxLength={NAME_MAX}
            onBlur={(e) => {
              const next = sanitizeName(e.target.value);
              if (next.ok) {
                setPlayerName(next.name);
                e.target.value = next.name;
              }
            }}
            className="mt-3 w-full h-12 rounded-2xl border border-border bg-surface px-4 text-fg"
            placeholder="Shown on leaderboards"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-subtle">2–16 characters. Saved on this device. Not a login.</p>
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Sound</h2>
          <button
            type="button"
            onClick={() => setMuted(!muted)}
            className="mt-3 w-full rounded-2xl border border-border bg-surface p-4 flex items-center justify-between"
          >
            <span className="font-display tracking-wide">Gym effects</span>
            <span className="text-sm text-muted">{muted ? "Muted" : "On"}</span>
          </button>
        </section>

        <section>
          <h2 className="text-[11px] uppercase tracking-[0.18em] text-muted">Progress</h2>
          <Button
            variant="secondary"
            className="w-full mt-3"
            onClick={() => {
              if (window.confirm("Reset XP, stats, and achievements on this device?")) {
                resetProgress();
              }
            }}
          >
            Reset local progress
          </Button>
        </section>
      </div>
    </div>
  );
}
