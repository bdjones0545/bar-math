import { useId } from "react";
import type { PointerEvent } from "react";
import { SKELETON_VB, SILHOUETTE, pathsForView, type BonePath } from "@/lib/bones/paths";
import type { AnatomyView } from "@/lib/anatomy/muscles";
import type { BoneId } from "@/lib/bones/bones";
import { BONE_BAND, pointerPct } from "@/lib/anatomy/visual";
import { cn } from "@/lib/utils";

const SKULL_MARKS = [
  "M 96 38 C 100 34 108 34 110 38 C 112 34 120 34 124 38 C 122 46 116 48 110 46 C 104 48 98 46 96 38 Z",
  "M 100 56 L 120 56 C 118 64 114 66 110 66 C 106 66 102 64 100 56 Z",
];

export function SkeletonFigure({
  view,
  target,
  missId,
  reveal,
  locked,
  fatHit,
  hit,
  speed,
  onWhack,
}: {
  view: AnatomyView;
  target: BoneId | null;
  missId: BoneId | null;
  reveal: boolean;
  locked?: boolean;
  fatHit?: boolean;
  hit?: "correct" | "wrong" | null;
  speed?: boolean;
  onWhack: (id: BoneId | null, pt?: { x: number; y: number }) => void;
}) {
  const uid = useId();
  const paths = pathsForView(view);

  function handlePath(p: BonePath, e: PointerEvent<SVGPathElement>) {
    e.stopPropagation();
    e.preventDefault();
    if (locked) return;
    onWhack(p.boneId, pointerPct(e));
  }

  return (
    <svg
      viewBox={`0 0 ${SKELETON_VB.w} ${SKELETON_VB.h}`}
      className={cn("skeleton-svg", fatHit && "is-rookie", speed && "is-speed")}
      role="img"
      aria-label={`${view === "front" ? "Anterior" : "Posterior"} skeleton figure`}
      onPointerDown={(e) => {
        if (!locked) onWhack(null, pointerPct(e));
      }}
    >
      <title>{view === "front" ? "Front skeleton" : "Back skeleton"}</title>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-surface-2)" />
          <stop offset="100%" stopColor="var(--color-bg)" />
        </linearGradient>
        <linearGradient id={`${uid}-bone`} x1="0.2" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--color-accent)" stopOpacity="0.12" />
          <stop offset="100%" stopColor="var(--color-surface)" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <ellipse cx="110" cy="538" rx="58" ry="10" className="lab-floor" />
      {SILHOUETTE[view].map((d, i) => (
        <path key={i} d={d} className="skeleton-body" fill={`url(#${uid}-body)`} />
      ))}
      {paths.map((p) => {
        const isTarget = p.boneId === target;
        const isMiss = p.boneId === missId;
        const correct = isTarget && hit === "correct";
        return (
          <g key={`${p.view}-${p.id}`}>
            <path
              id={`${p.view}-${p.id}`}
              d={p.d}
              data-bone={p.boneId}
              data-band={BONE_BAND[p.boneId]}
              className={cn(
                "skeleton-bone",
                p.narrow && "is-narrow",
                isTarget && reveal && "is-reveal",
                isTarget && !reveal && "is-named",
                isMiss && "is-miss",
                correct && (speed ? "is-hit-fast" : "is-hit"),
              )}
              onPointerDown={(e) => handlePath(p, e)}
            >
              <title>{p.boneId}</title>
            </path>
            <path d={p.d} fill={`url(#${uid}-bone)`} className="skeleton-bone-gloss" pointerEvents="none" />
          </g>
        );
      })}
      {view === "front"
        ? SKULL_MARKS.map((d, i) => (
            <path key={i} d={d} className="skeleton-mark" pointerEvents="none" />
          ))
        : null}
    </svg>
  );
}
