import { mapModel } from './mapModel';
import type { MissionState } from './missions/mission';
import { isWorldComplete, isWorldUnlocked, progressOf, stopLock, stopStatus, type Progress, type Stop, type WorldDef } from './world';

// World 6 as it ships today, and as the rethink-unpredictable-walk-stage change restructures it (design Decisions 9
// and 11): "Let them sniff" inserted ahead of "Unpredictable walks", and `park-keep-fresh` added before its Mission.
const lesson = (id: string): Stop => ({ kind: 'lesson', id });
const node = (id: string): Stop => ({ kind: 'node', id });
const mission = (id: string): Stop => ({ kind: 'mission', id });
const passed: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T09:00:00.000Z', passedOn: '2026-05-02' };
const started: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-09T09:00:00.000Z' };
const now = new Date(2026, 4, 10, 9);

const base = { topics: 't' as never, title: 't' as never };
const park: WorldDef = { ...base, id: 'park', worldNumber: 5, stretches: [[lesson('theory-park'), node('park-mix'), mission('mission-park')]] };
const letThemSniff: Stop[] = [lesson('theory-sniffing-walks'), node('park-nose-on'), mission('mission-park-sniff')];
const unpredictableBefore: Stop[] = [lesson('theory-unpredictable-walks'), lesson('howto-yield-pressure'), node('park-unpredictable'), mission('mission-park-unpredictable')];
const unpredictableAfter: Stop[] = [lesson('theory-unpredictable-walks'), lesson('howto-yield-pressure'), node('park-unpredictable'), node('park-keep-fresh'), mission('mission-park-unpredictable')];
const recall = (stretches: Stop[][]): WorldDef => ({ ...base, id: 'recall', worldNumber: 6, unlockedBy: 'park', tier: 'plus', stretches });
const before = recall([unpredictableBefore]);
const after = recall([letThemSniff, unpredictableAfter]);
const cafe: WorldDef = { ...base, id: 'cafe', worldNumber: 7, unlockedBy: 'recall', tier: 'plus', stretches: [[lesson('theory-cafe'), mission('mission-cafe')]] };
const worldsBefore = [park, before, cafe];
const worldsAfter = [park, after, cafe];

const throughPark = (more: Partial<Progress> = {}): Progress => progressOf(['park-mix', ...(more.completedNodes ?? [])], {
  plus: true,
  ...more,
  completedNodes: ['park-mix', ...(more.completedNodes ?? [])],
  readLessons: ['theory-park', ...(more.readLessons ?? [])],
  missions: { 'mission-park': passed, ...more.missions },
});
const states = (p: Progress, worlds: readonly WorldDef[], stops: readonly Stop[]) => stops.map((s) => [s.id, stopStatus(s, p, now, worlds, []).state]);
const all = (w: WorldDef) => w.stretches.flat();

describe('a Stretch inserted ahead of one in progress (Decision 11)', () => {
  it('keeps a part-way user\'s reachable Stops open and opens the inserted Stretch', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'] });
    // what this user could reach on the previous trail
    expect(states(p, worldsBefore, unpredictableBefore)).toEqual([
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'open'], ['mission-park-unpredictable', 'locked'],
    ]);
    expect(states(p, worldsAfter, all(after))).toEqual([
      ['theory-sniffing-walks', 'open'], ['park-nose-on', 'locked'], ['mission-park-sniff', 'locked'],
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'open'], ['park-keep-fresh', 'locked'], ['mission-park-unpredictable', 'locked'],
    ]);
    // the next Node of the Stretch is gated only by its own Stretch, never by the unpassed "Let them sniff" Mission
    expect(stopLock(node('park-keep-fresh'), p, worldsAfter, [])).toEqual({ kind: 'stops', stops: [node('park-unpredictable')] });
    expect(stopLock(node('park-keep-fresh'), { ...p, completedNodes: [...p.completedNodes, 'park-unpredictable'] }, worldsAfter, [])).toBeNull();
  });

  it('keeps open a user who only read the first Lesson of the Stretch', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks'] });
    expect(stopStatus(lesson('howto-yield-pressure'), p, now, worldsAfter, []).state).toBe('open');
    expect(stopLock(node('park-unpredictable'), p, worldsAfter, [])).toEqual({ kind: 'stops', stops: [lesson('howto-yield-pressure')] });
  });

  it('leaves "Let them sniff" playable, not passed, for a user who already completed a Node after it', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'], completedNodes: ['park-unpredictable'], missions: { 'mission-park-unpredictable': started } });
    expect(stopStatus(lesson('theory-sniffing-walks'), p, now, worldsAfter, [])).toEqual({ state: 'open', satisfied: true });
    expect(stopStatus(node('park-nose-on'), p, now, worldsAfter, [])).toEqual({ state: 'open', satisfied: true });
    expect(stopStatus(mission('mission-park-sniff'), p, now, worldsAfter, [])).toEqual({ state: 'open' });
    expect(stopStatus(node('park-keep-fresh'), p, now, worldsAfter, []).state).toBe('open');
    // the Mission they already started stays reachable although a Node now comes before it
    expect(stopStatus(mission('mission-park-unpredictable'), p, now, worldsAfter, [])).toEqual({ state: 'open', checkInDue: true });
    expect(isWorldComplete(after, p)).toBe(false);
  });

  it('makes a brand-new user follow the new trail order strictly', () => {
    const p = throughPark();
    expect(states(p, worldsAfter, all(after))).toEqual([
      ['theory-sniffing-walks', 'open'], ['park-nose-on', 'locked'], ['mission-park-sniff', 'locked'],
      ['theory-unpredictable-walks', 'locked'], ['howto-yield-pressure', 'locked'], ['park-unpredictable', 'locked'], ['park-keep-fresh', 'locked'], ['mission-park-unpredictable', 'locked'],
    ]);
    expect(stopLock(lesson('theory-unpredictable-walks'), p, worldsAfter, [])).toEqual({ kind: 'mission', id: 'mission-park-sniff' });
    const sniffDone = throughPark({ readLessons: ['theory-sniffing-walks'], completedNodes: ['park-nose-on'] });
    expect(stopLock(lesson('theory-unpredictable-walks'), sniffDone, worldsAfter, [])).toEqual({ kind: 'mission', id: 'mission-park-sniff' });
    const sniffPassed = { ...sniffDone, missions: { ...sniffDone.missions, 'mission-park-sniff': passed } };
    expect(stopStatus(lesson('theory-unpredictable-walks'), sniffPassed, now, worldsAfter, []).state).toBe('open');
  });

  it('does not open a later Stretch for a user who only started the inserted one', () => {
    const p = throughPark({ readLessons: ['theory-sniffing-walks'] });
    expect(stopLock(lesson('theory-unpredictable-walks'), p, worldsAfter, [])).toEqual({ kind: 'mission', id: 'mission-park-sniff' });
  });
});

describe('a finished Stretch that grows', () => {
  const finishedBefore = throughPark({
    readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'],
    completedNodes: ['park-unpredictable'],
    missions: { 'mission-park-unpredictable': passed },
    completedWorlds: ['park', 'recall'],
  });

  it('opens a Node added before a passed Mission, keeps the Mission passed and the World complete', () => {
    const grown = recall([unpredictableAfter]);
    const worlds = [park, grown, cafe];
    expect(isWorldComplete(before, finishedBefore)).toBe(true);
    expect(stopStatus(node('park-keep-fresh'), finishedBefore, now, worlds, [])).toEqual({ state: 'open', satisfied: true });
    expect(stopStatus(mission('mission-park-unpredictable'), finishedBefore, now, worlds, []).state).toBe('done');
    expect(isWorldComplete(grown, finishedBefore)).toBe(true);
    expect(isWorldUnlocked(cafe, finishedBefore, worlds)).toBe(true);
  });

  it('still needs the added Node for a World the user never completed', () => {
    const grown = recall([unpredictableAfter]);
    const neverCompleted = { ...finishedBefore, completedWorlds: ['park'] };
    expect(stopStatus(node('park-keep-fresh'), neverCompleted, now, [park, grown, cafe], [])).toEqual({ state: 'open' });
    expect(isWorldComplete(grown, neverCompleted)).toBe(false);
  });
});

describe('a completed World with a Stretch inserted ahead', () => {
  const finishedBefore = throughPark({
    readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'],
    completedNodes: ['park-unpredictable'],
    missions: { 'mission-park-unpredictable': passed },
    completedWorlds: ['park', 'recall'],
  });

  it('opens the new Stretch, keeps done Stops done and keeps the next World unlocked', () => {
    expect(states(finishedBefore, worldsAfter, all(after))).toEqual([
      ['theory-sniffing-walks', 'open'], ['park-nose-on', 'open'], ['mission-park-sniff', 'open'],
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'done'], ['park-keep-fresh', 'open'], ['mission-park-unpredictable', 'done'],
    ]);
    expect(isWorldComplete(after, finishedBefore)).toBe(false);
    expect(isWorldUnlocked(cafe, finishedBefore, worldsAfter)).toBe(true);
    const m = mapModel(finishedBefore, {}, now, { worlds: worldsAfter, nodes: [], lessons: [], missions: [] });
    expect(m.worlds[1]).toMatchObject({ unlocked: true, complete: false });
    expect(m.worlds[2].unlocked).toBe(true);
  });
});
