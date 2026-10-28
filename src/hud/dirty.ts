/**
 * Tells whether a frame's inputs differ from the last frame's. Callers build a key from everything a piece of
 * drawing depends on and skip the work when `changed` returns false; `reset` forces the next frame to draw.
 */
export interface ChangeDetector {
  changed(key: string): boolean;
  reset(): void;
}

export function createChangeDetector(): ChangeDetector {
  let last: string | null = null;
  return {
    changed(key) {
      if (key === last) return false;
      last = key;
      return true;
    },
    reset() {
      last = null;
    },
  };
}

/** How many steps a HUD countdown ring runs down in. */
export const RING_STEPS = 48;

/**
 * A continuous value in [0, 1] as a whole number of `steps`, for a change key: the HUD redraws only when the value
 * moves by a visible step, not on every frame.
 */
export function quantize(value: number, steps = RING_STEPS): number {
  return Math.round(value * steps);
}
