import type { AnatomyView, MuscleId } from "./muscles.ts";

export const ANATOMY_VB = { w: 220, h: 560, cx: 110 };

export interface MusclePath {
  id: string;
  muscleId: MuscleId;
  view: AnatomyView;
  d: string;
}

type Pt = [number, number];

function poly(pts: Pt[]): string {
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";
}

function mirrorX(x: number): number {
  return ANATOMY_VB.cx * 2 - x;
}

function mirrorPts(pts: Pt[]): Pt[] {
  return pts.map(([x, y]) => [mirrorX(x), y]);
}

function bilateral(muscleId: MuscleId, view: AnatomyView, left: Pt[]): MusclePath[] {
  return [
    { id: `${muscleId}_l`, muscleId, view, d: poly(left) },
    { id: `${muscleId}_r`, muscleId, view, d: poly(mirrorPts(left)) },
  ];
}

function center(muscleId: MuscleId, view: AnatomyView, pts: Pt[]): MusclePath {
  return { id: muscleId, muscleId, view, d: poly(pts) };
}

export const MUSCLE_PATHS: MusclePath[] = [
  // FRONT — deep / large first, superficial last
  ...bilateral("quadriceps", "front", [
    [78, 252],
    [64, 264],
    [58, 312],
    [62, 352],
    [78, 362],
    [96, 352],
    [104, 308],
    [100, 262],
  ]),
  ...bilateral("tibialis_anterior", "front", [
    [72, 368],
    [64, 380],
    [62, 430],
    [66, 468],
    [78, 474],
    [86, 430],
    [84, 384],
  ]),
  ...bilateral("external_obliques", "front", [
    [72, 152],
    [58, 168],
    [56, 198],
    [66, 228],
    [88, 226],
    [92, 158],
  ]),
  center("rectus_abdominis", "front", [
    [92, 148],
    [128, 148],
    [126, 188],
    [128, 226],
    [92, 226],
    [94, 188],
  ]),
  ...bilateral("pectoralis_major", "front", [
    [78, 104],
    [62, 112],
    [60, 132],
    [70, 150],
    [98, 148],
    [108, 136],
    [108, 114],
    [96, 104],
  ]),
  ...bilateral("biceps_brachii", "front", [
    [50, 124],
    [40, 132],
    [36, 158],
    [40, 178],
    [54, 180],
    [62, 164],
    [62, 138],
  ]),
  ...bilateral("forearm_flexors", "front", [
    [40, 182],
    [32, 192],
    [28, 224],
    [32, 254],
    [46, 258],
    [54, 230],
    [52, 198],
  ]),
  ...bilateral("deltoid", "front", [
    [58, 84],
    [44, 92],
    [40, 110],
    [48, 126],
    [66, 128],
    [78, 114],
    [76, 94],
    [68, 84],
  ]),

  // BACK
  ...bilateral("hamstrings", "back", [
    [78, 292],
    [64, 306],
    [60, 348],
    [70, 370],
    [92, 364],
    [102, 322],
    [96, 296],
  ]),
  ...bilateral("gastrocnemius", "back", [
    [72, 368],
    [62, 382],
    [62, 422],
    [74, 436],
    [92, 428],
    [96, 390],
    [88, 370],
  ]),
  ...bilateral("soleus", "back", [
    [68, 430],
    [62, 444],
    [64, 478],
    [78, 488],
    [90, 478],
    [92, 446],
    [84, 432],
  ]),
  ...bilateral("gluteus_maximus", "back", [
    [80, 236],
    [66, 248],
    [66, 284],
    [84, 300],
    [106, 288],
    [104, 246],
  ]),
  ...bilateral("latissimus_dorsi", "back", [
    [76, 122],
    [62, 142],
    [56, 178],
    [62, 214],
    [88, 206],
    [98, 160],
    [92, 126],
  ]),
  ...bilateral("erector_spinae", "back", [
    [98, 154],
    [90, 164],
    [88, 218],
    [98, 238],
    [108, 220],
    [108, 164],
  ]),
  center("trapezius", "back", [
    [110, 76],
    [86, 86],
    [74, 108],
    [84, 146],
    [110, 166],
    [136, 146],
    [146, 108],
    [134, 86],
  ]),
  ...bilateral("triceps_brachii", "back", [
    [50, 122],
    [40, 134],
    [36, 166],
    [44, 182],
    [60, 176],
    [64, 146],
    [58, 124],
  ]),
  ...bilateral("forearm_extensors", "back", [
    [40, 184],
    [30, 196],
    [26, 228],
    [30, 258],
    [46, 260],
    [54, 230],
    [52, 198],
  ]),
  ...bilateral("posterior_deltoid", "back", [
    [56, 86],
    [44, 94],
    [40, 112],
    [50, 126],
    [68, 124],
    [76, 108],
    [70, 88],
  ]),
];

export const SILHOUETTE: Record<AnatomyView, string[]> = {
  front: [
    // head
    "M 110 18 C 128 18 136 34 132 52 C 128 68 118 74 110 74 C 102 74 92 68 88 52 C 84 34 92 18 110 18 Z",
    // neck
    "M 102 72 L 118 72 L 120 88 L 100 88 Z",
    // torso
    "M 74 90 C 52 96 42 112 44 132 L 40 250 C 40 262 58 272 78 274 L 110 276 L 142 274 C 162 272 180 262 180 250 L 176 132 C 178 112 168 96 146 90 Z",
    // left arm + hand
    "M 52 96 C 34 108 26 150 28 188 C 24 222 22 250 28 272 C 34 282 48 278 50 266 C 52 244 50 214 52 190 C 56 158 60 128 68 110 Z",
    "M 168 96 C 186 108 194 150 192 188 C 196 222 198 250 192 272 C 186 282 172 278 170 266 C 168 244 170 214 168 190 C 164 158 160 128 152 110 Z",
    // legs + feet
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

export function pathsForView(view: AnatomyView): MusclePath[] {
  return MUSCLE_PATHS.filter((p) => p.view === view);
}

export function pathsForMuscle(muscleId: MuscleId, view: AnatomyView): MusclePath[] {
  return MUSCLE_PATHS.filter((p) => p.muscleId === muscleId && p.view === view);
}

export function muscleIdFromPath(pathId: string): MuscleId | null {
  const hit = MUSCLE_PATHS.find((p) => p.id === pathId);
  return hit?.muscleId ?? null;
}
