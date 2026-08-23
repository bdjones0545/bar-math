import type { PointerEvent } from "react";
import { SKELETON_VB, SILHOUETTE, pathsForView, type BonePath } from "@/lib/bones/paths";
import type { AnatomyView } from "@/lib/anatomy/muscles";
import type { BoneId } from "@/lib/bones/bones";
import { cn } from "@/lib/utils";

export function SkeletonFigure({
  view,
  target,
  missId,
  reveal,
  locked,
  fatHit,
  onWhack,
}: {
  view: AnatomyView;
  target: BoneId | null;
  missId: BoneId | null;
  reveal: boolean;
  locked?: boolean;
  fatHit?: boolean;
  onWhack: (id: BoneId | null) => void;
}) {
  const paths = pathsForView(view);

  function handlePath(p: BonePath, e: PointerEvent<SVGPathElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (locked) return;
    onWhack(p.boneId);
  }

  return (
    <svg
      viewBox={`0 0 ${SKELETON_VB.w} ${SKELETON_VB.h}`}
      className={cn("skeleton-svg", fatHit && "is-rookie")}
      role="img"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} skeleton figure`}
      onPointerDown={() => {
        if (!locked) onWhack(null);
      }}
    >
      <title>{view === "front" ? "Front skeleton" : "Back skeleton"}</title>
      {SILHOUETTE[view].map((d, i) => (
        <path key={i} d={d} className="skeleton-body" />
      ))}
      {paths.map((p) => {
        const isTarget = p.boneId === target;
        const isMiss = p.boneId === missId;
        return (
          <path
            key={`${p.view}-${p.id}`}
            id={`${p.view}-${p.id}`}
            d={p.d}
            data-bone={p.boneId}
            className={cn(
              "skeleton-bone",
              p.narrow && "is-narrow",
              isTarget && reveal && "is-reveal",
              isTarget && !reveal && "is-named",
              isMiss && "is-miss",
            )}
            onPointerDown={(e) => handlePath(p, e)}
          >
            <title>{p.boneId}</title>
          </path>
        );
      })}
    </svg>
  );
}
