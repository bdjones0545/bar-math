import type { Difficulty } from "../game/types.ts";
import type { AnatomyView } from "../anatomy/muscles.ts";

export type BoneId =
  | "skull"
  | "mandible"
  | "clavicle"
  | "scapula"
  | "sternum"
  | "ribs"
  | "vertebral_column"
  | "pelvis"
  | "humerus"
  | "radius"
  | "ulna"
  | "carpals"
  | "metacarpals"
  | "phalanges_hand"
  | "femur"
  | "patella"
  | "tibia"
  | "fibula"
  | "tarsals"
  | "metatarsals"
  | "phalanges_foot"
  // Coach
  | "sacrum"
  | "calcaneus"
  // Elite
  | "coccyx"
  | "zygomatic"
  | "maxilla"
  // Depth 2
  | "frontal_bone"
  | "temporal_bone"
  | "occipital_bone"
  | "nasal_bone"
  | "cervical_spine"
  | "thoracic_spine"
  | "lumbar_spine"
  | "ilium"
  | "pubis"
  | "olecranon";

export interface BoneDef {
  id: BoneId;
  name: string;
  gymName: string;
  speedName: string;
  view: AnatomyView;
  group: boolean;
  min: Difficulty;
  /** Part of a larger bone also in the catalog; a whack here counts for the parent's prompt. */
  parent?: BoneId;
  cue: string;
  fact: string;
  neighbors: BoneId[];
}

export const BONES: BoneDef[] = [
  {
    id: "skull",
    name: "Skull",
    gymName: "Skull",
    speedName: "SKULL",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Cranium",
    fact: "The skull protects the brain.",
    neighbors: ["mandible", "vertebral_column"],
  },
  {
    id: "mandible",
    name: "Mandible",
    gymName: "Jaw",
    speedName: "JAW",
    view: "front",
    group: false,
    min: "athlete",
    cue: "Lower jaw",
    fact: "The mandible is the movable lower jaw.",
    neighbors: ["skull"],
  },
  {
    id: "clavicle",
    name: "Clavicle",
    gymName: "Collarbone",
    speedName: "CLAVICLE",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Collarbone",
    fact: "The clavicle is the collarbone linking sternum to scapula.",
    neighbors: ["scapula", "sternum", "humerus"],
  },
  {
    id: "scapula",
    name: "Scapula",
    gymName: "Shoulder blade",
    speedName: "SCAPULA",
    view: "back",
    group: false,
    min: "rookie",
    cue: "Shoulder blade",
    fact: "The scapula is the shoulder blade.",
    neighbors: ["clavicle", "humerus", "vertebral_column"],
  },
  {
    id: "sternum",
    name: "Sternum",
    gymName: "Breastbone",
    speedName: "STERNUM",
    view: "front",
    group: false,
    min: "athlete",
    cue: "Breastbone",
    fact: "The sternum is the breastbone in the center of the chest.",
    neighbors: ["ribs", "clavicle"],
  },
  {
    id: "ribs",
    name: "Ribs",
    gymName: "Ribs",
    speedName: "RIBS",
    view: "front",
    group: true,
    min: "rookie",
    cue: "Rib cage — bone group",
    fact: "The ribs are a group that protects the chest.",
    neighbors: ["sternum", "vertebral_column"],
  },
  {
    id: "vertebral_column",
    name: "Vertebral column",
    gymName: "Spine",
    speedName: "SPINE",
    view: "back",
    group: true,
    min: "athlete",
    cue: "Spine — bone group",
    fact: "The vertebral column is the spine, a group of vertebrae.",
    neighbors: ["ribs", "pelvis", "skull"],
  },
  {
    id: "pelvis",
    name: "Pelvis",
    gymName: "Pelvis",
    speedName: "PELVIS",
    view: "front",
    group: true,
    min: "rookie",
    cue: "Hip girdle — bone group",
    fact: "The pelvis is the hip girdle that supports the spine and legs.",
    neighbors: ["femur", "vertebral_column"],
  },
  {
    id: "humerus",
    name: "Humerus",
    gymName: "Upper arm bone",
    speedName: "HUMERUS",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Upper arm",
    fact: "The humerus is the upper arm bone from shoulder to elbow.",
    neighbors: ["radius", "ulna", "scapula"],
  },
  {
    id: "radius",
    name: "Radius",
    gymName: "Radius",
    speedName: "RADIUS",
    view: "front",
    group: false,
    min: "coach",
    cue: "Forearm, thumb side",
    fact: "The radius is the lateral forearm bone on the thumb side.",
    neighbors: ["ulna", "humerus", "carpals"],
  },
  {
    id: "ulna",
    name: "Ulna",
    gymName: "Ulna",
    speedName: "ULNA",
    view: "front",
    group: false,
    min: "coach",
    cue: "Forearm, pinky side",
    fact: "The ulna is the medial forearm bone on the pinky side.",
    neighbors: ["radius", "humerus"],
  },
  {
    id: "carpals",
    name: "Carpals",
    gymName: "Wrist bones",
    speedName: "CARPALS",
    view: "front",
    group: true,
    min: "coach",
    cue: "Wrist — bone group",
    fact: "The carpals are the group of wrist bones.",
    neighbors: ["metacarpals", "radius", "ulna"],
  },
  {
    id: "metacarpals",
    name: "Metacarpals",
    gymName: "Palm bones",
    speedName: "METACARPALS",
    view: "front",
    group: true,
    min: "coach",
    cue: "Palm — bone group",
    fact: "The metacarpals are the palm bones between wrist and fingers.",
    neighbors: ["carpals", "phalanges_hand"],
  },
  {
    id: "phalanges_hand",
    name: "Phalanges of the hand",
    gymName: "Finger bones",
    speedName: "HAND PHALANGES",
    view: "front",
    group: true,
    min: "coach",
    cue: "Fingers — bone group",
    fact: "Hand phalanges are the finger bones.",
    neighbors: ["metacarpals", "carpals"],
  },
  {
    id: "femur",
    name: "Femur",
    gymName: "Thigh bone",
    speedName: "FEMUR",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Thigh bone",
    fact: "The femur is the largest bone of the thigh.",
    neighbors: ["pelvis", "patella", "tibia"],
  },
  {
    id: "patella",
    name: "Patella",
    gymName: "Kneecap",
    speedName: "PATELLA",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Kneecap",
    fact: "The patella is the kneecap.",
    neighbors: ["femur", "tibia"],
  },
  {
    id: "tibia",
    name: "Tibia",
    gymName: "Shin bone",
    speedName: "TIBIA",
    view: "front",
    group: false,
    min: "rookie",
    cue: "Shin bone",
    fact: "The tibia is the primary weight-bearing bone of the lower leg.",
    neighbors: ["fibula", "femur", "patella"],
  },
  {
    id: "fibula",
    name: "Fibula",
    gymName: "Fibula",
    speedName: "FIBULA",
    view: "front",
    group: false,
    min: "athlete",
    cue: "Thin outer lower-leg bone",
    fact: "The fibula is the thin lateral bone of the lower leg.",
    neighbors: ["tibia", "tarsals"],
  },
  {
    id: "tarsals",
    name: "Tarsals",
    gymName: "Ankle bones",
    speedName: "TARSALS",
    view: "front",
    group: true,
    min: "coach",
    cue: "Ankle — bone group",
    fact: "The tarsals are the group of ankle bones.",
    neighbors: ["metatarsals", "tibia", "fibula"],
  },
  {
    id: "metatarsals",
    name: "Metatarsals",
    gymName: "Foot bones",
    speedName: "METATARSALS",
    view: "front",
    group: true,
    min: "coach",
    cue: "Midfoot — bone group",
    fact: "The metatarsals are the long bones of the midfoot.",
    neighbors: ["tarsals", "phalanges_foot"],
  },
  {
    id: "phalanges_foot",
    name: "Phalanges of the foot",
    gymName: "Toe bones",
    speedName: "TOE PHALANGES",
    view: "front",
    group: true,
    min: "coach",
    cue: "Toes — bone group",
    fact: "Foot phalanges are the toe bones.",
    neighbors: ["metatarsals", "tarsals"],
  },

  // ---- Coach ----
  {
    id: "sacrum",
    name: "Sacrum",
    gymName: "Tailbone base",
    speedName: "SACRUM",
    view: "back",
    group: false,
    min: "coach",
    cue: "Triangular bone at the base of the spine, between the hips",
    fact: "The sacrum is five fused vertebrae that lock the spine into the pelvis.",
    neighbors: ["pelvis", "vertebral_column", "coccyx"],
  },
  {
    id: "calcaneus",
    name: "Calcaneus",
    gymName: "Heel bone",
    speedName: "HEEL",
    view: "back",
    group: false,
    min: "coach",
    cue: "The heel",
    fact: "The calcaneus is the heel bone — the Achilles tendon anchors to it.",
    neighbors: ["tarsals", "tibia", "fibula"],
  },
  // ---- Elite ----
  {
    id: "coccyx",
    name: "Coccyx",
    gymName: "Tailbone",
    speedName: "COCCYX",
    view: "back",
    group: false,
    min: "elite",
    cue: "Tiny tip below the sacrum",
    fact: "The coccyx is the vestigial tailbone — three to five fused segments at the very end of the spine.",
    neighbors: ["sacrum", "pelvis"],
  },
  {
    id: "zygomatic",
    name: "Zygomatic",
    gymName: "Cheekbone",
    speedName: "CHEEK",
    view: "front",
    group: false,
    min: "elite",
    cue: "The cheekbone",
    fact: "The zygomatic bone forms the cheek and the outer rim of the eye socket.",
    neighbors: ["skull", "maxilla", "mandible"],
  },
  {
    id: "maxilla",
    name: "Maxilla",
    gymName: "Upper jaw",
    speedName: "MAXILLA",
    view: "front",
    group: false,
    min: "elite",
    cue: "Upper jaw, above the teeth",
    fact: "The maxilla is the fixed upper jaw; it holds the upper teeth and forms the floor of the eye sockets.",
    neighbors: ["mandible", "zygomatic", "skull"],
  },

  // ---- Depth 2: parts and landmarks of the big bones ----
  {
    id: "frontal_bone",
    name: "Frontal bone",
    gymName: "Forehead",
    speedName: "FRONTAL",
    view: "front",
    group: false,
    min: "coach",
    parent: "skull",
    cue: "The forehead",
    fact: "The frontal bone forms the forehead and the roof of the eye sockets.",
    neighbors: ["skull", "nasal_bone", "zygomatic"],
  },
  {
    id: "temporal_bone",
    name: "Temporal bone",
    gymName: "Temple",
    speedName: "TEMPORAL",
    view: "front",
    group: false,
    min: "elite",
    parent: "skull",
    cue: "Side of the skull around the ear",
    fact: "The temporal bone houses the ear and the jaw joint — the TMJ hinges on it.",
    neighbors: ["skull", "zygomatic", "mandible"],
  },
  {
    id: "occipital_bone",
    name: "Occipital bone",
    gymName: "Back of skull",
    speedName: "OCCIPUT",
    view: "back",
    group: false,
    min: "coach",
    parent: "skull",
    cue: "The back and base of the skull",
    fact: "The occipital bone forms the back of the skull and carries the opening the spinal cord passes through.",
    neighbors: ["skull", "cervical_spine"],
  },
  {
    id: "nasal_bone",
    name: "Nasal bone",
    gymName: "Bridge of the nose",
    speedName: "NASAL",
    view: "front",
    group: false,
    min: "elite",
    parent: "skull",
    cue: "The bridge of the nose",
    fact: "The two nasal bones form the bridge of the nose — the rest of the nose is cartilage.",
    neighbors: ["frontal_bone", "maxilla", "zygomatic"],
  },
  {
    id: "cervical_spine",
    name: "Cervical spine",
    gymName: "Neck vertebrae",
    speedName: "CERVICAL",
    view: "back",
    group: true,
    min: "coach",
    parent: "vertebral_column",
    cue: "The seven neck vertebrae",
    fact: "The cervical spine is seven vertebrae, C1 to C7; the top two let you nod and shake your head.",
    neighbors: ["thoracic_spine", "occipital_bone", "vertebral_column"],
  },
  {
    id: "thoracic_spine",
    name: "Thoracic spine",
    gymName: "Mid-back vertebrae",
    speedName: "THORACIC",
    view: "back",
    group: true,
    min: "coach",
    parent: "vertebral_column",
    cue: "The twelve vertebrae the ribs attach to",
    fact: "The thoracic spine is twelve vertebrae, T1 to T12, each one anchoring a pair of ribs.",
    neighbors: ["cervical_spine", "lumbar_spine", "scapula"],
  },
  {
    id: "lumbar_spine",
    name: "Lumbar spine",
    gymName: "Low-back vertebrae",
    speedName: "LUMBAR",
    view: "back",
    group: true,
    min: "coach",
    parent: "vertebral_column",
    cue: "The five big low-back vertebrae",
    fact: "The lumbar spine is five vertebrae, L1 to L5 — the segment a heavy deadlift asks to stay neutral.",
    neighbors: ["thoracic_spine", "sacrum", "pelvis"],
  },
  {
    id: "ilium",
    name: "Ilium",
    gymName: "Hip bone wing",
    speedName: "ILIUM",
    view: "front",
    group: false,
    min: "coach",
    parent: "pelvis",
    cue: "The wide wing of the hip bone",
    fact: "The ilium is the flared wing of the pelvis; its front point (the ASIS) is where you feel your hip bone.",
    neighbors: ["pelvis", "pubis", "femur"],
  },
  {
    id: "pubis",
    name: "Pubis",
    gymName: "Front of pelvis",
    speedName: "PUBIS",
    view: "front",
    group: false,
    min: "elite",
    parent: "pelvis",
    cue: "Front-center of the pelvis, where the two halves meet",
    fact: "The two pubic bones meet at the pubic symphysis; the adductors and rectus abdominis anchor here.",
    neighbors: ["pelvis", "ilium", "femur"],
  },
  {
    id: "olecranon",
    name: "Olecranon",
    gymName: "Elbow point",
    speedName: "OLECRANON",
    view: "back",
    group: false,
    min: "elite",
    parent: "ulna",
    cue: "The point of the elbow",
    fact: "The olecranon is the tip of the ulna — the bony point of the elbow that the triceps pull on.",
    neighbors: ["ulna", "humerus", "radius"],
  },
];

export const BONE_BY_ID: Record<BoneId, BoneDef> = Object.fromEntries(
  BONES.map((b) => [b.id, b]),
) as Record<BoneId, BoneDef>;

const RANK: Record<Difficulty, number> = {
  rookie: 0,
  athlete: 1,
  coach: 2,
  elite: 3,
};

export function bonesForDifficulty(difficulty: Difficulty): BoneDef[] {
  const rank = RANK[difficulty];
  if (difficulty === "rookie") return BONES.filter((b) => b.min === "rookie");
  return BONES.filter((b) => RANK[b.min] <= rank);
}

export function isBoneId(v: string): v is BoneId {
  return v in BONE_BY_ID;
}

export function displayBoneName(bone: BoneDef, difficulty: Difficulty): string {
  return difficulty === "rookie" ? bone.gymName : bone.name;
}
