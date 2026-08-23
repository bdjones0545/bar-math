import type { PointerEvent } from "react";
import { ANATOMY_VB, SILHOUETTE, pathsForView, type MusclePath } from "@/lib/anatomy/paths";
import type { AnatomyView, MuscleId } from "@/lib/anatomy/muscles";
import { cn } from "@/lib/utils";

export function BodyFigure({
  view,
  target,
  missId,
  reveal,
  locked,
  fatHit,
  onPoke,
}: {
  view: AnatomyView;
  target: MuscleId | null;
  missId: MuscleId | null;
  reveal: boolean;
  locked?: boolean;
  fatHit?: boolean;
  onPoke: (id: MuscleId | null) => void;
}) {
  const paths = pathsForView(view);

  function handlePath(p: MusclePath, e: PointerEvent<SVGPathElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (locked) return;
    onPoke(p.muscleId);
  }

  return (
    <svg
      viewBox={`0 0 ${ANATOMY_VB.w} ${ANATOMY_VB.h}`}
      className={cn("anatomy-svg", fatHit && "is-rookie")}
      role="img"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} anatomy figure`}
      onPointerDown={() => {
        if (!locked) onPoke(null);
      }}
    >
      <title>{view === "front" ? "Front view" : "Back view"}</title>
      {SILHOUETTE[view].map((d, i) => (
        <path key={i} d={d} className="anatomy-body" />
      ))}
      {paths.map((p) => {
        const isTarget = p.muscleId === target;
        const isMiss = p.muscleId === missId;
        return (
          <path
            key={p.id}
            id={p.id}
            d={p.d}
            data-muscle={p.muscleId}
            className={cn(
              "anatomy-muscle",
              isTarget && reveal && "is-reveal",
              isTarget && !reveal && "is-named",
              isMiss && "is-miss",
            )}
            onPointerDown={(e) => handlePath(p, e)}
          >
            <title>{p.muscleId}</title>
          </path>
        );
      })}
    </svg>
  );
}
