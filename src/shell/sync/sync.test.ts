import { applyStage, migrateRecord, newDogRecord, touch, type DogRecord, type KeyValueStore } from '../dogRecord';
import { payloadWith } from '../testPayload';
import type { Remote, RemoteDog, RemoteUser } from './remote';
import { BACKUP_DAYS, cleanupBackup, loadBackup, NEW_SYNC_STATE, saveBackup, type SyncState } from './state';
import { applyChoice, finishChoice, migrateOnRegister, mustVerify, runSync, summarize } from './sync';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v), removeItem: async (k) => void data.delete(k) };
}

class FakeRemote implements Remote {
  dogs: RemoteDog[] = [];
  online = true;
  constructor(public me: RemoteUser | null = { id: 'u1', createdAt: '2026-05-01T08:00:00.000Z', emailVerified: true }) {}
  private guard() {
    if (!this.online) throw new Error('network');
  }
  async user() {
    this.guard();
    return this.me;
  }
  async fetchDogs() {
    this.guard();
    return this.dogs.map((d) => ({ ...d }));
  }
  async upsertDog(dog: RemoteDog) {
    this.guard();
    this.dogs = [...this.dogs.filter((d) => d.dogId !== dog.dogId), JSON.parse(JSON.stringify(dog))];
  }
}

function device(remote: Remote | null, record: DogRecord = newDogRecord(), state: SyncState = { ...NEW_SYNC_STATE }, now = new Date('2026-05-02T10:00:00Z')) {
  const d = { record, state, now, replaced: 0 };
  const run = () =>
    runSync({
      remote,
      getRecord: () => d.record,
      replaceRecord: (r) => {
        d.record = r;
        d.replaced++;
      },
      state: d.state,
      setState: (s) => (d.state = s),
      now: () => d.now,
    });
  return { d, run };
}

const played = (r: DogRecord, at: string, nodes: string[] = []) => touch({ ...applyStage(r, payloadWith({ followMarks: 3, markerHits: 1, markerAccuracyMs: 0, posteSuccesses: 1 }), new Date(at)), completedNodes: nodes }, new Date(at));

describe('runSync', () => {
  it('does nothing when no backend is configured', async () => {
    const { d, run } = device(null);
    expect((await run()).outcome).toBe('skipped');
    expect(d.state).toEqual(NEW_SYNC_STATE);
  });

  it('does nothing when signed out', async () => {
    expect((await device(new FakeRemote(null)).run()).outcome).toBe('signed-out');
  });

  it('uploads silently to a new account', async () => {
    const remote = new FakeRemote();
    const record = played(newDogRecord(), '2026-05-02T09:00:00Z', ['poste-practice']);
    const { d, run } = device(remote, record);
    expect((await run()).outcome).toBe('synced');
    expect(remote.dogs).toHaveLength(1);
    expect(migrateRecord(remote.dogs[0].record).completedNodes).toEqual(['poste-practice']);
    expect(d.state.dogId).toBe(remote.dogs[0].dogId);
    expect(d.record).toBe(record);
  });

  it('asks instead of merging when the account already has a Dog', async () => {
    const remote = new FakeRemote();
    remote.dogs = [{ dogId: 'cloud-dog', record: newDogRecord(), updatedAt: newDogRecord().updatedAt }];
    const local = played(newDogRecord(), '2026-05-02T09:00:00Z');
    const { d, run } = device(remote, local);
    const result = await run();
    expect(result.outcome).toBe('needs-choice');
    expect(result.remoteDogs).toHaveLength(1);
    expect(d.record).toBe(local);
    expect(remote.dogs[0].record).toEqual(newDogRecord());
    expect(migrateOnRegister(local, remote.dogs)).toBe('choose');
    expect(migrateOnRegister(local, [])).toBe('upload');
  });

  it('asks again when this device was paired with a Dog the account no longer has', async () => {
    const remote = new FakeRemote();
    remote.dogs = [{ dogId: 'other', record: newDogRecord(), updatedAt: newDogRecord().updatedAt }];
    const { run } = device(remote, newDogRecord(), { ...NEW_SYNC_STATE, dogId: 'gone' });
    expect((await run()).outcome).toBe('needs-choice');
  });

  it('leaves local state untouched when the network fails, and replicates at the next sync', async () => {
    const remote = new FakeRemote();
    const first = device(remote, played(newDogRecord(), '2026-05-02T09:00:00Z'));
    await first.run();
    const offline = played(first.d.record, '2026-05-03T09:00:00Z', ['a']);
    first.d.record = offline;
    remote.online = false;
    expect((await first.run()).outcome).toBe('offline');
    expect(first.d.record).toBe(offline);
    remote.online = true;
    expect((await first.run()).outcome).toBe('synced');
    expect(migrateRecord(remote.dogs[0].record).completedNodes).toEqual(['a']);
  });

  it('takes a newer cloud record, whole', async () => {
    const remote = new FakeRemote();
    const a = device(remote, played(newDogRecord(), '2026-05-02T09:00:00Z'));
    await a.run();
    const other = device(remote, a.d.record, { ...a.d.state });
    other.d.record = played(other.d.record, '2026-05-04T09:00:00Z', ['x']);
    await other.run();
    expect((await a.run()).outcome).toBe('synced');
    expect(a.d.record.attributes).toEqual(other.d.record.attributes);
    expect(a.d.record.completedNodes).toEqual(['x']);
  });

  it('combines two devices that each logged something and ends identical', async () => {
    const remote = new FakeRemote();
    const base = played(newDogRecord(), '2026-05-02T09:00:00Z');
    const a = device(remote, base);
    await a.run();
    const b = device(remote, base, { ...a.d.state });
    a.d.record = played(a.d.record, '2026-05-03T09:00:00Z', ['from-a']);
    b.d.record = played(b.d.record, '2026-05-04T09:00:00Z', ['from-b']);
    await a.run();
    await b.run();
    await a.run();
    expect([...a.d.record.completedNodes].sort()).toEqual(['from-a', 'from-b']);
    expect([...b.d.record.completedNodes].sort()).toEqual(['from-a', 'from-b']);
    expect(migrateRecord(remote.dogs[0].record)).toEqual(a.d.record);
  });

  it('does not stamp a new updatedAt on a record it only copies', async () => {
    const remote = new FakeRemote();
    const a = device(remote, played(newDogRecord(), '2026-05-02T09:00:00Z'));
    await a.run();
    const b = device(remote, newDogRecord(), { ...a.d.state });
    await b.run();
    expect(b.d.record.updatedAt).toBe(a.d.record.updatedAt);
    const replaced = b.d.replaced;
    await b.run();
    expect(b.d.replaced).toBe(replaced);
  });
});

describe('email verification grace', () => {
  const user = (emailVerified: boolean): RemoteUser => ({ id: 'u', createdAt: '2026-05-01T12:00:00Z', emailVerified });

  it('syncs on day 7 and pauses on day 8 when unverified', () => {
    expect(mustVerify(user(false), new Date('2026-05-08T12:00:00Z'))).toBe(false);
    expect(mustVerify(user(false), new Date('2026-05-09T12:00:00Z'))).toBe(true);
  });

  it('never pauses a verified account', () => {
    expect(mustVerify(user(true), new Date('2027-01-01T12:00:00Z'))).toBe(false);
  });

  it('pauses sync with paused: verify and leaves local play alone', async () => {
    const remote = new FakeRemote({ id: 'u', createdAt: '2026-05-01T12:00:00Z', emailVerified: false });
    const local = played(newDogRecord(), '2026-05-09T09:00:00Z');
    const { d, run } = device(remote, local, { ...NEW_SYNC_STATE }, new Date('2026-05-09T12:00:00Z'));
    expect((await run()).outcome).toBe('paused');
    expect(d.state.paused).toBe('verify');
    expect(d.record).toBe(local);
    expect(remote.dogs).toEqual([]);
  });

  it('resumes once the email is verified', async () => {
    const remote = new FakeRemote({ id: 'u', createdAt: '2026-05-01T12:00:00Z', emailVerified: false });
    const { d, run } = device(remote, newDogRecord(), { ...NEW_SYNC_STATE, paused: 'verify' }, new Date('2026-05-09T12:00:00Z'));
    await run();
    remote.me = { ...remote.me!, emailVerified: true };
    expect((await run()).outcome).toBe('synced');
    expect(d.state.paused).toBeNull();
  });
});

describe('choosing between two Dogs', () => {
  const local = played(newDogRecord(), '2026-05-02T09:00:00Z', ['a', 'b']);
  const cloudRecord = played(newDogRecord(), '2026-05-05T09:00:00Z', ['c']);
  const remoteDog: RemoteDog = { dogId: 'cloud-dog', record: cloudRecord, updatedAt: cloudRecord.updatedAt };
  const now = new Date('2026-05-06T10:00:00Z');

  it('summarizes each side', () => {
    expect(summarize(local)).toEqual({ streak: local.streak.current, nodes: 2 });
    expect(summarize(cloudRecord).nodes).toBe(1);
  });

  it('keeping the cloud Dog replaces the local one and backs it up', () => {
    const r = applyChoice('cloud', local, remoteDog, now);
    expect(r.record.completedNodes).toEqual(['c']);
    expect(r.backup).toBe(local);
    expect(r.backupFrom).toBe('local');
    expect(r.dogId).toBe('cloud-dog');
  });

  it('keeping the local Dog beats the cloud copy and backs the cloud one up', () => {
    const r = applyChoice('local', local, remoteDog, now);
    expect(Date.parse(r.record.updatedAt)).toBeGreaterThan(Date.parse(cloudRecord.updatedAt));
    expect(r.record.completedNodes).toEqual(['a', 'b']);
    expect(r.backup.completedNodes).toEqual(['c']);
  });

  it('after keeping local, the cloud Dog is overwritten and later syncs do not bring it back', async () => {
    const remote = new FakeRemote();
    remote.dogs = [remoteDog];
    const chosen = await finishChoice(remote, 'local', local, remoteDog, now);
    expect(migrateRecord(remote.dogs[0].record).completedNodes).toEqual(['a', 'b']);
    const { d, run } = device(remote, chosen.record, { ...NEW_SYNC_STATE, dogId: chosen.dogId }, now);
    await run();
    expect(migrateRecord(remote.dogs[0].record).completedNodes).toEqual(['a', 'b']);
    expect(d.record.completedNodes).toEqual(['a', 'b']);
  });

  it('after keeping the cloud Dog, nothing is pushed', async () => {
    const remote = new FakeRemote();
    remote.dogs = [remoteDog];
    const chosen = await finishChoice(remote, 'cloud', local, remoteDog, now);
    expect(remote.dogs[0].record).toBe(remoteDog.record);
    const { run } = device(remote, chosen.record, { ...NEW_SYNC_STATE, dogId: chosen.dogId }, now);
    await run();
    expect(migrateRecord(remote.dogs[0].record).completedNodes).toEqual(['c']);
  });

  it('keeps the discarded side for 30 days, then deletes it', async () => {
    const store = memoryStore();
    await saveBackup(store, local, 'local', now);
    expect((await loadBackup(store, new Date('2026-06-04T10:00:00Z')))?.record.completedNodes).toEqual(['a', 'b']);
    await cleanupBackup(store, new Date('2026-06-04T10:00:00Z'));
    expect(store.data.size).toBe(1);
    const after = new Date(now.getTime() + (BACKUP_DAYS + 1) * 86_400_000);
    expect(await loadBackup(store, after)).toBeNull();
    await cleanupBackup(store, after);
    expect(store.data.size).toBe(0);
  });
});
