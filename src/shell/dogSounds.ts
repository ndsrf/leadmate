import type { DogSound } from './vocalize';

/** Bundled dog vocalizations. Kept apart from `vocalize.ts` so its logic stays testable without assets. */
export const DOG_SOUNDS: Record<DogSound, number> = {
  bark: require('../../assets/dog/bark.wav'),
  whine: require('../../assets/dog/whine.wav'),
  growl: require('../../assets/dog/growl.wav'),
};
