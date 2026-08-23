import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useGameStore } from "@/lib/game/store";
import { listLbBoard } from "@/lib/leaderboard/functions";
import {
  LB_DIFFICULTIES,
  LB_MODES,
  LB_PERIODS,
  MODE_LABEL,
  PERIOD_LABEL,
  type BoardRow,
  type LbDifficulty,
  type LbMode,
  type LbPeriod,
} from "@/lib/leaderboard/rules";
import { DIFFICULTY_META } from "@/lib/game/progression";
import { cn } from "@/lib/utils";

export function LeaderboardScreen() {
  const goHome = useGameStore((s) => s.goHome);
  const difficulty = useGameStore((s) => s.difficulty);
  const clientId = useGameStore((s) => s.clientId);
  const focus = useGameStore((s) => s.lbFocus);
  const bestSpeed = useGameStore((s) => s.bestSpeedScore);
  const muscleBest = useGameStore((s) => s.anatomyBestSpeed);
  const boneBest = useGameStore((s) => s.boneBestSpeed);
  const [mode, setMode] = useState<LbMode>(focus ?? "bar");
  const [period, setPeriod] = useState<LbPeriod>("today");
  const [diff, setDiff] = useState<LbDifficulty>(difficulty);
  const [rows, setRows] = useState<BoardRow[]>([]);
  const [you, setYou] = useState<{ rank: number; name: string; score: number } | null>(null);
  const [down, setDown] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    setLoading(true);
    listLbBoard({ data: { mode, difficulty: diff, period, clientId } })
      .then((r) => {
        if (!live) return;
        if (r.ok) {
          setRows(r.rows);
          setYou(r.you);
          setDown(false);
        } else {
          setDown(true);
          setRows([]);
          setYou(null);
        }
      })
      .catch(() => {
        if (live) {
          setDown(true);
          setRows([]);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [mode, diff, period, clientId]);

  const localBest = mode === "bar" ? bestSpeed : mode === "muscle" ? muscleBest : boneBest;
  const globalBest = rows[0]?.score ?? null;
  const youOffBoard = you && !rows.some((r) => r.mine && r.rank === you.rank);

  return (
    <div className="gym-shell flex flex-col px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))]">
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
          <p className="font-display tracking-[0.18em] text-xs text-muted">COMPETE</p>
          <h1 className="font-display tracking-[0.14em] text-lg">LEADERBOARDS</h1>
        </div>
        <span className="size-11 shrink-0" />
      </header>

      <div className="mt-4 max-w-md mx-auto w-full">
        <Seg
          value={mode}
          options={LB_MODES.map((id) => [id, MODE_LABEL[id].replace(" SPEED", "")] as const)}
          onChange={setMode}
        />
        <div className="mt-2">
          <Seg value={period} options={LB_PERIODS.map((id) => [id, PERIOD_LABEL[id]] as const)} onChange={setPeriod} />
        </div>
        <div className="mt-2">
          <Seg
            value={diff}
            options={LB_DIFFICULTIES.map((id) => [id, DIFFICULTY_META[id].name.toUpperCase()] as const)}
            onChange={setDiff}
          />
        </div>

        <p className="mt-4 text-center text-[11px] uppercase tracking-[0.18em] text-subtle">
          {MODE_LABEL[mode]} · {PERIOD_LABEL[period]} · {DIFFICULTY_META[diff].name}
        </p>
        <p className="mt-1 text-center text-[11px] uppercase tracking-[0.16em] text-subtle">
          Windows run on UTC · ranked by correct, then accuracy
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Chip label="Your best" value={String(localBest)} />
          <Chip label="Global best" value={globalBest == null ? "—" : String(globalBest)} />
        </div>

        {down ? (
          <p className="mt-8 text-center text-sm text-muted text-pretty">
            Leaderboard temporarily unavailable. Your local score is safe.
          </p>
        ) : loading ? (
          <p className="mt-8 text-center text-sm text-muted">Loading board…</p>
        ) : rows.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted text-pretty">
            No scores yet for this board. Finish a Speed Round and submit.
          </p>
        ) : (
          <ol className="mt-4 space-y-1.5">
            {rows.map((row) => (
              <li
                key={`${row.rank}-${row.name}-${row.score}`}
                className={cn(
                  "rounded-2xl border px-3 py-2.5 flex items-baseline gap-3",
                  row.mine ? "border-accent bg-accent/10" : "border-border bg-surface",
                )}
              >
                <span className="font-display tabular-nums w-8 shrink-0 text-muted">{row.rank}</span>
                <span className="flex-1 min-w-0">
                  <span className="font-display tracking-wide block truncate">{row.name}</span>
                  <span className="text-[11px] uppercase tracking-[0.14em] text-subtle">
                    {row.correct} correct · {row.accuracy}%
                  </span>
                </span>
                <span className="font-display text-xl tabular-nums">{row.score}</span>
              </li>
            ))}
          </ol>
        )}

        {youOffBoard && you ? (
          <div className="mt-4 rounded-2xl border border-accent px-3 py-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Your rank</p>
            <p className="font-display tracking-wide mt-1">
              #{you.rank} — {you.name} — {you.score}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: ReadonlyArray<readonly [T, string]>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-3xl bg-surface p-1.5 border border-border" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            "min-h-10 rounded-2xl font-display tracking-wide text-[10px] px-1",
            value === id ? "bg-accent text-accent-fg" : "text-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-3 py-3">
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}
