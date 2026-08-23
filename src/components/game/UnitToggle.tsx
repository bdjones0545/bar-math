import { useGameStore } from "@/lib/game/store";
import { cn } from "@/lib/utils";
import type { Unit } from "@/lib/game/types";

const UNITS: Unit[] = ["lb", "kg"];

export function UnitToggle({ compact = false }: { compact?: boolean }) {
  const unit = useGameStore((s) => s.unit);
  const setUnit = useGameStore((s) => s.setUnit);

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border border-border bg-surface",
        compact ? "p-0.5" : "p-1",
      )}
      role="group"
      aria-label="Weight units"
    >
      {UNITS.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => setUnit(u)}
          className={cn(
            "font-display tracking-wide uppercase",
            compact ? "h-8 min-w-10 px-2 text-[11px] rounded-lg" : "h-9 min-w-11 px-2.5 text-xs rounded-lg",
            unit === u ? "bg-accent text-accent-fg" : "text-muted",
          )}
          aria-pressed={unit === u}
        >
          {u}
        </button>
      ))}
    </div>
  );
}
