import { Button } from "@/components/ui/button";
import { Barbell } from "@/components/game/Barbell";
import { useGameStore } from "@/lib/game/store";
import { formatWeight, specFor } from "@/lib/game/plates";
import { tutorialDemo } from "@/lib/game/math";

export function Tutorial() {
  const step = useGameStore((s) => s.tutorialStep);
  const unit = useGameStore((s) => s.unit);
  const nextTutorial = useGameStore((s) => s.nextTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const spec = specFor(unit);
  const demo = tutorialDemo(unit);

  return (
    <div className="gym-shell flex flex-col px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-10 min-h-dvh">
      <button
        type="button"
        onClick={skipTutorial}
        className="self-end text-[11px] uppercase tracking-[0.18em] text-muted h-11"
      >
        Skip
      </button>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto w-full">
        {step === 0 ? (
          <>
            <p className="text-[0.7rem] tracking-[0.32em] uppercase text-muted">Lesson 1</p>
            <h2 className="mt-2 font-display text-4xl tracking-wide">Every Olympic bar starts with the bar.</h2>
            <div className="mt-10 w-full">
              <Barbell unit={unit} plates={[]} />
              <div className="gym-floor mt-4" />
            </div>
            <p className="mt-8 font-display text-3xl tabular-nums">
              {spec.barLabel} {spec.suffix}
            </p>
            <p className="mt-2 text-muted">
              Standard men's bar = {spec.barLabel} {spec.suffix}
            </p>
          </>
        ) : (
          <>
            <p className="text-[0.7rem] tracking-[0.32em] uppercase text-muted">Lesson 2</p>
            <h2 className="mt-2 font-display text-4xl tracking-wide">Load both sides.</h2>
            <div className="mt-10 w-full">
              <Barbell unit={unit} plates={demo.plates} />
              <div className="gym-floor mt-4" />
            </div>
            <p className="mt-8 font-display text-2xl tabular-nums text-fg">
              {spec.barLabel} + {formatWeight(demo.plates[0] ?? 0)} + {formatWeight(demo.plates[0] ?? 0)} = {formatWeight(demo.total)} {spec.suffix}
            </p>
            <p className="mt-3 text-muted text-pretty">
              One plate per side. Always count the pair.
            </p>
          </>
        )}
      </div>

      <div className="max-w-md mx-auto w-full">
        <Button className="w-full" onClick={nextTutorial}>
          {step === 0 ? "Next" : "Now you try"}
        </Button>
      </div>
    </div>
  );
}
