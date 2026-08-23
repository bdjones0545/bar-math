import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/lib/game/store";
import { submitLbScore } from "@/lib/leaderboard/functions";
import { accuracyOf, NAME_MAX, type LbMode } from "@/lib/leaderboard/rules";
import { cn } from "@/lib/utils";

export function SpeedSubmit({
  mode,
  ticket,
  boardStatus,
  score,
  correct,
  incorrect,
  personalBest,
}: {
  mode: LbMode;
  ticket: { token: string } | null;
  boardStatus: "idle" | "ready" | "down";
  score: number;
  correct: number;
  incorrect: number;
  personalBest: boolean;
}) {
  const playerName = useGameStore((s) => s.playerName);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const clientId = useGameStore((s) => s.clientId);
  const setScreen = useGameStore((s) => s.setScreen);
  const setLbFocus = useGameStore((s) => s.setLbFocus);
  const [name, setName] = useState(playerName);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ rank: number; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const down = boardStatus === "down" || (boardStatus === "idle" && !ticket);

  async function submit() {
    if (!ticket || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await submitLbScore({
        data: {
          token: ticket.token,
          clientId,
          name,
          score,
          correct,
          incorrect,
          accuracy: accuracyOf(correct, incorrect),
        },
      });
      if (result.ok) {
        setPlayerName(result.name);
        setDone({ rank: result.rank, name: result.name });
      } else if (result.error === "name") {
        setError("Pick a short player name (2–16 characters).");
      } else if (result.error === "duplicate") {
        setError("This round was already submitted.");
      } else if (result.error === "rate") {
        setError("Easy — give it a minute before submitting again.");
      } else {
        setError("Leaderboard temporarily unavailable. Your local score is safe.");
      }
    } catch {
      setError("Leaderboard temporarily unavailable. Your local score is safe.");
    } finally {
      setBusy(false);
    }
  }

  function openBoard() {
    setLbFocus(mode);
    setScreen("leaderboards");
  }

  return (
    <div className="mt-6 w-full text-center">
      {personalBest ? (
        <p className="font-display tracking-[0.18em] text-accent">NEW PERSONAL BEST</p>
      ) : null}

      {down && !done ? (
        <p className="mt-3 text-sm text-muted text-pretty">
          Leaderboard temporarily unavailable. Your local score is safe.
        </p>
      ) : null}

      {done ? (
        <div className="mt-4">
          <p className="font-display text-3xl tracking-[0.12em]">#{done.rank} TODAY</p>
          <p className="mt-1 text-sm text-muted">{done.name}</p>
          <Button className="w-full mt-5" onClick={openBoard}>
            View leaderboard
          </Button>
        </div>
      ) : ticket && boardStatus === "ready" ? (
        <div className="mt-4">
          {!playerName ? (
            <label className="block text-left">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Choose your player name</span>
              <input
                value={name}
                maxLength={NAME_MAX}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full h-12 rounded-2xl border border-border bg-surface px-4 text-fg"
                placeholder="e.g. Bryan"
                autoComplete="off"
              />
            </label>
          ) : (
            <p className="text-xs uppercase tracking-[0.16em] text-subtle">Submit as {playerName}</p>
          )}
          {error ? <p className="mt-2 text-sm text-muted text-pretty">{error}</p> : null}
          <Button className="w-full mt-4" onClick={() => void submit()} disabled={busy}>
            {busy ? "Submitting…" : "Submit to leaderboard"}
          </Button>
          <button
            type="button"
            className={cn("mt-3 text-xs uppercase tracking-[0.16em] text-subtle")}
            onClick={openBoard}
          >
            Skip · view board
          </button>
        </div>
      ) : null}
    </div>
  );
}
