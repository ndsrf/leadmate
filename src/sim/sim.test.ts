import { defaultScenario, type ScenarioConfig } from './config';
import { APPROACH_FACTOR, createState, isGoSniffAvailable, noInput, setPaused, tick, type SimEvent, type SimInput, type SimState } from './sim';
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

  it('starts a Fixation when Arousal from the Distractor reaches the reactivity threshold', () => {
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

describe('Marker in the Reactive tier', () => {
  it('awards no hit for a press while the Dog is Reactive, and counts it as a reactive Marker', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'fixation-start');
    expect(s.tier).toBe('reactive');
    const events = tick(s, press);
    expect(events.filter((e) => e.type === 'marker-reactive')).toHaveLength(1);
    expect(events.some((e) => e.type === 'marker-hit')).toBe(false);
    expect(s.telemetry.reactiveMarkers).toBe(1);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
  });

  it('counts a press from a Reactive Dog that is not fixated as reactive too', () => {
    const s = createState(1, scenario({ distractor: noDistractor }));
    s.arousal = 90;
    s.dogTraits = { ...s.dogTraits, reactivityThreshold: 24 };
    const events = tick(s, press);
    expect(events.some((e) => e.type === 'marker-reactive')).toBe(true);
    expect(s.telemetry.checkInHits).toBe(0);
  });
});

describe('Go Sniff', () => {
  const sniff: SimInput = { ...noInput, sniff: true };
  /** A Stage at the end of a Reward Window that closed unmarked: the Go Sniff offer is open. */
  const offered = (config: Partial<ScenarioConfig> = {}) => {
    const s = createState(5, scenario({ distractor: nearbyDistractor, ...config }));
    runUntil(s, 'disengagement');
    run(s, 1.3);
    return s;
  };

  /** Ticks (Handler standing) for `seconds`, returning the times at which the button was on offer. */
  const offerTimes = (s: SimState, seconds: number): number[] => {
    const times: number[] = [];
    for (let i = 0; i < Math.round(seconds / STEP); i++) {
      tick(s, noInput);
      if (isGoSniffAvailable(s)) times.push(s.time);
    }
    return times;
  };

  it('is offered for 3.0 s from the end of the Reward Window, after a Marker hit', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'disengagement');
    expect(isGoSniffAvailable(s)).toBe(false); // the Reward Window is still open
    tick(s, press);
    const hitAt = s.time;
    const times = offerTimes(s, 4);
    expect(times.length).toBeGreaterThan(0); // the Dog comes back to the Handler's side
    expect(times[0]).toBeGreaterThan(hitAt);
    expect(times[times.length - 1] - hitAt).toBeLessThanOrEqual(3.0 + STEP * 2);
  });

  it('opens when an unmarked Reward Window closes, and closes 3.0 s later', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'disengagement');
    run(s, 1.3);
    // keep the Dog beside the Handler so the leash stays Slack
    const stay = (st: SimState): SimInput => {
      st.dog = { ...st.handler };
      return noInput;
    };
    run(s, 0.1, stay);
    expect(isGoSniffAvailable(s)).toBe(true);
    run(s, 2.5, stay);
    expect(isGoSniffAvailable(s)).toBe(true);
    run(s, 0.8, stay);
    expect(isGoSniffAvailable(s)).toBe(false);
  });

  it('is not offered while the leash is not Slack', () => {
    const s = offered();
    s.dog = { x: s.handler.x + 1.8, y: s.handler.y };
    tick(s, noInput, 1e-6);
    expect(s.ratio).toBeGreaterThanOrEqual(0.85);
    expect(isGoSniffAvailable(s)).toBe(false);
  });

  it('never activates in World 1', () => {
    const s = offered({ world: 1 });
    expect(isGoSniffAvailable(s)).toBe(false);
    const events = tick(s, sniff);
    expect(events.some((e) => e.type === 'go-sniff-start')).toBe(false);
    expect(s.sniff).toBeNull();
    expect(s.telemetry.goSniffs).toBe(0);
  });

  it('shifts the Dog to a 0.4 m/s sniffing drive', () => {
    const s = offered();
    s.dog = { ...s.handler };
    const events = tick(s, sniff);
    expect(events.some((e) => e.type === 'go-sniff-start')).toBe(true);
    expect(s.dogMode).toBe('sniffing');
    const from = { ...s.dog };
    run(s, 1);
    expect(distance(from, s.dog)).toBeGreaterThan(0.3);
    expect(distance(from, s.dog)).toBeLessThanOrEqual(0.42);
  });

  it('decays Arousal at three times the standard rate', () => {
    const decay = (sniffing: boolean) => {
      const s = offered();
      s.dog = { ...s.handler };
      s.arousal = 50;
      if (sniffing) tick(s, sniff);
      const before = s.arousal;
      run(s, 1);
      return before - s.arousal;
    };
    expect(decay(true) / decay(false)).toBeCloseTo(3, 0);
  });

  it('ends after 4.0 s', () => {
    const s = offered();
    s.dog = { ...s.handler };
    s.arousal = 100;
    tick(s, sniff);
    const end = runUntil(s, 'go-sniff-end') as Extract<SimEvent, { type: 'go-sniff-end' }>;
    expect(end.reason).toBe('time');
    expect(s.sniff).toBeNull();
    expect(s.dogMode).toBe('goal');
  });

  it('ends at once when the leash reaches 0.85', () => {
    const s = offered();
    s.dog = { ...s.handler };
    s.arousal = 100;
    tick(s, sniff);
    s.dog = { x: s.handler.x + 1.8, y: s.handler.y };
    const events = tick(s, noInput, 1e-6);
    const end = events.find((e) => e.type === 'go-sniff-end') as Extract<SimEvent, { type: 'go-sniff-end' }>;
    expect(end.reason).toBe('tension');
    expect(s.dogMode).toBe('goal');
  });

  it('ends when Arousal reaches 0', () => {
    const s = offered();
    s.dog = { ...s.handler };
    s.arousal = 1;
    tick(s, sniff);
    const end = runUntil(s, 'go-sniff-end') as Extract<SimEvent, { type: 'go-sniff-end' }>;
    expect(end.reason).toBe('calm');
    expect(s.arousal).toBe(0);
  });
});

describe('walls', () => {
  const wall = { from: { x: 5, y: -20 }, to: { x: 5, y: 20 } };
  const free = { leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor };

  it('stops the Handler at a solid wall instead of passing through', () => {
    const s = createState(1, scenario({ ...free, walls: [wall] }));
    run(s, 6, move(1));
    expect(s.handler.x).toBeLessThan(5);
    expect(s.handler.x).toBeGreaterThan(4);
  });

  it('slides the Handler along a wall when moving at an angle', () => {
    const s = createState(1, scenario({ ...free, walls: [wall] }));
    run(s, 6, move(1, 1, 1));
    expect(s.handler.x).toBeLessThan(5);
    expect(s.handler.y).toBeGreaterThan(5);
  });

  it('stops the Dog at a wall too', () => {
    const s = createState(1, scenario({ leashLength: 100, dogGoalSpeed: 1.6, distractor: noDistractor, walls: [wall] }));
    run(s, 10);
    expect(s.dog.x).toBeLessThan(5);
  });

  it('measures tension along the leash path around a corner, not the straight line', () => {
    const corner = { from: { x: 3, y: -0.2 }, to: { x: 3, y: 20 } };
    const s = createState(1, scenario({ walls: [corner], leashLength: 10, handlerStart: { x: 1, y: 3 }, dogStart: { x: 5, y: 3 }, distractor: noDistractor, dogGoalSpeed: 0 }));
    tick(s, noInput);
    const around = 2 * Math.hypot(2, 3.2);
    expect(s.ratio).toBeCloseTo(around / 10, 2);
    expect(s.ratio).toBeGreaterThan(distance(s.handler, s.dog) / 10);
  });
});

describe('Cues', () => {
  const lets: SimInput = { ...noInput, cue: true, cueType: 'lets-go' };
  const leave: SimInput = { ...noInput, cue: true, cueType: 'leave-it' };
  const food = { ...nearbyDistractor, kind: 'food' as const, speed: 0, salience: 6, path: { from: { x: 3, y: 0 }, to: { x: 3, y: 0.0001 } } };
  const both = { cues: ['lets-go', 'leave-it'] as ScenarioConfig['cues'] };
  const fixatedOnFood = () => {
    const s = createState(5, scenario({ distractor: food, ...both }));
    runUntil(s, 'fixation-start');
    return s;
  };

  it('ignores a Cue that has no button in the Stage', () => {
    const s = createState(5, scenario({ distractor: noDistractor }));
    expect(tick(s, leave).some((e) => e.type === 'cue' || e.type === 'cue-mismatch')).toBe(false);
  });

  it('makes "Let\'s Go" ineffective on ground food', () => {
    const s = fixatedOnFood();
    const arousal = s.arousal;
    const events = tick(s, lets);
    expect(events.some((e) => e.type === 'cue-mismatch')).toBe(true);
    expect(events.some((e) => e.type === 'cue')).toBe(false);
    expect(s.dogMode).toBe('fixated');
    expect(s.arousal).toBeGreaterThanOrEqual(arousal - 0.1);
  });

  it('lets the Dog go cleanly on "Leave It" for food', () => {
    const s = fixatedOnFood();
    const arousal = s.arousal;
    const events = tick(s, leave);
    expect(events.some((e) => e.type === 'cue')).toBe(true);
    expect(events.some((e) => e.type === 'disengagement')).toBe(true);
    expect(s.dogMode).toBe('holding');
    expect(s.arousal).toBeLessThan(arousal - 20);
  });

  it('makes "Leave It" ineffective on a moving Distractor, and keeps the cooldown free', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor, ...both }));
    runUntil(s, 'fixation-start');
    expect(tick(s, leave).some((e) => e.type === 'cue-mismatch')).toBe(true);
    expect(tick(s, lets).some((e) => e.type === 'cue')).toBe(true);
  });

  it('works for "Let\'s Go" on a moving Distractor', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor, ...both }));
    runUntil(s, 'fixation-start');
    expect(tick(s, lets).some((e) => e.type === 'cue')).toBe(true);
  });
});

describe('route and schedule', () => {
  it('heads for the corridor waypoints in order before the end waypoint', () => {
    const s = createState(1, scenario({ waypoints: [{ x: 10, y: 0 }, { x: 10, y: 10 }], waypoint: { x: 30, y: 10 }, distractor: noDistractor }));
    expect(s.routeIndex).toBe(0);
    s.dog = { x: 9.5, y: 0 };
    s.handler = { x: 9, y: 0 };
    tick(s, noInput);
    expect(s.routeIndex).toBe(1);
    s.dog = { x: 10, y: 9.5 };
    tick(s, noInput);
    expect(s.routeIndex).toBe(2);
  });

  it('meets the next Distractor of the schedule once the first has passed', () => {
    const second = { ...nearbyDistractor, kind: 'bicycle' as const, path: { from: { x: 8, y: -12 }, to: { x: 8, y: 12 } } };
    const s = createState(5, scenario({ distractor: nearbyDistractor, moreDistractors: [second] }));
    run(s, 15, move(0.6, 0, 1));
    expect(s.distractorIndex).toBe(1);
    expect(s.distractor.from).toEqual({ x: 8, y: -12 });
  });

  it('breaks the Arousal when a visual shield blocks the line of sight', () => {
    const shield = { type: 'car', pos: { x: 1.5, y: 0 }, visualShield: true };
    const s = createState(1, scenario({ distractor: nearbyDistractor, scenery: [shield] }));
    s.dog = { x: 0, y: 0 };
    s.handler = { x: 0, y: 0 };
    s.distractor.active = true;
    s.distractor.pos = { x: 3, y: 0 };
    s.distractor.from = { x: 3, y: 0 };
    s.distractor.to = { x: 3, y: 1000 };
    tick(s, noInput, 0.05);
    expect(s.arousal).toBe(0);
  });
});

describe('stationary Distractors and spawn times', () => {
  const food = { ...defaultScenario.distractor, kind: 'food' as const, speed: 0, salience: 6, path: { from: { x: 20, y: 0 }, to: { x: 20, y: 0 } }, activateAfterMeters: 0 };

  it('keeps food where it is, and calls it done once the Dog has been near and moved on', () => {
    const s = createState(1, scenario({ distractor: food, handlerStart: { x: 12, y: 0 }, dogStart: { x: 13, y: 0 } }));
    run(s, 0.5);
    expect(s.distractor.pos).toEqual({ x: 20, y: 0 });
    expect(s.distractor.finished).toBe(false);
    s.dog = { x: 45, y: 0 };
    s.handler = { x: 44, y: 0 };
    tick(s, noInput);
    expect(s.distractor.finished).toBe(true);
  });

  it('moves on to the next Distractor of the schedule once the food has been handled', () => {
    const next = { ...nearbyDistractor, kind: 'bicycle' as const };
    const s = createState(1, scenario({ distractor: food, moreDistractors: [next], handlerStart: { x: 12, y: 0 }, dogStart: { x: 13, y: 0 } }));
    s.distractor.consumed = true;
    tick(s, noInput);
    tick(s, noInput);
    expect(s.distractorIndex).toBe(1);
  });

  it('holds a Distractor back until its spawn time', () => {
    const s = createState(1, scenario({ distractor: { ...nearbyDistractor, spawnAtSeconds: 5 } }));
    run(s, 4.5);
    expect(s.distractor.active).toBe(false);
    run(s, 1);
    expect(s.distractor.active).toBe(true);
  });
});

describe('tension-change events (shell hints)', () => {
  const tensions = (events: SimEvent[]) => events.flatMap((e) => (e.type === 'tension-change' ? [e.tension] : []));

  it('fires once per change of leash state, with the new state', () => {
    const s = createState(3, scenario({ distractor: noDistractor }));
    const events = run(s, 8, move(0.6));
    const seen = tensions(events);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen).toContain('taut');
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]);
  });

  it('starts from the state the Stage began in and reports only the changes after it', () => {
    const s = createState(3, scenario({ distractor: noDistractor }));
    expect(s.tension).toBe('slack');
    expect(tensions(run(s, 8, move(0.6)))[0]).toBe('taut');
  });

  it('does not change a replay: same seed and inputs give the same telemetry', () => {
    const play = (seed: number) => {
      const s = createState(seed, scenario({ distractor: nearbyDistractor }));
      run(s, 20, move(0.6));
      return { telemetry: s.telemetry, dog: s.dog, arousal: s.arousal };
    };
    expect(play(9)).toEqual(play(9));
  });

  it('reports a Fixation as an existing event so the Marker hint can come before the Reward Window', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    expect(runUntil(s, 'fixation-start')).toBeDefined();
  });
});

describe('dog-approaching event (first-run warning)', () => {
  const count = (events: SimEvent[]) => events.filter((e) => e.type === 'dog-approaching').length;
  const crossing = (kind: 'dog' | 'food' | 'child' | 'bicycle') => scenario({ distractor: { ...nearbyDistractor, kind, triggerRadius: 4 } });

  it('fires once for a dog, with the dog position', () => {
    const s = createState(1, crossing('dog'));
    const events = run(s, 30);
    expect(count(events)).toBe(1);
    const e = events.find((x) => x.type === 'dog-approaching');
    expect(e && e.type === 'dog-approaching' && e.position).toBeDefined();
  });

  it('never fires for another kind of Distractor', () => {
    for (const kind of ['food', 'child', 'bicycle'] as const) expect(count(run(createState(1, crossing(kind)), 30))).toBe(0);
  });

  it('does not fire before the dog is within the approach range', () => {
    const s = createState(1, crossing('dog'));
    const range = s.config.distractor.triggerRadius * APPROACH_FACTOR;
    let firedAt: number | null = null;
    for (let i = 0; i < 30 / STEP && firedAt === null; i++) {
      const fired = count(tick(s, noInput)) > 0;
      // the Distractor moved one step in that tick
      const far = distance(s.dog, s.distractor.pos) > range + s.config.distractor.speed * STEP;
      if (fired) firedAt = far ? -1 : i;
    }
    expect(firedAt).not.toBeNull();
    expect(firedAt).not.toBe(-1);
  });
});

describe('dog-approaching edge cases', () => {
  it('stays silent for a dog that stands still or is already within its trigger radius', () => {
    const still = { ...nearbyDistractor, kind: 'dog' as const, speed: 0, path: { from: { x: 4, y: 0 }, to: { x: 4, y: 0 } } };
    const events = run(createState(1, scenario({ distractor: still })), 5);
    expect(events.some((e) => e.type === 'dog-approaching')).toBe(false);
  });
});
