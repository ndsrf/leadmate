import type { TextKey } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import type { DogState, ReadDogAction } from '../nodes/readDog';

/** What the Dog's body is doing in a static Minigame; the avatar draws one of these. */
export type CaninePosture =
  | 'standing_waiting'
  | 'alert_barking'
  | 'settling_towards_mat'
  | 'calm_sphinx_on_mat'
  | 'straining'
  | 'slack'
  | 'looking'
  | 'jumping'
  | 'sniffing'
  | 'sitting_attentive'
  | 'staring_door'
  | 'unsettled_on_mat'
  | 'relaxed_lying';

export const CANINE_POSTURES: readonly CaninePosture[] = [
  'standing_waiting',
  'alert_barking',
  'settling_towards_mat',
  'calm_sphinx_on_mat',
  'straining',
  'slack',
  'looking',
  'jumping',
  'sniffing',
  'sitting_attentive',
  'staring_door',
  'unsettled_on_mat',
  'relaxed_lying',
];

/** The postures the user reads in the action Minigames; they must tell apart at a glance. */
export const READABLE_POSTURES: readonly DogState[] = ['jumping', 'alert_barking', 'staring_door', 'sniffing', 'sitting_attentive', 'unsettled_on_mat', 'relaxed_lying'];

export type Eyes = 'open' | 'wide' | 'closed';
/** The bubble beside the head; the caption always names the same state in words. */
export type Emote = 'alert' | 'distracted' | 'love' | 'sleepy' | 'none';

export interface PostureSpec {
  /** Body tilt in degrees, positive leaning forward (towards the right-hand side). */
  leanDeg: number;
  /** 1 is standing at full height, lower is lying down, above 1 is in the air. */
  height: number;
  tail: 'up' | 'wag' | 'down';
  earsUp: boolean;
  mouthOpen: boolean;
  eyes: Eyes;
  emote: Emote;
  /** Read aloud by screen readers. */
  label: TextKey;
  /** A few words on screen naming what the Dog is doing, so the user learns to read it. */
  cue: TextKey;
}

const SPECS: Record<CaninePosture, PostureSpec> = {
  standing_waiting: { leanDeg: 0, height: 1, tail: 'wag', earsUp: true, mouthOpen: false, eyes: 'open', emote: 'none', label: 'minigame.dog.standing_waiting', cue: 'minigame.cue.waiting' },
  alert_barking: { leanDeg: 12, height: 1, tail: 'up', earsUp: true, mouthOpen: true, eyes: 'wide', emote: 'alert', label: 'minigame.dog.alert_barking', cue: 'minigame.cue.barking' },
  settling_towards_mat: { leanDeg: -4, height: 0.8, tail: 'down', earsUp: false, mouthOpen: false, eyes: 'open', emote: 'none', label: 'minigame.dog.settling_towards_mat', cue: 'minigame.cue.settling' },
  calm_sphinx_on_mat: { leanDeg: 0, height: 0.55, tail: 'down', earsUp: false, mouthOpen: false, eyes: 'closed', emote: 'none', label: 'minigame.dog.calm_sphinx_on_mat', cue: 'minigame.cue.calm' },
  straining: { leanDeg: 24, height: 0.95, tail: 'up', earsUp: true, mouthOpen: false, eyes: 'open', emote: 'none', label: 'minigame.dog.straining', cue: 'minigame.cue.straining' },
  slack: { leanDeg: 0, height: 0.7, tail: 'down', earsUp: false, mouthOpen: false, eyes: 'open', emote: 'none', label: 'minigame.dog.slack', cue: 'minigame.cue.slack' },
  looking: { leanDeg: 0, height: 1, tail: 'up', earsUp: true, mouthOpen: false, eyes: 'open', emote: 'none', label: 'minigame.dog.looking', cue: 'minigame.cue.looking' },
  jumping: { leanDeg: -8, height: 1.15, tail: 'wag', earsUp: true, mouthOpen: true, eyes: 'wide', emote: 'alert', label: 'minigame.dog.jumping', cue: 'minigame.cue.jumping' },
  sniffing: { leanDeg: 10, height: 0.8, tail: 'wag', earsUp: false, mouthOpen: false, eyes: 'open', emote: 'distracted', label: 'minigame.dog.sniffing', cue: 'minigame.cue.sniffing' },
  sitting_attentive: { leanDeg: -10, height: 0.75, tail: 'down', earsUp: true, mouthOpen: false, eyes: 'open', emote: 'love', label: 'minigame.dog.sitting_attentive', cue: 'minigame.cue.sitting_attentive' },
  staring_door: { leanDeg: 6, height: 1, tail: 'up', earsUp: true, mouthOpen: false, eyes: 'wide', emote: 'alert', label: 'minigame.dog.staring_door', cue: 'minigame.cue.staring_door' },
  unsettled_on_mat: { leanDeg: 3, height: 0.9, tail: 'wag', earsUp: false, mouthOpen: false, eyes: 'wide', emote: 'alert', label: 'minigame.dog.unsettled_on_mat', cue: 'minigame.cue.unsettled_on_mat' },
  relaxed_lying: { leanDeg: 0, height: 0.5, tail: 'down', earsUp: false, mouthOpen: false, eyes: 'closed', emote: 'sleepy', label: 'minigame.dog.relaxed_lying', cue: 'minigame.cue.relaxed_lying' },
};

export function postureSpec(posture: CaninePosture): PostureSpec {
  return SPECS[posture];
}

/** Seconds a mistake keeps the Dog agitated on screen, since a failed round resets the Dog straight away. */
export const AGITATION_SECONDS = 1.2;

/** States in which the Dog is aroused: a wrong action leaves it so instead of changing its posture. */
const AROUSED: readonly DogState[] = ['jumping', 'alert_barking', 'staring_door'];

/**
 * How the Dog answers a wrong action for `AGITATION_SECONDS`: a harness is refused (the Dog backs away
 * to stand), an aroused Dog stays aroused, and any other Dog jumps up.
 */
export function wrongReaction(state: DogState, action: ReadDogAction | null): CaninePosture {
  if (action === 'harness') return 'standing_waiting';
  return AROUSED.includes(state) ? state : 'jumping';
}

/** Whether the Dog stands at the door in the Doorbell scene; every other posture is on or near its mat. */
export function atDoor(posture: CaninePosture): boolean {
  return posture === 'standing_waiting' || posture === 'alert_barking' || posture === 'staring_door';
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
  jumping: { x: 110, y: 37 },
  sniffing: { x: 112, y: 70 },
  sitting_attentive: { x: 92, y: 38 },
  staring_door: { x: 112, y: 48 },
  unsettled_on_mat: { x: 108, y: 55 },
  relaxed_lying: { x: 106, y: 80 },
};

/** Where an emote bubble sits, in `DOG_VIEW` units: the top-right corner, clear of the head, and higher for a Dog that stands taller. */
export function emotePoint(posture: CaninePosture): { x: number; y: number } {
  const c = COLLAR_POINT[posture];
  return { x: DOG_VIEW.w - 14, y: Math.max(14, c.y - 30) };
}

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
