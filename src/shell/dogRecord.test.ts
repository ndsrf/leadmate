import { DEFAULT_ATTRIBUTES } from '../sim/learning';
import { applyActivity, applyDiary, applyStage, failedPoste, touch, loadDogRecord, migrateRecord, newDogRecord, RECORD_KEY, recordDailyScore, saveDogRecord, setTriggerLevel, toSnapshot, type KeyValueStore } from './dogRecord';
import { payloadWith } from './testPayload';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
}

describe('Dog record', () => {
  it('survives an app restart', async () => {
    const store = memoryStore();
    const played = applyStage(newDogRecord(), payloadWith({ markerHits: 1, markerAccuracyMs: 100, posteSuccesses: 1, followMarks: 2 }), new Date('2026-05-01T10:00:00Z'));
    await saveDogRecord(store, { ...played, equipment: 'harness', voicePack: 'other', completedNodes: ['poste-practice'], customCues: { es: 'file:///cue.m4a' } });
    // a new session reads the same store
    const reopened = await loadDogRecord(store);
    expect(reopened.attributes).toEqual(played.attributes);
    expect(reopened.equipment).toBe('harness');
    expect(reopened.completedNodes).toEqual(['poste-practice']);
    expect(reopened.customCues).toEqual({ es: 'file:///cue.m4a' });
    expect(reopened.lastStageDate).toBe('2026-05-01T10:00:00.000Z');
  });

  it('starts from defaults when nothing or garbage is stored', async () => {
    const store = memoryStore();
    expect((await loadDogRecord(store)).attributes).toEqual(DEFAULT_ATTRIBUTES);
    store.data.set(RECORD_KEY, '{not json');
    expect((await loadDogRecord(store)).attributes).toEqual(DEFAULT_ATTRIBUTES);
  });

  it('is versioned and repairs unreadable fields', () => {
    const fixed = migrateRecord({ attributes: { followChance: 7, reactivityThreshold: 'x' }, triggerProfile: { child: 9, dog: 1 }, equipment: 'rope' });
    expect(fixed.version).toBe(3);
    expect(fixed.attributes.followChance).toBe(1);
    expect(fixed.attributes.reactivityThreshold).toBe(DEFAULT_ATTRIBUTES.reactivityThreshold);
    expect(fixed.triggerProfile.child).toBe(2);
    expect(fixed.triggerProfile.dog).toBe(1);
    expect(fixed.equipment).toBe('collar');
  });

  it('changes nothing because days passed', async () => {
    const store = memoryStore();
    const old = applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, peakArousalScore: 30 }), new Date('2026-01-01T00:00:00Z'));
    await saveDogRecord(store, old);
    const later = await loadDogRecord(store); // reading months later is all that happens
    expect(later).toEqual(old);
  });

  it('builds a snapshot without sharing mutable state', () => {
    const record = newDogRecord();
    const snap = toSnapshot(record, 0.8);
    snap.attributes.followChance = 0;
    expect(record.attributes.followChance).toBe(DEFAULT_ATTRIBUTES.followChance);
    expect(snap.capacityMultiplier).toBe(0.8);
  });

  it('applies a graded Stage to attributes, posture and date', () => {
    const next = applyStage(newDogRecord(), payloadWith({ followMarks: 4, checkInHits: 4, markerHits: 1, markerAccuracyMs: 0, posteSuccesses: 1 }), new Date('2026-03-03T00:00:00Z'));
    expect(next.attributes.followChance).toBeGreaterThan(DEFAULT_ATTRIBUTES.followChance);
    expect(next.lastStageDate).toBe('2026-03-03T00:00:00.000Z');
  });

  it('counts Poste failures in a row and resets them on a success', () => {
    const failed = payloadWith({ missedOpportunities: 1 });
    expect(failedPoste(failed)).toBe(true);
    let r = applyStage(newDogRecord(), failed, new Date());
    r = applyStage(r, failed, new Date());
    expect(r.posteFailures).toBe(2);
    r = applyStage(r, payloadWith({ posteSuccesses: 1 }), new Date());
    expect(r.posteFailures).toBe(0);
  });

  it('lets the user edit a Trigger Profile level for the next Stage', () => {
    const r = setTriggerLevel(newDogRecord(), 'dog', 3);
    expect(toSnapshot(r).triggerProfile.dog).toBe(3);
  });
});

describe('Dog record: Walk Diary, Streak and Daily best', () => {
  const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);

  it('starts with an empty diary, no Streak and no Daily scores', () => {
    const r = newDogRecord();
    expect(r.walkDiary).toEqual([]);
    expect(r.streak).toEqual({ current: 0, best: 0, lastActiveDate: '' });
    expect(r.dailyBest).toEqual({});
  });

  it('migrates a version 1 record: keeps what it had and adds the new fields', () => {
    const v1 = { version: 1, attributes: { followChance: 0.9 }, completedNodes: ['poste-practice'], equipment: 'harness', posture: 1 };
    const r = migrateRecord(v1);
    expect(r.version).toBe(3);
    expect(r.attributes.followChance).toBeCloseTo(0.9);
    expect(r.completedNodes).toEqual(['poste-practice']);
    expect(r.equipment).toBe('harness');
    expect(r.posture).toBe(1);
    expect(r.walkDiary).toEqual([]);
    expect(r.streak.current).toBe(0);
    expect(r.dailyBest).toEqual({});
  });

  it('drops unreadable diary entries, Streak values and Daily scores', () => {
    const r = migrateRecord({
      walkDiary: [{ date: '2026-05-01', nodeId: 'a', outcome: 'completed' }, { date: 'x', nodeId: 'a', outcome: 'completed' }, { date: '2026-05-01', nodeId: 'a', outcome: 'meh' }, 7],
      streak: { current: 'many', best: 4, lastActiveDate: 'soon' },
      dailyBest: { '2026-05-01': 640.4, today: 5, '2026-05-02': 'high', '2026-05-03': 5000 },
    });
    expect(r.walkDiary).toHaveLength(1);
    expect(r.streak).toEqual({ current: 0, best: 4, lastActiveDate: '' });
    expect(r.dailyBest).toEqual({ '2026-05-01': 640, '2026-05-03': 1000 });
  });

  it('persists the diary, the Streak and the Daily best across a restart', async () => {
    const store = memoryStore();
    let r = applyDiary(newDogRecord(), 'walk-distraction', 'struggled', noon(2026, 5, 1));
    r = recordDailyScore(r, '2026-05-01', 712).record;
    await saveDogRecord(store, r);
    const reopened = await loadDogRecord(store);
    expect(reopened.walkDiary).toEqual([{ date: '2026-05-01', nodeId: 'walk-distraction', outcome: 'struggled' }]);
    expect(reopened.streak).toEqual({ current: 1, best: 1, lastActiveDate: '2026-05-01' });
    expect(reopened.dailyBest).toEqual({ '2026-05-01': 712 });
  });

  it('logs a diary entry with its date and Node and marks the day active', () => {
    const r = applyDiary(newDogRecord(), 'poste-practice', 'completed', noon(2026, 5, 1));
    expect(r.walkDiary).toEqual([{ date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' }]);
    expect(r.streak.current).toBe(1);
  });

  it('never changes the Learning Attributes, Trigger Profile or posture, even after a long gap', () => {
    const base = applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 3, markerHits: 1, markerAccuracyMs: 50 }), noon(2026, 1, 1));
    const later = applyDiary(applyActivity(applyDiary(base, 'a', 'skipped', noon(2026, 1, 2)), noon(2026, 3, 1)), 'a', 'completed', noon(2026, 6, 1));
    expect(later.streak.current).toBe(1); // reset after the gaps
    expect(later.attributes).toEqual(base.attributes);
    expect(later.triggerProfile).toEqual(base.triggerProfile);
    expect(later.posture).toBe(base.posture);
    expect(later.calmCounts).toEqual(base.calmCounts);
  });

  it('keeps the best Daily score of each date through unlimited replays', () => {
    let r = newDogRecord();
    const first = recordDailyScore(r, '2026-05-01', 500);
    expect(first).toMatchObject({ firstOfDay: true, improved: true, best: 500 });
    r = first.record;
    const worse = recordDailyScore(r, '2026-05-01', 420);
    expect(worse).toMatchObject({ firstOfDay: false, improved: false, best: 500 });
    expect(worse.record).toBe(r);
    const better = recordDailyScore(r, '2026-05-01', 801);
    expect(better).toMatchObject({ firstOfDay: false, improved: true, best: 801 });
    r = better.record;
    for (let i = 0; i < 20; i++) r = recordDailyScore(r, '2026-05-01', 100 + i).record;
    expect(r.dailyBest['2026-05-01']).toBe(801);
    expect(recordDailyScore(r, '2026-05-02', 300).record.dailyBest).toEqual({ '2026-05-01': 801, '2026-05-02': 300 });
  });

  it('clamps scores to 0-1000', () => {
    expect(recordDailyScore(newDogRecord(), '2026-05-01', 1500).best).toBe(1000);
    expect(recordDailyScore(newDogRecord(), '2026-05-01', -5).best).toBe(0);
  });
});

describe('Dog record: version 3', () => {
  it('starts a new Dog at the first setup step with no weights', () => {
    const r = newDogRecord();
    expect(r.onboarding).toEqual({ step: 'setup', firstStageCompletedAt: null, trialStartedAt: null, diagnosticLatency: null, plan: [] });
    expect(r.weights).toEqual({ dogKg: null, handlerKg: null });
    expect(r.seenHints).toEqual([]);
  });

  it('migrates a version 2 record as an existing user who has finished onboarding', () => {
    const v2 = { version: 2, attributes: { followChance: 0.9 }, completedNodes: ['poste-practice'], streak: { current: 2, best: 3, lastActiveDate: '2026-05-01' } };
    const r = migrateRecord(v2);
    expect(r.version).toBe(3);
    expect(r.onboarding.step).toBe('done');
    expect(r.weights).toEqual({ dogKg: null, handlerKg: null });
    expect(r.seenHints).toEqual([]);
    expect(r.completedNodes).toEqual(['poste-practice']);
    expect(r.streak.best).toBe(3);
  });

  it('loads nothing or unreadable input as a new Dog', async () => {
    const store = memoryStore();
    expect((await loadDogRecord(store)).onboarding.step).toBe('setup');
    store.data.set(RECORD_KEY, '{not json');
    expect((await loadDogRecord(store)).onboarding.step).toBe('setup');
    expect(migrateRecord(42).onboarding.step).toBe('setup');
  });

  it('repairs unreadable onboarding, weight and hint fields', () => {
    const r = migrateRecord({ onboarding: { step: 'nope', trialStartedAt: 5, diagnosticLatency: 'fast', plan: ['a', 3] }, weights: { dogKg: -3, handlerKg: 70 }, seenHints: ['marker', 9], updatedAt: 'later' });
    expect(r.onboarding).toEqual({ step: 'setup', firstStageCompletedAt: null, trialStartedAt: null, diagnosticLatency: null, plan: ['a'] });
    expect(r.weights).toEqual({ dogKg: null, handlerKg: 70 });
    expect(r.seenHints).toEqual(['marker']);
    expect(r.updatedAt).toBe(new Date(0).toISOString());
  });

  it('keeps the onboarding state across a restart', async () => {
    const store = memoryStore();
    const r = { ...newDogRecord(), weights: { dogKg: 20, handlerKg: 70 }, onboarding: { ...newDogRecord().onboarding, step: 'diagnostic' as const }, updatedAt: '2026-05-01T10:00:00.000Z' };
    await saveDogRecord(store, r);
    expect(await loadDogRecord(store)).toEqual(r);
  });

  it('advances updatedAt on every touch, even within the same millisecond', () => {
    const t = new Date('2026-05-01T10:00:00.000Z');
    const a = touch(newDogRecord(), t);
    const b = touch(a, t);
    const c = touch(b, new Date('2026-05-01T09:00:00.000Z'));
    expect(a.updatedAt).toBe(t.toISOString());
    expect(Date.parse(b.updatedAt)).toBeGreaterThan(Date.parse(a.updatedAt));
    expect(Date.parse(c.updatedAt)).toBeGreaterThan(Date.parse(b.updatedAt));
  });
});
