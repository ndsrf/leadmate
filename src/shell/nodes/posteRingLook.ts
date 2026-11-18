import { ringLook, type RingLook } from '../../hud/telegraphLook';
import type { PosteRingProgress } from './posteMinigame';

/** Scene pixels per Stage pixel: the Poste scene is small, so its ring is too. */
export const POSTE_RING_SCALE = 0.62;
/** Where the ring sits in the Poste scene: on the ground under the Dog. */
export const POSTE_RING_CENTER = { x: 233, y: 148 } as const;

export interface PosteRingDrawing {
  look: RingLook;
  /** Horizontal and vertical radius in scene pixels. */
  rx: number;
  ry: number;
}

/**
 * The look of the Poste practice ring around the Dog. It is the Approach ring of the walking Stage (closing with the hold,
 * a solid landed disc on settling, a snap on release) and with reduced motion the fixed-radius fill-ring. It reads only
 * the Minigame's own state and never the Timing assist.
 */
export function posteRingDrawing(ring: PosteRingProgress, o: { reducedMotion: boolean; snapAge?: number; snapFromProgress?: number; landedAge?: number }): PosteRingDrawing | null {
  const look = ringLook({ shown: true, progress: ring.progress, phase: ring.phase, snap: ring.snap }, o);
  if (!look) return null;
  const rx = look.radius * POSTE_RING_SCALE;
  return { look, rx, ry: rx / 2 };
}
