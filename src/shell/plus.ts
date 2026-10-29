import { applyDaySkip, type DogRecord } from './dogRecord';
import { passPaywall } from './onboarding/paywall';

/** Length of the free trial, counted from `onboarding.trialStartedAt`. */
export const TRIAL_DAYS = 7;
const DAY_MS = 86_400_000;

/**
 * Whether the user has LeadMate Plus at `now`: for now, while the free trial is active. A clock earlier than the
 * recorded start counts as not Plus. Every Plus feature asks here, so real billing only replaces this body.
 */
export function isPlus(record: Pick<DogRecord, 'onboarding'>, now: Date): boolean {
  const start = record.onboarding.trialStartedAt;
  if (start === null) return false;
  const from = Date.parse(start);
  if (Number.isNaN(from)) return false;
  return now.getTime() >= from && now.getTime() < from + TRIAL_DAYS * DAY_MS;
}

/**
 * The Dog's progress as the trail gates it at `now`: the record with whether the user is Plus. Every check of the
 * trail (map, Stop locks, Mission entry, celebrations) reads progress through this, so a Plus World opens for all of
 * them at once and closes for all of them when the trial ends.
 */
export function progressAt<R extends DogRecord>(record: R, now: Date): R & { plus: boolean } {
  return { ...record, plus: isPlus(record, now) };
}

/** Whether "Empezar prueba" would make the user Plus at `now`: no trial yet, or one still running. */
export function canStartTrial(record: Pick<DogRecord, 'onboarding'>, now: Date): boolean {
  return record.onboarding.trialStartedAt === null || isPlus(record, now);
}

/** When the user stops being Plus: the end of a running trial; null for a free user. */
export function plusEndsAt(record: Pick<DogRecord, 'onboarding'>, now: Date): Date | null {
  return isPlus(record, now) ? new Date(Date.parse(record.onboarding.trialStartedAt!) + TRIAL_DAYS * DAY_MS) : null;
}

/** A Plus-only action a free user tapped, held while the paywall is open. */
export interface PendingPlusAction {
  skipMission: string;
}

/**
 * "Empezar prueba" on the paywall: the trial starts (only the first time ever), then the pending action is done if the
 * user is Plus now. A trial that already ended is not restarted, so the action is not done.
 */
export function startTrialThen(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  const after = passPaywall(record, true, now);
  return pending && isPlus(after, now) ? applyDaySkip(after, pending.skipMission, now) : after;
}
