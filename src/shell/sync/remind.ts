import type { DogRecord } from '../dogRecord';
import { localDateString } from '../streak';
import type { SyncState } from './state';

export const REMIND_AFTER_STAGES = 3;
export const REMIND_AT_STREAK = 3;

/**
 * Whether to show the non-blocking registration reminder: the user is not signed in, has finished the funnel, has
 * completed a third Stage or reached a 3-day Streak, and was not reminded today.
 */
export function shouldRemind(record: DogRecord, sync: SyncState, signedIn: boolean, now: Date): boolean {
  if (signedIn || record.onboarding.step !== 'done') return false;
  if (sync.lastReminderDate === localDateString(now)) return false;
  return sync.stagesCompleted >= REMIND_AFTER_STAGES || record.streak.current >= REMIND_AT_STREAK;
}

export function markReminded(sync: SyncState, now: Date): SyncState {
  return { ...sync, lastReminderDate: localDateString(now) };
}

export function countStage(sync: SyncState): SyncState {
  return { ...sync, stagesCompleted: sync.stagesCompleted + 1 };
}
