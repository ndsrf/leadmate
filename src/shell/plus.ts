import { applyDaySkip, newDogRecord, type DogRecord } from './dogRecord';
import { diaryDays, isActiveDay } from './diary';
import { localDateString } from './streak';
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
 * Whether the user has LeadMate Plus at `now`: true if mockSubscribed is true, if
 * the Trial is active, or if an active billing entitlement is cached and unexpired.
 */
export function isPlus(record: Pick<DogRecord, 'onboarding'> & { billing?: DogRecord['billing'] }, now: Date): boolean {
  if (record.onboarding.mockSubscribed) return true;
  if (trialState(record, now) === 'active') return true;
  if (record.billing?.isSubscribed) {
    if (!record.billing.expiresAt) return true;
    const expiresMs = Date.parse(record.billing.expiresAt);
    if (Number.isNaN(expiresMs)) return true;
    return now.getTime() < expiresMs;
  }
  return false;
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
export function canStartTrial(record: Pick<DogRecord, 'onboarding'> & { billing?: DogRecord['billing'] }, now: Date): boolean {
  return record.onboarding.trialStartedAt === null || isPlus(record, now);
}

/** When the user stops being Plus: the end of a running trial or billing period; null for a free user. */
export function plusEndsAt(record: Pick<DogRecord, 'onboarding'> & { billing?: DogRecord['billing'] }, now: Date): Date | null {
  if (!isPlus(record, now)) return null;
  if (record.billing?.isSubscribed && record.billing.expiresAt) {
    const d = new Date(record.billing.expiresAt);
    if (!Number.isNaN(d.getTime())) return d;
  }
  if (record.onboarding.trialStartedAt) {
    return new Date(Date.parse(record.onboarding.trialStartedAt) + TRIAL_DAYS * DAY_MS);
  }
  return null;
}

/** Props bundle for video gating in Lesson and related views. */
export interface VideoGatingProps {
  isPlus?: boolean;
  trialState?: TrialState;
  onUnlock?: () => void;
  autoPlay?: boolean;
}

/** A Plus-only action a free user tapped, held while the paywall is open. */
export type PendingPlusAction =
  | { kind: 'skip'; missionId: string }
  | { kind: 'video'; lessonId: string; returnTo?: 'map' | 'library' }
  | { skipMission: string };

/** Extracts the mission id if this pending action is a day skip (supporting legacy untagged shape). */
export function pendingSkipMission(pending: PendingPlusAction | undefined): string | null {
  if (!pending) return null;
  if ('skipMission' in pending && typeof pending.skipMission === 'string') return pending.skipMission;
  if ('kind' in pending && pending.kind === 'skip') return pending.missionId;
  return null;
}

function applyPendingSkip(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  const missionId = pendingSkipMission(pending);
  return missionId ? applyDaySkip(record, missionId, now) : record;
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

/**
 * Resolves any pending Plus action (such as an owed Day Skip) after a subscription or trial activation.
 */
export function resolvePendingPlus(record: DogRecord, pending: PendingPlusAction | undefined, now: Date): DogRecord {
  return applyPendingSkip(record, pending, now);
}

/**
 * Updates the dog record with verified billing entitlement information.
 */
export function applyBillingSubscription(
  record: DogRecord,
  billingInfo: { isPlus: boolean; expiresAt: string | null; tier?: 'annual' | 'monthly' },
  now: Date,
): DogRecord {
  return {
    ...record,
    billing: {
      isSubscribed: billingInfo.isPlus,
      expiresAt: billingInfo.expiresAt,
      lastVerifiedAt: now.toISOString(),
      ...(billingInfo.tier ? { tier: billingInfo.tier } : {}),
    },
  };
}

export interface TrialRecapStats {
  activeStreakDays: number;
  videosWatched: number;
  skipsUsed: number;
}

/**
 * Pure helper deriving dog activity achievements during the trial:
 * active streak days maintained during the trial, count of read lessons containing at least one video block,
 * and total mission day skips used.
 */
export function computeTrialRecap(
  record: Pick<DogRecord, 'readLessons' | 'activityLog'> &
    Partial<Pick<DogRecord, 'walkDiary' | 'dailyBest' | 'dailyBarkdoku' | 'onboarding' | 'streak'>>,
  lessonList: readonly { id: string; blocks: readonly { type: string }[] }[],
): TrialRecapStats {
  const videoLessonIds = new Set(
    lessonList.filter((l) => l.blocks.some((b) => b.type === 'video')).map((l) => l.id),
  );
  const videosWatched = record.readLessons.filter((id) => videoLessonIds.has(id)).length;
  const skipsUsed = record.activityLog.filter((e) => e.kind === 'skip').length;

  let activeStreakDays = 0;
  if (record.onboarding?.trialStartedAt) {
    const trialStartMs = Date.parse(record.onboarding.trialStartedAt);
    if (!Number.isNaN(trialStartMs)) {
      const trialStartDate = localDateString(new Date(trialStartMs));
      const trialEndDate = localDateString(new Date(trialStartMs + TRIAL_DAYS * DAY_MS));
      const fullRecord: DogRecord = {
        ...newDogRecord(),
        ...record,
        onboarding: record.onboarding ?? newDogRecord().onboarding,
        activityLog: record.activityLog,
        readLessons: record.readLessons,
      };
      const days = diaryDays(fullRecord);
      activeStreakDays = days.filter(
        (d) => d.date >= trialStartDate && d.date <= trialEndDate && isActiveDay(d),
      ).length;
    }
  } else {
    activeStreakDays = record.streak?.current ?? 0;
  }

  return { activeStreakDays, videosWatched, skipsUsed };
}
