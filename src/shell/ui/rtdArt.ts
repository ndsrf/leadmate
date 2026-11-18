import type { RtdSignal } from '../nodes/readTheDog';

/** How the Dog's body sits: level, a play bow (front down, rear up) or leaning forward. */
export type RtdBody = 'level' | 'bow' | 'lean';
/** Ears relaxed (the breed's own), held up (the perk per ear kind) or pinned back. */
export type RtdEars = 'relaxed' | 'up' | 'pinned';
/** Eyes soft, wide (the old Diagnostic look), whale (a white crescent) or fixed (a hard stare). */
export type RtdEyes = 'soft' | 'wide' | 'whale' | 'fixed';
/** Mouth closed and soft (the plain muzzle), gently open, a tongue flick or tight shut. */
export type RtdMouth = 'soft' | 'open' | 'tongue_flick' | 'tight';
/** Tail: the breed's own, held low, loose wag, or stiff and high. */
export type RtdTail = 'neutral' | 'low' | 'wag' | 'stiff';

/** One signal's pose as a set of parts; `BreedArt` draws each part, so the pose never needs a drawing per signal. */
export interface RtdParts {
  body: RtdBody;
  ears: RtdEars;
  eyes: RtdEyes;
  mouth: RtdMouth;
  tail: RtdTail;
  /** A ridge of raised fur from the withers to the rump. */
  hackles: boolean;
  /** Gaze lines in front of the face (only the Diagnostic `looking`). */
  gaze: boolean;
}

export type RtdPart = keyof RtdParts;

const base: RtdParts = { body: 'level', ears: 'relaxed', eyes: 'soft', mouth: 'soft', tail: 'neutral', hackles: false, gaze: false };
const pose = (over: Partial<RtdParts>): RtdParts => ({ ...base, ...over });

/** Every pair differs in at least one part (tested), so a pair of signals can always be told apart by drawing alone. */
export const RTD_ART: Record<RtdSignal, RtdParts> = {
  soft_loose: pose({ mouth: 'open' }),
  play_bow: pose({ body: 'bow', mouth: 'open' }),
  loose_wag: pose({ mouth: 'open', tail: 'wag' }),
  ears_up_still: pose({ ears: 'up', eyes: 'wide' }),
  lip_lick: pose({ mouth: 'tongue_flick', tail: 'low' }),
  whale_eye: pose({ ears: 'pinned', eyes: 'whale', tail: 'low' }),
  freeze_stare: pose({ body: 'lean', ears: 'up', eyes: 'fixed', tail: 'stiff' }),
  hackles_up: pose({ ears: 'up', eyes: 'fixed', tail: 'stiff', hackles: true }),
  stiff_closed_mouth: pose({ ears: 'up', mouth: 'tight', tail: 'stiff' }),
};

/** The Diagnostic `looking` look: ears up, wide eye and gaze lines. */
export const LOOKING_PARTS: RtdParts = pose({ ears: 'up', eyes: 'wide', gaze: true });
const NEUTRAL: RtdParts = base;

/** The parts to draw: a signal, `'looking'`, the legacy `looking` flag, or the neutral Dog. */
export function partsOf(signal?: RtdSignal | 'looking', looking = false): RtdParts {
  if (signal === 'looking') return LOOKING_PARTS;
  if (signal !== undefined) return RTD_ART[signal];
  return looking ? LOOKING_PARTS : NEUTRAL;
}
