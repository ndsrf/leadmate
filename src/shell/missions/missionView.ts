import type { DogRecord } from '../dogRecord';
import { isLastMissionOfWorld, isLastNodeOfStretch, missionOfStop, stopStatus, type Progress } from '../world';
import { canCheckIn, type MissionState } from './mission';

/**
 * Which screen a Mission opens on: the passed screen once passed (or grandfathered, so "Start mission" can never
 * un-grandfather it), its brief before "Start mission", the check-in once due, the wait otherwise.
 */
export type MissionEntry = 'brief' | 'waiting' | 'checkin' | 'passed';

export function missionEntryView(state: MissionState | undefined, now: Date, grandfathered = false): MissionEntry {
  if (state?.passedOn || grandfathered) return 'passed';
  if (!state?.startedAt) return 'brief';
  return canCheckIn(state, now) ? 'checkin' : 'waiting';
}

/** The entry screen of a Mission Stop for the Dog's progress, a grandfathered Mission included. */
export function missionEntryOf(missionId: string, progress: Progress, now: Date): MissionEntry {
  const grandfathered = !!stopStatus({ kind: 'mission', id: missionId }, progress, now).grandfathered;
  return missionEntryView(progress.missions[missionId], now, grandfathered);
}

/**
 * Whether "Saltar el día" is offered: the Mission is started and waiting for its check-in, not owed already, and not
 * its World's last Mission. It says nothing about Plus; a free user sees it too and is sent to the paywall.
 */
export function canSkipDay(missionId: string, progress: Progress, now: Date): boolean {
  return stopStatus({ kind: 'mission', id: missionId }, progress, now).state === 'waiting' && !isLastMissionOfWorld(missionId);
}

/**
 * The Mission whose brief opens when a Node's Debrief is closed: the Mission of the Stretch, when the Node is the
 * Stretch's last Node and the Mission has not been started or passed. Null means back to the map.
 */
export function missionAfterDebrief(nodeId: string, record: Progress, now: Date): string | null {
  if (!isLastNodeOfStretch(nodeId)) return null;
  const missionId = missionOfStop({ kind: 'node', id: nodeId });
  if (!missionId) return null;
  const status = stopStatus({ kind: 'mission', id: missionId }, record, now);
  return status.state === 'open' && !record.missions[missionId]?.startedAt ? missionId : null;
}

/** The Mission a Node's Debrief names in "Practise this for: «Mission»". */
export function missionForDebrief(nodeId: string): string | undefined {
  return missionOfStop({ kind: 'node', id: nodeId });
}

/** The Mission state on the record, or undefined before its brief is first used. */
export const missionState = (record: Pick<DogRecord, 'missions'>, id: string): MissionState | undefined => record.missions[id];
