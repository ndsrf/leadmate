/**
 * The one place that turns an interaction into a haptic and a short UI sound. Everything is
 * fire-and-forget: it never throws, never awaits, and never touches the simulation. Components
 * call this service; nothing else calls haptics or UI sounds directly.
 */
export type HapticKind = 'light' | 'success' | 'unlock' | 'tick' | 'thud';
export type UiSound = 'press' | 'success' | 'star' | 'unlock';
/** The in-Stage Feedback Message sounds. */
export type StageSound = 'tick' | 'chime' | 'fanfare' | 'bonk';
export interface StageSoundOptions {
  /** Playback rate; 2^(n/12) raises the pitch n semitones. */
  rate: number;
  /** 0-1. */
  volume: number;
}

/** Feedback volume while a Cue or a Dog sound is playing. */
export const CUE_ACTIVE_VOLUME = 0.35;
/** The tick rises one semitone per Combo step, up to this many. */
export const MAX_COMBO_SEMITONES = 7;

/** The Approach ring's count-in tick: the tick sound five semitones down, at lower volume, with no haptic. */
export const TELEGRAPH_TICK_SEMITONES = -5;
export const TELEGRAPH_TICK_VOLUME = 0.5;

export function comboSemitones(combo: number): number {
  return Math.max(0, Math.min(MAX_COMBO_SEMITONES, Math.floor(combo) - 1));
}

export interface FeedbackBackends {
  haptic(kind: HapticKind): void;
  sound(sound: UiSound): void;
  /** True while a Cue or a Dog sound is playing; UI sounds then stay silent. */
  cueAudioActive(): boolean;
  /** Plays a Feedback Message sound at a rate and volume; a platform that cannot change the rate plays it fixed. */
  stageSound(sound: StageSound, options: StageSoundOptions): void;
  /** Creates one player per Feedback Message sound so playing one later does not load a file. */
  preload(): void;
}

/** What the shell needs of a `feedback` bundle message to voice it. */
export interface StageFeedbackCue {
  polarity: 'right' | 'wrong';
  tier: 'small' | 'medium' | 'big';
  combo: number;
  /** Perfects in a row, present on the message shown for a Perfect press: its sound rises by it, whichever tier plays. */
  perfectRun?: number;
}

export interface FeedbackSettings {
  sounds: boolean;
  haptics: boolean;
}

export const DEFAULT_FEEDBACK_SETTINGS: FeedbackSettings = { sounds: true, haptics: true };

export interface Feedback {
  press(): void;
  success(): void;
  /** The `n`th star of a reveal (1-3); later stars are higher. */
  star(n: number): void;
  unlock(): void;
  /** Voices a Feedback Message: a sound (tick, chime, fanfare, bonk) and a light tick or soft thud haptic. */
  stage(cue: StageFeedbackCue): void;
  /** The count-in tick of the Approach ring: sound only, under the sound setting. */
  telegraphTick(): void;
  /** Call when a Stage starts. */
  preloadStage(): void;
}

export function createFeedback(getBackends: () => FeedbackBackends, getSettings: () => FeedbackSettings): Feedback {
  const play = (haptic: HapticKind, sound: UiSound) => {
    let settings: FeedbackSettings;
    let backends: FeedbackBackends;
    try {
      settings = getSettings();
      backends = getBackends();
    } catch {
      return;
    }
    if (settings.haptics) {
      try {
        backends.haptic(haptic);
      } catch {
        // no haptics here
      }
    }
    if (!settings.sounds) return;
    try {
      if (backends.cueAudioActive()) return;
      backends.sound(sound);
    } catch {
      // a sound that cannot play is silent
    }
  };
  const stage = (cue: StageFeedbackCue) => {
    let settings: FeedbackSettings;
    let backends: FeedbackBackends;
    try {
      settings = getSettings();
      backends = getBackends();
    } catch {
      return;
    }
    if (settings.haptics) {
      try {
        backends.haptic(cue.polarity === 'right' ? 'tick' : 'thud');
      } catch {
        // no haptics here
      }
    }
    if (!settings.sounds) return;
    try {
      const sound: StageSound = cue.polarity === 'wrong' ? 'bonk' : cue.tier === 'big' ? 'fanfare' : cue.tier === 'medium' ? 'chime' : 'tick';
      const rate =
        cue.perfectRun !== undefined ? Math.pow(2, comboSemitones(cue.perfectRun) / 12) : sound === 'tick' ? Math.pow(2, comboSemitones(cue.combo) / 12) : 1;
      backends.stageSound(sound, { rate, volume: backends.cueAudioActive() ? CUE_ACTIVE_VOLUME : 1 });
    } catch {
      // a sound that cannot play is silent
    }
  };
  const telegraphTick = () => {
    try {
      if (!getSettings().sounds) return;
      const backends = getBackends();
      const volume = TELEGRAPH_TICK_VOLUME * (backends.cueAudioActive() ? CUE_ACTIVE_VOLUME : 1);
      backends.stageSound('tick', { rate: Math.pow(2, TELEGRAPH_TICK_SEMITONES / 12), volume });
    } catch {
      // a sound that cannot play is silent
    }
  };
  const preloadStage = () => {
    try {
      if (getSettings().sounds) getBackends().preload();
    } catch {
      // players that cannot load are created on first play
    }
  };
  return {
    stage,
    telegraphTick,
    preloadStage,
    press: () => play('light', 'press'),
    success: () => play('success', 'success'),
    star: () => play('light', 'star'),
    unlock: () => play('unlock', 'unlock'),
  };
}

const SILENT: FeedbackBackends = { haptic: () => {}, sound: () => {}, cueAudioActive: () => false, stageSound: () => {}, preload: () => {} };
let backends: FeedbackBackends = SILENT;
let settings: FeedbackSettings = DEFAULT_FEEDBACK_SETTINGS;

/** Connects the real haptics and players; until then (and in tests) feedback is silent. */
export function configureFeedback(next: FeedbackBackends): void {
  backends = next;
}

/** The device's current choices; the Settings screen and the loader call this. */
export function setFeedbackSettings(next: FeedbackSettings): void {
  settings = next;
}

export const feedback: Feedback = createFeedback(
  () => backends,
  () => settings,
);
