import { es } from '../i18n';
import { requiredCue } from '../sim/config';
import { BODY_RADIUS, closestOnSegment, hasLineOfSight, routeLength } from '../sim/geometry';
import { routeWalker, runScripted } from '../sim/harness';
import { requiredProps, routePoints, validateScenario } from '../sim/scenery';
import { activeDistractor, routeOf, type SimInput, type SimState } from '../sim/sim';
import { distance } from '../sim/vec';
import {
  BLIND_CORNER_NODE, DOORBELL_MAT_NODE, HARNESS_RITUAL_NODE, LEAVE_IT_NODE, NODES, PARK_JOGGER_NODE, PARK_MIX_NODE, POSTE_PRACTICE, SCOOTER_NODE, SLACK_U_NODE, URBAN_MIX_NODE, WALK_DISTRACTION,
} from './nodes/content';
import { isAvailable, primerCardOf, type NodeDef } from './nodes/node';
import { currentWorld, findWorld, isLastNodeOfStretch, isNodeOpen, isWorldComplete, isWorldUnlocked, missionOfStop, nodeIdsOf, nodesOfWorld, placeOfLesson, progressOf, sameStop, stopLock, stopsOf, stopStatus, WORLDS, worldOfNode, type Progress, type Stop, type WorldDef } from './world';
import { findNode } from './nodes/content';
import { findLesson } from './lessons/content';
import { MISSIONS } from './missions/content';
import type { MissionDef, MissionState } from './missions/mission';
import { migrateRecord } from './dogRecord';
import type { ScenarioConfig } from '../sim/config';
import { defaultScenario } from '../sim/config';

const ids = (n: readonly NodeDef[]) => n.map((x) => x.id);
const world = (id: string) => findWorld(id)!;
const nodesIn = (...worlds: string[]) => worlds.flatMap((w) => nodeIdsOf(world(w)));
const passed = (id: string): [string, MissionState] => [id, { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z', passedOn: '2026-05-02' }];
/** Progress with every Stop of these Worlds done: Nodes completed, Lessons read and Missions passed. */
const finished = (...worlds: string[]): Progress => {
  const stops = worlds.flatMap((w) => stopsOf(world(w)));
  return progressOf(nodesIn(...worlds), {
    readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
    missions: Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => passed(s.id))),
  });
};
const at = (h: number, day = 2) => new Date(2026, 4, day, h);

describe('World unlocking', () => {
  it('has eight sequential Worlds, each unlocked by the one before', () => {
    expect(WORLDS.map((w) => w.worldNumber)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(WORLDS.map((w) => w.unlockedBy)).toEqual([undefined, 'home', 'sidewalk', 'urban', 'park', 'recall', 'cafe', 'trails']);
  });

  it('designates Worlds 1-4 as playable free worlds and 5-8 as preview plus worlds', () => {
    const playable = WORLDS.filter((w) => !w.preview);
    const previews = WORLDS.filter((w) => w.preview);
    expect(playable.map((w) => w.id)).toEqual(['home', 'sidewalk', 'urban', 'park']);
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
    expect(isWorldUnlocked(world('home'), progressOf([]))).toBe(true);
    for (const id of ['sidewalk', 'urban', 'park', 'recall', 'cafe', 'trails', 'crowds']) expect(isWorldUnlocked(world(id), progressOf([]))).toBe(false);
  });

  it('keeps World 2 locked until every Stop of World 1 is done, its last Mission included', () => {
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
    // finishing World 2 without World 1 does not open World 3
    expect(isWorldUnlocked(world('urban'), finished('sidewalk'))).toBe(false);
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
    const harnessReady = progressOf([], { readLessons: ['theory-harness', 'howto-tap-hold'] });
    expect(isNodeOpen(HARNESS_RITUAL_NODE, harnessReady)).toBe(true);
    expect(isNodeOpen(HARNESS_RITUAL_NODE, progressOf([]))).toBe(false); // its theory Lesson comes first
    expect(isNodeOpen(DOORBELL_MAT_NODE, harnessReady)).toBe(false);
    expect(isNodeOpen(WALK_DISTRACTION, progressOf([POSTE_PRACTICE.id]))).toBe(false); // World 2 is locked
    const world2 = { ...finished('home'), readLessons: [...finished('home').readLessons, 'theory-loose-leash', 'howto-walking'] };
    expect(isNodeOpen(WALK_DISTRACTION, world2)).toBe(true);
    expect(isNodeOpen(LEAVE_IT_NODE, finished('home'))).toBe(false);
  });

  it('opens the map on the first World that is not complete', () => {
    expect(currentWorld(progressOf([])).id).toBe('home');
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
  const stretch1 = progressOf(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] });
  const started = (p: Progress, id: string, startedAt = at(9, 1)): Progress => ({ ...p, missions: { ...p.missions, [id]: { target: 'full', skipRun: 0, attempts: [], startedAt: startedAt.toISOString() } } });

  it('opens the Stops of a Stretch in order, naming the missing ones', () => {
    expect(stopStatus(lesson('theory-harness'), progressOf([]), at(9)).state).toBe('open');
    expect(stopStatus(node('harness-ritual'), progressOf([]), at(9))).toEqual({ state: 'locked', lock: { kind: 'stops', stops: [lesson('theory-harness'), lesson('howto-tap-hold')] } });
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
    let p = progressOf([]);
    const stops = world('home').stretches[0];
    for (const s of stops.slice(0, -1)) {
      expect(stopStatus(s, p, at(9)).state).toBe('open');
      p = s.kind === 'lesson' ? { ...p, readLessons: [...p.readLessons, s.id] } : { ...p, completedNodes: [...p.completedNodes, s.id] };
    }
    expect(stopStatus(stops[stops.length - 1], p, at(9)).state).toBe('open');
  });

  it('passes the gate once the Mission is passed', () => {
    const p = { ...stretch1, missions: Object.fromEntries([passed('mission-harness')]) };
    expect(stopStatus(lesson('theory-doorbell'), p, at(9)).state).toBe('open');
  });

  it('completes a Lesson Stop read from the Library, without passing a Mission before it', () => {
    const p = { ...started(stretch1, 'mission-harness'), readLessons: [...stretch1.readLessons, 'theory-doorbell'] };
    expect(stopStatus(lesson('theory-doorbell'), p, at(9)).state).toBe('done');
    expect(stopStatus(node('doorbell-mat'), p, at(9)).lock).toEqual({ kind: 'mission', id: 'mission-harness' });
    const passedP = { ...p, missions: Object.fromEntries([passed('mission-harness')]) };
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
    const p = { ...legacy, readLessons: ['theory-visual-shields'], missions: Object.fromEntries([passed('mission-leave-it')]) };
    expect(stopStatus(node('scooter-crossing'), p, at(9)).lock).toEqual({ kind: 'stops', stops: [node('calm-zone-intro')] });
    expect(stopStatus(node('calm-zone-intro'), p, at(9)).state).toBe('open');
    expect(stopStatus(node('scooter-crossing'), { ...p, readLessons: [] }, at(9)).lock).toEqual({ kind: 'stops', stops: [lesson('theory-visual-shields'), node('calm-zone-intro')] });
  });

  it('finds the Mission and the Stretch place of a Stop', () => {
    expect(missionOfStop(node('doorbell-mat'))).toBe('mission-doorbell');
    expect(placeOfLesson('howto-walking')).toEqual({ world: 2, stretch: 1 });
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
      if (missionsHere.length !== 1 || stops[stops.length - 1].kind !== 'mission') problems.push(`${where}: must end in exactly one Mission`);
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
    const ahead: MissionDef = { ...MISSIONS[0], generalFix: { ...MISSIONS[0].generalFix, practise: { kind: 'node', id: 'doorbell-mat' } } };
    expect(trailProblems([home], [ahead, ...MISSIONS.slice(1)]).some((p) => p.includes('ahead of it'))).toBe(true);
  });
});

describe('Node content of every World', () => {
  it.each(NODES.map((n) => [n.id, n] as const))('%s has all its text in the catalog and one right answer', (_id, node) => {
    const keys = [node.title, ...node.primerCards.map((c) => primerCardOf(c).text), node.checkpoint.question, ...node.checkpoint.options.map((o) => o.text), ...node.exercises.map((e) => e.key)];
    for (const key of keys) expect(es[key]).toBeTruthy();
    expect(node.primerCards.length).toBeGreaterThanOrEqual(1);
    expect(node.primerCards.length).toBeLessThanOrEqual(2);
    expect(node.checkpoint.options.filter((o) => o.correct)).toHaveLength(1);
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

describe('World 1: Home & Thresholds', () => {
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
    expect(scenario.world).toBe(1);
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

describe('World 2: The Quiet Sidewalk', () => {
  const nodes = nodesOfWorld(world('sidewalk'));

  it('is a suburban walk with Poste practice behind it and Go Sniff on offer', () => {
    expect(nodes.every((n) => n.mode === 'stage')).toBe(true);
    for (const n of nodes) {
      const c = scenarioOf(n);
      expect(c.theme).toBe('quiet_suburb');
      expect(c.world).toBeGreaterThanOrEqual(2); // Go Sniff is on from World 2
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

describe('World 3: Urban Navigations', () => {
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

describe('World 4: Fast Wheels & High Arousal', () => {
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
