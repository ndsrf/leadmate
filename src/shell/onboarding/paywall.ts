import type { DogRecord } from '../dogRecord';
import { nextStep } from './flow';

/**
 * Leaves the paywall screen. Both buttons come here: "Start trial" also records the start, "Maybe later" does not.
 * Plus features read the recorded start through `isPlus`; the first start is kept, so a trial never restarts.
 */
export function passPaywall(record: DogRecord, startTrial: boolean, now: Date): DogRecord {
  return {
    ...record,
    onboarding: {
      ...record.onboarding,
      trialStartedAt: startTrial && record.onboarding.trialStartedAt === null ? now.toISOString() : record.onboarding.trialStartedAt,
      step: nextStep('paywall'),
    },
  };
}
