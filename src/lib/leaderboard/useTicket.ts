import { useEffect, useState } from "react";
import { useGameStore } from "@/lib/game/store";
import { startLbRound } from "./functions";
import type { LbMode } from "./rules";

export function useLeaderboardTicket(mode: LbMode, active: boolean) {
  const difficulty = useGameStore((s) => s.difficulty);
  const clientId = useGameStore((s) => s.clientId);
  const [ticket, setTicket] = useState<{ roundId: string; token: string } | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "down">("idle");

  useEffect(() => {
    if (!active || !clientId) return;
    let live = true;
    setTicket(null);
    setStatus("idle");
    startLbRound({ data: { mode, difficulty, clientId } })
      .then((r) => {
        if (!live) return;
        if (r.ok) {
          setTicket({ roundId: r.roundId, token: r.token });
          setStatus("ready");
        } else {
          setStatus("down");
        }
      })
      .catch(() => {
        if (live) setStatus("down");
      });
    return () => {
      live = false;
    };
  }, [active, mode, difficulty, clientId]);

  return { ticket, status };
}
