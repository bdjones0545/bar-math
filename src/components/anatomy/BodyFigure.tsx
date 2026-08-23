import { useId } from "react";
import type { PointerEvent } from "react";
import { ANATOMY_VB, SILHOUETTE, pathsForView, type MusclePath } from "@/lib/anatomy/paths";
import type { AnatomyView, MuscleId } from "@/lib/anatomy/muscles";
import { MUSCLE_BAND, pointerPct } from "@/lib/anatomy/visual";
import { cn } from "@/lib/utils";

export function BodyFigure({
  view,
  target,
  missId,
  reveal,
  locked,
  fatHit,
  hit,
  speed,
  onPoke,
}: {
  view: AnatomyView;
  target: MuscleId | null;
  missId: MuscleId | null;
  reveal: boolean;
  locked?: boolean;
  fatHit?: boolean;
  hit?: "correct" | "wrong" | null;
  speed?: boolean;
  onPoke: (id: MuscleId | null, pt?: { x: number; y: number }) => void;
}) {
  const uid = useId();
  const paths = pathsForView(view);

  function handlePath(p: MusclePath, e: PointerEvent<SVGPathElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (locked) return;
    onPoke(p.muscleId, pointerPct(e));
  }

  return (
    <svg
      viewBox={`0 0 ${ANATOMY_VB.w} ${ANATOMY_VB.h}`}
      className={cn("anatomy-svg", fatHit && "is-rookie", speed && "is-speed")}
      role="img"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} anatomy figure`}
      onPointerDown={(e) => {
        if (!locked) onPoke(null, pointerPct(e));
      }}
    >
      <title>{view === "front" ? "Front view" : "Back view"}</title>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-surface-2)" stopOpacity="1" />
          <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`${uid}-gloss`} x1="0.15" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
          <stop offset="55%" stopColor="var(--color-accent)" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${uid}-core`} cx="50%" cy="28%" r="55%">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--color-bg)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="110" cy="538" rx="58" ry="10" className="lab-floor" />
      <ellipse cx="110" cy="210" rx="70" ry="160" fill={`url(#${uid}-core)`} pointerEvents="none" />
      {SILHOUETTE[view].map((d, i) => (
        <path key={i} d={d} className="anatomy-body" fill={`url(#${uid}-body)`} />
      ))}
      {paths.map((p) => {
        const isTarget = p.muscleId === target;
        const isMiss = p.muscleId === missId;
        const correct = isTarget && hit === "correct";
        const revealed = isTarget && reveal;
        return (
          <g key={p.id}>
            <path
              id={p.id}
              d={p.d}
              data-muscle={p.muscleId}
              data-band={MUSCLE_BAND[p.muscleId]}
              className={cn(
                "anatomy-muscle",
                isTarget && reveal && "is-reveal",
                isTarget && !reveal && "is-named",
                isMiss && "is-miss",
                correct && (speed ? "is-hit-fast" : "is-hit"),
              )}
              onPointerDown={(e) => handlePath(p, e)}
            >
              <title>{p.muscleId}</title>
            </path>
            <path
              d={p.d}
              className={cn("anatomy-muscle-gloss", revealed && "is-on")}
              fill={`url(#${uid}-gloss)`}
              pointerEvents="none"
            />
          </g>
        );
      })}
    </svg>
  );
}
