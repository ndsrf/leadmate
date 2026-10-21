import { defaultScenario, type ScenarioConfig } from './config';
import { leashPath } from './geometry';
import { createState, noInput, tick, type SimEvent, type SimInput, type SimState } from './sim';
import { propWalls } from './scenery';
import { runScripted } from './harness';
import { distance } from './vec';

const STEP = defaultScenario.fixedStep;
const noDistractor = { ...defaultScenario.distractor, activateAfterMeters: 1e9 };
const at = (type: string, x: number, y: number, extra = {}) => ({ type, pos: { x, y }, ...extra });

/** A Stage with a long leash and a Dog that stays put, so only the Handler's collision matters. */
function stage(overrides: Partial<ScenarioConfig> = {}): ScenarioConfig {
  return { ...defaultScenario, leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor, walls: [], scenery: [], ...overrides };
}

const move = (x: number, y: number, strength = 1): SimInput => ({ direction: { x, y }, strength, marker: false });

function run(state: SimState, seconds: number, input: SimInput | ((s: SimState) => SimInput) = noInput): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++) events.push(...tick(state, typeof input === 'function' ? input(state) : input));
  return events;
}

describe('Obstacles block the Handler', () => {
  it('stops the Handler at the footprint edge of a bench', () => {
    const s = createState(1, stage({ scenery: [at('bench', 5, 0, { angle: Math.PI / 2 })] }));
    run(s, 6, move(1, 0));
    expect(s.handler.x).toBeLessThan(5);
    expect(s.handler.x).toBeGreaterThan(5 - 0.35);
  });

  it('slides along the edge when moving sideways into it', () => {
    const s = createState(1, stage({ scenery: [at('bench', 5, 0, { angle: Math.PI / 2 })] }));
    run(s, 4, move(1, 0));
    const y0 = s.handler.y;
    run(s, 0.3, move(1, 1));
    expect(s.handler.y).toBeGreaterThan(y0 + 0.2);
    expect(s.handler.x).toBeLessThan(5);
  });

  it('goes around a round prop and never into it', () => {
    const tree = at('tree', 5, 0);
    const s = createState(1, stage({ scenery: [tree] }));
    let closest = Infinity;
    run(s, 8, (st) => {
      closest = Math.min(closest, distance(st.handler, tree.pos));
      return move(1, 0.05);
    });
    expect(closest).toBeGreaterThanOrEqual(0.35 + 0.3 - 0.02);
    expect(s.handler.x).toBeGreaterThan(6);
  });

  it('is not slowed by a walkable prop', () => {
    const s = createState(1, stage({ theme: 'indoor_apartment', scenery: [at('dog_bed', 3, 0), at('door', 4, 0)] }));
    run(s, 3, move(1, 0));
    expect(s.handler.x).toBeCloseTo(6, 0);
  });

  it('emits no event and changes no score when bumping', () => {
    const blocked = stage({ scenery: [at('bench', 4, 0, { angle: Math.PI / 2 })] });
    const free = stage();
    const a = runScripted(1, () => move(1, 0), blocked, 8);
    const b = runScripted(1, () => move(1, 0), free, 8);
    expect(a.events.map((e) => e.type)).toEqual(b.events.map((e) => e.type));
    expect(a.payload.handlingScore).toBe(b.payload.handlingScore);
  });

  it('is the same for the same seed and input', () => {
    const config = stage({ scenery: [at('tree', 5, 0.2), at('bench', 3, 2)], dogGoalSpeed: 1.6, leashLength: 2 });
    const a = runScripted(7, () => move(1, 0.1), config, 20);
    const b = runScripted(7, () => move(1, 0.1), config, 20);
    expect(a.state.handler).toEqual(b.state.handler);
    expect(a.state.dog).toEqual(b.state.dog);
  });
});

describe('Obstacles block the Dog', () => {
  it('holds a Dog that heads straight for a tree at the edge', () => {
    const tree = at('tree', 3, 0);
    const config = stage({ leashLength: 100, dogGoalSpeed: 1.6, waypoint: { x: 20, y: 0 }, waypoints: [], wanderMaxAngle: 0, scenery: [tree] });
    const s = createState(1, config);
    let closest = Infinity;
    run(s, 4, (st) => {
      closest = Math.min(closest, distance(st.dog, tree.pos));
      return noInput;
    });
    expect(closest).toBeGreaterThanOrEqual(0.35 + 0.3 - 0.02);
  });
});

describe('the leash wraps around Obstacles', () => {
  it('measures the path around a lamp post between the Handler and the Dog', () => {
    const walls = propWalls([at('lamp_post', 0, 0)]);
    const path = leashPath({ x: -1, y: 0 }, { x: 1, y: 0 }, walls);
    expect(path.points.length).toBeGreaterThan(2);
    expect(path.length).toBeGreaterThan(2);
  });

  it('raises the Tension Ratio when a post is between them', () => {
    const config = stage({ leashLength: 2.2, scenery: [at('lamp_post', 0, 0)], handlerStart: { x: -1, y: 0 }, dogStart: { x: 1, y: 0 }, waypoint: { x: 30, y: 0 } });
    const open = createState(1, { ...config, scenery: [] });
    const wrapped = createState(1, config);
    expect(wrapped.ratio).toBeGreaterThan(open.ratio);
  });
});

describe('Obstacles do not affect sight', () => {
  it('lets the Dog see a Distractor past an Obstacle that is not a Visual Shield', () => {
    const base = stage({
      dogGoalSpeed: 0,
      dogStart: { x: 1, y: 0 },
      distractor: { ...defaultScenario.distractor, kind: 'skateboard', speed: 0, salience: 6, triggerRadius: 12, activateAfterMeters: 0, path: { from: { x: 6, y: 0 }, to: { x: 6, y: 0 } } },
    });
    const bench = createState(1, { ...base, scenery: [at('bench', 4, 0, { angle: Math.PI / 2 })] });
    run(bench, 3);
    expect(bench.arousal).toBeGreaterThan(0);
    const car = createState(1, { ...base, scenery: [at('parked_car', 4, 0, { angle: Math.PI / 2, visualShield: true, radius: 1.4 })] });
    run(car, 3);
    expect(car.arousal).toBe(0);
  });
});

describe('the Dog detours around an Obstacle that holds it up', () => {
  it('gets past a wide hedge across its way, with the Handler waiting', () => {
    const config = stage({
      leashLength: 3,
      dogGoalSpeed: 1.6,
      wanderMaxAngle: 0,
      handlerStart: { x: 0, y: 0 },
      dogStart: { x: 1, y: 0 },
      waypoint: { x: 12, y: 0 },
      scenery: [at('hedge', 3, 0, { angle: Math.PI / 2 })],
    });
    const s = createState(1, config);
    run(s, 40, (st) => ({ direction: { x: 1, y: 0 }, strength: st.ratio >= 1 ? 0.3 : 0.6, marker: false }));
    expect(s.dog.x).toBeGreaterThan(3.5);
    expect(Number.isFinite(s.dog.x) && Number.isFinite(s.handler.x)).toBe(true);
  });

  it('never produces a NaN when circling a prop on a taut leash', () => {
    const config = stage({ leashLength: 2, dogGoalSpeed: 1.6, waypoint: { x: 20, y: 0 }, scenery: [at('tree', 3, 0.2), at('bench', 6, 1)] });
    const s = createState(3, config);
    run(s, 60, move(1, 0.2, 0.6));
    expect(Number.isFinite(s.handler.x + s.handler.y + s.dog.x + s.dog.y)).toBe(true);
  });
});
