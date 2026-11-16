import type { DogPose } from './pose';

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

/** Wag animation frequency: 2 frames at ~4 Hz (readable-dog Decision 6). */
export const WAG_HZ = 4;

/**
 * Returns the wag step (0 or 1) for a given timestamp in seconds at `hz` (default 4 Hz).
 */
export function wagStep(timeSeconds: number, hz = WAG_HZ): number {
  return Math.floor(timeSeconds * hz) % 2;
}

/**
 * Change key for the Dog portrait in the HUD.
 * Redraws only when the Canine Posture changes or on a wag step (when tail is wagging),
 * and never on continuous time advances when still.
 */
export function portraitDirtyKey(
  pose: Pick<DogPose, 'gaze' | 'head' | 'ears' | 'tail'>,
  timeSeconds: number,
  options?: { reducedMotion?: boolean; coat?: string },
): string {
  const wag = pose.tail === 'wagging' && !options?.reducedMotion ? wagStep(timeSeconds) : '-';
  return [pose.gaze, pose.head, pose.ears, pose.tail, wag, options?.coat ?? 'golden'].join('|');
}
