import { newDogRecord, type DogRecord } from '../dogRecord';
import type { MissionState } from '../missions/mission';
import { resolve } from './merge';

const rec = (over: Partial<DogRecord>): DogRecord => ({ ...newDogRecord(), ...over });
const at = (updatedAt: string) => ({ updatedAt });

describe('resolve', () => {
  it('lets the later updatedAt win whole, never blending Learning Attributes', () => {
    const local = rec({ ...at('2026-05-02T00:00:00.000Z'), attributes: { reconnectionLatency: 0.9, reactivityThreshold: 0.1, followChance: 0.1, checkInFrequency: 0.1 }, equipment: 'collar' });
    const remote = rec({ ...at('2026-05-03T00:00:00.000Z'), attributes: { reconnectionLatency: 0.1, reactivityThreshold: 0.9, followChance: 0.9, checkInFrequency: 0.9 }, equipment: 'harness' });
    for (const merged of [resolve(local, remote), resolve(remote, local)]) {
      expect(merged.attributes).toEqual(remote.attributes);
      expect(merged.equipment).toBe('harness');
      expect(merged.updatedAt).toBe(remote.updatedAt);
    }
  });

  it('keeps local on a tie', () => {
    const local = rec({ ...at('2026-05-02T00:00:00.000Z'), equipment: 'collar' });
    const remote = rec({ ...at('2026-05-02T00:00:00.000Z'), equipment: 'harness' });
    expect(resolve(local, remote).equipment).toBe('collar');
  });

  it('unions Walk Diary entries by date and Node', () => {
    const a = { date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' } as const;
    const b = { date: '2026-05-02', nodeId: 'walk-distraction', outcome: 'struggled' } as const;
    const merged = resolve(rec({ ...at('2026-05-03T00:00:00.000Z'), walkDiary: [a] }), rec({ ...at('2026-05-01T00:00:00.000Z'), walkDiary: [b, { ...a, outcome: 'skipped' }] }));
    expect(merged.walkDiary).toEqual([a, b]);
  });

  it('unions completed Nodes', () => {
    const merged = resolve(rec({ completedNodes: ['a', 'b'], ...at('2026-05-02T00:00:00.000Z') }), rec({ completedNodes: ['b', 'c'], ...at('2026-05-01T00:00:00.000Z') }));
    expect(merged.completedNodes.sort()).toEqual(['a', 'b', 'c']);
  });

  it('unions read Lessons', () => {
    const merged = resolve(rec({ readLessons: ['1', '2'], ...at('2026-05-02T00:00:00.000Z') }), rec({ readLessons: ['2', '3'], ...at('2026-05-01T00:00:00.000Z') }));
    expect(merged.readLessons.sort()).toEqual(['1', '2', '3']);
  });

  it('keeps the earliest first-Stage time whichever copy wins', () => {
    const early = rec({ ...at('2026-05-01T00:00:00.000Z'), onboarding: { ...newDogRecord().onboarding, firstStageCompletedAt: '2026-04-01T10:00:00.000Z' } });
    const late = rec({ ...at('2026-05-02T00:00:00.000Z'), onboarding: { ...newDogRecord().onboarding, firstStageCompletedAt: '2026-04-20T10:00:00.000Z' } });
    const none = rec({ ...at('2026-05-03T00:00:00.000Z') });
    expect(resolve(early, late).onboarding.firstStageCompletedAt).toBe('2026-04-01T10:00:00.000Z');
    expect(resolve(late, early).onboarding.firstStageCompletedAt).toBe('2026-04-01T10:00:00.000Z');
    expect(resolve(none, late).onboarding.firstStageCompletedAt).toBe('2026-04-20T10:00:00.000Z');
  });

  it('keeps the best Daily Stage score per date', () => {
    const merged = resolve(rec({ dailyBest: { '2026-05-01': 400, '2026-05-02': 900 }, ...at('2026-05-02T00:00:00.000Z') }), rec({ dailyBest: { '2026-05-01': 700, '2026-05-03': 100 }, ...at('2026-05-01T00:00:00.000Z') }));
    expect(merged.dailyBest).toEqual({ '2026-05-01': 700, '2026-05-02': 900, '2026-05-03': 100 });
  });

  it('keeps the run that was active later and the best of both bests', () => {
    const merged = resolve(
      rec({ streak: { current: 2, best: 5, lastActiveDate: '2026-05-01' }, ...at('2026-05-03T00:00:00.000Z') }),
      rec({ streak: { current: 4, best: 4, lastActiveDate: '2026-05-04' }, ...at('2026-05-01T00:00:00.000Z') }),
    );
    expect(merged.streak).toEqual({ current: 4, best: 5, lastActiveDate: '2026-05-04' });
  });

  it('raises best to the current run when the current run beats both', () => {
    const merged = resolve(rec({ streak: { current: 7, best: 3, lastActiveDate: '2026-05-04' } }), rec({ streak: { current: 1, best: 2, lastActiveDate: '2026-05-01' } }));
    expect(merged.streak.best).toBe(7);
  });

  it('gives the same result when the copies are identical', () => {
    const r = rec({ completedNodes: ['a'], dailyBest: { '2026-05-01': 5 }, ...at('2026-05-02T00:00:00.000Z') });
    expect(resolve(r, r)).toEqual(r);
  });
});

describe('resolve stars', () => {
  it('lets a stale device never lower stars, whichever copy is newer', () => {
    const newer = rec({ ...at('2026-05-03T00:00:00.000Z'), stars: { 'poste-practice': 1 } });
    const stale = rec({ ...at('2026-05-01T00:00:00.000Z'), stars: { 'poste-practice': 3 } });
    expect(resolve(newer, stale).stars['poste-practice']).toBe(3);
    expect(resolve(stale, newer).stars['poste-practice']).toBe(3);
  });

  it('takes a better replay from either device and unions Nodes', () => {
    const a = rec({ ...at('2026-05-01T00:00:00.000Z'), stars: { 'poste-practice': 1, 'walk-distraction': 2 } });
    const b = rec({ ...at('2026-05-02T00:00:00.000Z'), stars: { 'poste-practice': 3 } });
    expect(resolve(a, b).stars).toEqual({ 'poste-practice': 3, 'walk-distraction': 2 });
  });
});

describe('resolve Missions and Fixes', () => {
  const waiting: MissionState = { startedAt: '2026-05-04T08:00:00.000Z', target: 'easier', skipRun: 0, attempts: [{ date: '2026-05-04', at: '2026-05-04T08:00:00.000Z', outcome: 'struggled', problemId: 'p' }] };
  const passed: MissionState = { startedAt: '2026-05-01T08:00:00.000Z', target: 'full', skipRun: 0, passedOn: '2026-05-02', attempts: [{ date: '2026-05-02', at: '2026-05-02T09:00:00.000Z', outcome: 'completed' }] };

  it('lets a passed Mission beat a waiting one, even from the older copy', () => {
    const newer = rec({ ...at('2026-05-05T00:00:00.000Z'), missions: { m: waiting } });
    const older = rec({ ...at('2026-05-03T00:00:00.000Z'), missions: { m: passed } });
    for (const merged of [resolve(newer, older), resolve(older, newer)]) expect(merged.missions.m.passedOn).toBe('2026-05-02');
  });

  it('unions the check-in history by time, and the later start supplies the wait and target', () => {
    const monday: MissionState = { startedAt: '2026-05-04T09:00:00.000Z', target: 'easier', skipRun: 0, attempts: [{ date: '2026-05-04', at: '2026-05-04T09:00:00.000Z', outcome: 'struggled', problemId: 'p' }] };
    const tuesday: MissionState = { startedAt: '2026-05-05T09:00:00.000Z', target: 'full', skipRun: 1, attempts: [{ date: '2026-05-05', at: '2026-05-05T09:00:00.000Z', outcome: 'skipped' }] };
    const merged = resolve(rec({ ...at('2026-05-06T00:00:00.000Z'), missions: { m: monday } }), rec({ ...at('2026-05-01T00:00:00.000Z'), missions: { m: tuesday } })).missions.m;
    expect(merged.attempts.map((a) => a.outcome)).toEqual(['struggled', 'skipped']);
    expect(merged.startedAt).toBe(tuesday.startedAt);
    expect(merged.skipRun).toBe(1);
  });

  it('keeps one check-in answer per day: a pass wins, otherwise the earlier answer', () => {
    const day = (outcome: 'completed' | 'struggled' | 'skipped', time: string): MissionState => ({ startedAt: '2026-05-03T09:00:00.000Z', target: 'full', skipRun: 0, attempts: [{ date: '2026-05-04', at: `2026-05-04T${time}:00.000Z`, outcome }] });
    const answers = (a: MissionState, b: MissionState) => resolve(rec({ missions: { m: a } }), rec({ ...at('2026-05-09T00:00:00.000Z'), missions: { m: b } })).missions.m.attempts.map((x) => x.outcome);
    expect(answers(day('struggled', '09:00'), day('skipped', '10:00'))).toEqual(['struggled']);
    expect(answers(day('skipped', '10:00'), day('struggled', '09:00'))).toEqual(['struggled']);
    expect(answers(day('struggled', '09:00'), day('completed', '18:00'))).toEqual(['completed']);
  });

  it('keeps "keep practising" from either side and Missions known to only one', () => {
    const a = rec({ missions: { m: { ...passed, keepPractising: true } } });
    const b = rec({ ...at('2026-05-09T00:00:00.000Z'), missions: { m: passed, n: waiting } });
    const merged = resolve(a, b);
    expect(merged.missions.m.keepPractising).toBe(true);
    expect(merged.missions.n).toEqual(waiting);
  });

  it('unions seen Fixes by Fix, keeping the first time each was shown', () => {
    const a = rec({ ...at('2026-05-06T00:00:00.000Z'), seenFixes: [{ fixId: 'f1', missionId: 'm', at: '2026-05-04T09:00:00.000Z' }] });
    const b = rec({ seenFixes: [{ fixId: 'f1', missionId: 'm', at: '2026-05-02T09:00:00.000Z' }, { fixId: 'f2', missionId: 'm', at: '2026-05-03T09:00:00.000Z' }] });
    expect(resolve(a, b).seenFixes).toEqual([
      { fixId: 'f1', missionId: 'm', at: '2026-05-02T09:00:00.000Z' },
      { fixId: 'f2', missionId: 'm', at: '2026-05-03T09:00:00.000Z' },
    ]);
  });

  it('unions legacy Nodes', () => {
    expect(resolve(rec({ legacyNodes: ['a'] }), rec({ legacyNodes: ['b'] })).legacyNodes.sort()).toEqual(['a', 'b']);
  });

  it('keeps old Node diary entries next to Mission entries of the same day', () => {
    const old = { date: '2026-05-01', nodeId: 'poste-practice', outcome: 'completed' } as const;
    const mission = { date: '2026-05-01', missionId: 'm', outcome: 'struggled', problemId: 'p' } as const;
    const merged = resolve(rec({ ...at('2026-05-03T00:00:00.000Z'), walkDiary: [old] }), rec({ walkDiary: [mission, { ...old, outcome: 'skipped' }] }));
    expect(merged.walkDiary).toEqual([old, mission]);
  });
});
