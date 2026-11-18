import type { SimulationDebriefPayload } from '../../sim/payload';

export type EncounterAim = 'keep-slack' | 'stay-calm' | 'mark-disengagement' | 'check-in';

export type PawReason = 'aim' | 'reactive' | 'pull' | 'reactive-marker' | 'late' | 'perfect';

export interface PawResult {
  paws: 1 | 2 | 3;
  next: PawReason | null;
}

export const KEEP_SLACK_MAX_PULL = 25;
export const CLEAN_MAX_PULL = 10;

export function pawsFor(aim: EncounterAim, payload: SimulationDebriefPayload): PawResult {
  let aimMet = false;
  switch (aim) {
    case 'keep-slack':
      aimMet = payload.pullPercentage <= KEEP_SLACK_MAX_PULL && payload.peakReactionTier !== 'reactive';
      break;
    case 'stay-calm':
      aimMet = payload.peakReactionTier !== 'reactive';
      break;
    case 'mark-disengagement':
      aimMet = payload.markerHits >= 1;
      break;
    case 'check-in':
      aimMet = payload.checkInHits >= 1;
      break;
  }

  if (!aimMet) {
    return { paws: 1, next: 'aim' };
  }

  // Aim is met -> check clean conditions in order: reactive, pull, reactive marker, late, perfect
  if (payload.peakReactionTier === 'reactive') {
    return { paws: 2, next: 'reactive' };
  }
  if (payload.pullPercentage > CLEAN_MAX_PULL) {
    return { paws: 2, next: 'pull' };
  }
  if (payload.reactiveMarkers > 0) {
    return { paws: 2, next: 'reactive-marker' };
  }
  if ((payload.markGrades?.late ?? 0) > 0) {
    return { paws: 2, next: 'late' };
  }
  if ((aim === 'mark-disengagement' || aim === 'check-in') && (payload.markGrades?.perfect ?? 0) < 1) {
    return { paws: 2, next: 'perfect' };
  }

  return { paws: 3, next: null };
}
