import { es } from '../i18n';
import { requiredCue } from '../sim/config';
import { BODY_RADIUS, closestOnSegment, hasLineOfSight, routeLength } from '../sim/geometry';
import { runScripted } from '../sim/harness';
import { requiredProps, routePoints, validateScenario } from '../sim/scenery';
import { activeDistractor, currentTarget, routeOf, type SimInput, type SimState } from '../sim/sim';
import { distance, normalize, sub } from '../sim/vec';
import {
  BLIND_CORNER_NODE, DOORBELL_MAT_NODE, HARNESS_RITUAL_NODE, LEAVE_IT_NODE, NODES, PARK_JOGGER_NODE, PARK_MIX_NODE, POSTE_PRACTICE, SCOOTER_NODE, SLACK_U_NODE, URBAN_MIX_NODE, WALK_DISTRACTION,
} from './nodes/content';
import { isAvailable, type NodeDef } from './nodes/node';
import { currentWorld, findWorld, isNodeOpen, isWorldComplete, isWorldUnlocked, nodesOfWorld, WORLDS, worldOfNode } from './world';
import type { ScenarioConfig } from '../sim/config';
import { defaultScenario } from '../sim/config';

const ids = (n: readonly NodeDef[]) => n.map((x) => x.id);
const world = (id: string) => findWorld(id)!;
const allOf = (...worlds: string[]) => worlds.flatMap((w) => world(w).nodes);

describe('World unlocking', () => {
  it('has four sequential Worlds, each unlocked by the one before', () => {
    expect(WORLDS.map((w) => w.worldNumber)).toEqual([1, 2, 3, 4]);
    expect(WORLDS.map((w) => w.unlockedBy)).toEqual([undefined, 'home', 'sidewalk', 'urban']);
  });

  it('keeps World 1 open and the rest locked for a new Dog', () => {
    expect(isWorldUnlocked(world('home'), [])).toBe(true);
    for (const id of ['sidewalk', 'urban', 'park']) expect(isWorldUnlocked(world(id), [])).toBe(false);
  });

  it('keeps World 2 locked until every Node of World 1 is completed', () => {
    const partial = world('home').nodes.slice(0, -1);
    expect(isWorldUnlocked(world('sidewalk'), partial)).toBe(false);
    expect(isWorldUnlocked(world('sidewalk'), world('home').nodes)).toBe(true);
    expect(isWorldComplete(world('home'), partial)).toBe(false);
  });

  it('opens one World at a time, never skipping ahead', () => {
    const home = allOf('home');
    expect(isWorldUnlocked(world('urban'), home)).toBe(false);
    expect(isWorldUnlocked(world('urban'), allOf('home', 'sidewalk'))).toBe(true);
    // finishing World 2's Nodes without World 1 does not open World 3
    expect(isWorldUnlocked(world('urban'), allOf('sidewalk'))).toBe(false);
    expect(isWorldUnlocked(world('park'), allOf('home', 'sidewalk', 'urban'))).toBe(true);
  });

  it('puts every Node in exactly one World', () => {
    const all = WORLDS.flatMap((w) => w.nodes);
    expect(new Set(all).size).toBe(all.length);
    expect(all.sort()).toEqual(ids(NODES).sort());
    for (const node of NODES) expect(worldOfNode(node.id)).toBeDefined();
    for (const w of WORLDS) expect(nodesOfWorld(w)).toHaveLength(w.nodes.length);
  });

  it('opens a Node only when its World is open and its own prerequisites are done', () => {
    expect(isNodeOpen(HARNESS_RITUAL_NODE, [])).toBe(true);
    expect(isNodeOpen(DOORBELL_MAT_NODE, [])).toBe(false); // needs the harness first
    expect(isNodeOpen(WALK_DISTRACTION, [POSTE_PRACTICE.id])).toBe(false); // World 2 is locked
    expect(isNodeOpen(WALK_DISTRACTION, [...allOf('home')])).toBe(true);
    expect(isNodeOpen(LEAVE_IT_NODE, allOf('home'))).toBe(false);
    expect(isNodeOpen(LEAVE_IT_NODE, allOf('home', 'sidewalk'))).toBe(true);
  });

  it('opens the map on the first World that is not complete', () => {
    expect(currentWorld([]).id).toBe('home');
    expect(currentWorld(allOf('home')).id).toBe('sidewalk');
    expect(currentWorld(allOf('home', 'sidewalk', 'urban', 'park')).id).toBe('park');
  });

  it('titles every World from the catalog', () => {
    for (const w of WORLDS) expect(es[w.title]).toBeTruthy();
  });
});

describe('Node content of every World', () => {
  it.each(NODES.map((n) => [n.id, n] as const))('%s has all its text in the catalog and one right answer', (_id, node) => {
    const keys = [node.title, ...node.primerCards, node.checkpoint.question, ...node.checkpoint.options.map((o) => o.text), ...node.exercises.map((e) => e.key)];
    for (const key of keys) expect(es[key]).toBeTruthy();
    expect(node.primerCards.length).toBeGreaterThanOrEqual(3);
    expect(node.primerCards.length).toBeLessThanOrEqual(5);
    expect(node.checkpoint.options.filter((o) => o.correct)).toHaveLength(1);
    expect(node.exercises.length).toBeGreaterThan(0);
  });

  it('only lists prerequisites that exist and never loops', () => {
    for (const node of NODES) for (const id of node.prerequisites) expect(ids(NODES)).toContain(id);
    // everything becomes reachable by completing Nodes in order
    const done: string[] = [];
    for (let guard = 0; guard < 50 && done.length < NODES.length; guard++) {
      const next = NODES.find((n) => !done.includes(n.id) && isNodeOpen(n, done));
      if (!next) break;
      done.push(next.id);
    }
    expect(done).toHaveLength(NODES.length);
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
  return (s: SimState): SimInput => {
    const target = currentTarget(s);
    const direction = normalize(sub(target, s.handler));
    const stand = s.dogMode === 'fixated' || s.dogMode === 'holding';
    const cue = s.dogMode === 'fixated' && s.config.cues.length > 0;
    const wanted = requiredCue(activeDistractor(s));
    return {
      direction,
      strength: stand ? 0 : s.ratio >= 1 ? 0.3 : 1,
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
