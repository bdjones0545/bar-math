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
  | "forearm_extensors"
  // Coach
  | "serratus_anterior"
  | "adductors"
  | "sternocleidomastoid"
  | "gluteus_medius"
  | "rhomboids"
  | "infraspinatus"
  // Elite
  | "pectineus"
  | "sartorius"
  | "tensor_fasciae_latae"
  | "iliopsoas"
  | "brachialis"
  | "piriformis"
  | "teres_major"
  | "quadratus_lumborum"
  // Depth 2
  | "rectus_femoris"
  | "vastus_lateralis"
  | "vastus_medialis"
  | "gracilis"
  | "peroneals"
  | "biceps_femoris"
  | "semitendinosus"
  | "adductor_magnus"
  | "supraspinatus"
  | "splenius_capitis";

export interface MuscleDef {
  id: MuscleId;
  name: string;
  gymName: string;
  speedName: string;
  view: AnatomyView;
  group: boolean;
  min: Difficulty;
  /** Lies under other muscle — drawn dashed and called out as deep. */
  deep?: boolean;
  /**
   * Part of a larger region that is also in the catalog (rectus femoris →
   * quadriceps). A tap on this counts for the parent's prompt; the parent's
   * uncovered area does not count for this.
   */
  parent?: MuscleId;
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

  // ---- Coach: the next layer a strength coach is expected to know ----
  {
    id: "serratus_anterior",
    name: "Serratus anterior",
    gymName: "Serratus",
    speedName: "SERRATUS",
    view: "front",
    group: false,
    min: "coach",
    cue: "Finger-like slips on the side of the ribcage",
    fact: "Serratus anterior pulls the shoulder blade forward — the 'boxer's muscle' behind every punch and push-up plus.",
    neighbors: ["pectoralis_major", "external_obliques", "latissimus_dorsi"],
  },
  {
    id: "adductors",
    name: "Adductors",
    gymName: "Inner thigh",
    speedName: "ADDUCTOR",
    view: "front",
    group: true,
    min: "coach",
    cue: "Inner thigh — muscle group",
    fact: "The adductor group pulls the leg toward midline and stabilizes every squat and lunge.",
    neighbors: ["quadriceps", "pectineus", "sartorius"],
  },
  {
    id: "sternocleidomastoid",
    name: "Sternocleidomastoid",
    gymName: "Neck",
    speedName: "SCM",
    view: "front",
    group: false,
    min: "coach",
    cue: "The rope on the front of the neck",
    fact: "Sternocleidomastoid turns and tilts the head; it stands out when you look over a shoulder.",
    neighbors: ["trapezius", "deltoid"],
  },
  {
    id: "gluteus_medius",
    name: "Gluteus medius",
    gymName: "Side glute",
    speedName: "GLUTE MED",
    view: "back",
    group: false,
    min: "coach",
    cue: "Upper outer hip",
    fact: "Gluteus medius keeps the pelvis level on one leg — weak glute med shows up as knees caving in.",
    neighbors: ["gluteus_maximus", "piriformis", "tensor_fasciae_latae"],
  },
  {
    id: "rhomboids",
    name: "Rhomboids",
    gymName: "Mid-back",
    speedName: "RHOMBOID",
    view: "back",
    group: true,
    min: "coach",
    deep: true,
    cue: "Between the shoulder blades, under the traps",
    fact: "The rhomboids retract the shoulder blades; they sit deep to the trapezius and drive every row.",
    neighbors: ["trapezius", "infraspinatus", "erector_spinae"],
  },
  {
    id: "infraspinatus",
    name: "Infraspinatus",
    gymName: "Rotator cuff",
    speedName: "INFRA",
    view: "back",
    group: false,
    min: "coach",
    cue: "On the shoulder blade, below the spine of the scapula",
    fact: "Infraspinatus is the rotator-cuff muscle that externally rotates the arm — the one that stabilizes a bench press.",
    neighbors: ["posterior_deltoid", "teres_major", "rhomboids"],
  },

  // ---- Elite: deep and small muscles you only find by knowing where to look ----
  {
    id: "pectineus",
    name: "Pectineus",
    gymName: "Groin",
    speedName: "PECTINEUS",
    view: "front",
    group: false,
    min: "elite",
    cue: "Top of the inner thigh, in the groin crease",
    fact: "Pectineus flexes and adducts the hip; it is the small muscle behind many 'groin pull' complaints.",
    neighbors: ["adductors", "iliopsoas", "sartorius"],
  },
  {
    id: "sartorius",
    name: "Sartorius",
    gymName: "Longest muscle",
    speedName: "SARTORIUS",
    view: "front",
    group: false,
    min: "elite",
    cue: "A strap from the outer hip to the inner knee",
    fact: "Sartorius is the longest muscle in the body; it crosses the thigh diagonally to cross the legs tailor-style.",
    neighbors: ["quadriceps", "tensor_fasciae_latae", "adductors"],
  },
  {
    id: "tensor_fasciae_latae",
    name: "Tensor fasciae latae",
    gymName: "TFL",
    speedName: "TFL",
    view: "front",
    group: false,
    min: "elite",
    cue: "Small pad on the outer hip",
    fact: "TFL tensions the IT band; it is the outer-hip muscle that gets overworked when the glutes don't fire.",
    neighbors: ["sartorius", "quadriceps", "gluteus_medius"],
  },
  {
    id: "iliopsoas",
    name: "Iliopsoas",
    gymName: "Hip flexors",
    speedName: "PSOAS",
    view: "front",
    group: true,
    min: "elite",
    deep: true,
    cue: "Deep in the lower belly, running into the groin",
    fact: "Iliopsoas is the primary hip flexor, running from the lumbar spine over the pelvis to the femur.",
    neighbors: ["rectus_abdominis", "pectineus", "external_obliques"],
  },
  {
    id: "brachialis",
    name: "Brachialis",
    gymName: "Under-biceps",
    speedName: "BRACHIALIS",
    view: "front",
    group: false,
    min: "elite",
    cue: "Outer upper arm, just above the elbow under the biceps",
    fact: "Brachialis sits beneath the biceps and is the strongest elbow flexor — it is what hammer curls build.",
    neighbors: ["biceps_brachii", "forearm_flexors", "triceps_brachii"],
  },
  {
    id: "piriformis",
    name: "Piriformis",
    gymName: "Deep hip rotator",
    speedName: "PIRIFORMIS",
    view: "back",
    group: false,
    min: "elite",
    deep: true,
    cue: "A band across the upper glute, under gluteus maximus",
    fact: "Piriformis externally rotates the hip and lies over the sciatic nerve — the reason a tight one mimics sciatica.",
    neighbors: ["gluteus_maximus", "gluteus_medius"],
  },
  {
    id: "teres_major",
    name: "Teres major",
    gymName: "Lat helper",
    speedName: "TERES",
    view: "back",
    group: false,
    min: "elite",
    cue: "Small muscle off the bottom of the shoulder blade toward the armpit",
    fact: "Teres major works with the lats to pull the arm down and in — the 'little lat'.",
    neighbors: ["infraspinatus", "latissimus_dorsi", "posterior_deltoid"],
  },
  {
    id: "quadratus_lumborum",
    name: "Quadratus lumborum",
    gymName: "QL",
    speedName: "QL",
    view: "back",
    group: false,
    min: "elite",
    deep: true,
    cue: "Deep low back, between the last rib and the pelvis",
    fact: "Quadratus lumborum hikes the hip and side-bends the spine; it is the deep low-back muscle behind a lot of one-sided back pain.",
    neighbors: ["erector_spinae", "latissimus_dorsi", "gluteus_medius"],
  },

  // ---- Depth 2: heads and parts of the big groups, plus the ones coaches cue ----
  {
    id: "rectus_femoris",
    name: "Rectus femoris",
    gymName: "Middle quad",
    speedName: "RECTUS FEM",
    view: "front",
    group: false,
    min: "elite",
    parent: "quadriceps",
    cue: "Straight down the middle of the thigh",
    fact: "Rectus femoris is the only quad head that crosses the hip, so it both flexes the hip and extends the knee.",
    neighbors: ["vastus_lateralis", "vastus_medialis", "sartorius"],
  },
  {
    id: "vastus_lateralis",
    name: "Vastus lateralis",
    gymName: "Outer quad",
    speedName: "VAST LAT",
    view: "front",
    group: false,
    min: "elite",
    parent: "quadriceps",
    cue: "Outer sweep of the thigh",
    fact: "Vastus lateralis is the largest quad head — the outer sweep you see in a lunge.",
    neighbors: ["rectus_femoris", "tensor_fasciae_latae", "vastus_medialis"],
  },
  {
    id: "vastus_medialis",
    name: "Vastus medialis",
    gymName: "Teardrop",
    speedName: "VMO",
    view: "front",
    group: false,
    min: "elite",
    parent: "quadriceps",
    cue: "The teardrop just above the inner knee",
    fact: "Vastus medialis (the VMO) locks out the last degrees of knee extension and keeps the kneecap tracking.",
    neighbors: ["rectus_femoris", "vastus_lateralis", "gracilis"],
  },
  {
    id: "gracilis",
    name: "Gracilis",
    gymName: "Inner-thigh strap",
    speedName: "GRACILIS",
    view: "front",
    group: false,
    min: "elite",
    parent: "adductors",
    cue: "The thin strap along the innermost thigh",
    fact: "Gracilis is the most superficial adductor and runs the full length of the inner thigh to the knee.",
    neighbors: ["adductors", "vastus_medialis", "sartorius"],
  },
  {
    id: "peroneals",
    name: "Peroneals",
    gymName: "Outer shin",
    speedName: "PERONEAL",
    view: "front",
    group: true,
    min: "coach",
    cue: "Outer side of the lower leg — muscle group",
    fact: "The peroneals (fibularis longus and brevis) evert the foot and stabilize the ankle against rolling.",
    neighbors: ["tibialis_anterior", "gastrocnemius", "soleus"],
  },
  {
    id: "biceps_femoris",
    name: "Biceps femoris",
    gymName: "Outer hamstring",
    speedName: "BICEPS FEM",
    view: "back",
    group: false,
    min: "elite",
    parent: "hamstrings",
    cue: "Outer half of the back of the thigh",
    fact: "Biceps femoris is the lateral hamstring and the one most often strained in sprinting.",
    neighbors: ["semitendinosus", "gluteus_maximus", "gastrocnemius"],
  },
  {
    id: "semitendinosus",
    name: "Semitendinosus",
    gymName: "Inner hamstring",
    speedName: "SEMITEND",
    view: "back",
    group: false,
    min: "elite",
    parent: "hamstrings",
    cue: "Inner half of the back of the thigh",
    fact: "Semitendinosus (with semimembranosus beneath it) forms the medial hamstring, the cord you feel behind the inner knee.",
    neighbors: ["biceps_femoris", "adductor_magnus", "gastrocnemius"],
  },
  {
    id: "adductor_magnus",
    name: "Adductor magnus",
    gymName: "Inner thigh (rear)",
    speedName: "ADD MAG",
    view: "back",
    group: false,
    min: "coach",
    cue: "Innermost back of the thigh",
    fact: "Adductor magnus is the biggest adductor and acts like a fourth hamstring in a deep squat.",
    neighbors: ["hamstrings", "gluteus_maximus", "semitendinosus"],
  },
  {
    id: "supraspinatus",
    name: "Supraspinatus",
    gymName: "Top rotator cuff",
    speedName: "SUPRA",
    view: "back",
    group: false,
    min: "elite",
    deep: true,
    cue: "Above the spine of the shoulder blade, under the traps",
    fact: "Supraspinatus starts every arm raise and is the rotator-cuff tendon most often impinged.",
    neighbors: ["infraspinatus", "trapezius", "posterior_deltoid"],
  },
  {
    id: "splenius_capitis",
    name: "Splenius capitis",
    gymName: "Back of neck",
    speedName: "SPLENIUS",
    view: "back",
    group: false,
    min: "elite",
    cue: "Strap on the back of the neck, under the upper traps",
    fact: "Splenius capitis extends and rotates the head; it is the neck muscle that fights forward-head posture.",
    neighbors: ["trapezius", "sternocleidomastoid"],
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
