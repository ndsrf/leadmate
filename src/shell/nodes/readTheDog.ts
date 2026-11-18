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
