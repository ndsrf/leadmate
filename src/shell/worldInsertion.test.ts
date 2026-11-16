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
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'], completedNodes: ['park-unpredictable'] });
    // what this user could reach on the previous trail
    expect(states(p, worldsBefore, unpredictableBefore)).toEqual([
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'done'], ['mission-park-unpredictable', 'open'],
    ]);
    expect(states(p, worldsAfter, all(after))).toEqual([
      ['theory-sniffing-walks', 'open'], ['park-nose-on', 'locked'], ['mission-park-sniff', 'locked'],
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'done'], ['park-keep-fresh', 'open'], ['mission-park-unpredictable', 'locked'],
    ]);
    // the next Stop of the Stretch is gated only by its own Stretch, never by the unpassed "Let them sniff" Mission
    expect(stopLock(mission('mission-park-unpredictable'), p, worldsAfter, [])).toEqual({ kind: 'stops', stops: [node('park-keep-fresh')] });
    expect(stopLock(mission('mission-park-unpredictable'), { ...p, completedNodes: [...p.completedNodes, 'park-keep-fresh'] }, worldsAfter, [])).toBeNull();
  });

  it('counts only a completed Node or a started Mission as reaching a Stretch, since the Library opens any Lesson', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'] });
    expect(stopStatus(lesson('theory-unpredictable-walks'), p, now, worldsAfter, []).state).toBe('done');
    expect(stopLock(node('park-unpredictable'), p, worldsAfter, [])).toEqual({ kind: 'mission', id: 'mission-park-sniff' });
    const started2 = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'], completedNodes: ['park-unpredictable'], missions: { 'mission-park-unpredictable': started } });
    expect(stopLock(node('park-keep-fresh'), started2, worldsAfter, [])).toBeNull();
  });

  it('leaves "Let them sniff" playable, not passed, for a user who already completed a Node after it', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure'], completedNodes: ['park-unpredictable'], missions: { 'mission-park-unpredictable': started } });
    // the inserted Stretch is played in order: its Stops are neither satisfied nor passed by the later Node
    expect(stopStatus(lesson('theory-sniffing-walks'), p, now, worldsAfter, [])).toEqual({ state: 'open' });
    expect(stopStatus(node('park-nose-on'), p, now, worldsAfter, []).lock).toEqual({ kind: 'stops', stops: [lesson('theory-sniffing-walks')] });
    expect(stopStatus(mission('mission-park-sniff'), p, now, worldsAfter, []).lock).toEqual({ kind: 'stops', stops: [lesson('theory-sniffing-walks'), node('park-nose-on')] });
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

  it('never passes the inserted Mission for free once the user starts the inserted Stretch (review defect 1, ADR 0013)', () => {
    const p = throughPark({ readLessons: ['theory-unpredictable-walks', 'howto-yield-pressure', 'theory-sniffing-walks'], completedNodes: ['park-unpredictable'] });
    expect(stopStatus(mission('mission-park-sniff'), p, now, worldsAfter, [])).toEqual({ state: 'locked', lock: { kind: 'stops', stops: [node('park-nose-on')] } });
    const played = { ...p, completedNodes: [...p.completedNodes, 'park-nose-on'] };
    expect(stopStatus(mission('mission-park-sniff'), played, now, worldsAfter, [])).toEqual({ state: 'open' });
    expect(stopStatus(lesson('theory-unpredictable-walks'), played, now, worldsAfter, []).state).toBe('done');
    expect(stopStatus(node('park-keep-fresh'), played, now, worldsAfter, []).state).toBe('open');
  });

  it('keeps a Stretch after a passed one open past a Stretch inserted ahead of both (review defect 2)', () => {
    const w: WorldDef = { ...base, id: 'w', worldNumber: 1, stretches: [
      [lesson('lA'), node('nA'), mission('mA')], [lesson('lB'), node('nB'), mission('mB')], [lesson('lC'), node('nC'), mission('mC')],
    ] };
    const p = progressOf(['nB'], { readLessons: ['lB'], missions: { mB: passed } });
    expect(stopLock(lesson('lC'), p, [w], [])).toBeNull();
    expect(stopLock(node('nC'), { ...p, readLessons: ['lB', 'lC'] }, [w], [])).toBeNull();
    expect(stopLock(node('nA'), p, [w], [])).toEqual({ kind: 'stops', stops: [lesson('lA')] });
    expect(stopStatus(mission('mA'), p, now, [w], []).state).toBe('locked');
    // a brand-new user still meets the first Mission before the later Stretches
    expect(stopLock(lesson('lC'), progressOf([]), [w], [])).toEqual({ kind: 'mission', id: 'mA' });
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
      ['theory-sniffing-walks', 'open'], ['park-nose-on', 'locked'], ['mission-park-sniff', 'locked'],
      ['theory-unpredictable-walks', 'done'], ['howto-yield-pressure', 'done'], ['park-unpredictable', 'done'], ['park-keep-fresh', 'open'], ['mission-park-unpredictable', 'done'],
    ]);
    expect(isWorldComplete(after, finishedBefore)).toBe(false);
    expect(isWorldUnlocked(cafe, finishedBefore, worldsAfter)).toBe(true);
    const m = mapModel(finishedBefore, {}, now, { worlds: worldsAfter, nodes: [], lessons: [], missions: [] });
    expect(m.worlds[1]).toMatchObject({ unlocked: true, complete: false });
    expect(m.worlds[2].unlocked).toBe(true);
    expect(m.nextUp?.stop).toEqual(lesson('theory-sniffing-walks'));
  });

  it('plays the inserted Stretch in order, without satisfying it from the finished one (review defect 3)', () => {
    const p = throughPark({ completedNodes: ['park-unpredictable'], missions: { 'mission-park-unpredictable': passed }, completedWorlds: ['park', 'recall'] });
    expect(stopStatus(node('park-nose-on'), p, now, worldsAfter, []).state).toBe('locked');
    expect(stopStatus(mission('mission-park-sniff'), p, now, worldsAfter, []).state).toBe('locked');
  });
});

describe('a legacy user from before Missions', () => {
  it('still has an earlier Mission grandfathered and earlier Stops satisfied by a legacy Node after them', () => {
    const p = throughPark({ completedNodes: ['park-unpredictable'], legacyNodes: ['park-mix', 'park-unpredictable'] });
    expect(stopStatus(mission('mission-park-sniff'), p, now, worldsAfter, [])).toEqual({ state: 'done', grandfathered: true });
    expect(stopStatus(node('park-nose-on'), p, now, worldsAfter, [])).toEqual({ state: 'open', satisfied: true });
  });
});
