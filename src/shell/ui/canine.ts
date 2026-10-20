import type { TextKey } from '../../i18n';
import type { DoorbellOutcome, DoorbellState } from '../nodes/doorbellMat';

/** What the Dog's body is doing in a static Minigame; the avatar draws one of these. */
export type CaninePosture = 'standing_waiting' | 'alert_barking' | 'settling_towards_mat' | 'calm_sphinx_on_mat' | 'straining' | 'slack';

export const CANINE_POSTURES: readonly CaninePosture[] = ['standing_waiting', 'alert_barking', 'settling_towards_mat', 'calm_sphinx_on_mat', 'straining', 'slack'];

export interface PostureSpec {
  /** Body tilt in degrees, positive leaning forward (towards the right-hand side). */
  leanDeg: number;
  /** 1 is standing at full height, lower is lying down. */
  height: number;
  tail: 'up' | 'wag' | 'down';
  earsUp: boolean;
  mouthOpen: boolean;
  /** Read aloud by screen readers. */
  label: TextKey;
}

const SPECS: Record<CaninePosture, PostureSpec> = {
  standing_waiting: { leanDeg: 0, height: 1, tail: 'wag', earsUp: true, mouthOpen: false, label: 'minigame.dog.standing_waiting' },
  alert_barking: { leanDeg: 12, height: 1, tail: 'up', earsUp: true, mouthOpen: true, label: 'minigame.dog.alert_barking' },
  settling_towards_mat: { leanDeg: -4, height: 0.8, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.settling_towards_mat' },
  calm_sphinx_on_mat: { leanDeg: 0, height: 0.55, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.calm_sphinx_on_mat' },
  straining: { leanDeg: 24, height: 0.95, tail: 'up', earsUp: true, mouthOpen: false, label: 'minigame.dog.straining' },
  slack: { leanDeg: 0, height: 0.7, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.slack' },
};

export function postureSpec(posture: CaninePosture): PostureSpec {
  return SPECS[posture];
}

/** Seconds a mistake keeps the Dog agitated on screen, since a failed round resets the Dog straight away. */
export const AGITATION_SECONDS = 1.2;

/** Fraction of the excited phase after which the Dog starts to disengage from the door. */
const SETTLING_FROM = 0.6;

/**
 * The Doorbell Mat posture cycle: waiting, barking at the bell, settling towards the mat, calm on it.
 * A press that rewarded the wrong moment keeps the Dog barking for a while (`agitated`).
 */
export function doorbellPosture(state: Pick<DoorbellState, 'phase' | 't' | 'bellAt' | 'calmAt'>, agitated: boolean): CaninePosture {
  if (agitated) return 'alert_barking';
  if (state.phase === 'waiting') return 'standing_waiting';
  if (state.phase === 'calm') return 'calm_sphinx_on_mat';
  return state.t >= state.bellAt + SETTLING_FROM * (state.calmAt - state.bellAt) ? 'settling_towards_mat' : 'alert_barking';
}

/** Whether a Doorbell round outcome rewarded an uncalm Dog. */
export function agitatesDog(outcome: DoorbellOutcome): boolean {
  return outcome === 'early';
}

/**
 * The hold-to-settle posture from leash tension (0 slack, 1 rigid). A release that ended the round
 * (`lunged`) sends the Dog forward again at once.
 */
export function holdPosture(tension: number, lunged: boolean): CaninePosture {
  return lunged || tension >= 0.5 ? 'straining' : 'slack';
}

export interface LeashSegment {
  x: number;
  y: number;
  length: number;
  /** Degrees, clockwise from the x axis. */
  angleDeg: number;
}

export const LEASH_SEGMENTS = 14;
/** Tension is shown in steps so the leash only redraws when it visibly changes. */
export const TENSION_STEPS = 10;

export function quantizeTension(tension: number): number {
  return Math.round(Math.max(0, Math.min(1, tension)) * TENSION_STEPS) / TENSION_STEPS;
}

/**
 * The leash as short straight segments along a quadratic Bezier from the Handler to the Dog: it sags
 * by `sag` pixels when slack and runs straight when rigid.
 */
export function leashSegments(tension: number, from: { x: number; y: number }, to: { x: number; y: number }, sag: number): LeashSegment[] {
  const t0 = Math.max(0, Math.min(1, tension));
  const control = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 + sag * (1 - t0) };
  const at = (u: number) => ({
    x: (1 - u) ** 2 * from.x + 2 * (1 - u) * u * control.x + u ** 2 * to.x,
    y: (1 - u) ** 2 * from.y + 2 * (1 - u) * u * control.y + u ** 2 * to.y,
  });
  const out: LeashSegment[] = [];
  for (let i = 0; i < LEASH_SEGMENTS; i++) {
    const a = at(i / LEASH_SEGMENTS);
    const b = at((i + 1) / LEASH_SEGMENTS);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    out.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, length: Math.hypot(dx, dy), angleDeg: (Math.atan2(dy, dx) * 180) / Math.PI });
  }
  return out;
}
