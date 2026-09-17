import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Flame, Timer, Undo2, Volume2, VolumeX, Zap } from "lucide-react";
import { UnitToggle } from "@/components/game/UnitToggle";
import { Barbell } from "@/components/game/Barbell";
import { PlateRack } from "@/components/game/PlateRack";
import { NumberPad } from "@/components/game/NumberPad";
import { Button } from "@/components/ui/button";
import { SPEED_ROUND_MS, useGameStore } from "@/lib/game/store";
import { barTotal, formatWeight, platesForUnit, specFor } from "@/lib/game/plates";
import { formatDelta } from "@/lib/game/progression";
import { trainerCurriculum } from "@/lib/game/math";
import { cn } from "@/lib/utils";
import { SpeedSubmit } from "@/components/game/SpeedSubmit";
import { useLeaderboardTicket } from "@/lib/leaderboard/useTicket";
import type { Difficulty, Unit } from "@/lib/game/types";

const MODE_LABEL: Record<string, string> = {
  load: "Load the Bar",
  identify: "What's on the Bar?",
  speed: "Speed Round",
  trainer: "Plate Math Trainer",
};

/** Rookie and Athlete get the "to go" readout; Coach and Elite do the math themselves. */
function showsGuidance(difficulty: Difficulty): boolean {
  return difficulty === "rookie" || difficulty === "athlete";
}

function fmtSeconds(ms: number): string {
  return `${(Math.max(0, ms) / 1000).toFixed(1)}s`;
}

export function PlayScreen() {
  const unit = useGameStore((s) => s.unit);
  const difficulty = useGameStore((s) => s.difficulty);
  const mode = useGameStore((s) => s.mode);
  const round = useGameStore((s) => s.round);
  const sidePlates = useGameStore((s) => s.sidePlates);
  const identifyInput = useGameStore((s) => s.identifyInput);
  const feedback = useGameStore((s) => s.feedback);
  const muted = useGameStore((s) => s.muted);
  const currentStreak = useGameStore((s) => s.currentStreak);
  const speed = useGameStore((s) => s.speed);
  const eliteRemainingMs = useGameStore((s) => s.eliteRemainingMs);
  const impact = useGameStore((s) => s.impact);
  const roundStartedAt = useGameStore((s) => s.roundStartedAt);
  const fastestMs = useGameStore((s) => s.fastestMs);
  const goHome = useGameStore((s) => s.goHome);
  const addPlate = useGameStore((s) => s.addPlate);
  const removePlate = useGameStore((s) => s.removePlate);
  const undoPlate = useGameStore((s) => s.undoPlate);
  const clearBar = useGameStore((s) => s.clearBar);
  const setIdentifyInput = useGameStore((s) => s.setIdentifyInput);
  const checkAnswer = useGameStore((s) => s.checkAnswer);
  const dismissFeedback = useGameStore((s) => s.dismissFeedback);
  const setMuted = useGameStore((s) => s.setMuted);
  const tick = useGameStore((s) => s.tick);
  const startMode = useGameStore((s) => s.startMode);
  const trainerIndex = useGameStore((s) => s.trainerIndex);
  const bestSpeedScore = useGameStore((s) => s.bestSpeedScore);
  const lb = useLeaderboardTicket("bar", Boolean(speed?.running));

  const spec = specFor(unit);
  const inIntro = Boolean(speed?.running && speed.introMs > 0);
  const clockOn = Boolean(speed?.running) || (eliteRemainingMs !== null && !feedback);

  useEffect(() => {
    if (!clockOn) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      tick(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [tick, clockOn]);

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (const p of sidePlates) c[p.cents] = (c[p.cents] ?? 0) + 1;
    return c;
  }, [sidePlates]);

  const locked = Boolean(feedback) || inIntro;
  const kind = round?.kind;

  // Keyboard: 1–7 rack plates, Backspace undo, Enter check, Escape clear.
  // The NumberPad owns the keyboard in identify rounds.
  useEffect(() => {
    if (kind !== "load") return;
    const rack = platesForUnit(unit);
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (feedback) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dismissFeedback();
        }
        return;
      }
      if (inIntro) return;
      const n = Number.parseInt(e.key, 10);
      if (n >= 1 && n <= rack.length) {
        e.preventDefault();
        addPlate(rack[n - 1]!.cents);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        undoPlate();
      } else if (e.key === "Enter") {
        e.preventDefault();
        checkAnswer();
      } else if (e.key === "Escape") {
        e.preventDefault();
        clearBar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [kind, unit, feedback, inIntro, addPlate, undoPlate, checkAnswer, clearBar, dismissFeedback]);

  if (speed && !speed.running) {
    const asked = speed.correct + speed.incorrect;
    const acc = asked === 0 ? 0 : Math.round((speed.correct / asked) * 100);
    return (
      <div className="gym-shell flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10">
        <Header onBack={goHome} muted={muted} onMute={() => setMuted(!muted)} title="Speed Round" />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
          <p className="font-display tracking-[0.28em] text-muted text-sm">SESSION COMPLETE</p>
          <p className="bm-pop mt-2 font-display text-7xl tabular-nums">{speed.score}</p>
          <p className="text-muted mt-1">Score</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 w-full text-left">
            <Stat label="Correct" value={String(speed.correct)} />
            <Stat label="Incorrect" value={String(speed.incorrect)} />
            <Stat label="Accuracy" value={`${acc}%`} />
            <Stat label="Best streak" value={String(speed.bestStreak)} />
          </dl>
          <SpeedSubmit
            mode="bar"
            ticket={lb.ticket}
            boardStatus={lb.status}
            score={speed.score}
            correct={speed.correct}
            incorrect={speed.incorrect}
            personalBest={speed.score > 0 && speed.score === bestSpeedScore}
          />
          <Button className="w-full mt-8" onClick={() => startMode("speed")}>
            Run it back
          </Button>
          <Button className="w-full mt-3" variant="ghost" onClick={goHome}>
            Home
          </Button>
        </div>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="gym-shell grid place-items-center">
        <p className="text-muted">Loading round…</p>
      </div>
    );
  }

  const currentCents = barTotal(spec.barCents, sidePlates.map((p) => p.cents));
  const equal = currentCents === round.targetCents;
  const streak = speed?.running ? speed.streak : currentStreak;
  const guided = showsGuidance(difficulty);
  const timerFrac =
    kind === "load" && eliteRemainingMs !== null && round.timedMs
      ? eliteRemainingMs / round.timedMs
      : speed?.running
        ? speed.remainingMs / SPEED_ROUND_MS
        : null;
  const urgent = timerFrac !== null && timerFrac < 0.17;
  const showStopwatch = !speed && eliteRemainingMs === null;

  return (
    <div className="gym-shell bm-play flex flex-col h-dvh overflow-hidden px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Header
        onBack={goHome}
        muted={muted}
        onMute={() => setMuted(!muted)}
        title={MODE_LABEL[mode] ?? "BAR MATH"}
        streak={streak}
        subtitle={
          showStopwatch ? (
            <Stopwatch startedAt={roundStartedAt} running={!feedback} bestMs={fastestMs} />
          ) : null
        }
      />

      {timerFrac !== null ? (
        <div className="mt-3 bm-timer">
          <div
            className={cn("bm-timer-fill", urgent && "is-urgent")}
            style={{ width: `${Math.max(0, timerFrac * 100)}%` }}
          />
        </div>
      ) : null}

      {speed?.running ? (
        <div className="mt-2 flex justify-between font-display text-sm uppercase tracking-[0.16em] text-muted tabular-nums">
          <span className={cn(urgent && "bm-urgent")}>{Math.ceil(speed.remainingMs / 1000)}s</span>
          <span className="text-fg">{speed.score} pts</span>
        </div>
      ) : null}

      {mode === "trainer" ? (
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-muted tabular-nums">
          {trainerIndex + 1} / {trainerCurriculum(unit).length}
        </p>
      ) : null}

      <div className="bm-play-gap mt-4 text-center">
        {kind === "load" ? (
          <>
            <p className="text-[0.7rem] tracking-[0.32em] uppercase text-muted">
              {round.trainerTitle ?? "Target Weight"}
            </p>
            <p className="bm-play-target font-display text-5xl sm:text-7xl tracking-tight tabular-nums text-fg leading-none mt-1">
              {formatWeight(round.targetCents)}
              <span className="ml-2 text-2xl text-muted">{spec.suffix}</span>
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.7rem] tracking-[0.32em] uppercase text-muted">
              {round.trainerTitle ?? "What's on the bar?"}
            </p>
            <p className="mt-1 text-sm text-muted">Call the total.</p>
          </>
        )}
      </div>

      <div className="bm-play-gap mt-4 relative">
        <Barbell
          key={feedback?.kind === "wrong" || feedback?.kind === "timeout" ? `miss-${impact}` : "bar"}
          unit={unit}
          plates={kind === "load" ? sidePlates : round.shownPlates}
          interactive={kind === "load" && !locked}
          onRemove={kind === "load" ? removePlate : undefined}
          hit={feedback?.kind === "correct" || feedback?.kind === "math"}
          miss={feedback?.kind === "wrong" || feedback?.kind === "timeout"}
        />
        <div className="gym-floor mt-3" />
        {feedback && (feedback.kind === "correct" || feedback.kind === "math") && feedback.xpGained ? (
          <p key={`xp-${impact}`} className="bm-float" aria-hidden="true">
            +{feedback.xpGained} XP
          </p>
        ) : null}
      </div>

      {kind === "load" ? (
        <LoadReadout
          unit={unit}
          currentCents={currentCents}
          targetCents={round.targetCents}
          guided={guided}
        />
      ) : (
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-subtle">
          {spec.barLabel} {spec.suffix} bar · plates each side
        </p>
      )}

      {round.hint && !feedback ? (
        <p className="bm-play-hint mt-3 mx-auto max-w-md text-center text-sm text-muted text-pretty">
          {round.hint}
        </p>
      ) : null}

      <div className="mt-auto pt-3">
        {kind === "load" ? (
          <>
            <PlateRack unit={unit} counts={counts} disabled={locked} onAdd={addPlate} />
            <div className="mt-4 max-w-md mx-auto">
              <Button
                className={cn("w-full", equal && guided && !locked && "bm-ready")}
                onClick={checkAnswer}
                disabled={locked}
              >
                Check Answer
              </Button>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={undoPlate}
                  disabled={locked || sidePlates.length === 0}
                >
                  <Undo2 className="size-4" />
                  Undo
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearBar}
                  disabled={locked || sidePlates.length === 0}
                >
                  Clear Bar
                </Button>
              </div>
            </div>
          </>
        ) : (
          <NumberPad
            value={identifyInput}
            suffix={spec.suffix}
            onChange={setIdentifyInput}
            onSubmit={checkAnswer}
            disabled={locked}
          />
        )}
      </div>

      {inIntro && speed ? <Countdown introMs={speed.introMs} /> : null}

      {feedback ? (
        <FeedbackCard
          key={`${impact}-${feedback.kind}`}
          unit={unit}
          feedback={feedback}
          onContinue={dismissFeedback}
          speed={Boolean(speed?.running)}
        />
      ) : null}
    </div>
  );
}

function LoadReadout({
  unit,
  currentCents,
  targetCents,
  guided,
}: {
  unit: Unit;
  currentCents: number;
  targetCents: number;
  guided: boolean;
}) {
  const spec = specFor(unit);
  const delta = targetCents - currentCents;
  const on = delta === 0;
  const over = delta < 0;
  // Bar fills toward the target; overshoot pins full and turns red.
  const frac = Math.min(1, (currentCents - spec.barCents) / Math.max(1, targetCents - spec.barCents));

  return (
    <div className="bm-readout mt-4">
      <p
        className={cn(
          "font-display text-xl tracking-wide tabular-nums",
          on ? "text-success" : over ? "text-danger" : "text-fg",
        )}
      >
        Current weight: {formatWeight(currentCents)} {spec.suffix}
      </p>
      {guided ? (
        <>
          <p
            className={cn("bm-readout-status", on && "is-on", over && "is-over")}
            aria-live="polite"
          >
            {on ? (
              <>
                <Zap className="size-3.5" /> On target — check it
              </>
            ) : over ? (
              `Over by ${formatWeight(-delta)} ${spec.suffix}`
            ) : (
              `${formatWeight(delta)} ${spec.suffix} to go`
            )}
          </p>
          <div className="bm-progress" aria-hidden="true">
            <div
              className={cn("bm-progress-fill", on && "is-on", over && "is-over")}
              style={{ width: `${Math.max(0, frac) * 100}%` }}
            />
            <div className="bm-progress-tick" style={{ right: 0 }} />
          </div>
        </>
      ) : (
        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-subtle">
          Both sides load together
        </p>
      )}
    </div>
  );
}

function Stopwatch({
  startedAt,
  running,
  bestMs,
}: {
  startedAt: number;
  running: boolean;
  bestMs: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [running, startedAt]);
  const elapsed = (running ? now : Date.now()) - startedAt;
  return (
    <span
      className="bm-clock"
      title={bestMs !== null ? `Fastest ${fmtSeconds(bestMs)}` : "Round time"}
      aria-label={`Round time ${fmtSeconds(elapsed)}`}
    >
      <Timer className="size-3.5 text-accent" />
      {fmtSeconds(elapsed)}
    </span>
  );
}

function Countdown({ introMs }: { introMs: number }) {
  const n = Math.ceil(introMs / 1000);
  const label = n <= 0 ? "GO" : String(n);
  return (
    <div className="bm-countdown" role="status" aria-live="assertive">
      <div className="text-center">
        <p className="font-display text-xs tracking-[0.42em] text-muted">SPEED ROUND</p>
        <p key={label} className={cn("bm-countdown-num", label === "GO" && "is-go")}>
          {label}
        </p>
        <p className="text-sm text-muted">60 seconds. Stay accurate.</p>
      </div>
    </div>
  );
}

function Header({
  onBack,
  muted,
  onMute,
  title,
  streak,
  subtitle,
}: {
  onBack: () => void;
  muted: boolean;
  onMute: () => void;
  title: string;
  streak?: number;
  /** Small live element rendered beside the title (the round stopwatch). */
  subtitle?: React.ReactNode;
}) {
  return (
    <>
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBack}
          className="size-11 shrink-0 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="font-display tracking-[0.18em] text-xs text-muted truncate">{title.toUpperCase()}</p>
          {subtitle || (streak && streak > 0) ? (
            <div className="bm-subline">
              {subtitle}
              {streak && streak > 0 ? (
                <span className={cn("bm-streak", streak >= 5 && "is-hot", streak >= 10 && "is-fire")}>
                  <Flame className="size-3.5" />
                  {streak}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <UnitToggle compact />
          <button
            type="button"
            onClick={onMute}
            className="size-11 shrink-0 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
          </button>
        </div>
      </header>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function FeedbackCard({
  unit,
  feedback,
  onContinue,
  speed,
}: {
  unit: Unit;
  feedback: NonNullable<ReturnType<typeof useGameStore.getState>["feedback"]>;
  onContinue: () => void;
  speed: boolean;
}) {
  const spec = specFor(unit);
  const isWin = feedback.kind === "correct" || feedback.kind === "math";

  useEffect(() => {
    if (!isWin) return;
    const ms = speed ? 650 : feedback.kind === "math" ? 2600 : 1200;
    const t = window.setTimeout(onContinue, ms);
    return () => window.clearTimeout(t);
  }, [isWin, speed, feedback.kind, onContinue]);

  // Speed round wins never block the bar — a banner glides past and the next
  // round is already loading underneath it.
  if (isWin && speed) {
    return (
      <div className="bm-banner" role="status">
        <div className="bm-banner-card">
          <span className="font-display tracking-[0.14em] text-fg">NAILED IT</span>
          {feedback.streak && feedback.streak >= 2 ? (
            <span className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.16em] text-accent">
              <Flame className="size-3.5" />
              {feedback.streak}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-bg/70 px-5" onClick={onContinue}>
      <div
        className={cn(
          "bm-pop w-full max-w-sm rounded-3xl border p-6 text-center shadow-panel",
          isWin ? "bg-surface border-border" : "bg-surface border-danger/40",
        )}
      >
        {isWin ? (
          <>
            <p className="font-display text-4xl tracking-[0.14em] text-fg">NAILED IT</p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
              {feedback.streak && feedback.streak >= 2 ? (
                <p className="inline-flex items-center gap-1 text-sm uppercase tracking-[0.18em] text-accent">
                  <Flame className="size-4" />
                  {feedback.streak} streak
                </p>
              ) : null}
              {feedback.xpGained ? (
                <p className="text-muted text-sm tabular-nums">+{feedback.xpGained} XP</p>
              ) : null}
              {feedback.elapsedMs !== undefined ? (
                <p className="text-muted text-sm tabular-nums">{fmtSeconds(feedback.elapsedMs)}</p>
              ) : null}
            </div>
            {feedback.newFastest ? (
              <p className="mt-3 inline-flex items-center gap-1.5 font-display tracking-[0.18em] text-accent">
                <Zap className="size-4" />
                NEW FASTEST
              </p>
            ) : null}
            {feedback.kind === "math" && feedback.explanation ? (
              <div className="mt-5 text-sm text-muted space-y-1">
                {feedback.explanation.lines.map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      i === 0 && "font-display text-2xl text-fg tabular-nums",
                      i === feedback.explanation!.lines.length - 1 && "text-fg",
                    )}
                  >
                    {line}
                  </p>
                ))}
                <p className="pt-3 text-fg">{feedback.explanation.shortcut}</p>
              </div>
            ) : null}
          </>
        ) : feedback.kind === "timeout" ? (
          <>
            <p className="font-display text-3xl tracking-wide">TIME</p>
            <p className="mt-3 text-muted">Clock ran out. Try this load again.</p>
          </>
        ) : (
          <>
            <p className="font-display text-3xl tracking-wide">NOT YET</p>
            <p className="mt-3 text-fg text-pretty">
              You loaded {formatWeight(feedback.loadedCents ?? 0)} {spec.suffix}.{" "}
              {formatDelta(feedback.deltaCents ?? 0, unit)}
            </p>
          </>
        )}
        <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-subtle">Tap to continue</p>
      </div>
    </div>
  );
}
