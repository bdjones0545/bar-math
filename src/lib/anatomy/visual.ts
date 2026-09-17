import { useEffect, useRef, useState } from "react";
import type { MuscleId } from "./muscles.ts";
import type { BoneId } from "../bones/bones.ts";
import { sfx } from "../game/audio.ts";
import { haptics } from "../game/haptics.ts";

export type MuscleBand = "shoulder" | "torso" | "core" | "arm" | "leg" | "calf";
export type BoneBand = "head" | "cage" | "girdle" | "limb" | "joint" | "small";

export const MUSCLE_BAND: Record<MuscleId, MuscleBand> = {
  deltoid: "shoulder",
  posterior_deltoid: "shoulder",
  pectoralis_major: "torso",
  trapezius: "torso",
  latissimus_dorsi: "torso",
  rectus_abdominis: "core",
  external_obliques: "core",
  erector_spinae: "core",
  biceps_brachii: "arm",
  triceps_brachii: "arm",
  forearm_flexors: "arm",
  forearm_extensors: "arm",
  quadriceps: "leg",
  hamstrings: "leg",
  gluteus_maximus: "leg",
  tibialis_anterior: "calf",
  gastrocnemius: "calf",
  soleus: "calf",
  serratus_anterior: "torso",
  adductors: "leg",
  sternocleidomastoid: "shoulder",
  gluteus_medius: "leg",
  rhomboids: "torso",
  infraspinatus: "shoulder",
  pectineus: "leg",
  sartorius: "leg",
  tensor_fasciae_latae: "leg",
  iliopsoas: "core",
  brachialis: "arm",
  piriformis: "leg",
  teres_major: "shoulder",
  quadratus_lumborum: "core",
};

export const BONE_BAND: Record<BoneId, BoneBand> = {
  skull: "head",
  mandible: "head",
  clavicle: "cage",
  scapula: "cage",
  sternum: "cage",
  ribs: "cage",
  vertebral_column: "cage",
  pelvis: "girdle",
  humerus: "limb",
  radius: "limb",
  ulna: "limb",
  femur: "limb",
  tibia: "limb",
  fibula: "limb",
  patella: "joint",
  carpals: "small",
  metacarpals: "small",
  phalanges_hand: "small",
  tarsals: "small",
  metatarsals: "small",
  phalanges_foot: "small",
  sacrum: "girdle",
  calcaneus: "small",
  coccyx: "small",
  zygomatic: "head",
  maxilla: "head",
};

export function pathCentroid(d: string): { x: number; y: number } {
  const nums = [...d.matchAll(/(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]!);
    ys.push(nums[i + 1]!);
  }
  return {
    x: (Math.min(...xs) + Math.max(...xs)) / 2,
    y: (Math.min(...ys) + Math.max(...ys)) / 2,
  };
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return reduced;
}

export interface LabRipple {
  id: number;
  x: number;
  y: number;
  kind: "poke" | "whack";
}

export function useAnatomyLab(personality: "muscle" | "bone") {
  const reduced = useReducedMotion();
  const [intro, setIntro] = useState(true);
  const [ripples, setRipples] = useState<LabRipple[]>([]);
  const [xpBurst, setXpBurst] = useState<{ id: number; n: number } | null>(null);
  const [streakBurst, setStreakBurst] = useState<number | null>(null);
  const [shake, setShake] = useState(0);

  useEffect(() => {
    const ms = reduced ? 0 : 860;
    const t = window.setTimeout(() => setIntro(false), ms);
    return () => window.clearTimeout(t);
  }, [reduced]);

  function skipIntro() {
    setIntro(false);
  }

  function impact(x: number, y: number) {
    setIntro(false);
    const id = Date.now() + Math.random();
    const kind = personality === "bone" ? "whack" : "poke";
    setRipples((list) => [...list.slice(-2), { id, x, y, kind }]);
    window.setTimeout(() => {
      setRipples((list) => list.filter((r) => r.id !== id));
    }, 480);
    try {
      navigator.vibrate?.(kind === "whack" ? 14 : 8);
    } catch {
      /* ignore */
    }
  }

  /** Wrong answer: rattle the whole figure once. */
  function miss() {
    setShake((n) => n + 1);
    haptics.wrong();
  }

  function celebrate(xp: number, streak: number) {
    const id = Date.now();
    setXpBurst({ id, n: xp });
    window.setTimeout(() => setXpBurst((cur) => (cur?.id === id ? null : cur)), 720);
    if (streak === 3 || streak === 5 || streak === 10 || streak === 20) {
      setStreakBurst(streak);
      window.setTimeout(() => setStreakBurst(null), 720);
    }
  }

  return {
    reduced,
    intro,
    skipIntro,
    ripples,
    impact,
    xpBurst,
    streakBurst,
    celebrate,
    miss,
    shake,
    personality,
  };
}

export type SpeedPhase = "idle" | "intro" | "running" | "done";

export const SPEED_TOTAL_MS = 60000;
export const SPEED_INTRO_MS = 3000;

/**
 * Timed-round clock shared by the anatomy speed rounds: a 3-2-1-GO intro,
 * then the 60s round, with count/go/tick sounds on the second boundaries.
 * Frame deltas are clamped like the bar-math clock so a backgrounded tab
 * pauses rather than burning the round.
 */
export function useSpeedClock(totalMs = SPEED_TOTAL_MS, introMs = SPEED_INTRO_MS) {
  const [phase, setPhase] = useState<SpeedPhase>("idle");
  const [intro, setIntro] = useState(introMs);
  const [remaining, setRemaining] = useState(totalMs);
  const introRef = useRef(introMs);
  const remainingRef = useRef(totalMs);
  const phaseRef = useRef<SpeedPhase>("idle");
  phaseRef.current = phase;

  useEffect(() => {
    if (phase !== "intro" && phase !== "running") return;
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      const dt = Math.min(100, t - last);
      last = t;
      if (phaseRef.current === "intro") {
        const before = Math.ceil(introRef.current / 1000);
        introRef.current = Math.max(0, introRef.current - dt);
        const after = Math.ceil(introRef.current / 1000);
        setIntro(introRef.current);
        if (introRef.current <= 0) {
          sfx.go();
          haptics.correct();
          setPhase("running");
        } else if (after < before) {
          sfx.count();
          haptics.tick();
        }
      } else {
        const before = Math.ceil(remainingRef.current / 1000);
        remainingRef.current = Math.max(0, remainingRef.current - dt);
        const after = Math.ceil(remainingRef.current / 1000);
        setRemaining(remainingRef.current);
        if (remainingRef.current <= 0) {
          setPhase("done");
          return;
        }
        if (after < before && after <= 10) {
          sfx.tick();
          haptics.tick();
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function start() {
    introRef.current = introMs;
    remainingRef.current = totalMs;
    setIntro(introMs);
    setRemaining(totalMs);
    setPhase("intro");
  }

  return {
    phase,
    intro,
    remaining,
    start,
    running: phase === "running",
    inIntro: phase === "intro",
    done: phase === "done",
    urgent: phase === "running" && remaining / totalMs < 0.17,
    frac: remaining / totalMs,
  };
}

export function pointerPct(e: { clientX: number; clientY: number; currentTarget: Element }): {
  x: number;
  y: number;
} {
  const node = e.currentTarget;
  const svg = node instanceof SVGSVGElement ? node : node.closest("svg");
  const r = (svg ?? node).getBoundingClientRect();
  const w = r.width || 1;
  const h = r.height || 1;
  return {
    x: ((e.clientX - r.left) / w) * 100,
    y: ((e.clientY - r.top) / h) * 100,
  };
}
