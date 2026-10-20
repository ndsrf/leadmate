import type { ReactionTier } from '../sim/sim';
import { VOCALIZATION_COOLDOWN_SECONDS } from '../hud/pose';

export type DogSound = 'whine' | 'growl' | 'bark';

/** The sounds each tier makes; Calm is silent. Alert alternates a whine and a growl. */
const SOUNDS: Record<ReactionTier, readonly DogSound[]> = { calm: [], alert: ['whine', 'growl'], reactive: ['bark'] };

export interface Vocalizer {
  /** The Dog crossed into `tier`; plays its sound unless the same tier sounded less than the cooldown ago. */
  onTier(tier: ReactionTier): DogSound | null;
}

/**
 * Turns Reaction Tier changes from the simulation into fire-and-forget sounds. A Dog that flickers
 * in and out of a tier does not repeat itself within the cooldown (2.0 s); `now` is in milliseconds.
 */
export function createVocalizer(play: (sound: DogSound) => void, now: () => number = Date.now, cooldownSeconds = VOCALIZATION_COOLDOWN_SECONDS): Vocalizer {
  const last: Partial<Record<ReactionTier, number>> = {};
  const turn: Partial<Record<ReactionTier, number>> = {};
  return {
    onTier(tier) {
      const sounds = SOUNDS[tier];
      if (sounds.length === 0) return null;
      const t = now();
      const before = last[tier];
      if (before !== undefined && t - before < cooldownSeconds * 1000) return null;
      last[tier] = t;
      const n = turn[tier] ?? 0;
      turn[tier] = n + 1;
      const sound = sounds[n % sounds.length];
      try {
        play(sound);
      } catch {
        // a sound that cannot play is silent; the Stage goes on
      }
      return sound;
    },
  };
}
