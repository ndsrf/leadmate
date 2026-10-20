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
