import { STAR_THRESHOLDS } from '../sim/payload';

export type Stars = 1 | 2 | 3;

/**
 * Stars for a finished Node from its handling score (0-1000): 1 for completing it, 2 from 650 and 3
 * from 850. A Node without a score (a Minigame) earns 1. Only handling quality counts, never time or taps.
 */
export function starsFor(handlingScore: number | undefined): Stars {
  if (handlingScore === undefined || !Number.isFinite(handlingScore)) return 1;
  if (handlingScore >= STAR_THRESHOLDS.three) return 3;
  if (handlingScore >= STAR_THRESHOLDS.two) return 2;
  return 1;
}

/** The better of two ratings; a worse replay never lowers it. */
export function bestStars(a: Stars | undefined, b: Stars | undefined): Stars | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a >= b ? a : b;
}

export function isStars(v: unknown): v is Stars {
  return v === 1 || v === 2 || v === 3;
}
