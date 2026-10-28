import { migrateRecord } from './dogRecord';
import { mapModel, nextMapChange, type MapModel, type MapStop } from './mapModel';
import type { MissionState } from './missions/mission';
import { progressOf, stopsOf, WORLDS, type Progress, type WorldDef } from './world';

const at = (h: number, day = 2, m = 0) => new Date(2026, 4, day, h, m);
const find = (m: MapModel, id: string): MapStop => m.worlds.flatMap((w) => w.stops).find((s) => s.stop.id === id)!;
const stateOf = (m: MapModel, id: string) => find(m, id).state;
const started = (startedAt: Date, over: Partial<MissionState> = {}): MissionState => ({ target: 'full', skipRun: 0, attempts: [], startedAt: startedAt.toISOString(), ...over });
const passedOn = (over: Partial<MissionState> = {}): MissionState => ({ ...started(at(9, 1)), passedOn: '2026-05-02', ...over });
const stretch1: Progress = progressOf(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] });
const allDone = (worlds: readonly WorldDef[]): Progress => {
  const stops = worlds.filter((w) => !w.preview).flatMap(stopsOf);
  return progressOf(stops.filter((s) => s.kind === 'node').map((s) => s.id), {
    readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
    missions: Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, passedOn()])),
  });
};

describe('mapModel over Stops', () => {
  it('opens the first theory Lesson as next-up on a fresh Dog and locks the rest of the Stretch', () => {
    const m = mapModel(progressOf([]), {}, at(9));
    expect(m.nextUp).toEqual({ worldId: 'home', stop: { kind: 'lesson', id: 'theory-harness' }, stopKind: 'theory' });
    expect(stateOf(m, 'howto-tap-hold')).toBe('locked');
    expect(find(m, 'harness-ritual')).toMatchObject({ state: 'locked', kind: 'node', lock: { kind: 'stops' } });
    expect(m.allComplete).toBe(false);
  });

  it('gives every Stop its kind and Stretch', () => {
    const stops = mapModel(progressOf([]), {}, at(9)).worlds[0].stops;
    expect(stops.map((s) => s.kind)).toEqual(['theory', 'how-to-play', 'node', 'mission', 'theory', 'node', 'mission', 'theory', 'node', 'mission']);
    expect(stops.map((s) => s.stretch)).toEqual([0, 0, 0, 0, 1, 1, 1, 2, 2, 2]);
  });

  it('counts done and total in Stops', () => {
    const m = mapModel(stretch1, { 'harness-ritual': 2 }, at(9));
    expect(m.worlds[0]).toMatchObject({ done: 3, total: 10 });
    expect(find(m, 'harness-ritual')).toMatchObject({ state: 'done', stars: 2 });
    expect(find(m, 'theory-harness').stars).toBeUndefined();
  });

  it('makes a Mission next-up after its Stretch, and waiting once started', () => {
    expect(mapModel(stretch1, {}, at(9)).nextUp?.stop).toEqual({ kind: 'mission', id: 'mission-harness' });
    const waiting = { ...stretch1, missions: { 'mission-harness': started(at(23, 1, 50)) } };
    const m = mapModel(waiting, {}, at(0, 2, 10));
    expect(find(m, 'mission-harness')).toMatchObject({ state: 'waiting', opensAt: at(7, 2, 50), opensTomorrow: false });
    expect(m.nextUp).toBeNull();
    expect(m.waitingAt).toEqual({ worldId: 'home', stop: { kind: 'mission', id: 'mission-harness' } });
    expect(stateOf(m, 'theory-doorbell')).toBe('locked');
    expect(find(m, 'theory-doorbell').lock).toEqual({ kind: 'mission', id: 'mission-harness' });
  });

  it('says "tomorrow" when the check-in opens at the next midnight', () => {
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, {}, at(20, 1));
    expect(find(m, 'mission-harness')).toMatchObject({ state: 'waiting', opensTomorrow: true });
  });

  it('marks a due check-in as next-up', () => {
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, {}, at(9, 2));
    expect(find(m, 'mission-harness')).toMatchObject({ state: 'next', checkInDue: true });
    expect(m.waitingAt).toBeUndefined();
  });

  it('shows a passed Mission done, with the "keep practising" mark when moved on', () => {
    const m = mapModel({ ...stretch1, missions: { 'mission-harness': passedOn({ keepPractising: true }) } }, {}, at(9));
    expect(find(m, 'mission-harness')).toMatchObject({ state: 'done', keepPractising: true });
    expect(m.nextUp?.stop.id).toBe('theory-doorbell');
  });

  it('skips a satisfied Lesson for next-up and marks it optional', () => {
    const legacy = migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat'] });
    const m = mapModel(legacy, {}, at(9));
    expect(find(m, 'theory-harness')).toMatchObject({ state: 'open', optional: true });
    expect(find(m, 'theory-doorbell')).toMatchObject({ state: 'open', optional: true });
    expect(m.nextUp?.stop).toEqual({ kind: 'mission', id: 'mission-doorbell' });
  });

  it('opens World 2 for a returning user who finished World 1', () => {
    const m = mapModel(migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] }), {}, at(9));
    expect(m.worlds[1].unlocked).toBe(true);
    expect(m.worlds[0].done).toBe(m.worlds[0].total);
    expect(m.nextUp).toMatchObject({ worldId: 'sidewalk', stop: { id: 'theory-loose-leash' } });
  });

  it('names the last missing Stop of the previous World in the unlock banner', () => {
    const all = allDone(WORLDS.slice(0, 1));
    const waiting = { ...all, missions: { ...all.missions, 'mission-poste': started(at(9, 1)) } };
    const sidewalk = mapModel(waiting, {}, at(20, 1)).worlds[1];
    expect(sidewalk.unlocked).toBe(false);
    expect(sidewalk.unlockRequirement).toEqual({ worldTitle: 'world.1.title', lastStopTitle: 'mission.poste.title' });
    expect(mapModel(progressOf([]), {}, at(9)).worlds[1].unlockRequirement?.lastStopTitle).toBeUndefined();
  });

  it('keeps preview Worlds with their planned count and no Stops', () => {
    const recall = mapModel(progressOf([]), {}, at(9)).worlds.find((w) => w.world.id === 'recall')!;
    expect(recall).toMatchObject({ tier: 'plus', preview: true, total: 4, stops: [] });
  });

  it('reports all-complete with nothing next-up or waiting', () => {
    const m = mapModel(allDone(WORLDS), {}, at(9));
    expect(m.allComplete).toBe(true);
    expect(m.nextUp).toBeNull();
    expect(m.waitingAt).toBeUndefined();
  });

  it('gives every Stop exactly one state, and at most one next-up', () => {
    const states = new Set(['locked', 'open', 'next', 'waiting', 'done']);
    for (const p of [progressOf([]), stretch1, { ...stretch1, missions: { 'mission-harness': started(at(9, 1)) } }, allDone(WORLDS.slice(0, 2))]) {
      const stops = mapModel(p, {}, at(20, 1)).worlds.flatMap((w) => w.stops);
      for (const s of stops) expect(states.has(s.state)).toBe(true);
      expect(stops.filter((s) => s.state === 'next').length).toBeLessThanOrEqual(1);
    }
  });
});

describe('nextMapChange', () => {
  it('is the earliest check-in still to open, and null when nothing waits', () => {
    expect(nextMapChange({}, at(9))).toBeNull();
    expect(nextMapChange({ a: passedOn() }, at(9))).toBeNull();
    const late = started(at(20, 2));
    const early = started(at(8, 2));
    const next = nextMapChange({ late, early }, at(21, 2));
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeLessThanOrEqual(nextMapChange({ late }, at(21, 2))!.getTime());
    expect(next!.getTime()).toBeGreaterThan(at(21, 2).getTime());
  });

  it('skips a check-in that is already open', () => {
    expect(nextMapChange({ due: started(at(8, 1)) }, at(12, 3))).toBeNull();
  });
});
