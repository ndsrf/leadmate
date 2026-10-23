import type { TextKey } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import type { DoorbellOutcome, DoorbellState } from '../nodes/doorbellMat';

/** What the Dog's body is doing in a static Minigame; the avatar draws one of these. */
export type CaninePosture = 'standing_waiting' | 'alert_barking' | 'settling_towards_mat' | 'calm_sphinx_on_mat' | 'straining' | 'slack' | 'looking';

export const CANINE_POSTURES: readonly CaninePosture[] = ['standing_waiting', 'alert_barking', 'settling_towards_mat', 'calm_sphinx_on_mat', 'straining', 'slack', 'looking'];

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
  /** A few words on screen naming what the Dog is doing, so the user learns to read it. */
  cue: TextKey;
}

const SPECS: Record<CaninePosture, PostureSpec> = {
  standing_waiting: { leanDeg: 0, height: 1, tail: 'wag', earsUp: true, mouthOpen: false, label: 'minigame.dog.standing_waiting', cue: 'minigame.cue.waiting' },
  alert_barking: { leanDeg: 12, height: 1, tail: 'up', earsUp: true, mouthOpen: true, label: 'minigame.dog.alert_barking', cue: 'minigame.cue.barking' },
  settling_towards_mat: { leanDeg: -4, height: 0.8, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.settling_towards_mat', cue: 'minigame.cue.settling' },
  calm_sphinx_on_mat: { leanDeg: 0, height: 0.55, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.calm_sphinx_on_mat', cue: 'minigame.cue.calm' },
  straining: { leanDeg: 24, height: 0.95, tail: 'up', earsUp: true, mouthOpen: false, label: 'minigame.dog.straining', cue: 'minigame.cue.straining' },
  slack: { leanDeg: 0, height: 0.7, tail: 'down', earsUp: false, mouthOpen: false, label: 'minigame.dog.slack', cue: 'minigame.cue.slack' },
  looking: { leanDeg: 0, height: 1, tail: 'up', earsUp: true, mouthOpen: false, label: 'minigame.dog.looking', cue: 'minigame.cue.looking' },
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

/** The Diagnostic Dog: calm until the signal, then looking at the user with ears up and a fixed gaze while it is on. */
export function diagnosticPosture(signalOn: boolean): CaninePosture {
  return signalOn ? 'looking' : 'standing_waiting';
}

/** The Dog drawing's own coordinate space; the scene scales it. */
export const DOG_VIEW = { w: 160, h: 110 } as const;

/** Where the collar sits in the Dog drawing, in `DOG_VIEW` units, facing right: the Leash is clipped to it. */
export const COLLAR_POINT: Record<CaninePosture, { x: number; y: number }> = {
  standing_waiting: { x: 110, y: 52 },
  alert_barking: { x: 110, y: 46 },
  settling_towards_mat: { x: 108, y: 53 },
  calm_sphinx_on_mat: { x: 108, y: 74 },
  straining: { x: 116, y: 58 },
  slack: { x: 92, y: 40 },
  looking: { x: 110, y: 50 },
};

/** Tension is shown in steps so the leash only redraws when it visibly changes. */
export const TENSION_STEPS = 10;

export function quantizeTension(tension: number): number {
  return Math.round(Math.max(0, Math.min(1, tension)) * TENSION_STEPS) / TENSION_STEPS;
}

/** Which colour a leash tension reads as: calm, warming up, or about to pull. */
export function tensionTone(tension: number): 'calm' | 'warn' | 'high' {
  return tension < 0.4 ? 'calm' : tension < 0.7 ? 'warn' : 'high';
}

/** Degrees the Handler leans back against a pull. */
export const HANDLER_LEAN_DEG = 9;

/** The Handler's hand and feet in scene units, upright; leaning rotates the hand about the feet. */
const HANDLER_HAND = { x: 62, y: 98 };
const HANDLER_FEET = { x: 40, y: 148 };

/** Where the Handler's hand is at a leash tension, in scene units. */
export function handlerHand(tension: number): { x: number; y: number } {
  const a = (-HANDLER_LEAN_DEG * Math.max(0, Math.min(1, tension)) * Math.PI) / 180;
  const dx = HANDLER_HAND.x - HANDLER_FEET.x;
  const dy = HANDLER_HAND.y - HANDLER_FEET.y;
  return { x: HANDLER_FEET.x + dx * Math.cos(a) - dy * Math.sin(a), y: HANDLER_FEET.y + dx * Math.sin(a) + dy * Math.cos(a) };
}

export const HANDLER_PIVOT = HANDLER_FEET;

/** The Leash as one SVG quadratic path from the hand to the collar: it sags by `sag` when slack and runs straight when rigid. */
export function leashPath(tension: number, from: { x: number; y: number }, to: { x: number; y: number }, sag: number): string {
  const t0 = Math.max(0, Math.min(1, tension));
  const cx = (from.x + to.x) / 2;
  const cy = (from.y + to.y) / 2 + sag * (1 - t0);
  const r = (n: number) => Math.round(n * 10) / 10;
  return `M${r(from.x)} ${r(from.y)} Q${r(cx)} ${r(cy)} ${r(to.x)} ${r(to.y)}`;
}

export interface HandlerPalette {
  skin: string;
  hair: string;
  shirt: string;
  trousers: string;
  shoes: string;
}

export const HANDLER_PALETTE: HandlerPalette = { skin: '#8d5a3b', hair: '#1f2937', shirt: '#16a34a', trousers: '#334155', shoes: '#f59e0b' };

export interface CoatPalette {
  fill: string;
  /** Ears, tail tip and the far legs. */
  shade: string;
  belly: string;
}

/** Coat colours of the Minigame Dog; they follow the Stage tints in `bundle/src/sprites.ts`. */
export const COAT_PALETTE: Record<DogCoat, CoatPalette> = {
  golden: { fill: '#f0b45c', shade: '#c98a2e', belly: '#f8d596' },
  black: { fill: '#55555c', shade: '#34343a', belly: '#74747c' },
  chocolate: { fill: '#9a6a4a', shade: '#704a31', belly: '#b88a6a' },
  cream: { fill: '#f6e3bc', shade: '#d8bf8c', belly: '#fff3d8' },
  white: { fill: '#ffffff', shade: '#cfd5df', belly: '#ffffff' },
  grey: { fill: '#b0b6c2', shade: '#868d9b', belly: '#ccd1da' },
  red: { fill: '#e2703a', shade: '#b4501f', belly: '#f0996a' },
};
