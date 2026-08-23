import { useEffect } from "react";
import { HomeScreen } from "@/components/game/HomeScreen";
import { PlayScreen } from "@/components/game/PlayScreen";
import { Tutorial } from "@/components/game/Tutorial";
import { StatsScreen } from "@/components/game/StatsScreen";
import { SettingsScreen } from "@/components/game/SettingsScreen";
import { useGameStore } from "@/lib/game/store";
import { setMuted, unlockAudio } from "@/lib/game/audio";

export function GameApp() {
  const hydrated = useGameStore((s) => s.hydrated);
  const screen = useGameStore((s) => s.screen);
  const toasts = useGameStore((s) => s.toasts);
  const dismissToast = useGameStore((s) => s.dismissToast);
  const hydrateDone = useGameStore((s) => s.hydrateDone);
  const muted = useGameStore((s) => s.muted);

  useEffect(() => {
    const finish = () => {
      setMuted(useGameStore.getState().muted);
      hydrateDone();
    };
    if (useGameStore.persist.hasHydrated()) {
      finish();
      return;
    }
    const unsub = useGameStore.persist.onFinishHydration(finish);
    void useGameStore.persist.rehydrate();
    return unsub;
  }, [hydrateDone]);

  useEffect(() => {
    setMuted(muted);
  }, [muted]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    const vis = () => {
      if (document.visibilityState === "visible") unlockAudio();
    };
    document.addEventListener("visibilitychange", vis);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const t = window.setTimeout(() => dismissToast(toasts[0]!.id), 2800);
    return () => window.clearTimeout(t);
  }, [toasts, dismissToast]);

  if (!hydrated) {
    return (
      <div className="gym-shell grid min-h-dvh place-items-center">
        <div className="text-center">
          <p className="font-display text-[0.7rem] tracking-[0.42em] text-muted">OLYMPIC LOADING</p>
          <h1 className="mt-2 font-display text-5xl tracking-[0.14em]">BAR MATH</h1>
        </div>
      </div>
    );
  }

  return (
    <>
      {screen === "home" && <HomeScreen />}
      {screen === "tutorial" && <Tutorial />}
      {screen === "play" && <PlayScreen />}
      {screen === "stats" && <StatsScreen />}
      {screen === "settings" && <SettingsScreen />}
      {toasts[0] ? (
        <div className="fixed top-[max(1rem,env(safe-area-inset-top))] inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bm-pop pointer-events-auto rounded-2xl border border-border bg-surface px-4 py-3 shadow-panel max-w-sm w-full">
            <p className="font-display tracking-wide">{toasts[0].title}</p>
            <p className="text-sm text-muted">{toasts[0].detail}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
