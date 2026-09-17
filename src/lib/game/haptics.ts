/**
 * Tiny haptic helper. `navigator.vibrate` is Android-only in practice; iOS
 * silently ignores it, so this is a bonus layer, never load-bearing feedback.
 */
export function haptic(pattern: number | number[]) {
  if (typeof navigator === "undefined") return;
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported */
  }
}

export const haptics = {
  plate: () => haptic(8),
  remove: () => haptic(5),
  correct: () => haptic([12, 40, 18]),
  wrong: () => haptic([30, 30, 30]),
  levelUp: () => haptic([10, 30, 10, 30, 24]),
  tick: () => haptic(4),
};
