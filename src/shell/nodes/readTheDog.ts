import { DIAGNOSTIC } from '../onboarding/diagnostic';

/**
 * Read the Dog - pure engine
 *
 * Implements the reflex minigame according to ADR 0032 and OpenSpec change `add-read-the-dog-game`.
 */

export type RtdClass = 'calm' | 'alert' | 'about_to_react';

export type RtdSignal =
  | 'soft_loose'
  | 'play_bow'
  | 'loose_wag'
  | 'ears_up_still'
  | 'lip_lick'
  | 'whale_eye'
  | 'freeze_stare'
  | 'hackles_up'
  | 'stiff_closed_mouth';

export interface RtdSignalInfo {
  cls: RtdClass;
  subtle: boolean;
}

export const SIGNALS: Record<RtdSignal, RtdSignalInfo> = {
  soft_loose: { cls: 'calm', subtle: false },
  play_bow: { cls: 'calm', subtle: false },
  loose_wag: { cls: 'calm', subtle: true },
  ears_up_still: { cls: 'alert', subtle: false },
  lip_lick: { cls: 'alert', subtle: true },
  whale_eye: { cls: 'alert', subtle: true },
  freeze_stare: { cls: 'about_to_react', subtle: false },
  hackles_up: { cls: 'about_to_react', subtle: false },
  stiff_closed_mouth: { cls: 'about_to_react', subtle: true },
};

export const READ_THE_DOG = {
  roundSeconds: 24,
  pauseSeconds: 0.35,
  wrongPauseSeconds: 1.2,
  timers: [2.4, 2.0, 1.7, 1.4, 1.2, 1.0],
  subtleFromLevel: 2,
  upAfter: 3,
  downAfter: 2,
  missWeight: 2,
  rightWeight: -1,
  maxWeight: 5,
  baseWeight: 1,
  decisionAllowance: 0.45,
  missSeconds: DIAGNOSTIC.timeout,
  screenReaderTimer: 6,
  bigEvery: 5,
  basePoints: 100,
} as const;

export interface TimerOptions {
  screenReader?: boolean;
  timerSeconds?: number;
}

export function timerFor(level: number, opts?: TimerOptions): number {
  if (opts?.screenReader) {
    return READ_THE_DOG.screenReaderTimer;
  }
  if (opts?.timerSeconds !== undefined) {
    return opts.timerSeconds;
  }
  const maxIdx = READ_THE_DOG.timers.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, Math.floor(level)));
  return READ_THE_DOG.timers[clamped];
}

