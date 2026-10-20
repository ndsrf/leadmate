import type { DogRecord, KeyValueStore } from '../dogRecord';

export const SYNC_KEY = 'leadmate.sync';
export const BACKUP_KEY = 'leadmate.backup';
export const BACKUP_DAYS = 30;

/** Device-only sync bookkeeping; it lives apart from the Dog record so it is never replicated. */
export interface SyncState {
  /** The account's Dog this device is paired with. */
  dogId: string | null;
  lastSyncedAt: string | null;
  /** Local date of the last registration reminder. */
  lastReminderDate: string | null;
  paused: 'verify' | null;
  /** Graded Stages finished on this device, for the registration reminder. */
  stagesCompleted: number;
}

export const NEW_SYNC_STATE: SyncState = { dogId: null, lastSyncedAt: null, lastReminderDate: null, paused: null, stagesCompleted: 0 };

const str = (v: unknown) => (typeof v === 'string' ? v : null);

export function readSyncState(raw: unknown): SyncState {
  if (!raw || typeof raw !== 'object') return { ...NEW_SYNC_STATE };
  const r = raw as Partial<Record<keyof SyncState, unknown>>;
  return { dogId: str(r.dogId), lastSyncedAt: str(r.lastSyncedAt), lastReminderDate: str(r.lastReminderDate), paused: r.paused === 'verify' ? 'verify' : null, stagesCompleted: typeof r.stagesCompleted === 'number' && r.stagesCompleted > 0 ? Math.floor(r.stagesCompleted) : 0 };
}

export async function loadSyncState(store: KeyValueStore): Promise<SyncState> {
  try {
    const raw = await store.getItem(SYNC_KEY);
    return raw ? readSyncState(JSON.parse(raw)) : { ...NEW_SYNC_STATE };
  } catch {
    return { ...NEW_SYNC_STATE };
  }
}

export async function saveSyncState(store: KeyValueStore, state: SyncState): Promise<void> {
  await store.setItem(SYNC_KEY, JSON.stringify(state));
}

/** The record the user did not keep when choosing between two Dogs, held for 30 days. */
export interface Backup {
  record: DogRecord;
  expiresAt: string;
  from: 'local' | 'cloud';
}

export async function saveBackup(store: KeyValueStore, record: DogRecord, from: Backup['from'], now: Date): Promise<void> {
  const expiresAt = new Date(now.getTime() + BACKUP_DAYS * 86_400_000).toISOString();
  await store.setItem(BACKUP_KEY, JSON.stringify({ record, expiresAt, from } satisfies Backup));
}

/** The backup if there is one and it has not expired. */
export async function loadBackup(store: KeyValueStore, now: Date): Promise<Backup | null> {
  try {
    const raw = await store.getItem(BACKUP_KEY);
    if (!raw) return null;
    const b = JSON.parse(raw) as Backup;
    return b && typeof b.expiresAt === 'string' && Date.parse(b.expiresAt) > now.getTime() ? b : null;
  } catch {
    return null;
  }
}

/** Run at app start: an expired backup is deleted. */
export async function cleanupBackup(store: KeyValueStore, now: Date): Promise<void> {
  const raw = await store.getItem(BACKUP_KEY);
  if (!raw || (await loadBackup(store, now))) return;
  if (store.removeItem) await store.removeItem(BACKUP_KEY);
  else await store.setItem(BACKUP_KEY, '');
}
