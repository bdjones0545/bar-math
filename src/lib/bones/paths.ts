import type { AnatomyView } from "../anatomy/muscles.ts";
import type { BoneId } from "./bones.ts";

export const SKELETON_VB = { w: 220, h: 560, cx: 110 };

export interface BonePath {
  id: string;
  boneId: BoneId;
  view: AnatomyView;
  d: string;
  narrow?: boolean;
}

type Pt = [number, number];

function poly(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
}

function mirrorX(x: number): number {
  return SKELETON_VB.cx * 2 - x;
}

function mirrorPts(pts: Pt[]): Pt[] {
  return pts.map(([x, y]) => [mirrorX(x), y]);
}

function bilateral(
  boneId: BoneId,
  view: AnatomyView,
  left: Pt[],
  extra?: { narrow?: boolean },
): BonePath[] {
  return [
    { id: `${boneId}_l`, boneId, view, d: poly(left), ...extra },
    { id: `${boneId}_r`, boneId, view, d: poly(mirrorPts(left)), ...extra },
  ];
}

function center(
  boneId: BoneId,
  view: AnatomyView,
  pts: Pt[],
  extra?: { narrow?: boolean },
): BonePath {
  return { id: `${boneId}`, boneId, view, d: poly(pts), ...extra };
}

const SKULL: Pt[] = [
  [86, 20],
  [110, 14],
  [134, 20],
  [144, 40],
  [140, 62],
  [122, 72],
  [98, 72],
  [80, 62],
  [76, 40],
];

const PELVIS: Pt[] = [
  [74, 208],
  [110, 202],
  [146, 208],
  [154, 230],
  [142, 250],
  [110, 244],
  [78, 250],
  [66, 230],
];

const HUMERUS_L: Pt[] = [
  [40, 110],
  [28, 122],
  [24, 168],
  [26, 204],
  [38, 210],
  [50, 202],
  [48, 158],
  [52, 124],
];

const RADIUS_L: Pt[] = [
  [22, 214],
  [12, 224],
  [10, 268],
  [14, 296],
  [26, 300],
  [30, 268],
  [30, 226],
];

const ULNA_L: Pt[] = [
  [38, 214],
  [34, 224],
  [34, 270],
  [38, 300],
  [50, 304],
  [54, 272],
  [52, 226],
];

const CARPALS_L: Pt[] = [
  [12, 302],
  [10, 316],
  [38, 318],
  [44, 308],
  [40, 300],
];

const METACARPALS_L: Pt[] = [
  [10, 320],
  [6, 344],
  [40, 346],
  [46, 322],
];

const PHALANGES_HAND_L: Pt[] = [
  [6, 348],
  [2, 372],
  [36, 374],
  [42, 350],
];

const FEMUR_L: Pt[] = [
  [78, 252],
  [64, 268],
  [58, 328],
  [64, 364],
  [80, 370],
  [92, 360],
  [96, 300],
  [92, 258],
];

const TIBIA_L: Pt[] = [
  [76, 398],
  [70, 412],
  [70, 466],
  [76, 484],
  [90, 484],
  [94, 458],
  [92, 412],
  [88, 398],
];

const FIBULA_L: Pt[] = [
  [58, 406],
  [50, 418],
  [48, 466],
  [52, 480],
  [64, 480],
  [68, 454],
  [66, 418],
];

const TARSALS_L: Pt[] = [
  [50, 486],
  [48, 504],
  [78, 508],
  [90, 498],
  [86, 486],
];

const METATARSALS_L: Pt[] = [
  [48, 510],
  [44, 532],
  [80, 534],
  [88, 512],
];

const PHALANGES_FOOT_L: Pt[] = [
  [44, 536],
  [40, 554],
  [78, 556],
  [84, 536],
];

const RIBS_L_FRONT: Pt[] = [
  [70, 114],
  [100, 116],
  [102, 130],
  [98, 188],
  [80, 186],
  [64, 158],
  [64, 128],
];

const RIBS_L_BACK: Pt[] = [
  [64, 148],
  [88, 154],
  [100, 164],
  [96, 192],
  [74, 190],
  [58, 168],
];

export const BONE_PATHS: BonePath[] = [
  // FRONT — larger / deeper first, small landmarks last
  ...bilateral("ribs", "front", RIBS_L_FRONT),
  center("pelvis", "front", PELVIS),
  ...bilateral("femur", "front", FEMUR_L),
  ...bilateral("tibia", "front", TIBIA_L),
  ...bilateral("fibula", "front", FIBULA_L, { narrow: true }),
  ...bilateral("humerus", "front", HUMERUS_L),
  ...bilateral("ulna", "front", ULNA_L, { narrow: true }),
  ...bilateral("radius", "front", RADIUS_L, { narrow: true }),
  center("skull", "front", SKULL),
  center("mandible", "front", [
    [98, 72],
    [122, 72],
    [128, 82],
    [116, 92],
    [110, 94],
    [104, 92],
    [92, 82],
  ]),
  ...bilateral(
    "clavicle",
    "front",
    [
      [110, 100],
      [88, 96],
      [70, 102],
      [68, 108],
      [86, 110],
      [110, 106],
    ],
    { narrow: true },
  ),
  center("sternum", "front", [
    [104, 112],
    [116, 112],
    [118, 172],
    [110, 180],
    [102, 172],
  ]),
  ...bilateral("patella", "front", [
    [70, 372],
    [64, 384],
    [72, 396],
    [86, 396],
    [92, 384],
    [84, 372],
  ]),
  ...bilateral("carpals", "front", CARPALS_L),
  ...bilateral("metacarpals", "front", METACARPALS_L),
  ...bilateral("phalanges_hand", "front", PHALANGES_HAND_L),
  ...bilateral("tarsals", "front", TARSALS_L),
  ...bilateral("metatarsals", "front", METATARSALS_L),
  ...bilateral("phalanges_foot", "front", PHALANGES_FOOT_L),

  // BACK
  ...bilateral("ribs", "back", RIBS_L_BACK),
  center("pelvis", "back", PELVIS),
  ...bilateral("femur", "back", FEMUR_L),
  ...bilateral("tibia", "back", TIBIA_L),
  ...bilateral("fibula", "back", FIBULA_L, { narrow: true }),
  ...bilateral("humerus", "back", HUMERUS_L),
  ...bilateral("ulna", "back", ULNA_L, { narrow: true }),
  ...bilateral("radius", "back", RADIUS_L, { narrow: true }),
  center("skull", "back", SKULL),
  center(
    "vertebral_column",
    "back",
    [
      [104, 86],
      [116, 86],
      [118, 226],
      [110, 236],
      [102, 226],
    ],
    { narrow: true },
  ),
  ...bilateral("scapula", "back", [
    [72, 110],
    [60, 122],
    [56, 152],
    [64, 172],
    [90, 162],
    [96, 138],
    [92, 112],
  ]),
  ...bilateral("carpals", "back", CARPALS_L),
  ...bilateral("metacarpals", "back", METACARPALS_L),
  ...bilateral("phalanges_hand", "back", PHALANGES_HAND_L),
  ...bilateral("tarsals", "back", TARSALS_L),
  ...bilateral("metatarsals", "back", METATARSALS_L),
  ...bilateral("phalanges_foot", "back", PHALANGES_FOOT_L),
];

export const SILHOUETTE: Record<AnatomyView, string[]> = {
  front: [
    "M 110 18 C 128 18 136 34 132 52 C 128 68 118 74 110 74 C 102 74 92 68 88 52 C 84 34 92 18 110 18 Z",
    "M 102 72 L 118 72 L 120 88 L 100 88 Z",
    "M 74 90 C 52 96 42 112 44 132 L 40 250 C 40 262 58 272 78 274 L 110 276 L 142 274 C 162 272 180 262 180 250 L 176 132 C 178 112 168 96 146 90 Z",
    "M 52 96 C 34 108 26 150 28 188 C 24 222 22 250 28 272 C 34 282 48 278 50 266 C 52 244 50 214 52 190 C 56 158 60 128 68 110 Z",
    "M 168 96 C 186 108 194 150 192 188 C 196 222 198 250 192 272 C 186 282 172 278 170 266 C 168 244 170 214 168 190 C 164 158 160 128 152 110 Z",
    "M 78 270 C 58 278 50 330 54 380 C 52 430 50 470 56 502 C 48 512 48 524 70 526 L 92 522 C 96 490 94 450 92 410 C 94 360 100 310 104 276 Z",
    "M 142 270 C 162 278 170 330 166 380 C 168 430 170 470 164 502 C 172 512 172 524 150 526 L 128 522 C 124 490 126 450 128 410 C 126 360 120 310 116 276 Z",
  ],
  back: [
    "M 110 18 C 128 18 136 34 132 52 C 128 68 118 74 110 74 C 102 74 92 68 88 52 C 84 34 92 18 110 18 Z",
    "M 102 72 L 118 72 L 120 88 L 100 88 Z",
    "M 74 90 C 52 96 42 112 44 132 L 40 250 C 40 262 58 272 78 274 L 110 276 L 142 274 C 162 272 180 262 180 250 L 176 132 C 178 112 168 96 146 90 Z",
    "M 52 96 C 34 108 26 150 28 188 C 24 222 22 250 28 272 C 34 282 48 278 50 266 C 52 244 50 214 52 190 C 56 158 60 128 68 110 Z",
    "M 168 96 C 186 108 194 150 192 188 C 196 222 198 250 192 272 C 186 282 172 278 170 266 C 168 244 170 214 168 190 C 164 158 160 128 152 110 Z",
    "M 78 270 C 58 278 50 330 54 380 C 52 430 50 470 56 502 C 48 512 48 524 70 526 L 92 522 C 96 490 94 450 92 410 C 94 360 100 310 104 276 Z",
    "M 142 270 C 162 278 170 330 166 380 C 168 430 170 470 164 502 C 172 512 172 524 150 526 L 128 522 C 124 490 126 450 128 410 C 126 360 120 310 116 276 Z",
  ],
};

export function pathsForView(view: AnatomyView): BonePath[] {
  return BONE_PATHS.filter((p) => p.view === view);
}

export function pathsForBone(boneId: BoneId, view?: AnatomyView): BonePath[] {
  return BONE_PATHS.filter((p) => p.boneId === boneId && (view ? p.view === view : true));
}

export function viewsForBone(boneId: BoneId): AnatomyView[] {
  return [...new Set(BONE_PATHS.filter((p) => p.boneId === boneId).map((p) => p.view))];
}

export function boneIdFromPath(pathId: string): BoneId | null {
  const hit = BONE_PATHS.find((p) => p.id === pathId);
  return hit?.boneId ?? null;
}

export function bbox(d: string): { minX: number; maxX: number; minY: number; maxY: number } {
  const nums = [...d.matchAll(/(-?\d+\.?\d*)/g)].map((m) => Number(m[1]));
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    xs.push(nums[i]!);
    ys.push(nums[i + 1]!);
  }
  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}
