import { cn } from "@/lib/utils";
import { plateByCents } from "@/lib/game/plates";
import type { LoadedPlate, Unit } from "@/lib/game/types";

function PlateFace({
  cents,
  unit,
  onClick,
  animate,
  delay,
}: {
  cents: number;
  unit: Unit;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
}) {
  const plate = plateByCents(unit, cents);
  const size = plate?.size ?? "md";
  const label = plate?.label ?? "";
  const ring = plate?.ring ?? "#7a2e28";
  const className = cn(
    "bm-plate",
    `bm-plate-${size}`,
    onClick && "bm-plate-interactive",
    animate && "bm-plate-on",
  );
  const style = {
    ["--plate-ring" as string]: ring,
    animationDelay: delay ? `${delay}ms` : undefined,
  };
  if (onClick) {
    return (
      <button
        type="button"
        className={className}
        style={style}
        onClick={onClick}
        aria-label={`Remove ${label} ${unit} plate`}
      >
        <span className="bm-plate-hole" aria-hidden="true" />
        <span className="bm-plate-label">{label}</span>
      </button>
    );
  }
  return (
    <div className={className} style={style} aria-label={`${label} ${unit} plate`}>
      <span className="bm-plate-hole" aria-hidden="true" />
      <span className="bm-plate-label">{label}</span>
    </div>
  );
}

export function Barbell({
  unit,
  plates,
  interactive = false,
  onRemove,
  hit = false,
  className,
}: {
  unit: Unit;
  plates: LoadedPlate[] | number[];
  interactive?: boolean;
  onRemove?: (id: string) => void;
  hit?: boolean;
  className?: string;
}) {
  const loaded: LoadedPlate[] = plates.map((p, i) =>
    typeof p === "number" ? { id: `static-${p}-${i}`, cents: p } : p,
  );

  return (
    <div className={cn("bm-barbell", hit && "is-hit", className)} role="img" aria-label="Olympic barbell">
      <div className="bm-sleeve" aria-hidden="true" />
      <div className="bm-side bm-side-left">
        {loaded.map((p, i) => (
          <PlateFace
            key={`L-${p.id}`}
            cents={p.cents}
            unit={unit}
            animate={interactive}
            delay={i * 40}
            onClick={interactive && onRemove ? () => onRemove(p.id) : undefined}
          />
        ))}
      </div>
      <div className="bm-collar" aria-hidden="true" />
      <div className="bm-shaft" aria-hidden="true" />
      <div className="bm-collar" aria-hidden="true" />
      <div className="bm-side bm-side-right">
        {loaded.map((p, i) => (
          <PlateFace
            key={`R-${p.id}`}
            cents={p.cents}
            unit={unit}
            animate={interactive}
            delay={i * 40}
            onClick={interactive && onRemove ? () => onRemove(p.id) : undefined}
          />
        ))}
      </div>
      <div className="bm-sleeve" aria-hidden="true" />
    </div>
  );
}
