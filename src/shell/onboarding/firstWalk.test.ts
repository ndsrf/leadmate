import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { requiredFor, routePoints, validateScenario } from '../../sim/scenery';
import { routeLength } from '../../sim/geometry';
import { createState, noInput, tick, type SimEvent, type SimInput, type SimState } from '../../sim/sim';
import { findNode, WALK_DISTRACTION } from '../nodes/content';
import { warmupScenario } from '../rusty';
import { tasteScenario } from './taste';
import { FIRST_WALK, FIRST_WALK_METERS, FIRST_WALK_PROPS_PER_METER, INTRO_NODE } from './introNode';

const scenario: ScenarioConfig = { ...defaultScenario, ...INTRO_NODE.simulation.scenario };

/** Walks at top speed towards the end; stops while the Dog is fixated or the Distractor is close, then goes on. */
function play(seed: number): { state: SimState; events: SimEvent[]; appearedAtMeters: number | null; endedAt: number } {
  const state = createState(seed, scenario);
  const events: SimEvent[] = [];
  let appearedAtMeters: number | null = null;
  let stoppedFor = 0;
  while (!state.ended && state.time < 60) {
    if (appearedAtMeters === null && state.distractor.active) appearedAtMeters = state.handler.x;
    const near = state.distractor.active && !state.distractor.finished && Math.hypot(state.distractor.pos.x - state.dog.x, state.distractor.pos.y - state.dog.y) < 8;
    const stop = near && stoppedFor < 4;
    if (stop) stoppedFor += state.config.fixedStep;
    const input: SimInput = stop ? noInput : { direction: { x: 1, y: 0 }, strength: 1, marker: events.some((e) => e.type === 'fixation-start') && state.time % 1 < 0.02 };
    events.push(...tick(state, input));
  }
  return { state, events, appearedAtMeters, endedAt: state.time };
}

describe('the guided first walk', () => {
  it('is 36 m long, while the default Stage stays at 90 m', () => {
    expect(scenario.waypoint).toEqual({ x: 36, y: 0 });
    expect(FIRST_WALK_METERS).toBe(36);
    expect(defaultScenario.waypoint).toEqual({ x: 90, y: 0 });
  });

  it('can be finished in under 25 s, stopping once for the Distractor', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const { state, endedAt } = play(seed);
      expect(state.ended).toBe(true);
      expect(endedAt).toBeLessThan(25);
    }
  });

  it('shows the Distractor around the middle of the route, and it crosses before the end', () => {
    const { appearedAtMeters, state } = play(1);
    expect(appearedAtMeters).not.toBeNull();
    expect(appearedAtMeters!).toBeGreaterThan(FIRST_WALK_METERS * 0.25);
    expect(appearedAtMeters!).toBeLessThan(FIRST_WALK_METERS * 0.75);
    expect(state.distractor.finished || state.distractor.consumed).toBe(true);
  });

  it('still lets the first-run hints trigger: a Fixation for the Marker, and the Poste at the leash limit', () => {
    const types = new Set<string>();
    for (const seed of [1, 2, 3, 4, 5]) for (const e of play(seed).events) types.add(e.type);
    expect(types.has('fixation-start')).toBe(true);
    // a Dog lunging at the Distractor takes the leash to its limit: the Handler stops there
    const state = createState(1, scenario);
    let atLimit = false;
    while (!state.ended && state.time < 40) {
      tick(state, { direction: { x: 1, y: 0 }, strength: 1, marker: false });
      if (Math.hypot(state.dog.x - state.handler.x, state.dog.y - state.handler.y) >= scenario.leashLength - 0.05) atLimit = true;
    }
    expect(atLimit).toBe(true);
  });

  it('has denser scenery than the default and a valid geometry', () => {
    const route = routePoints(scenario);
    const perMeter = scenario.scenery.length / routeLength(route);
    const defaultPerMeter = defaultScenario.scenery.length / routeLength(routePoints(defaultScenario));
    expect(perMeter).toBeGreaterThan(defaultPerMeter);
    expect(scenario.scenery.length).toBeGreaterThanOrEqual(Math.ceil(FIRST_WALK_METERS * FIRST_WALK_PROPS_PER_METER));
    expect(scenario.scenery.length).toBeGreaterThanOrEqual(requiredFor(scenario.theme, route));
    expect(validateScenario(scenario)).toEqual([]);
    expect(FIRST_WALK.scenery).toBe(scenario.scenery);
  });

  it('leaves the other Stages on their own routes', () => {
    expect(tasteScenario.waypoint).toEqual(defaultScenario.waypoint);
    expect(warmupScenario().waypoint).toEqual(defaultScenario.waypoint);
    expect(findNode(WALK_DISTRACTION.id)?.simulation.scenario).toBeUndefined();
    expect({ ...defaultScenario, ...WALK_DISTRACTION.simulation.scenario }.waypoint).toEqual({ x: 90, y: 0 });
  });
});
