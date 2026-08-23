import { useEffect, useState } from "react";
import { ChevronLeft, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BodyFigure } from "@/components/anatomy/BodyFigure";
import { useGameStore } from "@/lib/game/store";
import { DIFFICULTY_META, xpForCorrect } from "@/lib/game/progression";
import { sfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import { MUSCLE_BY_ID, displayName, type MuscleId } from "@/lib/anatomy/muscles";
import {
  makeAnatomyQuestion,
  makeSpeedPrompt,
  type AnatomyKind,
  type AnatomyQuestion,
} from "@/lib/anatomy/game";

type Tab = "poke" | "name" | "speed";

export function AnatomyScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const difficulty = useGameStore((s) => s.difficulty);
  const bestSpeed = useGameStore((s) => s.anatomyBestSpeed);
  const [tab, setTab] = useState<Tab>("poke");

  return (
    <div className="gym-shell flex flex-col px-4 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
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
          <p className="font-display tracking-[0.18em] text-xs text-muted">TOOLS & TRAINING</p>
          <h1 className="font-display tracking-[0.14em] text-lg">POKE A MUSCLE</h1>
        </div>
        <span className="size-11 shrink-0" />
      </header>

      <div className="mt-4 max-w-md mx-auto w-full grid grid-cols-3 gap-1.5 rounded-3xl bg-surface p-1.5 border border-border">
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
              "h-11 rounded-2xl font-display tracking-wide text-xs",
              tab === id ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "speed" ? (
        <SpeedPlay key="speed" difficulty={difficulty} best={bestSpeed} />
      ) : (
        <Play key={tab} kind={tab} difficulty={difficulty} />
      )}
    </div>
  );
}

function Play({ kind, difficulty }: { kind: AnatomyKind; difficulty: ReturnType<typeof useGameStore.getState>["difficulty"] }) {
  const record = useGameStore((s) => s.recordAnatomyAnswer);
  const [q, setQ] = useState<AnatomyQuestion>(() => makeAnatomyQuestion(difficulty, kind));
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [missId, setMissId] = useState<MuscleId | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const started = useState(() => Date.now())[0];
  const muscle = MUSCLE_BY_ID[q.muscleId];
  const reveal = flash === "correct" || misses >= 2;
  const named = kind === "name";

  function next(from = q.muscleId) {
    setQ(makeAnatomyQuestion(difficulty, kind, from));
    setMisses(0);
    setMissId(null);
    setFlash(null);
    setPicked(null);
  }

  function succeed() {
    sfx.correct();
    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setFlash("correct");
    const xp = xpForCorrect({
      difficulty,
      attempts: misses + 1,
      elapsedMs: Date.now() - started,
      streak: nextStreak,
    });
    record({ hit: true, xp, streak: nextStreak });
    window.setTimeout(() => next(), 1100);
  }

  function fail(id: MuscleId | null) {
    sfx.wrong();
    setStreak(0);
    setMisses((n) => n + 1);
    setMissId(id);
    setFlash("wrong");
    record({ hit: false, xp: 0, streak: 0 });
  }

  function onPoke(id: MuscleId | null) {
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

  return (
    <div className="mt-4 max-w-md mx-auto w-full flex flex-col">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
        <span>{DIFFICULTY_META[difficulty].name}</span>
        <span className="inline-flex items-center gap-1">
          <Flame className="size-3.5 text-accent" />
          {streak} streak
        </span>
      </div>
      <p className="mt-3 text-center font-display text-xl tracking-[0.12em] text-pretty">{q.prompt}</p>
      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-subtle mt-1">
        {muscle.view === "front" ? "Anterior" : "Posterior"}
        {muscle.group ? " · group" : ""}
      </p>

      <div className="mt-2 flex justify-center">
        <BodyFigure
          view={muscle.view}
          target={named || reveal ? q.muscleId : null}
          missId={missId}
          reveal={reveal}
          fatHit={difficulty === "rookie"}
          locked={flash === "correct"}
          onPoke={onPoke}
        />
      </div>

      {kind === "name" && q.choices ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {q.choices.map((c) => {
            const showCorrect = flash === "correct" && c.id === q.muscleId;
            const showWrong = flash === "wrong" && picked === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onName(c.id)}
                className={cn(
                  "min-h-14 rounded-2xl border px-2 font-display text-sm tracking-wide",
                  showCorrect && "border-success bg-success text-fg",
                  showWrong && "border-danger bg-danger/20 text-fg",
                  !showCorrect && !showWrong && "border-border bg-surface text-fg",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {flash === "correct" ? (
        <div className="mt-3 text-center bm-pop">
          <p className="font-display text-3xl tracking-[0.14em]">NAILED IT</p>
          <p className="mt-2 text-sm text-muted text-pretty">{q.fact}</p>
        </div>
      ) : null}
      {flash === "wrong" ? (
        <div className="mt-3 text-center">
          <p className="font-display tracking-wide">TRY AGAIN</p>
          {misses >= 2 ? (
            <p className="mt-1 text-sm text-muted">
              {displayName(muscle, difficulty)}
              {muscle.group ? " (group)" : ""} — {q.cue}
            </p>
          ) : (
            <p className="mt-1 text-sm text-muted">Tap the matching region.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SpeedPlay({
  difficulty,
  best,
}: {
  difficulty: ReturnType<typeof useGameStore.getState>["difficulty"];
  best: number;
}) {
  const record = useGameStore((s) => s.recordAnatomyAnswer);
  const setBest = useGameStore((s) => s.setAnatomySpeedBest);
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(60000);
  const [q, setQ] = useState<AnatomyQuestion>(() => makeSpeedPrompt(difficulty));
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      setRemaining((ms) => {
        const next = ms - dt;
        if (next <= 0) return 0;
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    if (running && remaining <= 0) {
      setRunning(false);
      setBest(score);
    }
  }, [remaining, running, score, setBest]);

  function start() {
    setRunning(true);
    setRemaining(60000);
    setCorrect(0);
    setIncorrect(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setQ(makeSpeedPrompt(difficulty));
  }

  function onPoke(id: MuscleId | null) {
    if (!running) return;
    const muscle = MUSCLE_BY_ID[q.muscleId];
    if (id === q.muscleId) {
      sfx.correct();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBestStreak((b) => Math.max(b, nextStreak));
      setCorrect((n) => n + 1);
      const gained = 10 + Math.min(20, nextStreak * 2);
      setScore((s) => s + gained);
      record({
        hit: true,
        xp: xpForCorrect({ difficulty, attempts: 1, elapsedMs: 800, streak: nextStreak }),
        streak: nextStreak,
      });
      setQ(makeSpeedPrompt(difficulty, muscle.id));
      return;
    }
    sfx.wrong();
    setStreak(0);
    setIncorrect((n) => n + 1);
    record({ hit: false, xp: 0, streak: 0 });
  }

  const muscle = MUSCLE_BY_ID[q.muscleId];
  const asked = correct + incorrect;
  const acc = asked === 0 ? 0 : Math.round((correct / asked) * 100);

  if (!running && remaining === 0) {
    return (
      <div className="mt-8 max-w-md mx-auto w-full text-center">
        <p className="font-display tracking-[0.28em] text-muted text-sm">SESSION COMPLETE</p>
        <p className="mt-2 font-display text-6xl tabular-nums">{score}</p>
        <p className="text-muted mt-1">Muscle speed</p>
        <dl className="mt-8 grid grid-cols-2 gap-3 text-left">
          <Stat label="Correct" value={String(correct)} />
          <Stat label="Incorrect" value={String(incorrect)} />
          <Stat label="Accuracy" value={`${acc}%`} />
          <Stat label="Best streak" value={String(bestStreak)} />
        </dl>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-subtle">Best {Math.max(best, score)}</p>
        <Button className="mt-6 w-full" onClick={start}>
          Go again
        </Button>
      </div>
    );
  }

  if (!running) {
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
    <div className="mt-4 max-w-md mx-auto w-full flex flex-col">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
        <span className="tabular-nums">{Math.ceil(remaining / 1000)}s</span>
        <span className="tabular-nums">{score} pts</span>
        <span className="inline-flex items-center gap-1">
          <Flame className="size-3.5 text-accent" />
          {streak}
        </span>
      </div>
      <div className="mt-2 h-1 rounded-full bg-surface-2 overflow-hidden">
        <div className="h-full bg-accent" style={{ width: `${(remaining / 60000) * 100}%` }} />
      </div>
      <p className="mt-3 text-center font-display text-2xl tracking-[0.12em]">{q.prompt}</p>
      <div className="mt-2 flex justify-center">
        <BodyFigure
          view={muscle.view}
          target={null}
          missId={null}
          reveal={false}
          fatHit={difficulty === "rookie"}
          onPoke={onPoke}
        />
      </div>
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
