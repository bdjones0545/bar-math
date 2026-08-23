import { ChevronLeft } from "lucide-react";
import { useGameStore } from "@/lib/game/store";
import { ACHIEVEMENTS, levelForXp } from "@/lib/game/progression";
import { cn } from "@/lib/utils";

export function StatsScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const xp = useGameStore((s) => s.xp);
  const gamesPlayed = useGameStore((s) => s.gamesPlayed);
  const correct = useGameStore((s) => s.correct);
  const incorrect = useGameStore((s) => s.incorrect);
  const longestStreak = useGameStore((s) => s.longestStreak);
  const fastestMs = useGameStore((s) => s.fastestMs);
  const bestSpeedScore = useGameStore((s) => s.bestSpeedScore);
  const achievements = useGameStore((s) => s.achievements);
  const level = levelForXp(xp);
  const asked = correct + incorrect;
  const acc = asked === 0 ? 0 : Math.round((correct / asked) * 100);

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
        <h1 className="flex-1 text-center font-display tracking-[0.22em] text-sm">RECORD</h1>
        <span className="size-11" />
      </header>

      <div className="mt-8 max-w-md mx-auto">
        <p className="text-[0.7rem] tracking-[0.28em] uppercase text-muted">Level</p>
        <p className="font-display text-4xl mt-1">{level.current.name}</p>
        <div className="mt-3 h-1.5 rounded-full bg-surface-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full" style={{ width: `${level.pct}%` }} />
        </div>
        <p className="mt-2 text-xs text-muted tabular-nums">
          {xp} XP
          {level.next ? ` · ${level.next.xp - xp} to ${level.next.name}` : " · Mastered"}
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-3">
          <Tile label="Games" value={String(gamesPlayed)} />
          <Tile label="Correct" value={String(correct)} />
          <Tile label="Accuracy" value={`${acc}%`} />
          <Tile label="Longest streak" value={String(longestStreak)} />
          <Tile
            label="Fastest"
            value={fastestMs === null ? "—" : `${(fastestMs / 1000).toFixed(2)}s`}
          />
          <Tile label="Speed best" value={String(bestSpeedScore)} />
        </dl>

        <h2 className="mt-10 font-display tracking-[0.2em] text-sm text-muted">ACHIEVEMENTS</h2>
        <ul className="mt-3 space-y-2">
          {ACHIEVEMENTS.map((a) => {
            const on = achievements.includes(a.id);
            return (
              <li
                key={a.id}
                className={cn(
                  "rounded-2xl border p-4",
                  on ? "border-border bg-surface" : "border-border/60 bg-bg opacity-50",
                )}
              >
                <p className="font-display tracking-wide text-lg">{a.name}</p>
                <p className="text-sm text-muted mt-1">{a.detail}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
