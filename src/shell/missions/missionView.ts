import type { DogRecord } from '../dogRecord';
import { homeMissionOfNode } from '../homeBehaviours';
import { isLastMissionOfWorld, isLastNodeOfStretch, missionOfStop, placeOf, stopStatus, WORLDS, type Progress, type WorldDef } from '../world';
import { canCheckIn, type MissionState } from './mission';

/**
 * Which screen a Mission opens on: the passed screen once passed (or grandfathered, so "Start mission" can never
 * un-grandfather it), its World 1 check if not started, its brief before "Start mission", the check-in once due, the wait otherwise.
 */
export type MissionEntry = 'check' | 'brief' | 'waiting' | 'checkin' | 'passed';

/** True for a Mission that belongs to World 1 (the Basics World). */
export function isWorldOneMission(missionId: string, worlds: readonly WorldDef[] = WORLDS): boolean {
  return placeOf({ kind: 'mission', id: missionId }, worlds)?.world.id === 'basics';
}

export function missionEntryView(state: MissionState | undefined, now: Date, grandfathered = false, isWorldOne = false): MissionEntry {
  if (state?.passedOn || grandfathered) return 'passed';
  if (!state?.startedAt) return isWorldOne ? 'check' : 'brief';
  return canCheckIn(state, now) ? 'checkin' : 'waiting';
}

/** The entry screen of a Mission Stop for the Dog's progress, a grandfathered Mission included. */
export function missionEntryOf(missionId: string, progress: Progress, now: Date, worlds: readonly WorldDef[] = WORLDS): MissionEntry {
  const grandfathered = !!stopStatus({ kind: 'mission', id: missionId }, progress, now, worlds).grandfathered;
  const isWorldOne = isWorldOneMission(missionId, worlds);
  return missionEntryView(progress.missions[missionId], now, grandfathered, isWorldOne);
}

/**
 * Whether "Saltar el día" is offered: the Mission is started and waiting for its check-in, not owed already, and not
 * its World's last Mission, and on the trail (a Home Stretch in Other Home Behaviours has no Day Skip). It says nothing about Plus; a free user sees it too and is sent to the paywall.
 */
export function canSkipDay(missionId: string, progress: Progress, now: Date, worlds: readonly WorldDef[] = WORLDS): boolean {
  if (!placeOf({ kind: 'mission', id: missionId }, worlds)) return false;
  return stopStatus({ kind: 'mission', id: missionId }, progress, now, worlds).state === 'waiting' && !isLastMissionOfWorld(missionId, worlds);
}

/**
 * The Mission whose brief opens when a Node's Debrief is closed: the Mission of the Stretch, when the Node is the
 * Stretch's last Node and the Mission has not been started or passed. Null means back to the map.
 */
export function missionAfterDebrief(nodeId: string, record: Progress, now: Date, worlds: readonly WorldDef[] = WORLDS): string | null {
  if (!isLastNodeOfStretch(nodeId, worlds)) return null;
  const missionId = missionOfStop({ kind: 'node', id: nodeId }, worlds);
  if (!missionId) return null;
  const status = stopStatus({ kind: 'mission', id: missionId }, record, now, worlds);
  return status.state === 'open' && !record.missions[missionId]?.startedAt ? missionId : null;
}

/** The Mission a Node's Debrief names in "Practise this for: «Mission»". */
export function missionForDebrief(nodeId: string, worlds: readonly WorldDef[] = WORLDS): string | undefined {
  return missionOfStop({ kind: 'node', id: nodeId }, worlds) ?? homeMissionOfNode(nodeId);
}

/** The Mission state on the record, or undefined before its brief is first used. */
export const missionState = (record: Pick<DogRecord, 'missions'>, id: string): MissionState | undefined => record.missions[id];
