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
  | "phalanges_foot";

export interface BoneDef {
  id: BoneId;
  name: string;
  gymName: string;
  speedName: string;
  view: AnatomyView;
  group: boolean;
  min: Difficulty;
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
