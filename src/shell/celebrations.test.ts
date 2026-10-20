import { es } from '../i18n';
import { celebrationsFor, starsShown, streakStatus } from './celebrations';
import { newDogRecord, type DogRecord } from './dogRecord';

const rec = (over: Partial<DogRecord> = {}): DogRecord => ({ ...newDogRecord(), ...over });
const node = (id: string) => ({ kind: 'node' as const, nodeId: id });

describe('celebrationsFor', () => {
  it('celebrates a first completion once', () => {
    const before = rec();
    const after = rec({ completedNodes: ['harness-ritual'], stars: { 'harness-ritual': 1 } });
    expect(celebrationsFor(before, after, node('harness-ritual'))).toContainEqual({ type: 'first-completion', nodeId: 'harness-ritual' });
  });

  it('names a newly unlocked World when the last Node of a World is completed', () => {
    const before = rec({ completedNodes: ['harness-ritual', 'doorbell-mat'] });
    const after = rec({ completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] });
    const out = celebrationsFor(before, after, node('poste-practice'));
    expect(out.filter((c) => c.type === 'unlock-world')).toEqual([{ type: 'unlock-world', worldId: 'sidewalk' }]);
  });

  it('celebrates a Node that opens inside an open World', () => {
    const after = rec({ completedNodes: ['harness-ritual'] });
    const unlocked = celebrationsFor(rec(), after, node('harness-ritual')).filter((c) => c.type === 'unlock-node');
    expect(unlocked).toEqual([{ type: 'unlock-node', nodeId: 'doorbell-mat' }]);
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
