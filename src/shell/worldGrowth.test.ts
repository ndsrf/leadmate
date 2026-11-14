import { mapModel } from './mapModel';
import { hasMoreComing, isWorldComplete, isWorldUnlocked, progressOf, stopStatus, type Progress, type Stop, type WorldDef } from './world';

const passed = { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-05-01T09:00:00.000Z', passedOn: '2026-05-02' };
const lesson = (id: string): Stop => ({ kind: 'lesson', id });
const mission = (id: string): Stop => ({ kind: 'mission', id });
const now = new Date(2026, 4, 10, 9);

const base = { topics: 't' as never, title: 't' as never };
const w5: WorldDef = { ...base, id: 'w5', worldNumber: 5, stretches: [[lesson('l5'), mission('m5')], [lesson('l5b'), mission('m5b')]] };
const w6With = (stretches: Stop[][], nodeCount?: number): WorldDef => ({ ...base, id: 'w6', worldNumber: 6, unlockedBy: 'w5', tier: 'plus', stretches, ...(nodeCount ? { nodeCount } : {}) });
const w7: WorldDef = { ...base, id: 'w7', worldNumber: 7, unlockedBy: 'w6', tier: 'plus', preview: true, nodeCount: 5, stretches: [] };
const oneStretch = w6With([[lesson('l6'), mission('m6')]], 4);
const twoStretches = w6With([[lesson('l6'), mission('m6')], [lesson('l6b'), mission('m6b')]], 4);
const everything = w6With([[lesson('l6'), mission('m6')], [lesson('l6b'), mission('m6b')]], 4);

const through5: Partial<Progress> = {
  plus: true,
  readLessons: ['l5', 'l5b'],
  missions: { m5: passed, m5b: passed },
};
const world6Done: Progress = progressOf([], { ...through5, readLessons: ['l5', 'l5b', 'l6'], missions: { m5: passed, m5b: passed, m6: passed } });
const map = (p: Progress, worlds: readonly WorldDef[]) => mapModel(p, {}, now, { worlds, nodes: [], lessons: [], missions: [] });

describe('a World with one Stretch', () => {
  const worlds = [w5, oneStretch, w7];

  it('completes when its only Mission is passed and opens the World after it', () => {
    expect(isWorldComplete(oneStretch, world6Done)).toBe(true);
    expect(isWorldUnlocked(w7, world6Done, worlds)).toBe(true);
    const m = map(world6Done, worlds);
    expect(m.worlds[1]).toMatchObject({ complete: true, done: 2, total: 2 });
  });

  it('is not complete before the Mission is passed', () => {
    const p = progressOf([], { ...through5, readLessons: ['l5', 'l5b', 'l6'] });
    expect(isWorldComplete(oneStretch, p)).toBe(false);
    expect(isWorldUnlocked(w7, p, worlds)).toBe(false);
  });
});

describe('the "more Stretches coming" note', () => {
  it('shows when the pack plans more Stops than the World holds', () => {
    expect(hasMoreComing(oneStretch)).toBe(true);
    expect(map(world6Done, [w5, oneStretch, w7]).worlds[1].moreComing).toBe(true);
  });

  it('does not show when the World holds every planned Stretch, or has no planned count', () => {
    expect(hasMoreComing(w6With([[lesson('l6'), mission('m6')]], 2))).toBe(false);
    expect(hasMoreComing(w5)).toBe(false);
    expect(map(world6Done, [w5, w6With([[lesson('l6'), mission('m6')]], 2), w7]).worlds[1].moreComing).toBeUndefined();
  });

  it('is not shown on a Coming-soon World, and does not affect completion or unlocking', () => {
    expect(map(world6Done, [w5, oneStretch, w7]).worlds[2].moreComing).toBeUndefined();
    expect(isWorldUnlocked(w7, world6Done, [w5, oneStretch, w7])).toBe(true);
  });
});

describe('a World that grows after it was completed', () => {
  const stored: Progress = { ...world6Done, completedWorlds: ['w5', 'w6'] };

  it('reopens for the new Stretch, keeps done Stops done and keeps the next World unlocked', () => {
    const worlds = [w5, twoStretches, w7];
    expect(isWorldComplete(twoStretches, stored)).toBe(false);
    expect(stopStatus(lesson('l6'), stored, now, worlds, []).state).toBe('done');
    expect(stopStatus(mission('m6'), stored, now, worlds, []).state).toBe('done');
    expect(stopStatus(lesson('l6b'), stored, now, worlds, []).state).toBe('open');
    expect(isWorldUnlocked(w7, stored, worlds)).toBe(true);
    const m = map(stored, worlds);
    expect(m.worlds[1]).toMatchObject({ unlocked: true, complete: false, done: 2, total: 4 });
    expect(m.worlds[2].unlocked).toBe(true);
    expect(m.nextUp?.stop).toEqual(lesson('l6b'));
  });

  it('would relock the next World without the completed-World record', () => {
    expect(isWorldUnlocked(w7, world6Done, [w5, twoStretches, w7])).toBe(false);
  });

  it('keeps the position of a user part-way through and puts the new Stretch after the existing ones', () => {
    const partway = progressOf([], { ...through5, readLessons: ['l5', 'l5b', 'l6'] });
    const m = map(partway, [w5, twoStretches, w7]);
    expect(m.worlds[1].stops.map((s) => [s.stop.id, s.state, s.stretch])).toEqual([
      ['l6', 'done', 0],
      ['m6', 'next', 0],
      ['l6b', 'locked', 1],
      ['m6b', 'locked', 1],
    ]);
  });

  it('shows no note once the World holds every planned Stretch', () => {
    expect(map(stored, [w5, everything, w7]).worlds[1].moreComing).toBeUndefined();
  });
});
