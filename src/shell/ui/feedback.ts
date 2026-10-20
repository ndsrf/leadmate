/**
 * The one place that turns an interaction into a haptic and a short UI sound. Everything is
 * fire-and-forget: it never throws, never awaits, and never touches the simulation. Components
 * call this service; nothing else calls haptics or UI sounds directly.
 */
export type HapticKind = 'light' | 'success' | 'unlock';
export type UiSound = 'press' | 'success' | 'star' | 'unlock';

export interface FeedbackBackends {
  haptic(kind: HapticKind): void;
  sound(sound: UiSound): void;
  /** True while a Cue or a Dog sound is playing; UI sounds then stay silent. */
  cueAudioActive(): boolean;
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
  return {
    press: () => play('light', 'press'),
    success: () => play('success', 'success'),
    star: () => play('light', 'star'),
    unlock: () => play('unlock', 'unlock'),
  };
}

const SILENT: FeedbackBackends = { haptic: () => {}, sound: () => {}, cueAudioActive: () => false };
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
