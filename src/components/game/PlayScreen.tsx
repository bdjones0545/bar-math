import { useEffect, useMemo } from "react";
import { ChevronLeft, Flame, Volume2, VolumeX } from "lucide-react";
import { UnitToggle } from "@/components/game/UnitToggle";
import { Barbell } from "@/components/game/Barbell";
import { PlateRack } from "@/components/game/PlateRack";
import { NumberPad } from "@/components/game/NumberPad";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";
import { barTotal, formatWeight, specFor } from "@/lib/game/plates";
import { formatDelta } from "@/lib/game/progression";
import { trainerCurriculum } from "@/lib/game/math";
import { cn } from "@/lib/utils";

const MODE_LABEL: Record<string, string> = {
  load: "Load the Bar",
  identify: "What's on the Bar?",
  speed: "Speed Round",
  trainer: "Plate Math Trainer",
};

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
  const goHome = useGameStore((s) => s.goHome);
  const addPlate = useGameStore((s) => s.addPlate);
  const removePlate = useGameStore((s) => s.removePlate);
  const clearBar = useGameStore((s) => s.clearBar);
  const setIdentifyInput = useGameStore((s) => s.setIdentifyInput);
  const checkAnswer = useGameStore((s) => s.checkAnswer);
  const dismissFeedback = useGameStore((s) => s.dismissFeedback);
  const setMuted = useGameStore((s) => s.setMuted);
  const tick = useGameStore((s) => s.tick);
  const startMode = useGameStore((s) => s.startMode);
  const trainerIndex = useGameStore((s) => s.trainerIndex);

  const spec = specFor(unit);
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

  if (speed && !speed.running) {
    const asked = speed.correct + speed.incorrect;
    const acc = asked === 0 ? 0 : Math.round((speed.correct / asked) * 100);
    return (
      <div className="gym-shell flex flex-col px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-10">
        <Header onBack={goHome} muted={muted} onMute={() => setMuted(!muted)} title="Speed Round" />
        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
          <p className="font-display tracking-[0.28em] text-muted text-sm">SESSION COMPLETE</p>
          <p className="mt-2 font-display text-6xl tabular-nums">{speed.score}</p>
          <p className="text-muted mt-1">Score</p>
          <dl className="mt-8 grid grid-cols-2 gap-3 w-full text-left">
            <Stat label="Correct" value={String(speed.correct)} />
            <Stat label="Incorrect" value={String(speed.incorrect)} />
            <Stat label="Accuracy" value={`${acc}%`} />
            <Stat label="Best streak" value={String(speed.bestStreak)} />
          </dl>
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

  const kind = round.kind;
  const currentCents = barTotal(spec.barCents, sidePlates.map((p) => p.cents));
  const equal = currentCents === round.targetCents;
  const over = currentCents > round.targetCents;
  const streak = speed?.running ? speed.streak : currentStreak;
  const timerFrac =
    kind === "load" && eliteRemainingMs !== null && round.timedMs
      ? eliteRemainingMs / round.timedMs
      : speed?.running
        ? speed.remainingMs / 60000
        : null;

  const locked = Boolean(feedback);

  return (
    <div className="gym-shell flex flex-col h-dvh overflow-hidden px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <Header
        onBack={goHome}
        muted={muted}
        onMute={() => setMuted(!muted)}
        title={MODE_LABEL[mode] ?? "BAR MATH"}
        streak={streak}
      />

      {timerFrac !== null ? (
        <div className="mt-3 h-1 rounded-full bg-surface-2 overflow-hidden">
          <div
            className={cn("h-full rounded-full bg-accent", timerFrac < 0.2 && "bg-danger")}
            style={{ width: `${Math.max(0, timerFrac * 100)}%` }}
          />
        </div>
      ) : null}

      {speed?.running ? (
        <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.16em] text-muted tabular-nums">
          <span>{Math.ceil(speed.remainingMs / 1000)}s</span>
          <span>{speed.score} pts</span>
        </div>
      ) : null}

      {mode === "trainer" ? (
        <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-muted tabular-nums">
          {trainerIndex + 1} / {trainerCurriculum(unit).length}
        </p>
      ) : null}

      <div className="mt-4 text-center">
        {kind === "load" ? (
          <>
            <p className="text-[0.7rem] tracking-[0.32em] uppercase text-muted">
              {round.trainerTitle ?? "Target Weight"}
            </p>
            <p className="font-display text-5xl sm:text-7xl tracking-tight tabular-nums text-fg leading-none mt-1">
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

      <div className="mt-4">
        <Barbell
          unit={unit}
          plates={kind === "load" ? sidePlates : round.shownPlates}
          interactive={kind === "load" && !locked}
          onRemove={kind === "load" ? removePlate : undefined}
          hit={feedback?.kind === "correct" || feedback?.kind === "math"}
        />
        <div className="gym-floor mt-3" />
      </div>

      {kind === "load" ? (
        <div className="mt-4 text-center">
          <p
            className={cn(
              "font-display text-xl tracking-wide tabular-nums",
              equal && difficulty !== "elite" ? "text-success" : over ? "text-danger" : "text-fg",
            )}
          >
            Current weight: {formatWeight(currentCents)} {spec.suffix}
          </p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-subtle">
            Both sides load together
          </p>
        </div>
      ) : (
        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-subtle">
          {spec.barLabel} {spec.suffix} bar · plates each side
        </p>
      )}

      {round.hint && !feedback ? (
        <p className="mt-3 mx-auto max-w-md text-center text-sm text-muted text-pretty">{round.hint}</p>
      ) : null}

      <div className="mt-auto pt-3">
        {kind === "load" ? (
          <>
            <PlateRack
              unit={unit}
              counts={counts}
              disabled={locked}
              onAdd={addPlate}
            />
            <div className="mt-3 flex flex-col gap-1.5 max-w-md mx-auto">
              <Button className="w-full" onClick={checkAnswer} disabled={locked}>
                Check Answer
              </Button>
              <Button className="w-full" variant="ghost" onClick={clearBar} disabled={locked}>
                Clear Bar
              </Button>
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

function Header({
  onBack,
  muted,
  onMute,
  title,
  streak,
}: {
  onBack: () => void;
  muted: boolean;
  onMute: () => void;
  title: string;
  streak?: number;
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
      {streak && streak > 0 ? (
        <p className="stat-chip mx-auto mt-2">
          <Flame className="size-3.5 text-accent" />
          {streak} streak
        </p>
      ) : null}
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
  unit: ReturnType<typeof specFor>["id"];
  feedback: NonNullable<ReturnType<typeof useGameStore.getState>["feedback"]>;
  onContinue: () => void;
  speed: boolean;
}) {
  const spec = specFor(unit);
  const isWin = feedback.kind === "correct" || feedback.kind === "math";

  useEffect(() => {
    if (!isWin) return;
    const ms = speed ? 700 : feedback.kind === "math" ? 2600 : 1200;
    const t = window.setTimeout(onContinue, ms);
    return () => window.clearTimeout(t);
  }, [isWin, speed, feedback.kind, onContinue]);

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
            {feedback.streak && feedback.streak >= 2 ? (
              <p className="mt-2 inline-flex items-center gap-1 text-sm uppercase tracking-[0.18em] text-accent">
                <Flame className="size-4" />
                {feedback.streak} streak
              </p>
            ) : null}
            {feedback.xpGained ? (
              <p className="mt-2 text-muted text-sm tabular-nums">+{feedback.xpGained} XP</p>
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
