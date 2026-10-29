import { es } from '../i18n';
import { celebrationsFor, starsShown, streakStatus } from './celebrations';
import { applyDaySkip, newDogRecord, type DogRecord } from './dogRecord';
import type { MissionState } from './missions/mission';
import { progressAt } from './plus';
import { stopsOf, WORLDS } from './world';

const rec = (over: Partial<DogRecord> = {}): DogRecord => ({ ...newDogRecord(), ...over });
const node = (id: string) => ({ kind: 'node' as const, nodeId: id });
const mission = (id: string) => ({ kind: 'mission' as const, missionId: id });
const started: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T09:00:00.000Z' };
const world1 = {
  completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'],
  readLessons: ['theory-harness', 'howto-tap-hold', 'theory-doorbell', 'theory-poste'],
};
const passedAll: Record<string, MissionState> = { 'mission-harness': { ...started, passedOn: '2026-05-02' }, 'mission-doorbell': { ...started, passedOn: '2026-05-02' } };

describe('celebrationsFor', () => {
  it('celebrates a first completion once', () => {
    const before = rec();
    const after = rec({ completedNodes: ['harness-ritual'], stars: { 'harness-ritual': 1 } });
    expect(celebrationsFor(before, after, node('harness-ritual'))).toContainEqual({ type: 'first-completion', nodeId: 'harness-ritual' });
  });

  it('names a newly unlocked World when the last Mission of a World is passed', () => {
    const before = rec({ ...world1, missions: { ...passedAll, 'mission-poste': started } });
    const after = rec({ ...world1, missions: { ...passedAll, 'mission-poste': { ...started, passedOn: '2026-05-03' } } });
    const out = celebrationsFor(before, after, mission('mission-poste'));
    expect(out.filter((c) => c.type === 'unlock-world')).toEqual([{ type: 'unlock-world', worldId: 'sidewalk' }]);
  });

  it('names the newly unlocked World when the last Owed Mission is passed', () => {
    const owed = { ...started, skippedAt: '2026-05-01T09:05:00.000Z' };
    const lastPassed = { 'mission-poste': { ...started, passedOn: '2026-05-03' } };
    const before = rec({ ...world1, missions: { ...passedAll, ...lastPassed, 'mission-doorbell': owed } });
    const after = rec({ ...world1, missions: { ...passedAll, ...lastPassed, 'mission-doorbell': { ...owed, passedOn: '2026-05-04' } } });
    const out = celebrationsFor(before, after, mission('mission-doorbell'));
    expect(out.filter((c) => c.type === 'unlock-world')).toEqual([{ type: 'unlock-world', worldId: 'sidewalk' }]);
    // the Stops after it opened with the skip, so they are not celebrated again
    expect(out.some((c) => c.type === 'unlock-node')).toBe(false);
  });

  it('names a Plus World opened during the trial, read through progressAt', () => {
    const stops = WORLDS.filter((w) => !w.preview).flatMap(stopsOf);
    const missions = Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, { ...started, passedOn: '2026-05-02' }]));
    const done = {
      completedNodes: stops.filter((s) => s.kind === 'node').map((s) => s.id),
      readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
    };
    const lastId = stops.filter((s) => s.kind === 'mission').pop()!.id;
    const now = new Date('2026-05-03T10:00:00.000Z');
    const onboarding = { ...newDogRecord().onboarding, trialStartedAt: '2026-05-01T10:00:00.000Z' };
    const before = rec({ ...done, onboarding, missions: { ...missions, [lastId]: started } });
    const after = rec({ ...done, onboarding, missions });
    const plusOut = celebrationsFor(progressAt(before, now), progressAt(after, now), mission(lastId));
    expect(plusOut.filter((c) => c.type === 'unlock-world')).toEqual([{ type: 'unlock-world', worldId: 'recall' }]);
    const later = new Date('2026-05-09T10:00:00.000Z');
    expect(celebrationsFor(progressAt(before, later), progressAt(after, later), mission(lastId)).some((c) => c.type === 'unlock-world')).toBe(false);
  });

  it('gives no Mission or World celebration for a Day Skip', () => {
    const before = rec({ ...world1, missions: { 'mission-harness': { ...started, passedOn: '2026-05-02' }, 'mission-doorbell': started, 'mission-poste': { ...started, passedOn: '2026-05-03' } } });
    const after = applyDaySkip(before, 'mission-doorbell', new Date('2026-05-01T12:00:00.000Z'));
    expect(after).not.toBe(before);
    const out = celebrationsFor(before, after, mission('mission-doorbell'));
    expect(out.filter((c) => c.type === 'mission-passed' || c.type === 'unlock-world' || c.type === 'streak-day')).toEqual([]);
  });

  it('celebrates a passed Mission once, and the Node it opens', () => {
    const base = { completedNodes: ['harness-ritual'], readLessons: ['theory-harness', 'howto-tap-hold', 'theory-doorbell'] };
    const before = rec({ ...base, missions: { 'mission-harness': started } });
    const after = rec({ ...base, missions: { 'mission-harness': { ...started, passedOn: '2026-05-03' } } });
    const out = celebrationsFor(before, after, mission('mission-harness'));
    expect(out).toContainEqual({ type: 'mission-passed', missionId: 'mission-harness' });
    expect(out.filter((c) => c.type === 'unlock-node')).toEqual([{ type: 'unlock-node', nodeId: 'doorbell-mat' }]);
    expect(celebrationsFor(after, after, mission('mission-harness'))).toEqual([]);
  });

  it('gives no Mission celebration for a struggle or a skip', () => {
    const before = rec({ missions: { 'mission-harness': started } });
    const after = rec({ missions: { 'mission-harness': { ...started, target: 'easier' } } });
    expect(celebrationsFor(before, after, mission('mission-harness')).some((c) => c.type === 'mission-passed')).toBe(false);
  });

  it('celebrates a Streak day when the first activity of a day credits it, and not for more activity that day', () => {
    const before = rec();
    const credited = rec({ streak: { current: 3, best: 3, lastActiveDate: '2026-05-02' } });
    expect(celebrationsFor(before, credited, node('x'))).toContainEqual({ type: 'streak-day', days: 3 });
    expect(celebrationsFor(credited, credited, node('x')).some((c) => c.type === 'streak-day')).toBe(false);
  });

  it('celebrates a Daily new best but not the first score of the day', () => {
    const r = rec();
    expect(celebrationsFor(r, r, { kind: 'daily', improved: true, firstOfDay: false, best: 800 })).toEqual([{ type: 'daily-new-best', score: 800 }]);
    expect(celebrationsFor(r, r, { kind: 'daily', improved: true, firstOfDay: true, best: 800 })).toEqual([]);
    expect(celebrationsFor(r, r, { kind: 'daily', improved: false, firstOfDay: false, best: 800 })).toEqual([]);
  });

  it('celebrates a better replay as a new best, not a worse one', () => {
    const before = rec({ completedNodes: ['poste-practice'], stars: { 'poste-practice': 1 } });
    const better = rec({ completedNodes: ['poste-practice'], stars: { 'poste-practice': 3 } });
    expect(celebrationsFor(before, better, node('poste-practice'))).toContainEqual({ type: 'new-best-stars', nodeId: 'poste-practice', stars: 3 });
    expect(celebrationsFor(better, better, node('poste-practice'))).toEqual([]);
  });

  it('treats a Node completed before stars existed as 1 star', () => {
    const legacy = rec({ completedNodes: ['poste-practice'] });
    expect(starsShown(legacy, 'poste-practice')).toBe(1);
    expect(starsShown(legacy, 'doorbell-mat')).toBeUndefined();
    const after = rec({ completedNodes: ['poste-practice'], stars: { 'poste-practice': 2 } });
    expect(celebrationsFor(legacy, after, node('poste-practice'))).toContainEqual({ type: 'new-best-stars', nodeId: 'poste-practice', stars: 2 });
  });

  it('never repeats: diffing a record with itself gives nothing', () => {
    const r = rec({ completedNodes: ['poste-practice'], stars: { 'poste-practice': 2 }, streak: { current: 2, best: 2, lastActiveDate: '2026-05-02' } });
    expect(celebrationsFor(r, r, node('poste-practice'))).toEqual([]);
  });
});

describe('missed day', () => {
  const lapsed = { current: 9, best: 9, lastActiveDate: '2026-05-01' };

  it('shows the neutral start state and stores nothing', () => {
    const before = JSON.stringify(lapsed);
    expect(streakStatus(lapsed, '2026-05-05')).toEqual({ days: 0, mode: 'start' });
    expect(JSON.stringify(lapsed)).toBe(before);
  });

  it('keeps a live Streak running', () => {
    expect(streakStatus(lapsed, '2026-05-02')).toEqual({ days: 9, mode: 'running' });
  });

  it('removes no star or progress when a day is missed', () => {
    const r = rec({ completedNodes: ['poste-practice'], stars: { 'poste-practice': 3 }, streak: lapsed });
    streakStatus(r.streak, '2026-05-09');
    expect(r.stars).toEqual({ 'poste-practice': 3 });
    expect(r.completedNodes).toEqual(['poste-practice']);
    expect(r.streak).toEqual(lapsed);
  });

  it('uses no loss-framed words in any game-feel catalog string', () => {
    const banned = /perdi|pierd|rota\b|rompi|fallast|castigo|vidas|corazon|fracas|decepcion/i;
    const keys = Object.keys(es).filter((k) => /^(map|reveal|celebrate|stars|settings\.feedback)/.test(k) || k === 'streak.start');
    expect(keys.length).toBeGreaterThan(0);
    for (const k of keys) expect({ k, text: banned.test((es as Record<string, string>)[k]) }).toEqual({ k, text: false });
  });
});
