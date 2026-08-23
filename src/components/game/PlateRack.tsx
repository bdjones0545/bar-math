import { platesForUnit } from "@/lib/game/plates";
import type { Unit } from "@/lib/game/types";

export function PlateRack({
  unit,
  counts,
  disabled,
  onAdd,
}: {
  unit: Unit;
  counts: Record<number, number>;
  disabled?: boolean;
  onAdd: (cents: number) => void;
}) {
  const plates = platesForUnit(unit);
  const suffix = unit.toUpperCase();
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4" role="group" aria-label="Available plates">
      {plates.map((p) => {
        const n = counts[p.cents] ?? 0;
        return (
          <button
            key={p.cents}
            type="button"
            className="bm-rack-btn"
            style={{ ["--plate-ring" as string]: p.ring }}
            disabled={disabled}
            onClick={() => onAdd(p.cents)}
            aria-label={`Add ${p.label} ${suffix} plate to each side`}
          >
            <span className="leading-none">{p.label}</span>
            <span className="bm-rack-unit">{suffix}</span>
            {n > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-accent text-accent-fg text-[10px] font-sans font-bold grid place-items-center">
                {n}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
