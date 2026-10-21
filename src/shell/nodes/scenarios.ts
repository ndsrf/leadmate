import type { DistractorConfig, ScenarioConfig } from '../../sim/config';
import { defaultScenario } from '../../sim/config';
import type { SceneryItem, SceneryTheme, Wall } from '../../sim/geometry';
import { routePoints, scatterScenery } from '../../sim/scenery';
import type { Vec2 } from '../../sim/vec';
import type { Weights } from '../dogRecord';
import { pullFromWeights } from '../onboarding/weights';

/** The Stages of the four Worlds, as scenario overrides (plain data: waypoints, walls, scenery, Distractors). */

const p = (x: number, y: number): Vec2 => ({ x, y });

/** A hand-placed prop; `angle` turns a long one (0 runs along the x axis). */
const prop = (type: string, x: number, y: number, angle?: number): SceneryItem => (angle === undefined ? { type, pos: p(x, y) } : { type, pos: p(x, y), angle });

/** The four walls of a rectangle. */
function box(x0: number, y0: number, x1: number, y1: number): Wall[] {
  return [
    { from: p(x0, y0), to: p(x1, y0) },
    { from: p(x1, y0), to: p(x1, y1) },
    { from: p(x1, y1), to: p(x0, y1) },
    { from: p(x0, y1), to: p(x0, y0) },
  ];
}

/** A Distractor on a fixed path across the route. */
function crossing(kind: DistractorConfig['kind'], speed: number, from: Vec2, to: Vec2, extra: Partial<DistractorConfig> = {}): DistractorConfig {
  return { ...defaultScenario.distractor, kind, speed, path: { from, to }, triggerRadius: 14, activateAfterMeters: 12, ...extra };
}

/** Food on the ground: it does not move, but it is salient. */
function food(at: Vec2, extra: Partial<DistractorConfig> = {}): DistractorConfig {
  return { ...defaultScenario.distractor, kind: 'food', speed: 0, salience: 6, path: { from: at, to: at }, triggerRadius: 6, activateAfterMeters: 12, ...extra };
}

interface StageSpec {
  world: number;
  theme: SceneryTheme;
  /** The Handler's start, then the corridor points, then the end. */
  route: Vec2[];
  walls?: Wall[];
  scenery?: SceneryItem[];
  /** Extra props beyond the density minimum, e.g. parked cars as shields. */
  seed: number;
  scatter?: { types?: readonly string[]; offset?: { min: number; max: number }; clearance?: number };
  distractors: DistractorConfig[];
  cues?: ScenarioConfig['cues'];
  leashLength?: number;
}

function stage(spec: StageSpec): ScenarioConfig {
  const [handlerStart, ...rest] = spec.route;
  const waypoint = rest[rest.length - 1];
  const waypoints = rest.slice(0, -1);
  const walls = spec.walls ?? [];
  const base: ScenarioConfig = {
    ...defaultScenario,
    world: spec.world,
    theme: spec.theme,
    handlerStart,
    dogStart: { x: handlerStart.x + 1, y: handlerStart.y },
    waypoint,
    waypoints,
    walls,
    cues: spec.cues ?? ['lets-go'],
    distractor: spec.distractors[0],
    moreDistractors: spec.distractors.slice(1),
    leashLength: spec.leashLength ?? defaultScenario.leashLength,
    scenery: [],
  };
  const scatter = scatterScenery(spec.theme, routePoints(base), spec.seed, walls, { ...spec.scatter, existing: spec.scenery });
  return { ...base, scenery: [...(spec.scenery ?? []), ...scatter] };
}

// -- World 1: Home & Thresholds (indoors) ---------------------------------------------------------

/** The scenario with the Handler's `pullStrength` set from the Dog's and Handler's weights (0.8 when not entered). */
export function withPull<T extends Partial<ScenarioConfig>>(scenario: T, weights: Weights): T & { pullStrength: number } {
  return { ...scenario, pullStrength: pullFromWeights(weights.dogKg, weights.handlerKg) };
}

/** A narrow apartment hallway. */
export const HALLWAY: ScenarioConfig = stage({
  world: 1,
  theme: 'indoor_apartment',
  route: [p(0, 0), p(14, 0)],
  walls: [{ from: p(-1, -1.7), to: p(15, -1.7) }, { from: p(-1, 1.7), to: p(15, 1.7) }, { from: p(15, -1.7), to: p(15, 1.7) }],
  seed: 11,
  // set pieces along the walls, scatter fills in between
  scenery: [prop('plant', 1.8, -1.25), prop('shoe_rack', 3.4, 1.25, 0), prop('coat_rack', 6, -1.25), prop('cabinet', 9, 1.25, 0), prop('shelf', 11.6, -1.25, 0)],
  scatter: { offset: { min: 0.95, max: 1.25 } },
  distractors: [{ ...defaultScenario.distractor, activateAfterMeters: 1e9 }],
});

/** The building elevator and the landing in front of it. */
export const ELEVATOR_LOBBY: ScenarioConfig = stage({
  world: 1,
  theme: 'indoor_apartment',
  route: [p(0, 0), p(8, 0)],
  walls: box(-1.5, -2.2, 9.5, 2.2),
  seed: 12,
  scenery: [prop('plant', 0.6, -1.8), prop('sofa', 3.4, 1.75, 0), prop('shelf', 6.2, -1.75, 0), prop('umbrella_stand', 8.5, 1.8), prop('elevator_panel', 9.2, 0)],
  scatter: { offset: { min: 1.0, max: 1.6 } },
  distractors: [{ ...defaultScenario.distractor, activateAfterMeters: 1e9 }],
});

// -- World 2: The Quiet Sidewalk ---------------------------------------------------------------------

/** A sidewalk that turns a corner around a building: whatever comes is hidden until the bend. */
export const BLIND_CORNER: ScenarioConfig = stage({
  world: 2,
  theme: 'quiet_suburb',
  route: [p(0, 0), p(30, 0), p(30, 32)],
  walls: [
    ...box(8, 5, 25, 26), // the building on the inside of the bend
    { from: p(-4, -4.5), to: p(35, -4.5) }, // fence along the far side
    { from: p(35, -4.5), to: p(35, 36) },
  ],
  seed: 21,
  scenery: [prop('bench', 10, -3.2, 0), prop('bin', 11.8, -3.2), prop('mailbox', 18, -3.1), prop('lamp_post', 24, -3.2), prop('mailbox_row', 33.2, 14, Math.PI / 2)],
  scatter: { offset: { min: 2.6, max: 4 } },
  distractors: [crossing('bicycle', 3.5, p(30.5, 30), p(30.5, -2), { activateAfterMeters: 14, triggerRadius: 16 })],
});

/** A long sidewalk walked in gentle arcs; two passers-by, and a Go Sniff to ease the tension. */
export const SLACK_U: ScenarioConfig = stage({
  world: 2,
  theme: 'quiet_suburb',
  route: [p(0, 0), p(22, 0), p(22, 16), p(46, 16), p(46, 34)],
  walls: [{ from: p(-4, -5), to: p(27, -5) }, { from: p(27, -5), to: p(27, 11) }, { from: p(27, 11), to: p(51, 11) }, { from: p(51, 11), to: p(51, 39) }],
  seed: 22,
  scenery: [prop('bench', 8, -3, 0), prop('bin', 9.8, -3), prop('conifer', 16, -3.2), prop('flower_bed', 30, 13.6, 0), prop('garden_gnome', 38.5, 13.7), prop('bench', 49, 28, Math.PI / 2)],
  scatter: { offset: { min: 2.6, max: 4 } },
  distractors: [
    crossing('child', 1.8, p(14, -14), p(14, 14), { activateAfterMeters: 6, triggerRadius: 10 }),
    crossing('dog', 2.4, p(38, 4), p(38, 28), { activateAfterMeters: 38, triggerRadius: 12 }),
  ],
});

// -- World 3: Urban Navigations ----------------------------------------------------------------------

const PARKED = (x: number, y: number): SceneryItem => ({ type: 'parked_car', pos: p(x, y), visualShield: true, radius: 1.4 });

/** Introduces "Leave It": food on the pavement, and only that button. */
export const LEAVE_IT_INTRO: ScenarioConfig = stage({
  world: 3,
  theme: 'urban_street',
  route: [p(0, 0), p(60, 0)],
  walls: [{ from: p(-4, -6), to: p(64, -6) }, { from: p(-4, 6), to: p(64, 6) }],
  cues: ['leave-it'],
  seed: 31,
  scenery: [prop('bus_stop', 12, -4.2, 0), prop('kiosk', 36, 4.3), prop('bike_rack', 50, -4.2, 0), prop('trash_can', 22, 4.6)],
  scatter: { offset: { min: 3.5, max: 5 } },
  distractors: [food(p(30, 1.5)), food(p(48, -1.5), { activateAfterMeters: 40 })],
});

/** A scooter at 4.5 m/s comes out from behind a parked car; both Cues are on the HUD. */
export const SCOOTER_CROSSING: ScenarioConfig = stage({
  world: 3,
  theme: 'urban_street',
  route: [p(0, 0), p(70, 0)],
  walls: [{ from: p(-4, -7), to: p(74, -7) }, { from: p(-4, 7), to: p(74, 7) }],
  cues: ['lets-go', 'leave-it'],
  seed: 32,
  scenery: [PARKED(36, -3.6), PARKED(36, 3.6), PARKED(12, -3.6), prop('hydrant', 24, 5.6), prop('bike_rack', 56, -5.2, 0), prop('bin', 62, 5.4)],
  scatter: { offset: { min: 4, max: 5.5 } },
  distractors: [crossing('skateboard', 4.5, p(40, -22), p(40, 22), { activateAfterMeters: 20, triggerRadius: 16 })],
});

/** Everything at once: food, a scooter and a dog. Choose the Cue that fits. */
export const URBAN_MIX: ScenarioConfig = stage({
  world: 3,
  theme: 'urban_street',
  route: [p(0, 0), p(40, 0), p(40, 30), p(80, 30)],
  walls: [
    { from: p(-4, -6), to: p(46, -6) },
    { from: p(46, -6), to: p(46, 24) },
    { from: p(46, 24), to: p(84, 24) },
    { from: p(-4, 6), to: p(34, 6) },
    { from: p(34, 6), to: p(34, 36) },
    { from: p(34, 36), to: p(84, 36) },
  ],
  cues: ['lets-go', 'leave-it'],
  seed: 33,
  scenery: [PARKED(20, -3.6), PARKED(37.5, 18), PARKED(60, 33.4), prop('bench', 10, -3.6, 0), prop('kiosk', 28, 3.6), prop('sign', 60, 27), prop('trash_can', 72, 27.2)],
  scatter: { offset: { min: 4, max: 5.2 } },
  distractors: [
    food(p(22, 1), { activateAfterMeters: 12 }),
    crossing('skateboard', 4.5, p(30, -18), p(30, 18), { activateAfterMeters: 26, triggerRadius: 14 }),
    crossing('dog', 2.6, p(44, 20), p(36, 42), { activateAfterMeters: 52, triggerRadius: 12 }),
  ],
});

// -- World 4: Fast Wheels & High Arousal ---------------------------------------------------------------

const PARK_LEASH = 3;
/** Scatter keeps this far from the route in the park: a leash length and a body. */
const PARK_CLEARANCE = PARK_LEASH + 0.6;

/** An open park with a 3 m leash; a jogger shoots out of nowhere. */
export const PARK_JOGGER: ScenarioConfig = stage({
  world: 4,
  theme: 'open_park',
  route: [p(0, 0), p(50, 0), p(90, 20)],
  walls: [],
  seed: 41,
  scenery: [prop('picnic_table', 20, -6.5, 0), prop('bench', 23.4, -6.5, 0), prop('fountain', 30, 7.5), prop('kiosk', 70, 4)],
  scatter: { offset: { min: 4, max: 9 }, clearance: PARK_CLEARANCE },
  leashLength: PARK_LEASH,
  distractors: [crossing('other', 3.6, p(42, -10), p(42, 14), { activateAfterMeters: 30, triggerRadius: 12 })],
});

/** The busy park: a jogger, a bicycle, food on the path. Both Cues, 3 m leash. */
export const PARK_MIX: ScenarioConfig = stage({
  world: 4,
  theme: 'open_park',
  route: [p(0, 0), p(40, 0), p(70, 24), p(110, 24)],
  walls: [],
  cues: ['lets-go', 'leave-it'],
  seed: 42,
  scenery: [prop('picnic_table', 15, 6.5, 0), prop('fountain', 30, -7.5), prop('bench', 56, 8, 0), prop('kiosk', 90, 18)],
  scatter: { offset: { min: 4, max: 9 }, clearance: PARK_CLEARANCE },
  leashLength: PARK_LEASH,
  distractors: [
    crossing('other', 3.8, p(28, -12), p(28, 14), { activateAfterMeters: 18, triggerRadius: 12 }),
    food(p(60, 17), { activateAfterMeters: 50 }),
    crossing('bicycle', 5, p(95, 40), p(95, 10), { activateAfterMeters: 85, triggerRadius: 16 }),
  ],
});
