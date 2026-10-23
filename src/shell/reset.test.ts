jest.mock('expo-audio', () => ({}));
jest.mock('expo-file-system', () => ({}));
jest.mock('./audio', () => ({ deleteRecording: jest.fn() }));

import { loadDogRecord, newDogRecord, migrateRecord, touch, type DogRecord, type KeyValueStore } from './dogRecord';
import { createResetRecord, resetProgress, shouldShowResetSection } from './reset';
import { loadSyncState, SYNC_KEY, type SyncState } from './sync/state';
import { migrateOnRegister, runSync } from './sync/sync';
import type { Remote, RemoteDog, RemoteUser } from './sync/remote';

class FakeRemote implements Remote {
  dogs: RemoteDog[] = [];
  online = true;
  constructor(public me: RemoteUser | null = { id: 'u1', createdAt: '2026-05-01T08:00:00.000Z', emailVerified: true }) {}
  async user() {
    return this.me;
  }
  async fetchDogs() {
    return this.dogs.map((d) => ({ ...d }));
  }
  async upsertDog(dog: RemoteDog) {
    this.dogs = [...this.dogs.filter((d) => d.dogId !== dog.dogId), JSON.parse(JSON.stringify(dog))];
  }
}

function createMemoryStore(initial: Record<string, string> = {}): KeyValueStore & { storage: Record<string, string> } {
  const storage = { ...initial };
  return {
    storage,
    async getItem(key: string) {
      return storage[key] ?? null;
    },
    async setItem(key: string, value: string) {
      storage[key] = value;
    },
    async removeItem(key: string) {
      delete storage[key];
    },
  };
}

describe('resetProgress failure', () => {
  it('restores the old record when detaching the sync state fails', async () => {
    const storage: Record<string, string> = {};
    const store: KeyValueStore = {
      async getItem(k) {
        return storage[k] ?? null;
      },
      async setItem(k, v) {
        if (k === SYNC_KEY) throw new Error('disk full');
        storage[k] = v;
      },
      async removeItem(k) {
        delete storage[k];
      },
    };
    const old = { ...newDogRecord(), name: 'Luna', updatedAt: '2026-06-15T10:00:00.000Z' };
    storage['leadmate.dog'] = JSON.stringify(old);
    await expect(resetProgress(store, old, new Date('2026-06-16T12:00:00.000Z'), jest.fn())).rejects.toThrow('disk full');
    expect(JSON.parse(storage['leadmate.dog']).name).toBe('Luna');
  });
});

describe('resetProgress', () => {
  const oldDate = new Date('2026-06-15T10:00:00.000Z');
  const now = new Date('2026-06-16T12:00:00.000Z');

  const populatedRecord: DogRecord = {
    version: 6,
    attributes: { reconnectionLatency: 0.8, reactivityThreshold: 0.7, followChance: 0.9, checkInFrequency: 0.8 },
    triggerProfile: { dog: 2, child: 1, bicycle: 0, skateboard: 3, food: 1, other: 0 },
    calmCounts: { dog: 4 },
    equipment: 'harness',
    name: 'Luna',
    coat: 'black',
    breed: 'collie',
    voicePack: 'spark',
    checkpointSeconds: 10,
    completedNodes: ['doorbell-mat', 'heel-turns'],
    stars: { 'doorbell-mat': 3, 'heel-turns': 2 },
    lastStageDate: '2026-06-15T09:30:00.000Z',
    posteFailures: 1,
    posture: 2,
    customCues: { es: 'file:///data/cues/cue.es.m4a', en: 'file:///data/cues/cue.en.m4a' },
    walkDiary: [{ date: '2026-06-15', nodeId: 'doorbell-mat', outcome: 'completed' }],
    streak: { current: 5, best: 10, lastActiveDate: '2026-06-15' },
    dailyBest: { '2026-06-15': 850 },
    updatedAt: oldDate.toISOString(),
    weights: { dogKg: 20, handlerKg: 75 },
    onboarding: {
      step: 'done',
      firstStageCompletedAt: '2026-06-01T10:00:00.000Z',
      trialStartedAt: '2026-06-01T10:05:00.000Z',
      diagnosticLatency: 0.42,
      plan: ['heel-turns'],
    },
    seenHints: ['taut', 'rigid'],
  };

  it('createResetRecord produces first-run state with strictly later updatedAt', () => {
    const reset = createResetRecord(populatedRecord, now);

    expect(reset.onboarding.step).toBe('welcome');
    expect(reset.name).toBe('');
    expect(reset.coat).toBe('golden');
    expect(reset.breed).toBe('mestizo');
    expect(reset.onboarding.firstStageCompletedAt).toBeNull();
    expect(reset.onboarding.trialStartedAt).toBeNull();
    expect(reset.onboarding.plan).toEqual([]);
    expect(reset.streak.current).toBe(0);
    expect(reset.completedNodes).toEqual([]);
    expect(reset.stars).toEqual({});
    expect(reset.walkDiary).toEqual([]);
    expect(reset.dailyBest).toEqual({});
    expect(reset.customCues).toEqual({});
    expect(reset.seenHints).toEqual([]);

    expect(Date.parse(reset.updatedAt)).toBeGreaterThan(Date.parse(populatedRecord.updatedAt));
  });

  it('createResetRecord enforces strictly later updatedAt even if clock is slightly behind', () => {
    // If system clock is earlier than or equal to oldRecord.updatedAt
    const behindTime = new Date('2026-06-15T09:00:00.000Z');
    const reset = createResetRecord(populatedRecord, behindTime);
    expect(Date.parse(reset.updatedAt)).toBe(Date.parse(populatedRecord.updatedAt) + 1);
  });

  it('resetProgress deletes custom-cue recordings, clears pairing, and keeps UI/auth/config keys', async () => {
    const deletedUris: string[] = [];
    const deleteFn = (uri: string) => {
      deletedUris.push(uri);
    };

    const store = createMemoryStore({
      'leadmate.dog': JSON.stringify(populatedRecord),
      'leadmate.sync': JSON.stringify({
        dogId: 'cloud-dog-123',
        lastSyncedAt: '2026-06-15T10:00:00.000Z',
        lastReminderDate: '2026-06-15',
        paused: 'verify',
        stagesCompleted: 8,
      }),
      'leadmate.ui': JSON.stringify({ sounds: false, haptics: true }),
      'sb-auth-token': JSON.stringify({ access_token: 'xyz', user: { id: 'u1' } }),
      'leadmate.configs': JSON.stringify({ 'node-1': { id: 'node-1' } }),
    });

    const fresh = await resetProgress(store, populatedRecord, now, deleteFn);

    // 1. Custom cues removed
    expect(deletedUris).toEqual(['file:///data/cues/cue.es.m4a', 'file:///data/cues/cue.en.m4a']);

    // 2. Fresh record returned
    expect(fresh.onboarding.step).toBe('welcome');
    expect(Date.parse(fresh.updatedAt)).toBeGreaterThan(Date.parse(populatedRecord.updatedAt));

    // 3. UI settings, auth session, config cache keys are untouched
    expect(store.storage['leadmate.ui']).toBe(JSON.stringify({ sounds: false, haptics: true }));
    expect(store.storage['sb-auth-token']).toBe(JSON.stringify({ access_token: 'xyz', user: { id: 'u1' } }));
    expect(store.storage['leadmate.configs']).toBe(JSON.stringify({ 'node-1': { id: 'node-1' } }));

    // 4. Sync pairing is cleared
    const sync = await loadSyncState(store);
    expect(sync.dogId).toBeNull();
    expect(sync.lastSyncedAt).toBeNull();
    expect(sync.lastReminderDate).toBeNull();
    expect(sync.stagesCompleted).toBe(0);
    expect(sync.paused).toBeNull();

    // 5. Survives reload (store round trip)
    const loadedDog = await loadDogRecord(store);
    expect(loadedDog.onboarding.step).toBe('welcome');
    expect(loadedDog.completedNodes).toEqual([]);
    expect(loadedDog.streak.current).toBe(0);
    expect(loadedDog.updatedAt).toBe(fresh.updatedAt);
  });

  it('section hidden when signed in (and disappears on sign-in)', () => {
    // When signed out: section is shown
    expect(shouldShowResetSection(false)).toBe(true);

    // When signed in: section is hidden
    expect(shouldShowResetSection(true)).toBe(false);
  });

  it('section hidden while the device is paired with a cloud Dog, even when signed out', () => {
    expect(shouldShowResetSection(false, true)).toBe(false);
    expect(shouldShowResetSection(false, false)).toBe(true);
  });

  it('after a reset, logging in to an account with a Dog takes that Dog, and registering uploads only the reset Dog', async () => {
    const store = createMemoryStore({
      'leadmate.dog': JSON.stringify(populatedRecord),
      'leadmate.sync': JSON.stringify({
        dogId: 'old-cloud-dog',
        lastSyncedAt: '2026-06-15T10:00:00.000Z',
        lastReminderDate: '2026-06-15',
        paused: null,
        stagesCompleted: 5,
      }),
    });

    // 1. Reset progress
    const freshRecord = await resetProgress(store, populatedRecord, now, () => {});
    let currentSyncState: SyncState = await loadSyncState(store);
    expect(currentSyncState.dogId).toBeNull();

    // 2. Logging in to an existing account with a Dog
    const existingCloudRemote = new FakeRemote();
    const existingCloudDog: RemoteDog = {
      dogId: 'cloud-existing-dog',
      record: populatedRecord,
      updatedAt: populatedRecord.updatedAt,
    };
    existingCloudRemote.dogs = [existingCloudDog];

    expect(migrateOnRegister(freshRecord, existingCloudRemote.dogs)).toBe('choose');

    // the reset Dog is still at the welcome screen: nothing on the device is worth keeping
    let localRecord: DogRecord = freshRecord;
    const loginSyncResult = await runSync({
      remote: existingCloudRemote,
      getRecord: () => localRecord,
      replaceRecord: (r) => {
        localRecord = r;
      },
      state: currentSyncState,
      setState: (s) => {
        currentSyncState = s;
      },
      now: () => now,
    });

    expect(loginSyncResult.outcome).toBe('synced');
    expect(localRecord.completedNodes).toEqual(populatedRecord.completedNodes);
    expect(currentSyncState.dogId).toBe('cloud-existing-dog');

    // once the user has gone past the welcome screen the device Dog is worth keeping, so login asks
    const begunRecord: DogRecord = { ...freshRecord, onboarding: { ...freshRecord.onboarding, step: 'dog' } };
    const asked = await runSync({
      remote: existingCloudRemote,
      getRecord: () => begunRecord,
      replaceRecord: () => {},
      state: { ...currentSyncState, dogId: null },
      setState: () => {},
      now: () => now,
    });
    expect(asked.outcome).toBe('needs-choice');
    expect(asked.remoteDogs).toHaveLength(1);

    // 3. Registering a brand-new account (no dogs yet) uploads only the reset Dog
    const newAccountRemote = new FakeRemote();
    expect(migrateOnRegister(freshRecord, newAccountRemote.dogs)).toBe('upload');

    let newAccountSyncState: SyncState = { ...currentSyncState };
    let newAccountRecord = freshRecord;
    const registerSyncResult = await runSync({
      remote: newAccountRemote,
      getRecord: () => newAccountRecord,
      replaceRecord: (r) => {
        newAccountRecord = r;
      },
      state: newAccountSyncState,
      setState: (s) => {
        newAccountSyncState = s;
      },
      now: () => now,
    });

    expect(registerSyncResult.outcome).toBe('synced');
    expect(newAccountRemote.dogs).toHaveLength(1);
    const uploadedRecord = migrateRecord(newAccountRemote.dogs[0].record);
    expect(uploadedRecord.onboarding.step).toBe('welcome');
    expect(uploadedRecord.completedNodes).toEqual([]);
    expect(uploadedRecord.streak.current).toBe(0);
    expect(newAccountSyncState.dogId).toBe(newAccountRemote.dogs[0].dogId);
  });
});
