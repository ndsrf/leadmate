import { applyDaySkip, type DogRecord } from './dogRecord';
import { passPaywall } from './onboarding/paywall';

/** Length of the Trial, counted from `onboarding.trialStartedAt`. */
export const TRIAL_DAYS = 7;
const DAY_MS = 86_400_000;

export type TrialState = 'unstarted' | 'active' | 'expired';

/**
 * Returns the trial lifecycle state:
 * - 'unstarted' if no trial start is recorded (or clock is prior to start)
 * - 'active' if within 7 days of start
 * - 'expired' if 7 days or more have elapsed
 */
export function trialState(record: Pick<DogRecord, 'onboarding'>, now: Date): TrialState {
  const start = record.onboarding.trialStartedAt;
  if (start === null) return 'unstarted';
  const from = Date.parse(start);
  if (Number.isNaN(from)) return 'unstarted';
  const nowMs = now.getTime();
  if (nowMs < from) return 'unstarted';
  if (nowMs >= from + TRIAL_DAYS * DAY_MS) return 'expired';
  return 'active';
}

/**
 * Integer days remaining in an active trial, from 1 to 7. Returns 0 if trial is not active.
 */
export function trialDaysRemaining(record: Pick<DogRecord, 'onboarding'>, now: Date): number {
  if (trialState(record, now) !== 'active') return 0;
  const from = Date.parse(record.onboarding.trialStartedAt!);
  const end = from + TRIAL_DAYS * DAY_MS;
  const remaining = Math.ceil((end - now.getTime()) / DAY_MS);
  return Math.max(1, Math.min(TRIAL_DAYS, remaining));
}

/**
 * Whether the user has LeadMate Plus at `now`: true if mockSubscribed is true or if
 * the Trial is active.
 */
export function isPlus(record: Pick<DogRecord, 'onboarding'>, now: Date): boolean {
  if (record.onboarding.mockSubscribed) return true;
  return trialState(record, now) === 'active';
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
export type PendingPlusAction =
  | { kind: 'skip'; missionId: string }
  | { kind: 'video'; lessonId: string; returnTo?: 'map' | 'library' }
  | { skipMission: string };

function applyPendingSkip(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  if (!pending) return record;
  if ('skipMission' in pending) {
    return applyDaySkip(record, pending.skipMission, now);
  }
  if (pending.kind === 'skip') {
    return applyDaySkip(record, pending.missionId, now);
  }
  return record;
}

/**
 * "Empezar prueba" on the paywall: the trial starts (only the first time ever), then the pending action is done if the
 * user is Plus now. A trial that already ended is not restarted, so the action is not done.
 */
export function startTrialThen(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  const after = passPaywall(record, true, now);
  if (!pending || !isPlus(after, now)) return after;
  return applyPendingSkip(after, pending, now);
}

/**
 * Activates mock subscription and immediately applies any pending action.
 */
export function subscribeThen(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  const after: DogRecord = {
    ...record,
    onboarding: {
      ...record.onboarding,
      mockSubscribed: true,
    },
  };
  return applyPendingSkip(after, pending, now);
}

export interface TrialRecapStats {
  videosWatched: number;
  skipsUsed: number;
}

/**
 * Pure helper deriving dog activity achievements during the trial:
 * count of read lessons containing at least one video block, and total mission day skips used.
 */
export function computeTrialRecap(
  record: Pick<DogRecord, 'readLessons' | 'activityLog'>,
  lessonList: readonly { id: string; blocks: readonly { type: string }[] }[],
): TrialRecapStats {
  const videoLessonIds = new Set(
    lessonList.filter((l) => l.blocks.some((b) => b.type === 'video')).map((l) => l.id),
  );
  const videosWatched = record.readLessons.filter((id) => videoLessonIds.has(id)).length;
  const skipsUsed = record.activityLog.filter((e) => e.kind === 'skip').length;
  return { videosWatched, skipsUsed };
}
