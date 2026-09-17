import type { ReactNode } from "react";
import { Eye, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/lib/game/types";
import { DIFFICULTY_META } from "@/lib/game/progression";
import type { LabRipple } from "@/lib/anatomy/visual";

export interface LabHud {
  round: number;
  correct: number;
  incorrect: number;
  streak: number;
}

/** The strip pinned over the bottom of the figure — where the eye already is. */
export interface LabCaption {
  tone: "correct" | "wrong" | "reveal";
  title: string;
  subtitle?: string;
  body?: string;
  action?: { label: string; onClick: () => void };
}

export function AnatomyLab({
  personality,
  difficulty,
  prompt,
  promptKey,
  viewLabel,
  group,
  flash,
  hud,
  xpBurst,
  streakBurst,
  shake,
  intro,
  speed,
  reduced,
  ripples,
  caption,
  onSkipIntro,
  figure,
  footer,
}: {
  personality: "muscle" | "bone";
  difficulty: Difficulty;
  prompt: string;
  promptKey: string;
  viewLabel: string;
  group: boolean;
  flash: "correct" | "wrong" | null;
  hud: LabHud | null;
  xpBurst: { id: number; n: number } | null;
  streakBurst: number | null;
  shake: number;
  intro: boolean;
  speed?: boolean;
  reduced: boolean;
  ripples: LabRipple[];
  caption: LabCaption | null;
  onSkipIntro: () => void;
  figure: ReactNode;
  footer?: ReactNode;
}) {
  const attempts = hud ? hud.correct + hud.incorrect : 0;
  const acc = attempts === 0 ? null : Math.round((hud!.correct / attempts) * 100);

  return (
    <div
      className={cn(
        "lab-board mt-3 w-full mx-auto",
        personality === "bone" ? "is-bone" : "is-muscle",
        speed && "is-speed",
        `is-${difficulty}`,
      )}
    >
      <div className="lab-copy">
        {hud ? (
          <div className="lab-hud">
            <span>{DIFFICULTY_META[difficulty].name}</span>
            <span className="lab-hud-mid tabular-nums">
              <span className="text-fg">#{hud.round}</span>
              {acc !== null ? <span>· {acc}%</span> : null}
            </span>
            <span
              className={cn(
                "lab-hud-streak tabular-nums",
                hud.streak > 0 && "is-on",
                hud.streak >= 5 && "is-hot",
                hud.streak >= 10 && "is-fire",
              )}
            >
              <Flame className="size-3.5" />
              {hud.streak}
            </span>
          </div>
        ) : null}
        <p
          key={promptKey}
          className={cn(
            "lab-prompt mt-2 text-center font-display text-xl tracking-[0.12em] text-pretty",
            !reduced && "is-enter",
          )}
        >
          {prompt}
        </p>
        <p className="text-center text-[11px] uppercase tracking-[0.18em] text-subtle mt-0.5">
          {viewLabel}
          {group ? " · group" : ""}
        </p>
      </div>

      <div
        className={cn("lab-figure-col relative mt-1", intro && "is-intro")}
        onPointerDown={intro ? onSkipIntro : undefined}
      >
        <div
          key={shake}
          className={cn(
            "lab-stage",
            !reduced && "can-breathe",
            shake > 0 && !reduced && "is-shake",
            flash === "correct" && "is-correct",
          )}
        >
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
          {intro ? <p className="lab-ready font-display tracking-[0.28em]">READY</p> : null}
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
          {caption ? (
            <div
              key={`${caption.tone}-${caption.title}`}
              className={cn("lab-caption", `is-${caption.tone}`)}
              role="status"
              aria-live="polite"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display tracking-[0.14em] text-base leading-tight truncate">
                  {caption.title}
                </p>
                {caption.subtitle ? (
                  <p className="text-[11px] uppercase tracking-[0.16em] text-muted truncate">
                    {caption.subtitle}
                  </p>
                ) : null}
                {caption.body ? (
                  <p className="mt-1 text-xs text-muted text-pretty leading-snug lab-caption-body">
                    {caption.body}
                  </p>
                ) : null}
              </div>
              {caption.action ? (
                <button
                  type="button"
                  onClick={caption.action.onClick}
                  className="lab-caption-btn shrink-0"
                >
                  <Eye className="size-3.5" />
                  {caption.action.label}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {footer ? <div className="lab-aside mt-2">{footer}</div> : null}
    </div>
  );
}
