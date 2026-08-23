import type { ReactNode } from "react";
import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/game/types";
import { DIFFICULTY_META } from "@/lib/game/progression";
import type { LabRipple } from "@/lib/anatomy/visual";

export function AnatomyLab({
  personality,
  difficulty,
  prompt,
  promptKey,
  viewLabel,
  group,
  flash,
  streak,
  xpBurst,
  streakBurst,
  intro,
  speed,
  reduced,
  ripples,
  label,
  labelAt,
  onSkipIntro,
  figure,
  footer,
  aside,
}: {
  personality: "muscle" | "bone";
  difficulty: Difficulty;
  prompt: string;
  promptKey: string;
  viewLabel: string;
  group: boolean;
  flash: "correct" | "wrong" | null;
  streak: number;
  xpBurst: { id: number; n: number } | null;
  streakBurst: number | null;
  intro: boolean;
  speed?: boolean;
  reduced: boolean;
  ripples: LabRipple[];
  label: { title: string; subtitle: string } | null;
  labelAt: { x: number; y: number } | null;
  onSkipIntro: () => void;
  figure: ReactNode;
  footer?: ReactNode;
  aside?: ReactNode;
}) {
  const labelSide = (labelAt?.x ?? 50) > 50 ? "left" : "right";

  return (
    <div
      className={cn(
        "lab-board mt-4 w-full mx-auto",
        personality === "bone" ? "is-bone" : "is-muscle",
        speed && "is-speed",
        `is-${difficulty}`,
      )}
    >
      <div className="lab-copy">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
          <span>{DIFFICULTY_META[difficulty].name}</span>
          <span className="inline-flex items-center gap-1">
            <Flame className="size-3.5 text-accent" />
            {streak} streak
          </span>
        </div>
        <p
          key={promptKey}
          className={cn("lab-prompt mt-3 text-center font-display text-xl tracking-[0.12em] text-pretty", !reduced && "is-enter")}
        >
          {prompt}
        </p>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-subtle mt-1">
          {viewLabel}
          {group ? " · group" : ""}
        </p>
      </div>

      <div
        className={cn("lab-figure-col relative mt-2", intro && "is-intro")}
        onPointerDown={intro ? onSkipIntro : undefined}
      >
        <div className={cn("lab-stage", !reduced && "can-breathe")}>
          <div className={cn("lab-figure-spin", !reduced && "is-live")} key={viewLabel}>
            {figure}
          </div>
          {ripples.map((r) => (
            <span
              key={r.id}
              className={cn("lab-ripple", r.kind === "whack" && "is-whack")}
              style={{ left: `${r.x}%`, top: `${r.y}%` }}
            />
          ))}
          {intro && !reduced ? <span className="lab-scan" /> : null}
          {intro ? (
            <p className="lab-ready font-display tracking-[0.28em]">READY</p>
          ) : null}
          {xpBurst ? (
            <p key={xpBurst.id} className="lab-xp font-display">
              +{xpBurst.n} XP
            </p>
          ) : null}
          {streakBurst ? (
            <p key={streakBurst} className="lab-streak-burst font-display">
              {streakBurst} STREAK
            </p>
          ) : null}
          {label && labelAt && !speed ? (
            <div
              className={cn("lab-callout", labelSide === "left" ? "is-left" : "is-right")}
              style={{ top: `${Math.min(78, Math.max(8, labelAt.y - 8))}%` }}
            >
              <p className="font-display tracking-[0.12em] text-sm">{label.title}</p>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label.subtitle}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lab-aside mt-3">
        {aside}
        {flash === "correct" && !speed ? (
          <div className="text-center bm-pop">
            <p className="font-display text-3xl tracking-[0.14em]">NAILED IT</p>
          </div>
        ) : null}
        {flash === "wrong" && !speed ? (
          <div className="text-center lab-miss-copy">
            <p className="font-display tracking-wide">TRY AGAIN</p>
          </div>
        ) : null}
        {footer}
      </div>
    </div>
  );
}
