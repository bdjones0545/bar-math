import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronDown, ChevronLeft, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";
import { DIFFICULTY_META } from "@/lib/game/progression";
import { sfx } from "@/lib/game/audio";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  CATEGORY_UNITS,
  PARSE_MESSAGE,
  UNITS,
  convert,
  formatResult,
  parseInput,
  quickRefs,
  type ConvertCategory,
  type ConvertUnit,
} from "@/lib/convert/units";
import { makeChallengeQuestion, type ChallengeQuestion } from "@/lib/convert/challenge";

type Tab = "convert" | "challenge";

export function ConvertScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const difficulty = useGameStore((s) => s.difficulty);
  const [tab, setTab] = useState<Tab>("convert");

  return (
    <div className="gym-shell flex flex-col px-5 pb-10 pt-[max(1.25rem,env(safe-area-inset-top))]">
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
          <h1 className="font-display tracking-[0.14em] text-lg">CONVERSION MEASUREMENTS</h1>
        </div>
        <span className="size-11 shrink-0" />
      </header>

      <div className="mt-5 max-w-md mx-auto w-full grid grid-cols-2 gap-1.5 rounded-3xl bg-surface p-1.5 border border-border">
        {(
          [
            ["convert", "Converter"],
            ["challenge", "Challenge"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "h-11 rounded-2xl font-display tracking-wide text-sm",
              tab === id ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "convert" ? <Converter /> : <Challenge difficulty={difficulty} />}
    </div>
  );
}

function Converter() {
  const [category, setCategory] = useState<ConvertCategory>("mass");
  const [from, setFrom] = useState<ConvertUnit>("kg");
  const [to, setTo] = useState<ConvertUnit>("lb");
  const [raw, setRaw] = useState("100");
  const [openRef, setOpenRef] = useState<string | null>("Weight");

  const units = CATEGORY_UNITS[category];
  const parsed = parseInput(raw);
  const result = useMemo(() => {
    if (!parsed.ok) return { text: PARSE_MESSAGE[parsed.reason], live: false };
    try {
      return { text: formatResult(convert(parsed.value, from, to)), live: true };
    } catch {
      return { text: "—", live: false };
    }
  }, [parsed, from, to]);

  function selectCategory(next: ConvertCategory) {
    const meta = CATEGORY_META[next];
    setCategory(next);
    setFrom(meta.from);
    setTo(meta.to);
  }

  function pickFrom(id: ConvertUnit) {
    if (id === to) setTo(from);
    setFrom(id);
  }

  function pickTo(id: ConvertUnit) {
    if (id === from) setFrom(to);
    setTo(id);
  }

  function swap() {
    const nextFrom = to;
    const nextTo = from;
    setFrom(nextFrom);
    setTo(nextTo);
    if (result.live) setRaw(result.text);
  }

  const refs = quickRefs();

  return (
    <div className="mt-6 max-w-md mx-auto w-full">
      <div className="grid grid-cols-3 gap-1.5 rounded-3xl bg-surface p-1.5 border border-border">
        {(Object.keys(CATEGORY_META) as ConvertCategory[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectCategory(id)}
            className={cn(
              "h-11 rounded-2xl font-display tracking-wide text-xs",
              category === id ? "bg-accent text-accent-fg" : "text-muted",
            )}
          >
            {CATEGORY_META[id].name}
          </button>
        ))}
      </div>

      <label className="mt-6 block">
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Convert</span>
        <input
          value={raw}
          inputMode="decimal"
          enterKeyHint="done"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          onChange={(e) => setRaw(e.target.value)}
          className="mt-2 w-full h-16 rounded-3xl border border-border bg-surface px-4 font-display text-4xl tabular-nums tracking-wide text-fg outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          aria-label="Value to convert"
        />
      </label>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-muted">From</p>
      <UnitGrid units={units} selected={from} onPick={pickFrom} />

      <div className="mt-3 flex justify-center">
        <button
          type="button"
          onClick={swap}
          className="size-12 rounded-2xl border border-border bg-surface-2 grid place-items-center text-fg"
          aria-label={`Swap ${UNITS[from].label} and ${UNITS[to].label}`}
        >
          <ArrowLeftRight className="size-5" />
        </button>
      </div>

      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">To</p>
      <UnitGrid units={units} selected={to} onPick={pickTo} />

      <div className="mt-6 rounded-3xl border border-border bg-surface px-5 py-6 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Result</p>
        <p
          className={cn(
            "mt-2 font-display tracking-wide tabular-nums",
            result.live ? "text-5xl text-fg" : "text-3xl text-muted",
          )}
        >
          {result.text}
        </p>
        {result.live ? (
          <p className="mt-2 font-display tracking-[0.16em] text-muted">{UNITS[to].label}</p>
        ) : null}
      </div>

      <p className="mt-8 text-[11px] uppercase tracking-[0.18em] text-muted">Athlete quick conversions</p>
      <div className="mt-3 space-y-2">
        {refs.map((group) => {
          const open = openRef === group.title;
          return (
            <div key={group.title} className="rounded-2xl border border-border bg-surface overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenRef(open ? null : group.title)}
                className="w-full h-12 px-4 flex items-center justify-between font-display tracking-wide"
                aria-expanded={open}
              >
                {group.title}
                <ChevronDown className={cn("size-4 text-muted transition-transform", open && "rotate-180")} />
              </button>
              {open ? (
                <ul className="px-4 pb-4 space-y-2">
                  {group.rows.map((row) => (
                    <li key={row.left} className="flex items-center justify-between text-sm tabular-nums">
                      <span className="text-muted">{row.left}</span>
                      <span className="font-display tracking-wide">{row.right}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UnitGrid({
  units,
  selected,
  onPick,
}: {
  units: ConvertUnit[];
  selected: ConvertUnit;
  onPick: (id: ConvertUnit) => void;
}) {
  return (
    <div className="mt-2 grid grid-cols-4 gap-1.5">
      {units.map((id) => {
        const on = selected === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onPick(id)}
            className={cn(
              "min-h-11 rounded-2xl border font-display tracking-wide text-xs",
              on ? "border-accent bg-accent text-accent-fg" : "border-border bg-surface text-muted",
            )}
            aria-pressed={on}
          >
            {UNITS[id].label}
          </button>
        );
      })}
    </div>
  );
}

function Challenge({ difficulty }: { difficulty: ReturnType<typeof useGameStore.getState>["difficulty"] }) {
  const [question, setQuestion] = useState<ChallengeQuestion>(() => makeChallengeQuestion(difficulty));
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);

  function next(avoid = question.id) {
    setQuestion(makeChallengeQuestion(difficulty, avoid));
    setPicked(null);
    setFlash(null);
  }

  function choose(label: string, correct: boolean) {
    if (flash === "correct") return;
    setPicked(label);
    if (correct) {
      sfx.correct();
      const nextStreak = streak + 1;
      setStreak(nextStreak);
      setBest((b) => Math.max(b, nextStreak));
      setFlash("correct");
      window.setTimeout(() => next(), 900);
      return;
    }
    sfx.wrong();
    setStreak(0);
    setFlash("wrong");
  }

  return (
    <div className="mt-6 max-w-md mx-auto w-full">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-muted">
        <span>{DIFFICULTY_META[difficulty].name}</span>
        <span className="inline-flex items-center gap-1">
          <Flame className="size-3.5 text-accent" />
          {streak} streak
        </span>
      </div>

      <div className="mt-6 rounded-3xl border border-border bg-surface px-5 py-8 text-center">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Convert</p>
        <p className="mt-3 font-display text-5xl tabular-nums tracking-wide">{question.valueLabel}</p>
        <p className="mt-2 font-display tracking-[0.18em] text-muted">{question.fromLabel}</p>
        <p className="mt-6 text-sm text-muted">= ? {question.toLabel}</p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {question.choices.map((c) => {
          const selected = picked === c.label;
          const showCorrect = flash === "correct" && c.correct;
          const showWrong = flash === "wrong" && selected;
          return (
            <button
              key={c.label}
              type="button"
              onClick={() => choose(c.label, c.correct)}
              className={cn(
                "min-h-16 rounded-3xl border font-display text-2xl tabular-nums tracking-wide",
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

      {flash === "wrong" ? (
        <div className="mt-4 text-center">
          <p className="font-display tracking-wide">NOT YET</p>
          <p className="mt-1 text-sm text-muted">Try another answer.</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => next()}>
            Skip
          </Button>
        </div>
      ) : null}

      {flash === "correct" ? (
        <p className="mt-6 text-center font-display text-3xl tracking-[0.14em]">NAILED IT</p>
      ) : null}

      {best > 1 ? (
        <p className="mt-6 text-center text-xs uppercase tracking-[0.16em] text-subtle">Best this session {best}</p>
      ) : null}
    </div>
  );
}
