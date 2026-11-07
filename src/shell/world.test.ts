import { createTranslator, es } from '../i18n';
import { requiredCue } from '../sim/config';
import { BODY_RADIUS, closestOnSegment, hasLineOfSight, routeLength } from '../sim/geometry';
import { routeWalker, runScripted } from '../sim/harness';
import { requiredProps, routePoints, validateScenario } from '../sim/scenery';
import { activeDistractor, routeOf, type SimInput, type SimState } from '../sim/sim';
import { distance } from '../sim/vec';
import {
  ALL_NODES, BLIND_CORNER_NODE, DOORBELL_MAT_NODE, HARNESS_RITUAL_NODE, LEAVE_IT_NODE, NODES, PARK_JOGGER_NODE, PARK_MIX_NODE, POSTE_PRACTICE, SCOOTER_NODE, SLACK_U_NODE, URBAN_MIX_NODE, WALK_DISTRACTION,
} from './nodes/content';
import { isAvailable, primerCardOf, type NodeDef } from './nodes/node';
import { currentWorld, findWorld, isLastNodeOfStretch, isNodeOpen, isWorldComplete, isWorldUnlocked, missionOfStop, nodeIdsOf, nodesOfWorld, placeOfLesson, progressOf, sameStop, stopLock, stopsOf, stopStatus, WORLDS, worldOfNode, worldsFor, worldTitle, type Progress, type Stop, type WorldDef } from './world';
import { findNode } from './nodes/content';
import { findLesson } from './lessons/content';
import { MISSIONS } from './missions/content';
import type { MissionDef, MissionState } from './missions/mission';
import { migrateRecord, newDogRecord, setHomeConcern } from './dogRecord';
import { buildPersonalPlan, rebuildPlan } from './onboarding/plan';
import { HOME_CONCERNS, type HomeConcern } from './concerns';
import { HOME_BEHAVIOUR_CONTENT } from './homeBehaviours';
import { isPlus } from './plus';
import { requiredLessonsOf } from './nodes/readDog';
import type { ScenarioConfig } from '../sim/config';
import { defaultScenario } from '../sim/config';

const ids = (n: readonly NodeDef[]) => n.map((x) => x.id);
const world = (id: string) => findWorld(id)!;
const nodesIn = (...worlds: string[]) => worlds.flatMap((w) => nodeIdsOf(world(w)));
const passed = (id: string): [string, MissionState] => [id, { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z', passedOn: '2026-05-02' }];
/** Progress with every Stop of these Worlds done: Nodes completed, Lessons read and Missions passed. */
const finished = (...only: string[]): Progress => {
  // every World needs the ones before it; the Basics World is always done here unless asked for alone
  const worlds = only.includes('basics') ? only : ['basics', ...only];
  const stops = worlds.flatMap((w) => stopsOf(world(w)));
  return progressOf(nodesIn(...worlds), {
    readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
    missions: Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => passed(s.id))),
  });
};
const at = (h: number, day = 2) => new Date(2026, 4, day, h);
/** Progress past the Basics World plus these Nodes and fields: where the Home & Thresholds tests start. */
const atHome = (completed: readonly string[] = [], more: Partial<Progress> = {}): Progress => {
  const base = finished('basics');
  return { ...base, ...more, completedNodes: [...base.completedNodes, ...completed], readLessons: [...base.readLessons, ...(more.readLessons ?? [])], missions: { ...base.missions, ...more.missions } };
};

describe('World unlocking', () => {
  it('has nine sequential Worlds, each unlocked by the one before', () => {
    expect(WORLDS.map((w) => w.worldNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(WORLDS.map((w) => w.unlockedBy)).toEqual([undefined, 'basics', 'home', 'sidewalk', 'urban', 'park', 'recall', 'cafe', 'trails']);
  });

  it('designates Worlds 1-5 as playable free worlds and 6-9 as preview plus worlds', () => {
    const playable = WORLDS.filter((w) => !w.preview);
    const previews = WORLDS.filter((w) => w.preview);
    expect(playable.map((w) => w.id)).toEqual(['basics', 'home', 'sidewalk', 'urban', 'park']);
    expect(playable.every((w) => (w.tier ?? 'free') === 'free')).toBe(true);
    expect(previews.map((w) => w.id)).toEqual(['recall', 'cafe', 'trails', 'crowds']);
    expect(previews.every((w) => w.tier === 'plus')).toBe(true);
  });

  it('keeps Preview Worlds 5-8 unplayable with their planned Stop count', () => {
    for (const w of WORLDS.filter((x) => x.preview)) {
      expect(w.stretches).toEqual([]);
      expect(w.nodeCount).toBeGreaterThan(0);
    }
  });

  it('keeps World 1 open and the rest locked for a new Dog', () => {
    expect(isWorldUnlocked(world('basics'), progressOf([]))).toBe(true);
    for (const id of ['home', 'sidewalk', 'urban', 'park', 'recall', 'cafe', 'trails', 'crowds']) expect(isWorldUnlocked(world(id), progressOf([]))).toBe(false);
  });

  it('keeps Home locked until every Stop of the Basics World is done', () => {
    const basics = finished('basics');
    const almost = { ...basics, completedNodes: basics.completedNodes.filter((id) => id !== 'calm-first') };
    expect(isWorldUnlocked(world('home'), almost)).toBe(false);
    expect(isWorldUnlocked(world('home'), basics)).toBe(true);
  });

  it('keeps the Sidewalk locked until every Stop of Home is done, its last Mission included', () => {
    const all = finished('home');
    const lastMission = world('home').stretches[2][2].id;
    const waiting = { ...all, missions: { ...all.missions, [lastMission]: { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z' } } };
    expect(isWorldUnlocked(world('sidewalk'), waiting)).toBe(false);
    expect(isWorldComplete(world('home'), waiting)).toBe(false);
    expect(isWorldUnlocked(world('sidewalk'), all)).toBe(true);
  });

  it('opens one World at a time, never skipping ahead', () => {
    expect(isWorldUnlocked(world('urban'), finished('home'))).toBe(false);
    expect(isWorldUnlocked(world('urban'), finished('home', 'sidewalk'))).toBe(true);
    // finishing the Sidewalk without Home does not open Urban
    expect(isWorldUnlocked(world('urban'), finished('sidewalk'))).toBe(false);
    expect(isWorldUnlocked(world('sidewalk'), finished('basics'))).toBe(false);
    expect(isWorldUnlocked(world('park'), finished('home', 'sidewalk', 'urban'))).toBe(true);
  });

  it('puts every Node in exactly one World', () => {
    const all = WORLDS.flatMap((w) => nodeIdsOf(w));
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(ids(NODES).sort());
    for (const node of NODES) expect(worldOfNode(node.id)).toBeDefined();
    for (const w of WORLDS) expect(nodesOfWorld(w)).toHaveLength(nodeIdsOf(w).length);
  });

  it('opens a Node only when its World is open, its Stretch is done up to it and its own prerequisites are done', () => {
    const harnessReady = atHome([], { readLessons: ['theory-harness', 'howto-tap-hold'] });
    expect(isNodeOpen(HARNESS_RITUAL_NODE, harnessReady)).toBe(true);
    expect(isNodeOpen(HARNESS_RITUAL_NODE, atHome())).toBe(false); // its theory Lesson comes first
    expect(isNodeOpen(HARNESS_RITUAL_NODE, progressOf([], { readLessons: ['theory-harness', 'howto-tap-hold'] }))).toBe(false); // Home is locked
    expect(isNodeOpen(DOORBELL_MAT_NODE, harnessReady)).toBe(false);
    expect(isNodeOpen(WALK_DISTRACTION, progressOf([POSTE_PRACTICE.id]))).toBe(false); // World 2 is locked
    const world2 = { ...finished('home'), readLessons: [...finished('home').readLessons, 'theory-loose-leash', 'howto-walking'] };
    expect(isNodeOpen(WALK_DISTRACTION, world2)).toBe(true);
    expect(isNodeOpen(LEAVE_IT_NODE, finished('home'))).toBe(false);
  });

  it('opens the map on the first World that is not complete', () => {
    expect(currentWorld(progressOf([])).id).toBe('basics');
    expect(currentWorld(finished('basics')).id).toBe('home');
    expect(currentWorld(finished('home')).id).toBe('sidewalk');
    expect(currentWorld(finished('home', 'sidewalk', 'urban', 'park')).id).toBe('park');
  });

  it('titles and topics every World from the catalog', () => {
    for (const w of WORLDS) {
      expect(es[w.title]).toBeTruthy();
      expect(es[w.topics]).toBeTruthy();
    }
  });
});

describe('Stop availability and the Mission gate', () => {
  const lesson = (id: string): Stop => ({ kind: 'lesson', id });
  const node = (id: string): Stop => ({ kind: 'node', id });
  const mission = (id: string): Stop => ({ kind: 'mission', id });
  const stretch1 = atHome(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] });
  const started = (p: Progress, id: string, startedAt = at(9, 1)): Progress => ({ ...p, missions: { ...p.missions, [id]: { target: 'full', skipRun: 0, attempts: [], startedAt: startedAt.toISOString() } } });

  it('opens the Stops of a Stretch in order, naming the missing ones', () => {
    expect(stopStatus(lesson('theory-harness'), atHome(), at(9)).state).toBe('open');
    expect(stopStatus(node('harness-ritual'), atHome(), at(9))).toEqual({ state: 'locked', lock: { kind: 'stops', stops: [lesson('theory-harness'), lesson('howto-tap-hold')] } });
    expect(stopStatus(mission('mission-harness'), stretch1, at(9)).state).toBe('open');
  });

  it('locks the next Stretch behind its Mission', () => {
    expect(stopStatus(lesson('theory-doorbell'), stretch1, at(9))).toEqual({ state: 'locked', lock: { kind: 'mission', id: 'mission-harness' } });
    expect(stopStatus(node('doorbell-mat'), started(stretch1, 'mission-harness'), at(9)).lock).toEqual({ kind: 'mission', id: 'mission-harness' });
  });

  it('shows a started Mission as waiting until its check-in opens, then open', () => {
    const p = started(stretch1, 'mission-harness', at(9, 1));
    expect(stopStatus(mission('mission-harness'), p, at(20, 1))).toMatchObject({ state: 'waiting', opensAt: new Date(2026, 4, 2) });
    expect(stopStatus(mission('mission-harness'), p, at(9, 2))).toEqual({ state: 'open', checkInDue: true });
  });

  it('lets the user practise while a Mission waits, and replaying changes nothing', () => {
    const p = started(stretch1, 'mission-harness');
    for (const s of [lesson('theory-harness'), lesson('howto-tap-hold'), node('harness-ritual')]) expect(stopStatus(s, p, at(20, 1)).state).toBe('done');
    expect(stopLock(node('harness-ritual'), p)).toBeNull();
  });

  it('allows every Stop of an open Stretch on the same day, up to the Mission', () => {
    let p = atHome();
    const stops = world('home').stretches[0];
    for (const s of stops.slice(0, -1)) {
      expect(stopStatus(s, p, at(9)).state).toBe('open');
      p = s.kind === 'lesson' ? { ...p, readLessons: [...p.readLessons, s.id] } : { ...p, completedNodes: [...p.completedNodes, s.id] };
    }
    expect(stopStatus(stops[stops.length - 1], p, at(9)).state).toBe('open');
  });

  it('passes the gate once the Mission is passed', () => {
    const p = { ...stretch1, missions: { ...stretch1.missions, ...Object.fromEntries([passed('mission-harness')]) } };
    expect(stopStatus(lesson('theory-doorbell'), p, at(9)).state).toBe('open');
  });

  it('completes a Lesson Stop read from the Library, without passing a Mission before it', () => {
    const p = { ...started(stretch1, 'mission-harness'), readLessons: [...stretch1.readLessons, 'theory-doorbell'] };
    expect(stopStatus(lesson('theory-doorbell'), p, at(9)).state).toBe('done');
    expect(stopStatus(node('doorbell-mat'), p, at(9)).lock).toEqual({ kind: 'mission', id: 'mission-harness' });
    const passedP = { ...p, missions: { ...p.missions, ...Object.fromEntries([passed('mission-harness')]) } };
    expect(stopStatus(node('doorbell-mat'), passedP, at(9)).state).toBe('open');
  });

  it('grandfathers a returning user who finished World 1: every Mission passed and World 2 open', () => {
    const legacy = migrateRecord({ version: 6, completedNodes: nodeIdsOf(world('home')) });
    for (const s of stopsOf(world('home')).filter((x) => x.kind === 'mission')) expect(stopStatus(s, legacy, at(9))).toEqual({ state: 'done', grandfathered: true });
    expect(isWorldUnlocked(world('sidewalk'), legacy)).toBe(true);
    expect(stopStatus(lesson('theory-loose-leash'), legacy, at(9)).state).toBe('open');
  });

  it('gates a user partly through a World at the first unpassed Mission', () => {
    const legacy = migrateRecord({ version: 6, completedNodes: ['harness-ritual'] });
    expect(stopStatus(mission('mission-harness'), legacy, at(9)).state).toBe('open');
    expect(stopStatus(lesson('theory-doorbell'), legacy, at(9)).lock).toEqual({ kind: 'mission', id: 'mission-harness' });
  });

  it('never grandfathers the last Mission of a World for a Dog that started with Missions', () => {
    const p = { ...finished('home'), missions: { ...finished('home').missions, 'mission-poste': undefined as never } };
    delete p.missions['mission-poste'];
    expect(stopStatus(mission('mission-poste'), p, at(9)).state).toBe('open');
    expect(isWorldUnlocked(world('sidewalk'), p)).toBe(false);
  });

  it('does not let an unread theory Lesson before a completed doorbell-mat block the trail', () => {
    const legacy = migrateRecord({ version: 6, completedNodes: ['harness-ritual', 'doorbell-mat'] });
    expect(stopStatus(lesson('theory-doorbell'), legacy, at(9))).toEqual({ state: 'open', satisfied: true });
    expect(stopStatus(mission('mission-doorbell'), legacy, at(9)).state).toBe('open');
    expect(stopStatus(lesson('theory-poste'), legacy, at(9)).lock).toEqual({ kind: 'mission', id: 'mission-doorbell' });
  });

  it('does not let a Node added ahead of completed Nodes re-lock a World the user had finished', () => {
    // calm-zone-intro joined World 3 after these users had finished it
    const done = ['home', 'sidewalk', 'urban'].flatMap((id) => nodeIdsOf(world(id))).filter((id) => id !== 'calm-zone-intro');
    const legacy = migrateRecord({ version: 6, completedNodes: done });
    expect(isWorldComplete(world('urban'), legacy)).toBe(true);
    expect(isWorldUnlocked(world('park'), legacy)).toBe(true);
    expect(stopStatus(node('calm-zone-intro'), legacy, at(9))).toEqual({ state: 'open', satisfied: true });
    expect(stopStatus(node('scooter-crossing'), legacy, at(9)).state).toBe('done');
  });

  it('still asks for a new Node when nothing after it is completed', () => {
    const legacy = migrateRecord({ version: 6, completedNodes: [...nodeIdsOf(world('home')), ...nodeIdsOf(world('sidewalk')), 'leave-it-intro'] });
    const p = { ...legacy, readLessons: ['theory-visual-shields'], missions: { ...legacy.missions, ...Object.fromEntries([passed('mission-leave-it')]) } };
    expect(stopStatus(node('scooter-crossing'), p, at(9)).lock).toEqual({ kind: 'stops', stops: [node('calm-zone-intro')] });
    expect(stopStatus(node('calm-zone-intro'), p, at(9)).state).toBe('open');
    expect(stopStatus(node('scooter-crossing'), { ...p, readLessons: [] }, at(9)).lock).toEqual({ kind: 'stops', stops: [lesson('theory-visual-shields'), node('calm-zone-intro')] });
  });

  it('finds the Mission and the Stretch place of a Stop', () => {
    expect(missionOfStop(node('doorbell-mat'))).toBe('mission-doorbell');
    expect(placeOfLesson('howto-walking')).toEqual({ world: 3, stretch: 1 });
    expect(placeOfLesson('theory-named-behaviours')).toEqual({ world: 1, stretch: 1 });
    expect(placeOfLesson('calm-leash')).toBeUndefined();
    expect(isLastNodeOfStretch('harness-ritual')).toBe(true);
  });
});

/** Every rule a trail must keep (design decision 1 and the world-progression spec); an empty list means valid. */
function trailProblems(worlds: readonly WorldDef[], missions: readonly MissionDef[] = MISSIONS): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  const exists = (s: Stop) => (s.kind === 'node' ? !!findNode(s.id) : s.kind === 'lesson' ? !!findLesson(s.id) : missions.some((m) => m.id === s.id));
  const controlsTaught = new Set<string>();
  for (const w of worlds) {
    w.stretches.forEach((stops, i) => {
      const where = `${w.id} stretch ${i + 1}`;
      const missionsHere = stops.filter((s) => s.kind === 'mission');
      if (w.id !== 'basics' && (missionsHere.length !== 1 || stops[stops.length - 1].kind !== 'mission')) problems.push(`${where}: must end in exactly one Mission`);
      const def = missions.find((m) => m.id === stops[stops.length - 1]?.id);
      for (const s of stops) {
        const key = `${s.kind}:${s.id}`;
        if (seen.has(key)) problems.push(`${where}: ${key} placed twice`);
        seen.add(key);
        if (!exists(s)) problems.push(`${where}: ${key} does not resolve`);
        if (s.kind === 'node' && def && !def.trains.some((t) => sameStop(t, s))) problems.push(`${where}: ${s.id} does not train the Mission's technique`);
      }
      const firstNode = stops.findIndex((s) => s.kind === 'node');
      if (firstNode >= 0) {
        const before = stops.slice(0, firstNode).map((s) => (s.kind === 'lesson' ? findLesson(s.id) : undefined));
        if (!before.some((l) => l?.kind === 'theory')) problems.push(`${where}: no theory Lesson before its Node`);
        const node = findNode(stops[firstNode].id);
        const control = node?.mode === 'stage' ? (node.simulation.scenario?.cues?.length ?? 0) > 1 || node.id === 'leave-it-intro' ? 'cues' : 'walk' : 'tap';
        if (!controlsTaught.has(control) && !before.some((l) => l?.kind === 'how-to-play')) problems.push(`${where}: no How-to-play Lesson before the first use of ${control}`);
        controlsTaught.add(control);
      }
      // a Fix may only send the user back, never ahead of the Stretch
      const allowed = new Set(w.stretches.slice(0, i + 1).flat().map((s) => `${s.kind}:${s.id}`));
      for (const fix of def ? [...def.problems.map((p) => p.fix), def.generalFix] : []) {
        if (!allowed.has(`${fix.practise.kind}:${fix.practise.id}`)) problems.push(`${where}: ${fix.id} practises a Stop ahead of it`);
      }
    });
  }
  return problems;
}

describe('trail validation', () => {
  it('accepts the shipped trails', () => {
    expect(trailProblems(WORLDS)).toEqual([]);
  });

  it('gives World 1 three Stretches, harness, doorbell and Poste, and World 2 one per technique', () => {
    expect(world('home').stretches.map((s) => s.filter((x) => x.kind === 'node').map((x) => x.id))).toEqual([['harness-ritual'], ['doorbell-mat'], ['poste-practice']]);
    expect(world('sidewalk').stretches.map((s) => s.filter((x) => x.kind === 'node').map((x) => x.id))).toEqual([['walk-distraction'], ['blind-corner'], ['slack-u']]);
    for (const w of WORLDS.filter((x) => !x.preview)) expect(w.stretches.length).toBeGreaterThanOrEqual(2);
  });

  it('precedes the first walking Stage with a theory and a How-to-play Lesson', () => {
    const stops = world('sidewalk').stretches[0];
    expect(stops.slice(0, 3)).toEqual([{ kind: 'lesson', id: 'theory-loose-leash' }, { kind: 'lesson', id: 'howto-walking' }, { kind: 'node', id: 'walk-distraction' }]);
    expect(findLesson('theory-loose-leash')!.kind).toBe('theory');
    expect(findLesson('howto-walking')!.kind).toBe('how-to-play');
  });

  it('fails on a deliberately broken trail', () => {
    const home = world('home');
    const broken: WorldDef[] = [
      { ...home, stretches: [[...home.stretches[0].slice(0, -1)], [{ kind: 'node', id: 'harness-ritual' }, { kind: 'mission', id: 'nope' }], [{ kind: 'node', id: 'doorbell-mat' }, { kind: 'mission', id: 'mission-harness' }]] },
    ];
    const problems = trailProblems(broken);
    expect(problems.some((p) => p.includes('exactly one Mission'))).toBe(true);
    expect(problems.some((p) => p.includes('placed twice'))).toBe(true);
    expect(problems.some((p) => p.includes('does not resolve'))).toBe(true);
    expect(problems.some((p) => p.includes('no theory Lesson'))).toBe(true);
    expect(problems.some((p) => p.includes("does not train the Mission's technique"))).toBe(true);
    const harness = MISSIONS.find((m) => m.id === 'mission-harness')!;
    const ahead: MissionDef = { ...harness, generalFix: { ...harness.generalFix, practise: { kind: 'node', id: 'doorbell-mat' } } };
    expect(trailProblems([home], [ahead, ...MISSIONS.filter((m) => m !== harness)]).some((p) => p.includes('ahead of it'))).toBe(true);
  });
});

describe('Node content of every World', () => {
  it.each(NODES.map((n) => [n.id, n] as const))('%s has all its text in the catalog and one right answer', (_id, node) => {
    const keys = [node.title, ...node.primerCards.map((c) => primerCardOf(c).text), ...node.checkpoint.flatMap((q) => [q.question, q.explanation, ...q.options.map((o) => o.text)]), ...node.exercises.map((e) => e.key)];
    for (const key of keys) expect(es[key]).toBeTruthy();
    expect(node.primerCards.length).toBeGreaterThanOrEqual(1);
    expect(node.primerCards.length).toBeLessThanOrEqual(2);
    for (const q of node.checkpoint) expect(q.options.filter((o) => o.correct)).toHaveLength(1);
    expect(node.exercises.length).toBeGreaterThan(0);
  });

  it('only lists prerequisites that exist and never loops', () => {
    for (const node of NODES) for (const id of node.prerequisites) expect(ids(NODES)).toContain(id);
    // every Stop becomes reachable by doing the trail in order
    let p = progressOf([]);
    for (const stop of WORLDS.flatMap(stopsOf)) {
      expect({ stop: stop.id, lock: stopLock(stop, p) }).toEqual({ stop: stop.id, lock: null });
      if (stop.kind === 'node') p = { ...p, completedNodes: [...p.completedNodes, stop.id] };
      else if (stop.kind === 'lesson') p = { ...p, readLessons: [...p.readLessons, stop.id] };
      else p = { ...p, missions: { ...p.missions, [stop.id]: passed(stop.id)[1] } };
    }
    expect(p.completedNodes).toHaveLength(NODES.length);
  });
});

describe('World 2: Home & Thresholds', () => {
  const nodes = nodesOfWorld(world('home'));

  it('holds static minigames only, with no walking Stage', () => {
    expect(nodes.every((n) => n.mode === 'minigame')).toBe(true);
    expect(nodes.map((n) => n.simulation.minigame)).toEqual(['harness-ritual', 'doorbell-mat', 'poste-hold']);
  });

  it('includes the Harness Ritual and the Doorbell Mat', () => {
    expect(ids(nodes)).toEqual(expect.arrayContaining(['harness-ritual', 'doorbell-mat']));
  });

  it.each([[HARNESS_RITUAL_NODE], [DOORBELL_MAT_NODE]])('%# sits in an indoor boundary set that passes validation', (node) => {
    const scenario = node.simulation.scenario as ScenarioConfig;
    expect(scenario.theme).toBe('indoor_apartment');
    expect(scenario.world).toBe(2);
    expect(scenario.walls.length).toBeGreaterThanOrEqual(3);
    expect(validateScenario(scenario)).toEqual([]);
  });
});

/** Walks the route, stops for a fixated Dog and presses the Cue that fits it. */
function walker(config: ScenarioConfig) {
  const walk = routeWalker(config);
  return (s: SimState): SimInput => {
    const { direction, strength } = walk(s);
    const stand = s.dogMode === 'fixated' || s.dogMode === 'holding';
    const cue = s.dogMode === 'fixated' && s.config.cues.length > 0;
    const wanted = requiredCue(activeDistractor(s));
    return {
      direction,
      strength: stand ? 0 : strength,
      marker: false,
      cue,
      cueType: s.config.cues.includes(wanted) ? wanted : s.config.cues[0],
    };
  };
}

const STAGE_NODES = NODES.filter((n) => n.mode === 'stage');
const scenarioOf = (n: NodeDef): ScenarioConfig => ({ ...defaultScenario, ...n.simulation.scenario });

describe('Stage scenarios of Worlds 2 to 4', () => {
  it.each(STAGE_NODES.map((n) => [n.id, n] as const))('%s is valid, themed, dense enough and clear of the route', (_id, node) => {
    const config = scenarioOf(node);
    expect(validateScenario(config)).toEqual([]);
    expect(config.scenery.length).toBeGreaterThanOrEqual(requiredProps(routeLength(routePoints(config))));
    const w = worldOfNode(node.id)!;
    expect(config.world).toBe(w.worldNumber);
  });

  it.each(STAGE_NODES.map((n) => [n.id, n] as const))('%s can be walked to the end without ever entering a wall', (_id, node) => {
    const config = scenarioOf(node);
    let closest = Infinity;
    const play = walker(config);
    const { state, payload } = runScripted(
      5,
      (s) => {
        for (const wall of config.walls) {
          closest = Math.min(closest, distance(s.handler, closestOnSegment(s.handler, wall.from, wall.to)), distance(s.dog, closestOnSegment(s.dog, wall.from, wall.to)));
        }
        return play(s);
      },
      config,
      900,
    );
    expect(state.ended).toBe(true);
    expect(state.routeIndex).toBe(routeOf(config).length - 1);
    expect(closest).toBeGreaterThanOrEqual(BODY_RADIUS - 0.02);
    expect(payload.handlingScore).toBeGreaterThanOrEqual(0);
  });
});

describe('World 3: The Quiet Sidewalk', () => {
  const nodes = nodesOfWorld(world('sidewalk'));

  it('is a suburban walk with Poste practice behind it and Go Sniff on offer', () => {
    expect(nodes.every((n) => n.mode === 'stage')).toBe(true);
    for (const n of nodes) {
      const c = scenarioOf(n);
      expect(c.theme).toBe('quiet_suburb');
      expect(c.world).toBeGreaterThanOrEqual(3); // Go Sniff is on from World 3, the first walking World
      expect(c.cues).toEqual(['lets-go']);
    }
    expect(WALK_DISTRACTION.prerequisites).toContain(POSTE_PRACTICE.id);
  });

  it('has a blind corner: a bend in the corridor with a building wall that hides the oncoming cyclist', () => {
    const c = scenarioOf(BLIND_CORNER_NODE);
    expect(c.waypoints.length).toBeGreaterThanOrEqual(1);
    expect(c.walls.length).toBeGreaterThan(4);
    expect(c.distractor.kind).toBe('bicycle');
  });

  it('has a long curving route for the U-shaped leash with several passers-by', () => {
    const c = scenarioOf(SLACK_U_NODE);
    expect(c.waypoints.length).toBeGreaterThanOrEqual(3);
    expect(c.moreDistractors.length).toBeGreaterThanOrEqual(1);
  });
});

describe('World 4: Urban Navigations', () => {
  it('has a city theme with scooters at 4.5 m/s', () => {
    for (const n of nodesOfWorld(world('urban'))) expect(scenarioOf(n).theme).toBe('urban_street');
    expect(scenarioOf(SCOOTER_NODE).distractor.speed).toBe(4.5);
  });

  it('has parked cars as visual shields on the scooter street', () => {
    const shields = scenarioOf(SCOOTER_NODE).scenery.filter((i) => i.visualShield);
    expect(shields.length).toBeGreaterThanOrEqual(2);
    expect(shields.every((i) => i.type === 'parked_car')).toBe(true);
  });

  it('isolates "Leave It" in the introductory food Node and shows both Cues after it', () => {
    const intro = scenarioOf(LEAVE_IT_NODE);
    expect(intro.cues).toEqual(['leave-it']);
    expect(intro.distractor.kind).toBe('food');
    expect(requiredCue(intro.distractor)).toBe('leave-it');
    for (const n of [SCOOTER_NODE, URBAN_MIX_NODE]) expect(scenarioOf(n).cues).toEqual(['lets-go', 'leave-it']);
    expect(URBAN_MIX_NODE.prerequisites).toContain(SCOOTER_NODE.id);
    expect(SCOOTER_NODE.prerequisites).toContain(LEAVE_IT_NODE.id);
  });

  it('asks for the matching Cue in the mixed street: food needs "Leave It", the scooter "Let\'s Go"', () => {
    const c = scenarioOf(URBAN_MIX_NODE);
    const all = [c.distractor, ...c.moreDistractors];
    expect(all.filter((d) => requiredCue(d) === 'leave-it').length).toBeGreaterThanOrEqual(1);
    expect(all.filter((d) => requiredCue(d) === 'lets-go').length).toBeGreaterThanOrEqual(1);
  });

  it('breaks the line of sight to the scooter behind a parked car, and restores it once it is in the open', () => {
    const c = scenarioOf(SCOOTER_NODE);
    const dog = { x: 33, y: -0.2 };
    expect(hasLineOfSight(dog, { x: 40, y: -9 }, c.walls, c.scenery)).toBe(false);
    expect(hasLineOfSight(dog, { x: 40, y: 0 }, c.walls, c.scenery)).toBe(true);
  });
});

describe('World 5: Fast Wheels & High Arousal', () => {
  it('is an open park with a 3 m leash and a sudden fast jogger', () => {
    for (const n of nodesOfWorld(world('park'))) {
      const c = scenarioOf(n);
      expect(c.theme).toBe('open_park');
      expect(c.leashLength).toBe(3);
    }
    const jogger = scenarioOf(PARK_JOGGER_NODE).distractor;
    expect(jogger.kind).toBe('other');
    expect(jogger.speed).toBeGreaterThan(3);
  });

  it('keeps the tension ratios in line with the longer leash', () => {
    const c = scenarioOf(PARK_MIX_NODE);
    expect(c.leashLength).toBe(3);
    expect(c.cues).toEqual(['lets-go', 'leave-it']);
    const { state } = runScripted(5, () => ({ direction: { x: 0, y: 0 }, strength: 0, marker: false }), { ...c, endCondition: { kind: 'time-limit', seconds: 20 } }, 30);
    expect(state.ratio).toBeLessThanOrEqual(1.0001 + c.leashTolerance / c.leashLength);
  });
});

describe('Poste practice stays behind World 1', () => {
  it('still gates the first walking Node', () => {
    expect(isAvailable(WALK_DISTRACTION, [])).toBe(false);
    expect(isAvailable(WALK_DISTRACTION, [POSTE_PRACTICE.id])).toBe(true);
  });
});

describe('Plus Worlds', () => {
  const recall = world('recall');

  it('stays locked for a free user, even with the World before it complete', () => {
    expect(isWorldUnlocked(recall, finished('home', 'sidewalk', 'urban', 'park'))).toBe(false);
  });

  it('is unlocked for a Plus member once the World before it is complete', () => {
    expect(isWorldUnlocked(recall, { ...finished('home', 'sidewalk', 'urban', 'park'), plus: true })).toBe(true);
    expect(isWorldUnlocked(recall, { ...finished('home', 'sidewalk', 'urban'), plus: true })).toBe(false);
  });

  it('follows the trial through isPlus', () => {
    const record = { ...migrateRecord({}), ...finished('home', 'sidewalk', 'urban', 'park') };
    const trial = { ...record, onboarding: { ...record.onboarding, trialStartedAt: at(9, 1).toISOString() } };
    expect(isWorldUnlocked(recall, { ...trial, plus: isPlus(trial, at(9, 3)) })).toBe(true);
    expect(isWorldUnlocked(recall, { ...trial, plus: isPlus(trial, at(9, 9)) })).toBe(false);
  });
});

describe('Owed Missions', () => {
  const started: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: at(9, 1).toISOString() };
  const owed: MissionState = { ...started, skippedAt: at(9, 1).toISOString() };
  /** Every Stop of World 1 done, with these Mission states instead of a pass. */
  const homeWith = (missions: Record<string, MissionState>): Progress => ({ ...finished('home'), missions: { ...finished('home').missions, ...missions } });

  it('opens the Stretch after it', () => {
    const p = atHome(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'], missions: { 'mission-harness': owed } });
    expect(stopLock({ kind: 'lesson', id: 'theory-doorbell' }, p)).toBeNull();
    expect(stopLock({ kind: 'node', id: 'doorbell-mat' }, { ...p, readLessons: [...p.readLessons, 'theory-doorbell'] })).toBeNull();
  });

  it('reports the owed state, due or not', () => {
    const p = atHome([], { missions: { 'mission-harness': owed } });
    expect(stopStatus({ kind: 'mission', id: 'mission-harness' }, p, at(20, 1))).toEqual({ state: 'owed', opensAt: at(0, 2) });
    expect(stopStatus({ kind: 'mission', id: 'mission-harness' }, p, at(9, 2))).toEqual({ state: 'owed', checkInDue: true });
  });

  it('keeps the next World locked while one Mission is owed', () => {
    const p = homeWith({ 'mission-doorbell': owed });
    expect(isWorldComplete(world('home'), p)).toBe(false);
    expect(isWorldUnlocked(world('sidewalk'), p)).toBe(false);
  });

  it('unlocks the next World when the last Owed Mission is passed', () => {
    const p = homeWith({ 'mission-doorbell': { ...owed, passedOn: '2026-05-02' } });
    expect(isWorldComplete(world('home'), p)).toBe(true);
    expect(isWorldUnlocked(world('sidewalk'), p)).toBe(true);
  });

  it('is locked with its World when that World closes again', () => {
    const plusHome: WorldDef[] = [{ ...world('home'), unlockedBy: undefined, tier: 'plus' }];
    const p = progressOf([], { missions: { 'mission-harness': owed } });
    const mission: Stop = { kind: 'mission', id: 'mission-harness' };
    expect(stopStatus(mission, { ...p, plus: true }, at(9, 2), plusHome)).toEqual({ state: 'owed', checkInDue: true });
    expect(stopStatus(mission, p, at(9, 2), plusHome)).toEqual({ state: 'locked', lock: { kind: 'world' } });
  });
});

describe('worldTitle', () => {
  it('composes the visible title from the World number and its id-keyed name', () => {
    const t = createTranslator();
    expect(worldTitle(findWorld('sidewalk')!, t)).toBe(`Mundo ${findWorld('sidewalk')!.worldNumber} · La calle tranquila`);
  });
});

describe('World 1: the Basics World', () => {
  const basics = world('basics');

  it('holds three Stretches without missions or pauses, with a theory Lesson before each Node', () => {
    expect(basics.worldNumber).toBe(1);
    expect(basics.unlockedBy).toBeUndefined();
    expect(basics.stretches.map((s) => s.map((x) => x.id))).toEqual([
      ['howto-choose-action', 'theory-named-behaviours', 'theory-dog-as-dog', 'calm-hands', 'dog-as-dog'],
      ['theory-home-rest', 'home-rest'],
      ['theory-calm-first', 'calm-first'],
    ]);
    expect(findLesson('howto-choose-action')!.kind).toBe('how-to-play');
  });

  it('runs only static action Minigames, with no walking', () => {
    expect(nodesOfWorld(basics).map((n) => [n.mode, n.simulation.minigame])).toEqual([['close_exercise', undefined], ['minigame', 'dog-as-dog'], ['minigame', 'home-rest'], ['minigame', 'calm-first']]);
  });

  it('opens a new Dog on the Basics World with the Lessons of its first Stretch as the only open Stops, how to play first', () => {
    const p = progressOf([]);
    expect(currentWorld(p).id).toBe('basics');
    const open = WORLDS.flatMap(stopsOf).filter((s) => stopStatus(s, p, at(9)).state === 'open');
    expect(open).toEqual([{ kind: 'lesson', id: 'howto-choose-action' }, { kind: 'lesson', id: 'theory-named-behaviours' }, { kind: 'lesson', id: 'theory-dog-as-dog' }]);
  });

  it('keeps Home locked until the Basics World is complete, and Home keeps its own look', () => {
    expect(isWorldUnlocked(world('home'), finished('basics'))).toBe(true);
    const almost = { ...finished('basics'), completedNodes: finished('basics').completedNodes.filter((id) => id !== 'calm-first') };
    expect(isWorldUnlocked(world('home'), almost)).toBe(false);
    expect(world('home').worldNumber).toBe(2);
  });
});

describe('worldTitle and the Dog name', () => {
  it('uses no {name} placeholder, which the app fills with the Dog name', () => {
    expect(es['world.numbered']).not.toContain('{name}');
    const named: typeof es = { ...es };
    const t = (key: keyof typeof es) => named[key].replace('{name}', 'Migas');
    expect(worldTitle(findWorld('basics')!, t)).toBe('Mundo 1 · Un perro es un perro');
  });
});

describe('Lessons of a Stretch and the how-to-play Lesson', () => {
  const lessonStop = (id: string): Stop => ({ kind: 'lesson', id });
  it('opens every Lesson of a Stretch at once, but not the Node or Mission until they are read', () => {
    const p = progressOf([]);
    for (const id of ['howto-choose-action', 'theory-named-behaviours', 'theory-dog-as-dog']) expect(stopLock(lessonStop(id), p)).toBeNull();
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, p)).toMatchObject({ kind: 'stops' });
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, progressOf([], { readLessons: ['theory-dog-as-dog', 'theory-named-behaviours'] }))).toMatchObject({ kind: 'stops', stops: [lessonStop('howto-choose-action'), { kind: 'node', id: 'calm-hands' }] });
    const allRead = progressOf([], { readLessons: ['howto-choose-action', 'theory-dog-as-dog', 'theory-named-behaviours'] });
    // the choose-the-action Node also needs the hand drill before it
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, allRead)).toMatchObject({ kind: 'stops', stops: [{ kind: 'node', id: 'calm-hands' }] });
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, { ...allRead, completedNodes: ['calm-hands'] })).toBeNull();
  });
  it('still closes a Lesson behind an uncompleted earlier Node or a locked World', () => {
    expect(stopLock(lessonStop('theory-home-rest'), progressOf([]))).toMatchObject({ kind: 'stops' });
    expect(stopLock(lessonStop('theory-harness'), progressOf([]))).toEqual({ kind: 'world' });
  });
  it('makes how to play the first Stop of World 1, and every living-room Node requires it', () => {
    expect(stopsOf(world('basics'))[0]).toEqual(lessonStop('howto-choose-action'));
    const needing = ALL_NODES.filter((n) => requiredLessonsOf(n).length > 0).map((n) => n.id);
    expect(needing.sort()).toEqual(['bark-home', 'calm-first', 'calm-hands', 'destroy', 'dog-as-dog', 'eat-objects', 'home-rest']);
  });
  it('cannot play a Home Node in World 2 before how to play is read in World 1, and places its Stretch in World 2', () => {
    const p = progressOf([], {
      homeConcerns: { destroy: 1 },
      readLessons: ['theory-destroy', 'theory-named-behaviours', 'theory-dog-as-dog', 'theory-home-rest', 'theory-calm-first'],
      completedNodes: ['calm-hands', 'dog-as-dog', 'home-rest', 'calm-first'],
      missions: Object.fromEntries(['mission-dog-as-dog', 'mission-home-rest', 'mission-calm-first'].map(passed)),
    });
    const worlds = worldsFor([{ stretchId: 'theory-destroy' }], p);
    expect(stopLock({ kind: 'node', id: 'destroy' }, p, worlds)).toMatchObject({ kind: 'stops' });
    const ids = worlds.find((w) => w.id === 'home')!.stretches.map((s) => s[0].id);
    expect(ids).toContain('theory-destroy');
  });
  it('keeps a Home Stretch the Dog already started open although World 2 is still closed', () => {
    const p = progressOf([], { homeConcerns: { destroy: 1 }, readLessons: ['theory-destroy'] });
    const worlds = worldsFor([], p);
    expect(stopLock(lessonStop('theory-destroy'), p, worlds)).toBeNull();
    const untouched = progressOf([], { homeConcerns: { destroy: 1 } });
    expect(stopLock(lessonStop('theory-destroy'), untouched, worldsFor([], untouched))).toEqual({ kind: 'world' });
  });
  it('lets a Home Node played from Other Home Behaviours (off the trail) open without the Lesson', () => {
    expect(stopLock({ kind: 'node', id: 'destroy' }, progressOf([]))).toBeNull();
  });
});

describe('worldsFor', () => {
  const lead = (w: WorldDef) => w.stretches.map((s) => s[0].id);
  const lesson = (id: string): Stop => ({ kind: 'lesson', id });
  const node = (id: string): Stop => ({ kind: 'node', id });
  const mission = (id: string): Stop => ({ kind: 'mission', id });
  const basics = (worlds: readonly WorldDef[]) => worlds.find((w) => w.id === 'basics')!;

  it('is the shipped Worlds for an empty plan', () => {
    expect(worldsFor([], progressOf([]))).toBe(WORLDS);
  });

  it('puts the plan Stretches first inside their World, in plan order', () => {
    const worlds = worldsFor([{ stretchId: 'theory-home-rest' }, { stretchId: 'theory-calm-first' }], progressOf([]));
    expect(lead(basics(worlds))).toEqual(['howto-choose-action', 'theory-home-rest', 'theory-calm-first']);
  });

  it('never moves a Stretch before the Stretch that holds a prerequisite Node of its Nodes', () => {
    const worlds = worldsFor([{ stretchId: 'theory-calm-first' }, { stretchId: 'theory-home-rest' }], progressOf([]));
    expect(lead(basics(worlds))).toEqual(['howto-choose-action', 'theory-home-rest', 'theory-calm-first']);
  });

  it('keeps Stretches the user started where they are', () => {
    const started = progressOf([], { readLessons: ['theory-named-behaviours'] });
    expect(lead(basics(worldsFor([{ stretchId: 'theory-home-rest' }], started)))).toEqual(['howto-choose-action', 'theory-home-rest', 'theory-calm-first']);
  });

  it('leaves the World list, the locks and the Stops of each Stretch alone', () => {
    const worlds = worldsFor([{ stretchId: 'theory-poste' }, { stretchId: 'theory-home-rest' }], progressOf([]));
    expect(worlds.map((w) => w.id)).toEqual(WORLDS.map((w) => w.id));
    expect(worlds.map((w) => w.unlockedBy)).toEqual(WORLDS.map((w) => w.unlockedBy));
    for (const [i, w] of worlds.entries()) expect(stopsOf(w).map((s) => s.id).sort()).toEqual(stopsOf(WORLDS[i]).map((s) => s.id).sort());
  });

  it('opens the first Stretch a Dog can finish, even when the plan names a later one', () => {
    const worlds = worldsFor([{ stretchId: 'theory-home-rest' }], progressOf([]));
    expect(stopLock({ kind: 'lesson', id: 'howto-choose-action' }, progressOf([]), worlds)).toBeNull();
    expect(stopLock({ kind: 'lesson', id: 'theory-home-rest' }, progressOf([]), worlds)).toMatchObject({ kind: 'stops' });
  });

  it('ignores an unknown Stretch', () => {
    expect(worldsFor([{ stretchId: 'nope' }], progressOf([]))).toBe(WORLDS);
  });
});

describe('Home Behaviour content and the trail', () => {
  it('counts in no static World (they join World 1 per Dog, below): no Home Lesson, Node or Mission is a Stop, so none completes, unlocks or gates anything', () => {
    const stopIds = new Set(WORLDS.flatMap((w) => stopsOf(w).map((s) => s.id)));
    for (const id of ['theory-bite-owner', 'theory-bite-others', 'theory-bark-home', 'theory-destroy', 'theory-eat-objects', 'bark-home', 'destroy', 'eat-objects', 'mission-bite-owner', 'mission-bite-others', 'mission-bark-home', 'mission-destroy', 'mission-eat-objects']) {
      expect(stopIds.has(id)).toBe(false);
    }
    expect(nodeIdsOf(findWorld('basics')!)).not.toContain('bark-home');
    const homeDone = progressOf(['bark-home', 'destroy', 'eat-objects'], { readLessons: ['theory-bark-home'], missions: { 'mission-bark-home': { target: 'full', skipRun: 0, attempts: [], passedOn: '2026-11-01' } } });
    expect(WORLDS.map((w) => isWorldComplete(w, homeDone))).toEqual(WORLDS.map((w) => isWorldComplete(w, progressOf([]))));
    expect(WORLDS.map((w) => isWorldUnlocked(w, homeDone))).toEqual(WORLDS.map((w) => isWorldUnlocked(w, progressOf([]))));
  });
});

describe('worldsFor never makes a Stop unreachable', () => {
  test.each([['theory-home-rest'], ['theory-calm-first'], ['theory-calm-first', 'theory-home-rest']])('plan %s', (...ids) => {
    const worlds = worldsFor(ids.map((stretchId) => ({ stretchId })), progressOf([]));
    const progress = progressOf([]);
    for (const world of worlds.filter((w) => !w.preview)) {
      for (const stops of world.stretches) {
        for (const stop of stops) {
          expect(stopLock(stop, progress, worlds)).toBeNull();
          if (stop.kind === 'lesson') progress.readLessons.push(stop.id);
          else if (stop.kind === 'node') progress.completedNodes.push(stop.id);
          else progress.missions[stop.id] = { startedAt: 1, passedOn: '2026-01-01' } as unknown as MissionState;
        }
      }
    }
  });
});

describe('World 2 is composed per Dog from its Concerns (ADR 0023)', () => {
  const basics = (worlds: readonly WorldDef[]) => worlds.find((w) => w.id === 'basics')!;
  const homeWorld = (worlds: readonly WorldDef[]) => worlds.find((w) => w.id === 'home')!;
  const lesson = (id: string): Stop => ({ kind: 'lesson', id });
  const node = (id: string): Stop => ({ kind: 'node', id });
  const mission = (id: string): Stop => ({ kind: 'mission', id });
  const firsts = (w: WorldDef) => w.stretches.map((s) => s[0].id);
  const lessonOf = (c: HomeConcern) => HOME_BEHAVIOUR_CONTENT[c].lesson!;
  const withConcerns = (levels: Partial<Record<HomeConcern, 1 | 2 | 3>>, more: Partial<Progress> = {}) => progressOf([], { homeConcerns: levels, ...more });
  const mark = (p: Progress, stop: Stop): Progress => {
    if (stop.kind === 'lesson') return { ...p, readLessons: [...p.readLessons, stop.id] };
    if (stop.kind === 'node') return { ...p, completedNodes: [...p.completedNodes, stop.id] };
    return { ...p, missions: { ...p.missions, ...Object.fromEntries([passed(stop.id)]) } };
  };

  it('is the static Basics World and World 2 for a Dog with no home Concern', () => {
    expect(worldsFor([], withConcerns({}))).toBe(WORLDS);
  });

  it('leaves World 1 strictly with its 3 foundational Stretches and adds the Home Stretch of each Concern to World 2', () => {
    const worlds = worldsFor([], withConcerns({ 'bark-home': 1, destroy: 2 }));
    expect(firsts(basics(worlds))).toEqual(['howto-choose-action', 'theory-home-rest', 'theory-calm-first']);
    const w2 = homeWorld(worlds);
    expect(firsts(w2)).toEqual([lessonOf('destroy'), lessonOf('bark-home'), 'theory-harness', 'theory-doorbell', 'theory-poste']);
    expect(w2.stretches[1]).toEqual([lesson(lessonOf('bark-home')), node('bark-home'), mission('mission-bark-home')]);
    expect(WORLDS.map((x) => x.stretches.length)).toEqual(WORLDS.map((x) => x.stretches.length)); // the static trail is untouched
    expect(stopsOf(basics(WORLDS)).some((s) => s.id === 'theory-bark-home')).toBe(false);
  });

  it('orders them by the Personal Plan with biting first, ahead of the threshold Stretches', () => {
    const record = rebuildPlan({ ...newDogRecord(), homeConcerns: { 'bark-home': 1, 'bite-others': 1, 'eat-objects': 2 } });
    const w = homeWorld(worldsFor(record.onboarding.plan, record));
    const homeOrder = firsts(w).filter((id) => HOME_CONCERNS.some((c) => lessonOf(c) === id));
    expect(homeOrder).toEqual(record.onboarding.plan.map((p) => p.stretchId).filter((id) => homeOrder.includes(id)));
    expect(homeOrder[0]).toBe(lessonOf('bite-others'));
    expect(firsts(w).indexOf(lessonOf('bite-others'))).toBeLessThan(firsts(w).indexOf('theory-harness'));
  });

  it('puts the ones the plan does not name after the plan\'s and before the threshold Stretches, biting first', () => {
    const w = homeWorld(worldsFor([], withConcerns({ 'bark-home': 1, 'bite-owner': 1 })));
    expect(firsts(w)).toEqual([lessonOf('bite-owner'), lessonOf('bark-home'), 'theory-harness', 'theory-doorbell', 'theory-poste']);
  });

  it('never places a Stretch before the Stretch holding a prerequisite Node of its Nodes', () => {
    const nodes = ALL_NODES.map((n) => (n.id === 'bark-home' ? { ...n, prerequisites: ['poste-practice'] } : n));
    const w = homeWorld(worldsFor([{ stretchId: lessonOf('bark-home') }], withConcerns({ 'bark-home': 1 }), WORLDS, nodes));
    expect(firsts(w).indexOf(lessonOf('bark-home'))).toBeGreaterThan(firsts(w).indexOf('theory-poste'));
  });

  it('gates World 2 and World 3: World 1 completes without home concerns, World 2 requires home concerns, and World 3 stays locked', () => {
    const p = withConcerns({ 'bark-home': 1 });
    const doneBasics = { ...finished('basics'), homeConcerns: p.homeConcerns };
    const worlds = worldsFor([], doneBasics);
    expect(isWorldComplete(basics(worlds), doneBasics)).toBe(true);
    expect(isWorldUnlocked(homeWorld(worlds), doneBasics, worlds)).toBe(true);
    expect(isWorldComplete(homeWorld(worlds), doneBasics)).toBe(false);
    expect(isWorldUnlocked(worlds.find((w) => w.id === 'sidewalk')!, doneBasics, worlds)).toBe(false);

    let finishedHome: Progress = { ...doneBasics, ...finished('home') };
    for (const stop of homeWorld(worlds).stretches.find((x) => x[0].id === lessonOf('bark-home'))!) finishedHome = mark(finishedHome, stop);
    expect(isWorldComplete(homeWorld(worlds), finishedHome)).toBe(true);
    expect(isWorldUnlocked(worlds.find((w) => w.id === 'sidewalk')!, finishedHome, worlds)).toBe(true);
  });

  it('an Owed Home Mission is done for gating but does not complete World 2 (a normal Mission)', () => {
    const owed: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z', skippedAt: '2026-05-01T20:00:00.000Z' } as MissionState;
    let p: Progress = { ...finished('basics'), ...finished('home'), homeConcerns: { 'bark-home': 1 } };
    const worlds = worldsFor([], p);
    for (const stop of homeWorld(worlds).stretches.find((x) => x[0].id === lessonOf('bark-home'))!.slice(0, 2)) p = mark(p, stop);
    p = { ...p, missions: { ...p.missions, 'mission-bark-home': owed } };
    expect(isWorldComplete(homeWorld(worlds), p)).toBe(false);
    expect(stopStatus(mission('mission-bark-home'), p, at(9, 3), worlds).state).toBe('owed');
  });

  it('missionOfStop finds a Home Mission through World 2', () => {
    const worlds = worldsFor([], withConcerns({ destroy: 1 }));
    expect(missionOfStop(node('destroy'), worlds)).toBe('mission-destroy');
    expect(missionOfStop(lesson('theory-destroy'), worlds)).toBe('mission-destroy');
    expect(isLastNodeOfStretch('destroy', worlds)).toBe(true);
  });

  it('keeps a started Home Stretch in World 2 when its Concern is removed, and moves an untouched one back', () => {
    const started = withConcerns({}, { readLessons: [lessonOf('destroy')], worldHome: ['destroy', 'bark-home'] });
    const ids = firsts(homeWorld(worldsFor([], started)));
    expect(ids).toContain(lessonOf('destroy'));
    expect(ids).not.toContain(lessonOf('bark-home'));
  });

  it('does not pull a Home Stretch started from Other Home Behaviours into World 2 unless it joined', () => {
    const optional = withConcerns({}, { readLessons: [lessonOf('destroy')], worldHome: [] });
    expect(worldsFor([], optional)).toBe(WORLDS);
    const legacy = withConcerns({}, { readLessons: [lessonOf('destroy')] });
    expect(worldsFor([], legacy)).toBe(WORLDS);
  });

  it('a Home Node played early does not make the Basics or World 2 Missions count as passed', () => {
    const p = withConcerns({ destroy: 1 }, { completedNodes: ['destroy'] });
    const worlds = worldsFor([], p);
    expect(stopStatus(mission('mission-dog-as-dog'), p, at(9), worlds).state).not.toBe('done');
    expect(stopStatus(mission('mission-harness'), p, at(9), worlds).state).not.toBe('done');
  });

  it('a Concern declared after World 2 is complete stays in Other Home Behaviours and World 2 stays complete', () => {
    const done = { ...newDogRecord(), ...finished('basics'), ...finished('home') } as ReturnType<typeof newDogRecord> & Progress;
    const late = setHomeConcern(done, 'bark-home', 1);
    expect(late.homeConcerns['bark-home']).toBe(1);
    expect(late.worldHome).toEqual([]);
    const worlds = worldsFor([], late);
    expect(firsts(homeWorld(worlds))).not.toContain(lessonOf('bark-home'));
    expect(isWorldComplete(homeWorld(worlds), late)).toBe(true);
  });

  it('a Concern declared while World 2 is open joins it, level 1 included', () => {
    const joined = setHomeConcern(newDogRecord(), 'bark-home', 1);
    expect(joined.worldHome).toEqual(['bark-home']);
    expect(firsts(homeWorld(worldsFor([], joined)))).toContain(lessonOf('bark-home'));
    const removed = setHomeConcern(joined, 'bark-home', 0);
    expect(removed.worldHome).toEqual(['bark-home']); // kept, so a started Stretch stays
    expect(firsts(homeWorld(worldsFor([], removed)))).not.toContain(lessonOf('bark-home')); // untouched, so it moves back
  });

  describe('World 2 order for a Dog', () => {
    const orderFor = (levels: Partial<Record<HomeConcern, 1 | 2 | 3>>) => {
      const record = rebuildPlan({ ...newDogRecord(), homeConcerns: levels });
      return firsts(homeWorld(worldsFor(record.onboarding.plan, record)));
    };
    it('is the shipped World 2 order with no Home Concern', () => {
      expect(orderFor({})).toEqual(['theory-harness', 'theory-doorbell', 'theory-poste']);
    });
    it('puts biting first, then the threshold Stretches', () => {
      expect(orderFor({ 'bite-owner': 2 })).toEqual([lessonOf('bite-owner'), 'theory-harness', 'theory-doorbell', 'theory-poste']);
    });
    it('puts the other Home Stretches by level ahead of threshold Stretches', () => {
      expect(orderFor({ 'bark-home': 1, destroy: 2 })).toEqual([lessonOf('destroy'), lessonOf('bark-home'), 'theory-harness', 'theory-doorbell', 'theory-poste']);
    });
    it('orders all five before threshold Stretches', () => {
      expect(orderFor({ 'bite-owner': 1, 'bite-others': 3, 'bark-home': 1, destroy: 2, 'eat-objects': 3 })).toEqual([
        lessonOf('bite-others'), lessonOf('bite-owner'), lessonOf('eat-objects'), lessonOf('destroy'), lessonOf('bark-home'), 'theory-harness', 'theory-doorbell', 'theory-poste',
      ]);
    });
  });

  describe('reachability: every Stop of World 1 and World 2 can be completed in trail order', () => {
    const combos: HomeConcern[][] = [[], ...HOME_CONCERNS.map((c) => [c]), ['bark-home', 'destroy'], [...HOME_CONCERNS]];
    test.each(combos.map((c) => [c.join('+'), c] as const))('Dog with %s', (_name, concerns) => {
      const levels = Object.fromEntries(concerns.map((c) => [c, 1])) as Partial<Record<HomeConcern, 1 | 2 | 3>>;
      const record = rebuildPlan({ ...newDogRecord(), homeConcerns: levels });
      const plan = buildPersonalPlan(record);
      let p: Progress = { ...progressOf([]), homeConcerns: levels };
      // Complete World 1
      for (let guard = 0; guard < 100; guard++) {
        const worlds = worldsFor(plan, p);
        const w = basics(worlds);
        const next = stopsOf(w).find((s) => !(s.kind === 'lesson' ? p.readLessons.includes(s.id) : s.kind === 'node' ? p.completedNodes.includes(s.id) : !!p.missions[s.id]?.passedOn));
        if (!next) break;
        const status = stopStatus(next, p, at(9), worlds);
        expect({ stop: next.id, state: status.state, lock: status.lock }).toEqual({ stop: next.id, state: 'open', lock: undefined });
        p = mark(p, next);
      }
      expect(isWorldComplete(basics(worldsFor(plan, p)), p)).toBe(true);
      expect(isWorldUnlocked(homeWorld(worldsFor(plan, p)), p, worldsFor(plan, p))).toBe(true);

      // Complete World 2
      for (let guard = 0; guard < 100; guard++) {
        const worlds = worldsFor(plan, p);
        const w2 = homeWorld(worlds);
        const next = stopsOf(w2).find((s) => !(s.kind === 'lesson' ? p.readLessons.includes(s.id) : s.kind === 'node' ? p.completedNodes.includes(s.id) : !!p.missions[s.id]?.passedOn));
        if (!next) break;
        const status = stopStatus(next, p, at(9), worlds);
        expect({ stop: next.id, state: status.state, lock: status.lock }).toEqual({ stop: next.id, state: 'open', lock: undefined });
        p = mark(p, next);
      }
      const worlds = worldsFor(plan, p);
      for (const c of concerns) expect(firsts(homeWorld(worlds))).toContain(lessonOf(c));
      expect(isWorldComplete(homeWorld(worlds), p)).toBe(true);
      expect(isWorldUnlocked(worlds.find((x) => x.id === 'sidewalk')!, p, worlds)).toBe(true);
    });
  });
});

describe('the "calm hands and leash" Node in the first Basics Stretch', () => {
  const calm: Stop = { kind: 'node', id: 'calm-hands' };
  const howTo = ['howto-choose-action'];

  it('runs after the Stretch Lessons and before the choose-the-action Node', () => {
    expect(stopsOf(world('basics')).slice(0, 5).map((x) => x.id)).toEqual(['howto-choose-action', 'theory-named-behaviours', 'theory-dog-as-dog', 'calm-hands', 'dog-as-dog']);
    expect(findNode('calm-hands')!.mode).toBe('close_exercise');
  });

  it('opens once only the how-to-play Lesson is read, while the choose-the-action Node stays closed', () => {
    const p = progressOf([], { readLessons: howTo });
    expect(stopLock(calm, p)).toBeNull();
    expect(stopLock(calm, progressOf([]))).toMatchObject({ kind: 'stops', stops: [{ kind: 'lesson', id: 'howto-choose-action' }] });
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, p)).toMatchObject({ kind: 'stops' });
  });

  it('is done by a completion, which a skipped simulation records like a played one', () => {
    const p = progressOf(['calm-hands'], { readLessons: howTo });
    expect(stopStatus(calm, p, at(9)).state).toBe('done');
  });

  it('keeps the choose-the-action Node closed until calm-hands is complete', () => {
    const read = ['howto-choose-action', 'theory-named-behaviours', 'theory-dog-as-dog'];
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, progressOf([], { readLessons: read }))).toMatchObject({ kind: 'stops', stops: [calm] });
    expect(stopLock({ kind: 'node', id: 'dog-as-dog' }, progressOf(['calm-hands'], { readLessons: read }))).toBeNull();
    expect(MISSIONS.find((m) => m.id === 'mission-dog-as-dog')!.trains).toEqual([calm, { kind: 'node', id: 'dog-as-dog' }]);
  });

  it('stays in the first Basics Stretch for a Dog with biting and home Concerns, leaving World 1 as its 3 core Stretches', () => {
    let r = newDogRecord();
    r = setHomeConcern(r, 'bite-owner', 2);
    r = setHomeConcern(r, 'destroy', 1);
    const worlds = worldsFor(r.onboarding.plan, r);
    const first = worlds.find((w) => w.id === 'basics')!;
    const holders = first.stretches.filter((st) => st.some((x) => x.id === 'calm-hands'));
    expect(holders).toHaveLength(1);
    expect(holders[0].map((x) => x.id)[0]).toBe('howto-choose-action');
    const order = first.stretches.map((st) => st[0].id);
    expect(order).toEqual(['howto-choose-action', 'theory-home-rest', 'theory-calm-first']);
  });
});
