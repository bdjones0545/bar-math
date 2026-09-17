import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BodyFigure } from "@/components/anatomy/BodyFigure";
import { AnatomyLab, type LabCaption } from "@/components/anatomy/AnatomyLab";
import { SpeedSubmit } from "@/components/game/SpeedSubmit";
import { Countdown } from "@/components/game/Countdown";
import { useGameStore } from "@/lib/game/store";
import { xpForCorrect } from "@/lib/game/progression";
import { sfx } from "@/lib/game/audio";
import { haptics } from "@/lib/game/haptics";
import { cn } from "@/lib/utils";
import { MUSCLE_BY_ID, displayName, type MuscleId } from "@/lib/anatomy/muscles";
import { SPEED_TOTAL_MS, useAnatomyLab, useSpeedClock } from "@/lib/anatomy/visual";
import {
  makeAnatomyQuestion,
  makeSpeedPrompt,
  type AnatomyKind,
  type AnatomyQuestion,
} from "@/lib/anatomy/game";
import { useLeaderboardTicket } from "@/lib/leaderboard/useTicket";

type Tab = "poke" | "name" | "speed";

export function AnatomyScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const difficulty = useGameStore((s) => s.difficulty);
  const bestSpeed = useGameStore((s) => s.anatomyBestSpeed);
  const [tab, setTab] = useState<Tab>("poke");
  const lab = useAnatomyLab("muscle");

  return (
    <div className="gym-shell lab-shell flex flex-col h-dvh overflow-hidden px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-2">
        <button
          type="button"
          onClick={goHome}
          className="size-11 shrink-0 rounded-2xl border border-border bg-surface grid place-items-center text-muted"
          aria-label="Back"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <p className="font-display tracking-[0.18em] text-[11px] text-muted">ATHLETE PERFORMANCE LAB</p>
          <h1 className="font-display tracking-[0.14em] text-lg leading-tight">POKE A MUSCLE</h1>
        </div>
        <span className="size-11 shrink-0" />
      </header>

      <div className="mt-3 max-w-md mx-auto w-full grid grid-cols-3 gap-1 rounded-2xl bg-surface p-1 border border-border">
        {(
          [
            ["poke", "Poke"],
            ["name", "Name"],
            ["speed", "Speed"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-9 rounded-xl font-display tracking-wide text-xs transition-colors",
              tab === id ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "speed" ? (
        <SpeedPlay key="speed" difficulty={difficulty} best={bestSpeed} lab={lab} />
      ) : (
        <Play key={tab} kind={tab} difficulty={difficulty} lab={lab} />
      )}
    </div>
  );
}

function Play({
  kind,
  difficulty,
  lab,
}: {
  kind: AnatomyKind;
  difficulty: ReturnType<typeof useGameStore.getState>["difficulty"];
  lab: ReturnType<typeof useAnatomyLab>;
}) {
  const record = useGameStore((s) => s.recordAnatomyAnswer);
  const [q, setQ] = useState<AnatomyQuestion>(() => makeAnatomyQuestion(difficulty, kind));
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [tally, setTally] = useState({ correct: 0, incorrect: 0 });
  const [misses, setMisses] = useState(0);
  const [missId, setMissId] = useState<MuscleId | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [started, setStarted] = useState(() => Date.now());
  const muscle = MUSCLE_BY_ID[q.muscleId];
  const reveal = flash === "correct" || misses >= 2;
  const named = kind === "name";

  function next(from = q.muscleId) {
    setQ(makeAnatomyQuestion(difficulty, kind, from));
    setRound((n) => n + 1);
    setMisses(0);
    setMissId(null);
    setFlash(null);
    setPicked(null);
    setStarted(Date.now());
  }

  function succeed() {
    sfx.correct();
    haptics.correct();
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setFlash("correct");
    setTally((t) => ({ ...t, correct: t.correct + 1 }));
    const xp = xpForCorrect({
      difficulty,
      attempts: misses + 1,
      elapsedMs: Date.now() - started,
      streak: nextStreak,
    });
    record({ hit: true, xp, streak: nextStreak });
    lab.celebrate(xp, nextStreak);
    // Long enough to read the fact; the caption is where the eye already is.
    window.setTimeout(() => next(), 1600);
  }

  function fail(id: MuscleId | null) {
    sfx.wrong();
    lab.miss();
    setStreak(0);
    setMisses((n) => n + 1);
    setMissId(id);
    setFlash("wrong");
    if (misses === 0) setTally((t) => ({ ...t, incorrect: t.incorrect + 1 }));
    record({ hit: false, xp: 0, streak: 0 });
  }

  function onPoke(id: MuscleId | null, pt?: { x: number; y: number }) {
    if (pt) lab.impact(pt.x, pt.y);
    if (kind !== "poke" || flash === "correct") return;
    if (id === q.muscleId) succeed();
    else fail(id);
  }

  function onName(id: MuscleId) {
    if (kind !== "name" || flash === "correct") return;
    setPicked(id);
    if (id === q.muscleId) succeed();
    else fail(id);
  }

  function showMe() {
    setMisses(2);
    setFlash("wrong");
  }

  const wrongName = missId ? MUSCLE_BY_ID[missId] : null;
  let caption: LabCaption | null = null;
  if (flash === "correct") {
    caption = {
      tone: "correct",
      title: `NAILED IT — ${muscle.name.toUpperCase()}`,
      subtitle: muscle.gymName,
      body: q.fact,
    };
  } else if (misses >= 2) {
    caption = {
      tone: "reveal",
      title: muscle.name.toUpperCase(),
      subtitle: `${muscle.gymName} · ${q.cue}`,
      body: named ? "Pick it from the list." : "Tap the highlighted region.",
    };
  } else if (flash === "wrong") {
    caption = {
      tone: "wrong",
      title: "TRY AGAIN",
      subtitle: wrongName
        ? `That was the ${displayName(wrongName, difficulty).toLowerCase()}`
        : "Nothing there",
      action: { label: "Show me", onClick: showMe },
    };
  }

  return (
    <AnatomyLab
      personality="muscle"
      difficulty={difficulty}
      prompt={q.prompt}
      promptKey={q.id}
      viewLabel={muscle.view === "front" ? "Anterior" : "Posterior"}
      group={muscle.group}
      flash={flash}
      hud={{ round, correct: tally.correct, incorrect: tally.incorrect, streak }}
      xpBurst={lab.xpBurst}
      streakBurst={lab.streakBurst}
      shake={lab.shake}
      intro={lab.intro}
      reduced={lab.reduced}
      ripples={lab.ripples}
      caption={caption}
      onSkipIntro={lab.skipIntro}
      figure={
        <BodyFigure
          view={muscle.view}
          target={named || reveal ? q.muscleId : null}
          missId={missId}
          reveal={reveal}
          fatHit={difficulty === "rookie"}
          locked={flash === "correct"}
          hit={flash}
          onPoke={onPoke}
        />
      }
      footer={
        kind === "name" && q.choices ? (
          <div className="grid grid-cols-2 gap-1.5 max-w-md mx-auto">
            {q.choices.map((c) => {
              const showCorrect = (flash === "correct" || misses >= 2) && c.id === q.muscleId;
              const showWrong = flash === "wrong" && picked === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onName(c.id)}
                  className={cn(
                    "lab-choice",
                    showCorrect && "is-correct",
                    showWrong && "is-wrong",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        ) : null
      }
    />
  );
}

function SpeedPlay({
  difficulty,
  best,
  lab,
}: {
  difficulty: ReturnType<typeof useGameStore.getState>["difficulty"];
  best: number;
  lab: ReturnType<typeof useAnatomyLab>;
}) {
  const record = useGameStore((s) => s.recordAnatomyAnswer);
  const setBest = useGameStore((s) => s.setAnatomySpeedBest);
  const clock = useSpeedClock();
  const [q, setQ] = useState<AnatomyQuestion>(() => makeSpeedPrompt(difficulty));
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [hit, setHit] = useState<"correct" | "wrong" | null>(null);
  const [finalized, setFinalized] = useState(false);
  const lb = useLeaderboardTicket("muscle", clock.running);

  // Bank the score once when the clock runs out.
  useEffect(() => {
    if (!clock.done || finalized) return;
    setFinalized(true);
    setBest(score);
    if (score > 0 && score > best) {
      sfx.record();
      haptics.levelUp();
    }
  }, [clock.done, finalized, score, best, setBest]);

  function start() {
    lab.skipIntro();
    setCorrect(0);
    setIncorrect(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHit(null);
    setFinalized(false);
    setQ(makeSpeedPrompt(difficulty));
    clock.start();
  }

  function onPoke(id: MuscleId | null, pt?: { x: number; y: number }) {
    if (!clock.running) return;
    if (pt) lab.impact(pt.x, pt.y);
    const muscle = MUSCLE_BY_ID[q.muscleId];
    if (id === q.muscleId) {
      sfx.correct();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrect((n) => n + 1);
      const gained = 10 + Math.min(20, nextStreak * 2);
      setScore((s) => s + gained);
      const xp = xpForCorrect({ difficulty, attempts: 1, elapsedMs: 800, streak: nextStreak });
      record({ hit: true, xp, streak: nextStreak });
      lab.celebrate(xp, nextStreak);
      setHit("correct");
      setQ(makeSpeedPrompt(difficulty, muscle.id));
      window.setTimeout(() => setHit(null), 180);
      return;
    }
    sfx.wrong();
    lab.miss();
    setStreak(0);
    setIncorrect((n) => n + 1);
    setHit("wrong");
    window.setTimeout(() => setHit(null), 180);
    record({ hit: false, xp: 0, streak: 0 });
  }

  const muscle = MUSCLE_BY_ID[q.muscleId];
  const asked = correct + incorrect;
  const acc = asked === 0 ? 0 : Math.round((correct / asked) * 100);

  if (clock.done) {
    return (
      <div className="mt-6 max-w-md mx-auto w-full text-center overflow-y-auto">
        <p className="font-display tracking-[0.28em] text-muted text-sm">SESSION COMPLETE</p>
        <p className="bm-pop mt-2 font-display text-7xl tabular-nums">{score}</p>
        <p className="text-muted mt-1">Muscle speed</p>
        <dl className="mt-6 grid grid-cols-2 gap-3 text-left">
          <Stat label="Correct" value={String(correct)} />
          <Stat label="Incorrect" value={String(incorrect)} />
          <Stat label="Accuracy" value={`${acc}%`} />
          <Stat label="Best streak" value={String(bestStreak)} />
        </dl>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-subtle">Best {Math.max(best, score)}</p>
        <SpeedSubmit
          mode="muscle"
          ticket={lb.ticket}
          boardStatus={lb.status}
          score={score}
          correct={correct}
          incorrect={incorrect}
          personalBest={score > 0 && score === Math.max(best, score)}
        />
        <Button className="mt-6 w-full" onClick={start}>
          Go again
        </Button>
      </div>
    );
  }

  if (clock.phase === "idle") {
    return (
      <div className="mt-8 max-w-md mx-auto w-full text-center">
        <p className="font-display text-3xl tracking-[0.12em]">MUSCLE SPEED ROUND</p>
        <p className="mt-3 text-muted text-pretty">60 seconds. See the name. Tap the muscle.</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-subtle">Best {best}</p>
        <Button className="mt-6 w-full" onClick={start}>
          Start
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-3 max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
      <div className="flex items-center justify-between font-display text-sm uppercase tracking-[0.16em] text-muted tabular-nums">
        <span className={cn(clock.urgent && "bm-urgent")}>{Math.ceil(clock.remaining / 1000)}s</span>
        <span className="text-fg">{score} pts</span>
        <span className={cn("inline-flex items-center gap-1", streak >= 5 && "text-fg")}>
          {streak} streak
        </span>
      </div>
      <div className="mt-1.5 bm-timer">
        <div
          className={cn("bm-timer-fill", clock.urgent && "is-urgent")}
          style={{ width: `${(clock.remaining / SPEED_TOTAL_MS) * 100}%` }}
        />
      </div>
      <AnatomyLab
        personality="muscle"
        difficulty={difficulty}
        prompt={q.prompt}
        promptKey={q.id}
        viewLabel={muscle.view === "front" ? "Anterior" : "Posterior"}
        group={false}
        flash={hit}
        hud={null}
        xpBurst={lab.xpBurst}
        streakBurst={lab.streakBurst}
        shake={lab.shake}
        intro={false}
        speed
        reduced={lab.reduced}
        ripples={lab.ripples}
        caption={null}
        onSkipIntro={lab.skipIntro}
        figure={
          <BodyFigure
            view={muscle.view}
            target={null}
            missId={null}
            reveal={false}
            fatHit={difficulty === "rookie"}
            hit={hit}
            speed
            onPoke={onPoke}
          />
        }
      />
      {clock.inIntro ? (
        <Countdown introMs={clock.intro} title="MUSCLE SPEED" subtitle="See the name. Tap the muscle." />
      ) : null}
    </div>
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
