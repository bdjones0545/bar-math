import type { Difficulty } from "../game/types.ts";

export type AnatomyView = "front" | "back";
export type MuscleId =
  | "deltoid"
  | "pectoralis_major"
  | "biceps_brachii"
  | "rectus_abdominis"
  | "external_obliques"
  | "quadriceps"
  | "tibialis_anterior"
  | "forearm_flexors"
  | "trapezius"
  | "posterior_deltoid"
  | "triceps_brachii"
  | "latissimus_dorsi"
  | "erector_spinae"
  | "gluteus_maximus"
  | "hamstrings"
  | "gastrocnemius"
  | "soleus"
  | "forearm_extensors";

export interface MuscleDef {
  id: MuscleId;
  name: string;
  gymName: string;
  speedName: string;
  view: AnatomyView;
  group: boolean;
  min: Difficulty;
  cue: string;
  fact: string;
  neighbors: MuscleId[];
}

export const MUSCLES: MuscleDef[] = [
  {
    id: "deltoid",
    name: "Deltoid",
    gymName: "Shoulders",
    speedName: "DELT",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Shoulder cap",
    fact: "The deltoid caps the shoulder and raises the arm in every direction.",
    neighbors: ["pectoralis_major", "biceps_brachii"],
  },
  {
    id: "pectoralis_major",
    name: "Pectoralis major",
    gymName: "Chest",
    speedName: "CHEST",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Chest",
    fact: "Pectoralis major is the main chest muscle used in pressing and hugging the arms in.",
    neighbors: ["deltoid", "rectus_abdominis"],
  },
  {
    id: "biceps_brachii",
    name: "Biceps brachii",
    gymName: "Biceps",
    speedName: "BI",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Front of the upper arm",
    fact: "Biceps brachii flexes the elbow and helps turn the palm up.",
    neighbors: ["deltoid", "forearm_flexors"],
  },
  {
    id: "rectus_abdominis",
    name: "Rectus abdominis",
    gymName: "Abs",
    speedName: "ABS",
    view: "front",
    group: false,
    min: "rookie",
    cue: "“Six-pack” muscle",
    fact: "Rectus abdominis is the six-pack muscle that flexes the spine.",
    neighbors: ["external_obliques", "pectoralis_major"],
  },
  {
    id: "external_obliques",
    name: "External obliques",
    gymName: "Obliques",
    speedName: "OBLIQUE",
    view: "front",
    group: false,
    min: "athlete",
    cue: "Side abs",
    fact: "External obliques sit on the sides of the waist and rotate the trunk.",
    neighbors: ["rectus_abdominis", "quadriceps"],
  },
  {
    id: "quadriceps",
    name: "Quadriceps",
    gymName: "Quads",
    speedName: "QUAD",
    view: "front",
    group: true,
    min: "rookie",
    cue: "Front of the thigh — muscle group",
    fact: "The quadriceps group extends the knee and sits on the front of the thigh.",
    neighbors: ["tibialis_anterior", "external_obliques"],
  },
  {
    id: "tibialis_anterior",
    name: "Tibialis anterior",
    gymName: "Shin",
    speedName: "SHIN",
    view: "front",
    group: false,
    min: "athlete",
    cue: "Front of the shin",
    fact: "Tibialis anterior lifts the foot and runs along the front of the shin.",
    neighbors: ["quadriceps"],
  },
  {
    id: "forearm_flexors",
    name: "Forearm flexors",
    gymName: "Forearms",
    speedName: "FOREARM",
    view: "front",
    group: true,
    min: "athlete",
    cue: "Inner forearm — muscle group",
    fact: "Forearm flexors are a group that curls the wrist and fingers.",
    neighbors: ["biceps_brachii"],
  },
  {
    id: "trapezius",
    name: "Trapezius",
    gymName: "Traps",
    speedName: "TRAP",
    view: "back",
    group: false,
    min: "athlete",
    cue: "Upper back kite",
    fact: "Trapezius is the kite-shaped upper-back muscle that shrugs and steadies the scapula.",
    neighbors: ["posterior_deltoid", "latissimus_dorsi"],
  },
  {
    id: "posterior_deltoid",
    name: "Posterior deltoid",
    gymName: "Rear delt",
    speedName: "REAR DELT",
    view: "back",
    group: false,
    min: "coach",
    cue: "Back of the shoulder",
    fact: "The posterior deltoid is the rear head of the shoulder, used in reverse flies.",
    neighbors: ["trapezius", "triceps_brachii"],
  },
  {
    id: "triceps_brachii",
    name: "Triceps brachii",
    gymName: "Triceps",
    speedName: "TRI",
    view: "back",
    group: false,
    min: "athlete",
    cue: "Back of the upper arm",
    fact: "Triceps brachii is the horseshoe on the back of the arm that extends the elbow.",
    neighbors: ["posterior_deltoid", "forearm_extensors"],
  },
  {
    id: "latissimus_dorsi",
    name: "Latissimus dorsi",
    gymName: "Lats",
    speedName: "LAT",
    view: "back",
    group: false,
    min: "athlete",
    cue: "Lats",
    fact: "Latissimus dorsi is the large back muscle involved in shoulder extension and adduction.",
    neighbors: ["trapezius", "erector_spinae"],
  },
  {
    id: "erector_spinae",
    name: "Erector spinae",
    gymName: "Spinal erectors",
    speedName: "ERECTOR",
    view: "back",
    group: true,
    min: "coach",
    cue: "Along the spine — muscle group",
    fact: "Erector spinae is a group of muscles that run along the spine and keep you upright.",
    neighbors: ["latissimus_dorsi", "gluteus_maximus"],
  },
  {
    id: "gluteus_maximus",
    name: "Gluteus maximus",
    gymName: "Glutes",
    speedName: "GLUTE",
    view: "back",
    group: false,
    min: "rookie",
    cue: "Glutes",
    fact: "Gluteus maximus is the powerful hip extender used in squats, hinges, and sprints.",
    neighbors: ["hamstrings", "erector_spinae"],
  },
  {
    id: "hamstrings",
    name: "Hamstrings",
    gymName: "Hamstrings",
    speedName: "HAM",
    view: "back",
    group: true,
    min: "rookie",
    cue: "Back of the thigh — muscle group",
    fact: "The hamstrings group flexes the knee and extends the hip on the back of the thigh.",
    neighbors: ["gluteus_maximus", "gastrocnemius"],
  },
  {
    id: "gastrocnemius",
    name: "Gastrocnemius",
    gymName: "Calves",
    speedName: "CALF",
    view: "back",
    group: false,
    min: "rookie",
    cue: "Main superficial calf muscle",
    fact: "Gastrocnemius is the main superficial calf muscle that points the foot and helps flex the knee.",
    neighbors: ["soleus", "hamstrings"],
  },
  {
    id: "soleus",
    name: "Soleus",
    gymName: "Soleus",
    speedName: "SOLEUS",
    view: "back",
    group: false,
    min: "coach",
    cue: "Deeper / lower calf",
    fact: "Soleus sits under the gastrocnemius and is the endurance calf that points the foot.",
    neighbors: ["gastrocnemius"],
  },
  {
    id: "forearm_extensors",
    name: "Forearm extensors",
    gymName: "Forearm extensors",
    speedName: "EXTENSOR",
    view: "back",
    group: true,
    min: "coach",
    cue: "Outer forearm — muscle group",
    fact: "Forearm extensors are a group that lifts the wrist and fingers.",
    neighbors: ["triceps_brachii"],
  },
];

export const MUSCLE_BY_ID: Record<MuscleId, MuscleDef> = Object.fromEntries(
  MUSCLES.map((m) => [m.id, m]),
) as Record<MuscleId, MuscleDef>;

const RANK: Record<Difficulty, number> = {
  rookie: 0,
  athlete: 1,
  coach: 2,
  elite: 3,
};

export function musclesForDifficulty(difficulty: Difficulty): MuscleDef[] {
  const rank = RANK[difficulty];
  if (difficulty === "rookie") return MUSCLES.filter((m) => m.min === "rookie");
  return MUSCLES.filter((m) => RANK[m.min] <= rank);
}

export function isMuscleId(v: string): v is MuscleId {
  return v in MUSCLE_BY_ID;
}

export function displayName(muscle: MuscleDef, difficulty: Difficulty): string {
  return difficulty === "rookie" ? muscle.gymName : muscle.name;
}
