import { useEffect, useState } from "react";
import type { MuscleId } from "./muscles.ts";
import type { BoneId } from "../bones/bones.ts";

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
    personality,
  };
}

export function pointerPct(
  e: { clientX: number; clientY: number; currentTarget: Element },
): { x: number; y: number } {
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
