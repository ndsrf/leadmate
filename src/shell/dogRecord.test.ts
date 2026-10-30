import { DEFAULT_ATTRIBUTES } from '../sim/learning';
import { applyActivity, applyDaySkip, applyMissionCheckIn, updateMission, applyStage, failedPoste, touch, loadDogRecord, mergeLegacyNodes, migrateRecord, newDogRecord, RECORD_KEY, recordDailyBarkdoku, recordDailyScore, saveDogRecord, setTriggerLevel, toSnapshot, type KeyValueStore } from './dogRecord';
import { payloadWith } from './testPayload';
import { lookOf } from './onboarding/look';
import { advance, onDebrief, startNode, type NodeRun } from './nodes/node';
import { DOORBELL_MAT_NODE, POSTE_PRACTICE, WALK_DISTRACTION } from './nodes/content';
import { startMission } from './missions/mission';
import { TEST_MISSION } from './missions/testMission';

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
    expect(fixed.version).toBe(7);
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
    expect(r.version).toBe(7);
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
    let r = updateMission(newDogRecord(), TEST_MISSION.id, (s) => startMission(s, noon(2026, 4, 30)));
    r = applyMissionCheckIn(r, TEST_MISSION, 'struggled', 'excited', noon(2026, 5, 1));
    r = recordDailyScore(r, '2026-05-01', 712).record;
    await saveDogRecord(store, r);
    const reopened = await loadDogRecord(store);
    expect(reopened.walkDiary).toEqual([{ date: '2026-05-01', missionId: TEST_MISSION.id, outcome: 'struggled', problemId: 'excited' }]);
    expect(reopened.streak).toEqual({ current: 1, best: 1, lastActiveDate: '2026-05-01' });
    expect(reopened.dailyBest).toEqual({ '2026-05-01': 712 });
  });

  it('never changes the Learning Attributes, Trigger Profile or posture, even after a long gap', () => {
    const base = applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 3, markerHits: 1, markerAccuracyMs: 50 }), noon(2026, 1, 1));
    const started = updateMission(base, TEST_MISSION.id, (s) => startMission(s, noon(2026, 1, 1)));
    const skipped = applyMissionCheckIn(started, TEST_MISSION, 'skipped', undefined, noon(2026, 1, 2));
    const later = applyMissionCheckIn(applyActivity(skipped, noon(2026, 3, 1)), TEST_MISSION, 'completed', undefined, noon(2026, 6, 1));
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
  it('starts a new Dog at the welcome step with no weights', () => {
    const r = newDogRecord();
    expect(r.onboarding).toEqual({ step: 'welcome', firstStageCompletedAt: null, trialStartedAt: null, diagnosticLatency: null, plan: [] });
    expect(r.weights).toEqual({ dogKg: null, handlerKg: null });
    expect(r.seenHints).toEqual([]);
  });

  it('migrates a version 2 record as an existing user who has finished onboarding', () => {
    const v2 = { version: 2, attributes: { followChance: 0.9 }, completedNodes: ['poste-practice'], streak: { current: 2, best: 3, lastActiveDate: '2026-05-01' } };
    const r = migrateRecord(v2);
    expect(r.version).toBe(7);
    expect(r.onboarding.step).toBe('done');
    expect(r.weights).toEqual({ dogKg: null, handlerKg: null });
    expect(r.seenHints).toEqual([]);
    expect(r.completedNodes).toEqual(['poste-practice']);
    expect(r.streak.best).toBe(3);
  });

  it('loads nothing or unreadable input as a new Dog', async () => {
    const store = memoryStore();
    expect((await loadDogRecord(store)).onboarding.step).toBe('welcome');
    store.data.set(RECORD_KEY, '{not json');
    expect((await loadDogRecord(store)).onboarding.step).toBe('welcome');
    expect(migrateRecord(42).onboarding.step).toBe('welcome');
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

describe('stars on the record', () => {
  const debrief = (record: ReturnType<typeof newDogRecord>, score: number) => {
    const run: NodeRun = { ...startNode(WALK_DISTRACTION), step: 'simulation' };
    const done = advance(run, { type: 'finish', result: { kind: 'stage', payload: payloadWith({ handlingScore: score }) } });
    return onDebrief(record, done, new Date('2026-03-01T10:00:00Z'));
  };

  it('migrates an old record to an empty stars map', () => {
    const old = { version: 3, completedNodes: ['poste-practice'] };
    const r = migrateRecord(old);
    expect(r.version).toBe(7);
    expect(r.stars).toEqual({});
    expect(r.completedNodes).toEqual(['poste-practice']);
  });

  it('ignores invalid star values', () => {
    const r = migrateRecord({ stars: { a: 3, b: 0, c: 4, d: '2', e: null, f: 1.5, g: 2 } });
    expect(r.stars).toEqual({ a: 3, g: 2 });
    expect(migrateRecord({ stars: [1, 2] }).stars).toEqual({});
    expect(migrateRecord({ stars: 'x' }).stars).toEqual({});
  });

  it('awards stars from the handling score on completion', () => {
    expect(debrief(newDogRecord(), 400).stars[WALK_DISTRACTION.id]).toBe(1);
    expect(debrief(newDogRecord(), 700).stars[WALK_DISTRACTION.id]).toBe(2);
    expect(debrief(newDogRecord(), 870).stars[WALK_DISTRACTION.id]).toBe(3);
  });

  it('keeps the best: a worse replay never lowers it, a better one raises it', () => {
    const three = debrief(newDogRecord(), 900);
    expect(debrief(three, 300).stars[WALK_DISTRACTION.id]).toBe(3);
    const one = debrief(newDogRecord(), 300);
    expect(debrief(one, 900).stars[WALK_DISTRACTION.id]).toBe(3);
  });

  it('gives a Minigame without a handling score, the Poste practice, 1 star', () => {
    const run: NodeRun = { ...startNode(POSTE_PRACTICE), step: 'simulation' };
    const done = advance(run, { type: 'finish', result: { kind: 'minigame', metrics: { poste: 1, tension: 1 } } });
    expect(onDebrief(newDogRecord(), done, new Date()).stars[POSTE_PRACTICE.id]).toBe(1);
  });

  it.each([
    [1000, 3],
    [800, 2],
    [750, 2],
    [600, 1],
  ])('gives an action Minigame with a handling score of %i %i stars', (handlingScore, stars) => {
    const run: NodeRun = { ...startNode(DOORBELL_MAT_NODE), step: 'simulation' };
    const done = advance(run, { type: 'finish', result: { kind: 'minigame', metrics: { timing: 1, tension: 1 }, handlingScore } });
    expect(onDebrief(newDogRecord(), done, new Date()).stars[DOORBELL_MAT_NODE.id]).toBe(stars);
  });

  it('does not touch Learning Attributes or the Trigger Profile for a Minigame', () => {
    const before = newDogRecord();
    const run: NodeRun = { ...startNode(DOORBELL_MAT_NODE), step: 'simulation' };
    const after = onDebrief(before, advance(run, { type: 'finish', result: { kind: 'minigame', metrics: { timing: 1 } } }), new Date());
    expect(after.attributes).toEqual(before.attributes);
    expect(after.triggerProfile).toEqual(before.triggerProfile);
  });
});

describe('Dog record: version 5 (names and the new funnel)', () => {
  const base = { version: 4, completedNodes: ['poste-practice'] };

  it('starts a new Dog with an empty name', () => {
    expect(newDogRecord().name).toBe('');
  });

  it('loads an old record with an empty name', () => {
    const r = migrateRecord({ ...base, onboarding: { step: 'done' } });
    expect(r.name).toBe('');
    expect(r.version).toBe(7);
  });

  it('keeps a stored name and repairs an unreadable one', () => {
    expect(migrateRecord({ name: ' Luna ' }).name).toBe('Luna');
    expect(migrateRecord({ name: 'x'.repeat(30) }).name).toBe('');
    expect(migrateRecord({ name: 5 }).name).toBe('');
  });

  it.each(['setup', 'diagnostic', 'plan', 'first-stage'] as const)('keeps an old record at %s on that step', (step) => {
    expect(migrateRecord({ ...base, onboarding: { step } }).onboarding.step).toBe(step);
  });

  it('moves a record stored at the removed payoff step on to setup', () => {
    expect(migrateRecord({ ...base, onboarding: { step: 'payoff' } }).onboarding.step).toBe('setup');
  });

  it('keeps a finished record done', () => {
    expect(migrateRecord({ ...base, onboarding: { step: 'done' } }).onboarding.step).toBe('done');
  });

  it('sends a user who was at the old paywall (before the first Stage) to the first Stage', () => {
    expect(migrateRecord({ ...base, onboarding: { step: 'paywall' } }).onboarding.step).toBe('first-stage');
  });

  it('sends a version 4 user who already played the first Stage to done, not to a second paywall', () => {
    const r = migrateRecord({ ...base, onboarding: { step: 'first-stage', firstStageCompletedAt: '2026-06-01T10:00:00.000Z' } });
    expect(r.onboarding.step).toBe('done');
  });

  it('keeps a version 5 record at the paywall', () => {
    expect(migrateRecord({ version: 5, onboarding: { step: 'paywall' } }).onboarding.step).toBe('paywall');
  });
});

describe('Dog record: version 6 (breed)', () => {
  it('starts as a Mestizo', () => {
    expect(newDogRecord().breed).toBe('mestizo');
  });

  it('gives a record from before breeds a Mestizo and changes nothing else', () => {
    const old = { version: 5, name: 'Luna', coat: 'black', onboarding: { step: 'done' } };
    const r = migrateRecord(old);
    expect(r.breed).toBe('mestizo');
    expect(r.name).toBe('Luna');
    expect(r.coat).toBe('black');
  });

  it('keeps a stored breed and repairs an unknown one', () => {
    expect(migrateRecord({ breed: 'teckel' }).breed).toBe('teckel');
    expect(migrateRecord({ breed: 'unicorn' }).breed).toBe('mestizo');
    expect(migrateRecord({ breed: 7 }).breed).toBe('mestizo');
  });

  it('survives a restart', async () => {
    const store = memoryStore();
    await saveDogRecord(store, { ...newDogRecord(), breed: 'collie' });
    expect((await loadDogRecord(store)).breed).toBe('collie');
  });

  it('gives the Stage the same snapshot whatever the breed', () => {
    const a = { ...newDogRecord(), breed: 'teckel' as const };
    const b = { ...newDogRecord(), breed: 'husky' as const };
    expect(toSnapshot(a)).toEqual(toSnapshot(b));
    expect(lookOf(a)).toEqual(lookOf(b));
  });
});

describe('Dog record: version 6 (read Lessons)', () => {
  it('defaults read Lessons to none on an older record', () => {
    expect(migrateRecord({ version: 5 }).readLessons).toEqual([]);
  });

  it('keeps stored ids and drops non-strings', () => {
    expect(migrateRecord({ version: 6, readLessons: ['a', 3, 'b'] }).readLessons).toEqual(['a', 'b']);
  });
});

describe('Dog record: version 7 (Missions)', () => {
  const at = (iso: string) => new Date(iso);
  const started = (record = newDogRecord()) => updateMission(record, TEST_MISSION.id, (s) => startMission(s, at('2026-05-01T08:00:00')));

  it('starts with no Mission state, no seen Fixes and no legacy Nodes', () => {
    const r = newDogRecord();
    expect(r.missions).toEqual({});
    expect(r.seenFixes).toEqual([]);
    expect(r.legacyNodes).toEqual([]);
  });

  it('migrates an older record: empty Missions and Fixes, and a snapshot of its completed Nodes', () => {
    const r = migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat'] });
    expect(r.version).toBe(7);
    expect(r.missions).toEqual({});
    expect(r.seenFixes).toEqual([]);
    expect(r.legacyNodes).toEqual(['harness-ritual', 'doorbell-mat']);
  });

  it('keeps a version 7 record\'s own legacy Nodes, so later completions are not grandfathered', () => {
    const r = migrateRecord({ version: 7, completedNodes: ['harness-ritual', 'doorbell-mat'], legacyNodes: ['harness-ritual'] });
    expect(r.legacyNodes).toEqual(['harness-ritual']);
    expect(migrateRecord({ version: 7, completedNodes: ['a'] }).legacyNodes).toEqual([]);
  });

  it('does not count a Node completed under Missions as legacy when an old-app copy re-uploads it', () => {
    const local = { completedNodes: ['harness-ritual', 'doorbell-mat'], legacyNodes: ['harness-ritual'] };
    // the old app pulled doorbell-mat down and uploads it again as a version 6 record
    const stale = migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] });
    expect(mergeLegacyNodes(local, stale).sort()).toEqual(['harness-ritual', 'poste-practice']);
    expect(mergeLegacyNodes(stale, local).sort()).toEqual(['harness-ritual', 'poste-practice']);
  });

  it('takes an old copy\'s legacy Nodes whole on a device that has completed nothing', () => {
    const old = migrateRecord({ version: 6, completedNodes: ['harness-ritual'] });
    expect(mergeLegacyNodes(newDogRecord(), old)).toEqual(['harness-ritual']);
  });

  it('applies a Day Skip: the Mission is owed and one skip is logged, nothing else changes', () => {
    const before = { ...started(), streak: { current: 3, best: 4, lastActiveDate: '2026-04-30' } };
    const after = applyDaySkip(before, TEST_MISSION.id, at('2026-05-01T18:05:00'));
    expect(after.missions[TEST_MISSION.id].skippedAt).toBe(at('2026-05-01T18:05:00').toISOString());
    expect(after.activityLog).toEqual([{ at: at('2026-05-01T18:05:00').toISOString(), date: '2026-05-01', kind: 'skip', id: TEST_MISSION.id }]);
    expect(after.streak).toBe(before.streak);
    expect(after.walkDiary).toBe(before.walkDiary);
    expect(after.attributes).toBe(before.attributes);
    expect(after.triggerProfile).toBe(before.triggerProfile);
  });

  it('returns the same record when the Day Skip does not apply', () => {
    const r = newDogRecord();
    expect(applyDaySkip(r, TEST_MISSION.id, at('2026-05-01T18:05:00'))).toBe(r);
    const skipped = applyDaySkip(started(), TEST_MISSION.id, at('2026-05-01T18:05:00'));
    expect(applyDaySkip(skipped, TEST_MISSION.id, at('2026-05-01T19:00:00'))).toBe(skipped);
  });

  it('reads Mission state and seen Fixes tolerantly', () => {
    const r = migrateRecord({
      version: 7,
      missions: {
        good: { startedAt: '2026-05-01T08:00:00.000Z', target: 'easier', skipRun: 2, passedOn: '2026-05-03', keepPractising: true, focus: 'x', attempts: [{ date: '2026-05-02', at: '2026-05-02T09:00:00.000Z', outcome: 'struggled', problemId: 'p' }, { date: 'bad', at: 'x', outcome: 'completed' }] },
        odd: { startedAt: 'soon', target: 'hard', skipRun: -4, attempts: 'none' },
        broken: 7,
      },
      seenFixes: [{ fixId: 'f', missionId: 'good', at: '2026-05-02T09:00:00.000Z' }, { fixId: 3 }, null],
    });
    expect(r.missions.good).toEqual({ startedAt: '2026-05-01T08:00:00.000Z', target: 'easier', skipRun: 2, passedOn: '2026-05-03', keepPractising: true, focus: 'x', attempts: [{ date: '2026-05-02', at: '2026-05-02T09:00:00.000Z', outcome: 'struggled', problemId: 'p' }] });
    expect(r.missions.odd).toEqual({ target: 'full', skipRun: 0, attempts: [] });
    expect(r.missions.broken).toBeUndefined();
    expect(r.seenFixes).toEqual([{ fixId: 'f', missionId: 'good', at: '2026-05-02T09:00:00.000Z' }]);
    expect(migrateRecord({ version: 7, missions: [1], seenFixes: {} })).toMatchObject({ missions: {}, seenFixes: [] });
  });

  it('keeps old Node diary entries and reads Mission entries with their problem', () => {
    const r = migrateRecord({
      walkDiary: [
        { date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' },
        { date: '2026-05-02', missionId: 'm', outcome: 'struggled', problemId: 'p' },
        { date: '2026-05-03', outcome: 'completed' },
      ],
    });
    expect(r.walkDiary).toEqual([
      { date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' },
      { date: '2026-05-02', missionId: 'm', outcome: 'struggled', problemId: 'p' },
    ]);
  });

  it('logs a struggle in the diary with its Mission and problem, marks the day and keeps the Fix', () => {
    const before = started(applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 3 }), at('2026-04-30T10:00:00')));
    const r = applyMissionCheckIn(before, TEST_MISSION, 'struggled', 'excited', at('2026-05-02T09:00:00'));
    expect(r.walkDiary).toEqual([{ date: '2026-05-02', missionId: TEST_MISSION.id, outcome: 'struggled', problemId: 'excited' }]);
    expect(r.streak).toMatchObject({ current: 1, lastActiveDate: '2026-05-02' });
    expect(r.seenFixes).toEqual([{ fixId: 'test-fix-excited', missionId: TEST_MISSION.id, at: at('2026-05-02T09:00:00').toISOString() }]);
    expect(r.missions[TEST_MISSION.id].target).toBe('easier');
  });

  it('records "Otra cosa" as the general Fix, once', () => {
    let r = applyMissionCheckIn(started(), TEST_MISSION, 'struggled', undefined, at('2026-05-02T09:00:00'));
    r = applyMissionCheckIn(r, TEST_MISSION, 'struggled', 'other', at('2026-05-03T19:00:00'));
    expect(r.seenFixes.map((f) => f.fixId)).toEqual(['test-fix-general']);
  });

  it('never touches the Learning Attributes, Trigger Profile or posture on any outcome', () => {
    const base = started(applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 3, markerHits: 1, markerAccuracyMs: 50 }), at('2026-04-30T10:00:00')));
    for (const outcome of ['completed', 'struggled', 'skipped'] as const) {
      const r = applyMissionCheckIn(base, TEST_MISSION, outcome, 'bites', at('2026-05-02T09:00:00'));
      expect(r.walkDiary).toHaveLength(1);
      expect(r.attributes).toEqual(base.attributes);
      expect(r.triggerProfile).toEqual(base.triggerProfile);
      expect(r.calmCounts).toEqual(base.calmCounts);
      expect(r.posture).toBe(base.posture);
    }
  });

  it('changes nothing while the check-in is closed', () => {
    const r = started();
    expect(applyMissionCheckIn(r, TEST_MISSION, 'completed', undefined, at('2026-05-01T20:00:00'))).toBe(r);
    expect(applyMissionCheckIn(newDogRecord(), TEST_MISSION, 'completed', undefined, at('2026-05-02T20:00:00')).walkDiary).toEqual([]);
  });

  it('survives a restart', async () => {
    const store = memoryStore();
    const r = applyMissionCheckIn(started(), TEST_MISSION, 'struggled', 'excited', at('2026-05-02T09:00:00'));
    await saveDogRecord(store, r);
    const reopened = await loadDogRecord(store);
    expect(reopened.missions).toEqual(r.missions);
    expect(reopened.seenFixes).toEqual(r.seenFixes);
    expect(reopened.walkDiary).toEqual(r.walkDiary);
  });
});

describe('Dog record: Daily Barkdoku', () => {
  const summary = { size: 5, difficulty: 'easy' as const, durationSeconds: 130, targetSeconds: 120, mistakes: 0 };
  const morning = new Date(2026, 9, 28, 9);

  it('starts empty and reads leniently', () => {
    expect(newDogRecord().dailyBarkdoku).toEqual({});
    expect(migrateRecord({}).dailyBarkdoku).toEqual({});
    const r = migrateRecord({
      dailyBarkdoku: {
        '2026-10-28': { seconds: 130, at: '2026-10-28T08:00:00.000Z', targetSeconds: 120 },
        '2026-10-29': { seconds: 90, at: '2026-10-29T08:00:00.000Z', targetSeconds: -1 },
        'yesterday': { seconds: 90, at: '2026-10-29T08:00:00.000Z' },
        '2026-10-30': { seconds: 0, at: '2026-10-30T08:00:00.000Z' },
        '2026-10-31': { seconds: 60, at: 'never' },
      },
    });
    expect(r.dailyBarkdoku).toEqual({
      '2026-10-28': { seconds: 130, at: '2026-10-28T08:00:00.000Z', targetSeconds: 120 },
      '2026-10-29': { seconds: 90, at: '2026-10-29T08:00:00.000Z' },
    });
  });

  it('keeps and logs the first solve of a date and credits the Streak', () => {
    const r = recordDailyBarkdoku(newDogRecord(), 'b-5', summary, 2, '2026-10-28', morning);
    expect(r.dailyBarkdoku['2026-10-28']).toEqual({ seconds: 130, at: morning.toISOString(), targetSeconds: 120 });
    expect(r.activityLog).toEqual([expect.objectContaining({ kind: 'barkdoku', id: 'b-5', stars: 2, date: '2026-10-28', puzzle: summary })]);
    expect(r.streak.lastActiveDate).toBe('2026-10-28');
  });

  it('ignores a later solve of the same date, even a faster one', () => {
    const first = recordDailyBarkdoku(newDogRecord(), 'b-5', summary, 2, '2026-10-28', morning);
    const again = recordDailyBarkdoku(first, 'b-5', { ...summary, durationSeconds: 20 }, 3, '2026-10-28', new Date(2026, 9, 28, 10));
    expect(again.dailyBarkdoku).toEqual(first.dailyBarkdoku);
    expect(again.activityLog).toEqual(first.activityLog);
  });

  it("keeps the time on the board's date and the Streak on the day it was played", () => {
    const pastMidnight = new Date(2026, 9, 29, 0, 3);
    const r = recordDailyBarkdoku(newDogRecord(), 'b-5', summary, 2, '2026-10-28', pastMidnight);
    expect(Object.keys(r.dailyBarkdoku)).toEqual(['2026-10-28']);
    expect(r.streak.lastActiveDate).toBe('2026-10-29');
    expect(r.activityLog[0].date).toBe('2026-10-29');
  });
});
