import { quantize } from './dirty';
import type { TelegraphCheckInArc, TelegraphRing } from './telegraph';

/** Horizontal radius of the Approach ring when it opens (about 3x the Dog footprint) and when it lands. */
export const RING_OPEN = 78;
export const RING_CLOSED = 26;
/** The fixed radius of the reduced-motion fill-ring. */
export const RING_FIXED = 52;
/** Check-in arc radius and its height above the Dog's ground point. */
export const ARC_RADIUS = 13;
export const ARC_RISE = 46;
/** A snap flicks (or, with reduced motion, fades to empty) for this long. */
export const SNAP_SECONDS = 0.15;
/** Progress is drawn in about 60 steps, so idle frames never redraw. */
export const TELEGRAPH_STEPS = 60;

export type RingMode = 'closing' | 'landed' | 'good' | 'fading';

/** What to draw for the Approach ring this frame; the drawing code adds no logic of its own. */
export interface RingLook {
  mode: RingMode;
  /** Horizontal radius in world pixels (the ground ellipse is half as tall). */
  radius: number;
  /** Clockwise fill of the ring arc, 0 to 1 (1 = a full ring). */
  fill: number;
  /** A solid filled disc (the landed look). */
  disc: boolean;
  /** A dashed stroke (the Good look). */
  dashed: boolean;
  alpha: number;
  /** The radius of the open ring that is flicking away on a snap, with its alpha, or null. */
  ghost: { radius: number; alpha: number } | null;
  /** Everything the drawing depends on; unchanged since the last frame means nothing to redraw. */
  key: string;
}

export interface RingLookOptions {
  reducedMotion: boolean;
  /** Seconds since the ring landed (for the pulse). */
  landedAge?: number;
  /** Fraction of the Good look's Reward Window still to run, 1 down to 0. */
  goodLeft?: number;
  /** Seconds since the last snap, when one is under way. */
  snapAge?: number;
  /** The progress the ring had just before the snap. */
  snapFromProgress?: number;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function ringLook(ring: TelegraphRing | null, o: RingLookOptions): RingLook | null {
  if (!ring || !ring.shown) return null;
  const progress = clamp01(ring.progress);
  const snapT = o.snapAge !== undefined && o.snapAge < SNAP_SECONDS ? clamp01(o.snapAge / SNAP_SECONDS) : null;
  let look: Omit<RingLook, 'key'>;
  if (ring.phase === 'landed') {
    const pulse = o.reducedMotion ? 0 : 1 - clamp01((o.landedAge ?? 0) / 0.3);
    look = { mode: 'landed', radius: o.reducedMotion ? RING_FIXED * 0.55 : RING_CLOSED * (1 + 0.3 * pulse), fill: 1, disc: true, dashed: false, alpha: 1, ghost: null };
  } else if (ring.phase === 'good') {
    const left = clamp01(o.goodLeft ?? 1);
    look = { mode: 'good', radius: o.reducedMotion ? RING_FIXED * 0.55 : RING_CLOSED + 8, fill: left, disc: false, dashed: true, alpha: 1, ghost: null };
  } else {
    const mode: RingMode = ring.phase === 'fading' ? 'fading' : 'closing';
    const alpha = mode === 'fading' ? 0.5 : 1;
    if (o.reducedMotion) {
      // a fixed ring whose arc fills with progress; a snap fades the old fill out instead of flicking
      const fadingFill = snapT !== null && o.snapFromProgress !== undefined;
      look = { mode, radius: RING_FIXED, fill: fadingFill ? clamp01(o.snapFromProgress!) : progress, disc: false, dashed: false, alpha: fadingFill ? alpha * (1 - snapT!) : alpha, ghost: null };
    } else {
      const radius = lerp(RING_OPEN, RING_CLOSED, progress);
      const ghost = snapT !== null && o.snapFromProgress !== undefined ? { radius: lerp(RING_OPEN, RING_CLOSED, clamp01(o.snapFromProgress)), alpha: 0.5 * (1 - snapT) } : null;
      look = { mode, radius, fill: 1, disc: false, dashed: false, alpha, ghost };
    }
  }
  const key = [
    look.mode,
    quantize(progress, TELEGRAPH_STEPS),
    quantize(look.fill, TELEGRAPH_STEPS),
    look.disc ? 'd' : look.dashed ? 'h' : 's',
    Math.round(look.radius),
    Math.round(look.alpha * 20),
    look.ghost ? `${Math.round(look.ghost.radius)}:${Math.round(look.ghost.alpha * 20)}` : '-',
  ].join('|');
  return { ...look, key };
}

/** What to draw for the Check-in arc this frame. */
export interface ArcLook {
  /** Clockwise fill 0 to 1 (1 = closed). */
  fill: number;
  disc: boolean;
  alpha: number;
  key: string;
}

export function arcLook(arc: TelegraphCheckInArc | null): ArcLook | null {
  if (!arc || !arc.shown) return null;
  const landed = arc.phase === 'landed';
  const fill = clamp01(arc.progress);
  const alpha = arc.phase === 'fading' ? 0.5 : 1;
  return { fill, disc: landed, alpha, key: `${arc.phase}|${quantize(fill, TELEGRAPH_STEPS)}` };
}
