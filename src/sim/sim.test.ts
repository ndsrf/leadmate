import { defaultScenario, type ScenarioConfig } from './config';
import { createState, noInput, setPaused, tick, type SimEvent, type SimInput, type SimState } from './sim';
import { distance } from './vec';

const STEP = defaultScenario.fixedStep;

function scenario(overrides: Partial<ScenarioConfig> = {}): ScenarioConfig {
  return { ...defaultScenario, ...overrides };
}

/** No Distractor ever activates. */
const noDistractor = { ...defaultScenario.distractor, activateAfterMeters: 1e9 };

/** A Distractor that crosses right next to a Handler who stays at the start. */
const nearbyDistractor = {
  ...defaultScenario.distractor,
  path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } },
  activateAfterMeters: 0,
};

const move = (strength: number, x = 1, y = 0): SimInput => ({ direction: { x, y }, strength, marker: false });
const press: SimInput = { ...noInput, marker: true };

function run(state: SimState, seconds: number, input: SimInput | ((s: SimState) => SimInput) = noInput): SimEvent[] {
  const events: SimEvent[] = [];
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i++) {
    events.push(...tick(state, typeof input === 'function' ? input(state) : input));
  }
  return events;
}

function runUntil(state: SimState, type: SimEvent['type'], input: SimInput = noInput, maxSeconds = 30): SimEvent | undefined {
  for (let i = 0; i < maxSeconds / STEP; i++) {
    const found = tick(state, input).find((e) => e.type === type);
    if (found) return found;
  }
  return undefined;
}

describe('Handler movement', () => {
  // the Dog stays put and the leash is long, so only Handler speed matters
  const free = scenario({ leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor });

  it('walks at walk speed with strength 0.6', () => {
    const s = createState(1, free);
    run(s, 1, move(0.6));
    expect(s.handler.x).toBeCloseTo(1.2, 1);
  });

  it('moves at top speed with strength 1', () => {
    const s = createState(1, free);
    run(s, 1, move(1));
    expect(s.handler.x).toBeCloseTo(2.0, 1);
  });

  it('does not move with strength 0', () => {
    const s = createState(1, free);
    run(s, 2, move(0));
    expect(s.handler).toEqual(defaultScenario.handlerStart);
  });

  it('stops at the leash limit plus tolerance when moving away from a stationary Dog', () => {
    const s = createState(1, scenario({ dogGoalSpeed: 0, distractor: noDistractor, dogStart: { x: 0, y: 0 } }));
    run(s, 5, move(1));
    const limit = defaultScenario.leashLength + defaultScenario.leashTolerance;
    expect(distance(s.handler, s.dog)).toBeLessThanOrEqual(limit + 1e-9);
    expect(distance(s.handler, s.dog)).toBeCloseTo(limit, 1);
    expect(s.tension).toBe('rigid');
  });

  it('leaves Rigid Pull when the push stops', () => {
    const s = createState(1, scenario({ dogGoalSpeed: 0, distractor: noDistractor, dogStart: { x: 0, y: 0 } }));
    run(s, 5, move(1));
    expect(s.tension).toBe('rigid');
    run(s, 0.1, move(0));
    expect(s.tension).toBe('taut');
  });
});

describe('Poste', () => {
  it('locks the Handler and stops the Dog advancing when the leash is at its limit', () => {
    const s = createState(3, scenario({ distractor: noDistractor }));
    run(s, 6, move(0.6)); // the Dog outpaces a walk and reaches the leash limit
    expect(s.ratio).toBeGreaterThanOrEqual(0.99);

    const handler = { ...s.handler };
    const before = distance(s.handler, s.dog);
    run(s, 2, move(0));

    expect(s.handler).toEqual(handler);
    expect(distance(s.handler, s.dog)).toBeLessThanOrEqual(before + 1e-9);
    expect(s.ratio).toBeLessThanOrEqual(1 + 1e-6);
    expect(s.telemetry.rigidTime).toBe(0);
  });
});

describe('Drives', () => {
  it('gives the same Dog path for the same seed and inputs', () => {
    const path = (seed: number) => {
      const s = createState(seed, scenario({ distractor: noDistractor }));
      const out: number[] = [];
      for (let i = 0; i < 600; i++) {
        tick(s, move(0.6));
        if (i % 60 === 0) out.push(s.dog.x, s.dog.y);
      }
      return out;
    };
    expect(path(42)).toEqual(path(42));
    expect(path(42)).not.toEqual(path(43));
  });

  it('leads the Dog to the waypoint when the Handler keeps up', () => {
    const s = createState(7, scenario({ distractor: noDistractor }));
    const waypoint = defaultScenario.waypoint;
    let closest = Infinity;
    for (let i = 0; i < 100 / STEP && !s.ended; i++) {
      tick(s, { direction: { x: waypoint.x - s.handler.x, y: waypoint.y - s.handler.y }, strength: 1, marker: false });
      closest = Math.min(closest, distance(s.dog, waypoint));
    }
    expect(s.ended).toBe(true);
    expect(closest).toBeLessThan(defaultScenario.leashLength + defaultScenario.leashTolerance + defaultScenario.waypointRadius);
  });
});

describe('Fixation and Disengagement', () => {
  const near = () => createState(5, scenario({ distractor: nearbyDistractor }));

  it('starts a Fixation when the Distractor enters the trigger radius', () => {
    const s = near();
    expect(s.dogMode).toBe('goal');
    const fixation = runUntil(s, 'fixation-start');
    expect(fixation).toBeDefined();
    expect(s.dogMode).toBe('fixated');
  });

  it('disengages after the full calm period and opens a Reward Window of 1.1 s', () => {
    const s = near();
    const fixation = runUntil(s, 'fixation-start')!;
    const disengagement = runUntil(s, 'disengagement')!;
    expect(disengagement.time - fixation.time).toBeCloseTo(defaultScenario.calmSeconds, 1);
    const w = s.rewardWindow!;
    expect(w.closesAt - w.openedAt).toBeGreaterThanOrEqual(1.0);
    expect(w.closesAt - w.openedAt).toBeLessThanOrEqual(1.2);
  });

  it('restarts the calm period when the Handler moves', () => {
    // a slower Distractor, so there is time to restart the calm period and still complete it
    const s = createState(5, scenario({ distractor: { ...nearbyDistractor, speed: 2 } }));
    const fixation = runUntil(s, 'fixation-start')!;
    run(s, 2); // calm so far
    expect(s.calmElapsed).toBeGreaterThan(1.9);
    run(s, 0.1, move(0.6, 0, 1)); // Handler moves
    expect(s.calmElapsed).toBe(0);
    const disengagement = runUntil(s, 'disengagement')!;
    expect(disengagement.time - fixation.time).toBeGreaterThan(defaultScenario.calmSeconds + 2);
  });

  it('records a missed opportunity, with no Reward Window, if the Distractor leaves first', () => {
    const s = near();
    const events = run(s, 12, move(0.6, 0, 1));
    expect(events.some((e) => e.type === 'fixation-start')).toBe(true);
    expect(events.some((e) => e.type === 'disengagement')).toBe(false);
    expect(events.filter((e) => e.type === 'missed-opportunity')).toHaveLength(1);
    expect(s.telemetry.missedOpportunities).toBe(1);
    expect(s.rewardWindow).toBeNull();
    expect(s.dogMode).toBe('goal');
  });

  it('does not fixate again on the same Distractor', () => {
    const s = near();
    const events = run(s, 15);
    expect(events.filter((e) => e.type === 'fixation-start')).toHaveLength(1);
  });
});

describe('Marker', () => {
  const atDisengagement = () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'disengagement');
    return s;
  };

  it('records a hit with its accuracy and sends the Dog back to the Handler', () => {
    const s = atDisengagement();
    run(s, 0.3);
    const hit = tick(s, press).find((e) => e.type === 'marker-hit');
    expect(hit).toMatchObject({ type: 'marker-hit' });
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(1);
    expect(s.telemetry.hitAccuraciesMs[0]).toBeGreaterThanOrEqual(290);
    expect(s.telemetry.hitAccuraciesMs[0]).toBeLessThanOrEqual(330);
    expect(s.dogMode).toBe('returning');

    run(s, 3);
    expect(s.dogMode).toBe('goal');
    expect(s.rewardWindow).toBeNull();
  });

  it('records a miss when the Reward Window closes without a press', () => {
    const s = atDisengagement();
    const events = run(s, 1.5);
    expect(events.filter((e) => e.type === 'marker-miss')).toHaveLength(1);
    expect(s.telemetry.markerMisses).toBe(1);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
  });

  it('does not count a press after the window closed as a hit', () => {
    const s = atDisengagement();
    run(s, 1.5);
    tick(s, press);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
  });

  it('counts a press during Fixation as a reactive Marker, not a hit', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'fixation-start');
    const events = tick(s, press);
    expect(events.some((e) => e.type === 'marker-reactive')).toBe(true);
    expect(s.telemetry.reactiveMarkers).toBe(1);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
    expect(s.rewardWindow).toBeNull();
  });
});

describe('Stage flow', () => {
  it('ends when the Handler reaches the final waypoint', () => {
    const s = createState(1, scenario({ handlerStart: { x: 89, y: 0 }, dogStart: { x: 89.5, y: 0 }, distractor: noDistractor }));
    const events = run(s, 1);
    expect(s.ended).toBe(true);
    expect(events.filter((e) => e.type === 'stage-end')).toHaveLength(1);
  });

  it('ends at the time limit and ignores the waypoint then', () => {
    const s = createState(
      1,
      scenario({ handlerStart: { x: 89, y: 0 }, dogStart: { x: 89.5, y: 0 }, distractor: noDistractor, endCondition: { kind: 'time-limit', seconds: 5 } }),
    );
    run(s, 4.5);
    expect(s.ended).toBe(false);
    run(s, 1);
    expect(s.ended).toBe(true);
    expect(s.time).toBeLessThan(5.1);
  });

  it('lets no time pass while paused', () => {
    const s = createState(1, scenario({ distractor: noDistractor }));
    run(s, 1, move(1));
    setPaused(s, true);
    const frozen = { time: s.time, handler: { ...s.handler }, dog: { ...s.dog } };
    run(s, 5, move(1));
    expect({ time: s.time, handler: s.handler, dog: s.dog }).toEqual(frozen);
    setPaused(s, false);
    run(s, 1, move(1));
    expect(s.time).toBeCloseTo(frozen.time + 1, 1);
  });

  it('starts every Stage fresh, with nothing carried over', () => {
    const first = createState(9);
    run(first, 5, move(1));
    const second = createState(9);
    expect(second.time).toBe(0);
    expect(second.handler).toEqual(defaultScenario.handlerStart);
    expect(second.telemetry.hitAccuraciesMs).toHaveLength(0);
  });
});
