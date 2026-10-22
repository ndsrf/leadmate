import { deleteRecording } from './audio';
import { newDogRecord, saveDogRecord, touch, type DogRecord, type KeyValueStore } from './dogRecord';
import { NEW_SYNC_STATE, saveSyncState } from './sync/state';

/**
 * Whether the Reset section should be rendered in Settings: only for a Dog with no cloud copy,
 * so never while signed in and never while the device is still paired with an account's Dog
 * (not even disabled). A paired Dog is detached by deleting the account.
 */
export function shouldShowResetSection(signedIn: boolean, paired: boolean = false): boolean {
  return !signedIn && !paired;
}

/**
 * Pure record part of reset: returns a brand-new Dog record in first-run state,
 * with an `updatedAt` strictly later than the old record so any downstream
 * comparison or reload recognizes the change.
 */
export function createResetRecord(oldRecord: DogRecord, now: Date = new Date()): DogRecord {
  const fresh = newDogRecord();
  // Ensure the timestamp is strictly later than oldRecord.updatedAt
  const previous = Date.parse(oldRecord.updatedAt);
  const stamp = Number.isNaN(previous) ? now.getTime() : Math.max(now.getTime(), previous + 1);
  return { ...fresh, updatedAt: new Date(stamp).toISOString() };
}

/**
 * Resets local progress for a signed-out Dog:
 * 1. Prepares a fresh first-run Dog record with a strictly newer `updatedAt`.
 * 2. Awaits persisting the fresh record, then clears the sync pairing and reminder state
 *    (`dogId: null`, `lastSyncedAt: null`, counters: 0).
 * 3. Deletes custom-cue audio recordings from device storage, after the saves succeeded.
 *
 * Keeps device UI settings (`leadmate.ui`), auth session and cached configs.
 */
export async function resetProgress(
  store: KeyValueStore,
  oldRecord: DogRecord,
  now: Date = new Date(),
  deleteRecordingFn: (uri: string) => void = deleteRecording,
): Promise<DogRecord> {
  // 1. Pure fresh record stamped strictly later than oldRecord.updatedAt
  const fresh = createResetRecord(oldRecord, now);

  // 2. Persist fresh record and detach sync pairing before touching any recording
  await saveDogRecord(store, fresh);
  await saveSyncState(store, { ...NEW_SYNC_STATE });

  // 3. Delete custom-cue recordings only once nothing references them any more
  for (const uri of Object.values(oldRecord.customCues)) {
    if (uri) deleteRecordingFn(uri);
  }

  return fresh;
}
