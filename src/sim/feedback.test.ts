import { defaultScenario, type ScenarioConfig } from './config';
import { runScripted } from './harness';
import { createState, isDogLooking, noInput, tick, type SimEvent, type SimInput, type SimState } from './sim';

const STEP = defaultScenario.fixedStep;
const scenario = (o: Partial<ScenarioConfig> = {}): ScenarioConfig => ({ ...defaultScenario, ...o });
const slowCheckIns = { ...defaultScenario.ranges, checkInMeanInterval: { worst: 1e9, best: 1e9 } };
const fastCheckIns = { ...defaultScenario.ranges, checkInMeanInterval: { worst: 5, best: 5 } };
/** Learning attributes with the given follow chance (it is the same number in progress terms). */
const withFollow = (followChance: number) => ({ ...defaultScenario.learning, attributes: { ...defaultScenario.learning.attributes, followChance } });
const noDistractor = { ...defaultScenario.distractor, activateAfterMeters: 1e9 };
const nearbyDistractor = {
  ...defaultScenario.distractor,
  path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } },
  activateAfterMeters: 0,
};
const move = (strength: number, x = 1, y = 0): SimInput => ({ direction: { x, y }, strength, marker: false });
const press: SimInput = { ...noInput, marker: true };

function run(state: SimState, seconds: number, input: SimInput | ((s: SimState) => SimInput) = noInput): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++) {
    events.push(...tick(state, typeof input === 'function' ? input(state) : input));
  }
  return events;
}

function runUntil(state: SimState, type: SimEvent['type'], input: SimInput = noInput, maxSeconds = 60): SimEvent | undefined {
  for (let i = 0; i < maxSeconds / STEP; i++) {
    const found = tick(state, input).find((e) => e.type === type);
    if (found) return found;
  }
  return undefined;
}

describe('Mark budget', () => {
  it('spends a Mark on a hit', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'disengagement');
    tick(s, press);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(1);
    expect(s.telemetry.marksUsed).toBe(1);
  });

  it('spends a Mark on a reactive press', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor }));
    runUntil(s, 'fixation-start');
    tick(s, press);
    expect(s.telemetry.reactiveMarkers).toBe(1);
    expect(s.telemetry.marksUsed).toBe(1);
  });

  it('spends a Mark on a wasted press and records nothing else', () => {
    const s = createState(5, scenario({ distractor: noDistractor, ranges: slowCheckIns }));
    const events = tick(s, press);
    expect(events.map((e) => e.type)).toEqual(['marker-wasted']);
    const t = s.telemetry;
    expect([t.marksUsed, t.hitAccuraciesMs.length, t.reactiveMarkers, t.checkInHits]).toEqual([1, 0, 0, 0]);
  });

  it('ignores presses once the budget is spent', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor, markBudget: 2 }));
    runUntil(s, 'fixation-start');
    tick(s, press);
    tick(s, press);
    const events = tick(s, press);
    expect(events).toEqual([]);
    expect(s.telemetry.marksUsed).toBe(2);
    expect(s.telemetry.reactiveMarkers).toBe(2);
  });

  it('cannot hit once the budget is spent', () => {
    const s = createState(5, scenario({ distractor: nearbyDistractor, markBudget: 0 }));
    runUntil(s, 'disengagement');
    tick(s, press);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
    expect(s.telemetry.marksUsed).toBe(0);
  });
});

describe('Check-in', () => {
  const quiet = scenario({ distractor: noDistractor, ranges: fastCheckIns });
  const glanceTimes = (seed: number) =>
    run(createState(seed, quiet), 40)
      .filter((e) => e.type === 'check-in-glance')
      .map((e) => e.time);

  it('glances at seeded moments: same seed, same glances', () => {
    const a = glanceTimes(3);
    expect(a.length).toBeGreaterThan(2);
    expect(glanceTimes(3)).toEqual(a);
    expect(glanceTimes(4)).not.toEqual(a);
  });

  it('makes the Dog look for the Check-in window', () => {
    const s = createState(3, quiet);
    runUntil(s, 'check-in-glance');
    expect(isDogLooking(s)).toBe(true);
    run(s, quiet.checkInWindow + 0.1);
    expect(isDogLooking(s)).toBe(false);
  });

  it('counts a press inside the window as a Check-in hit', () => {
    const s = createState(3, quiet);
    runUntil(s, 'check-in-glance');
    run(s, 0.5);
    const events = tick(s, press);
    expect(events.map((e) => e.type)).toContain('check-in-hit');
    expect(s.telemetry.checkInHits).toBe(1);
    expect(s.telemetry.marksUsed).toBe(1);
    expect(s.telemetry.hitAccuraciesMs).toHaveLength(0);
  });

  it('does not count a press after the window', () => {
    const s = createState(3, quiet);
    runUntil(s, 'check-in-glance');
    run(s, quiet.checkInWindow + 0.2);
    tick(s, press);
    expect(s.telemetry.checkInHits).toBe(0);
    expect(s.telemetry.marksUsed).toBe(1);
  });
});

describe('Follow after a turn', () => {
  /** Handler turns 90 degrees on Slack, then stops. */
  const turnThenStop = (s: SimState): SimInput => (s.time < 0.2 ? move(0.6, 0, 1) : noInput);
  const base = { distractor: noDistractor, ranges: slowCheckIns };

  it('follows the turn and looks at the Handler when the draw is below followChance', () => {
    const s = createState(1, scenario({ ...base, learning: withFollow(1) }));
    const events = run(s, 1, move(0.6, 0, 1));
    expect(events.filter((e) => e.type === 'dog-follow')).toHaveLength(1);
    expect(s.dog.y).toBeGreaterThan(0.5);
    expect(s.telemetry.checkInHits).toBe(0);
    expect(events.some((e) => e.type === 'dog-correction')).toBe(false);
  });

  it('lets a Check-in hit be earned right after the Dog follows', () => {
    const s = createState(1, scenario({ ...base, learning: withFollow(1) }));
    runUntil(s, 'dog-follow', move(0.6, 0, 1));
    expect(isDogLooking(s)).toBe(true);
    tick(s, { ...press, direction: { x: 0, y: 1 }, strength: 0.6 });
    expect(s.telemetry.checkInHits).toBe(1);
  });

  it('keeps its heading when it does not follow, until a Taut correction turns it', () => {
    const s = createState(1, scenario({ ...base, learning: withFollow(0) }));
    const events = run(s, 0.2, turnThenStop);
    expect(events.some((e) => e.type === 'dog-follow')).toBe(false);
    expect(s.dog.x).toBeGreaterThan(1.2); // still heading for the waypoint
    expect(s.correctionPending).not.toBeNull();

    const correction = runUntil(s, 'dog-correction', noInput, 10);
    expect(correction).toBeDefined();
    expect(s.steer?.dir).toEqual({ x: 0, y: 1 });
  });

  it('never reaches Rigid Pull through the correction', () => {
    const s = createState(1, scenario({ ...base, learning: withFollow(0) }));
    let maxRatio = 0;
    run(s, 8, (st) => {
      maxRatio = Math.max(maxRatio, st.ratio);
      return turnThenStop(st);
    });
    expect(s.telemetry.rigidTime).toBe(0);
    expect(maxRatio).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('ignores turns that are not on Slack', () => {
    const s = createState(1, scenario({ ...base, learning: withFollow(1), handlerStart: { x: 0, y: 0 }, dogStart: { x: 1.8, y: 0 } }));
    const events = run(s, 0.5, move(0.6, 0, 1));
    expect(events.some((e) => e.type === 'dog-follow')).toBe(false);
  });

  it('follows the same turns with the same seed', () => {
    const c = scenario({ ...base, learning: withFollow(0.5) });
    const zigzag = (s: SimState): SimInput => (Math.floor(s.time / 4) % 2 === 0 ? move(0.4, 0, 1) : move(0.4, 1, 0));
    const a = runScripted(7, zigzag, { ...c, endCondition: { kind: 'time-limit', seconds: 40 } });
    const b = runScripted(7, zigzag, { ...c, endCondition: { kind: 'time-limit', seconds: 40 } });
    expect(a.events.filter((e) => e.type === 'dog-follow').length).toBeGreaterThan(0);
    expect(b.events).toEqual(a.events);
    expect(b.state.dog).toEqual(a.state.dog);
  });
});

describe('Pulling the Dog', () => {
  const stuck = { distractor: noDistractor, dogGoalSpeed: 0, dogStart: { x: 0, y: 0 }, ranges: slowCheckIns };

  it('drags the Dog toward the Handler in Rigid Pull', () => {
    const s = createState(1, scenario(stuck));
    run(s, 5, move(1));
    expect(s.dog.x).toBeGreaterThan(1);
    expect(s.tension).toBe('rigid');
    expect(s.telemetry.rigidTime).toBeGreaterThan(2);
  });

  it('leaves the Dog unmoved with pull strength 0, yet still counts Rigid Pull', () => {
    const s = createState(1, scenario({ ...stuck, pullStrength: 0 }));
    run(s, 5, move(1));
    expect(s.dog).toEqual({ x: 0, y: 0 });
    expect(s.telemetry.rigidTime).toBeGreaterThan(2);
  });

  it('stops dragging when the Handler stops', () => {
    const s = createState(1, scenario(stuck));
    run(s, 3, move(1));
    const before = { ...s.dog };
    run(s, 1, noInput);
    expect(s.dog).toEqual(before);
  });
});

describe('Sintonía', () => {
  // the Dog stands still and the leash is long, so only the Handler's movement matters
  const free = scenario({ leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor });
  /** The Handler walks in a circle at `omega` rad/s. */
  const arc =
    (omega: number, strength = 0.6) =>
    (s: SimState): SimInput => ({ direction: { x: Math.cos(omega * s.time), y: Math.sin(omega * s.time) }, strength, marker: false });
  const types = (events: SimEvent[]) => events.map((e) => e.type);

  it('starts after 2.0 s of smooth curved walking on a Slack leash', () => {
    const s = createState(1, free);
    const events = run(s, 1.9, arc(1));
    expect(s.sintonia.active).toBe(false);
    events.push(...run(s, 0.4, arc(1)));
    expect(s.sintonia.active).toBe(true);
    expect(types(events)).toContain('sintonia-start');
  });

  it('does not start on a straight walk, which has no turning rate', () => {
    const s = createState(1, free);
    run(s, 6, move(0.6));
    expect(s.sintonia.active).toBe(false);
  });

  it('does not start when the Handler turns too fast', () => {
    const s = createState(1, free);
    run(s, 6, arc(2.5));
    expect(s.sintonia.active).toBe(false);
  });

  it('does not start when the Handler is too slow', () => {
    const s = createState(1, free);
    run(s, 6, arc(1, 0.15 / free.quickSpeed)); // 0.15 m/s
    expect(s.sintonia.active).toBe(false);
  });

  it('ends at once when the leash reaches Taut', () => {
    const s = createState(1, free);
    run(s, 3, arc(1));
    expect(s.sintonia.active).toBe(true);
    s.dog = { x: s.handler.x + 0.9 * free.leashLength, y: s.handler.y };
    const events = tick(s, arc(1)(s));
    expect(types(events)).toContain('sintonia-end');
    expect(s.sintonia.active).toBe(false);
  });

  it('ends at once when the Handler stops', () => {
    const s = createState(1, free);
    run(s, 3, arc(1));
    const events = run(s, 0.1, noInput);
    expect(types(events)).toContain('sintonia-end');
  });

  it('ends on a sharp reversal of more than 90 degrees', () => {
    const s = createState(1, free);
    run(s, 3, arc(1));
    const events = run(s, 0.6, { direction: { x: -Math.cos(s.time), y: -Math.sin(s.time) }, strength: 0.6, marker: false });
    expect(types(events)).toContain('sintonia-end');
    expect(s.sintonia.active).toBe(false);
  });

  it('adds up the seconds spent in Sintonía, and only those', () => {
    const s = createState(1, free);
    run(s, 4.5, arc(1));
    const active = s.telemetry.sintoniaTime;
    expect(active).toBeGreaterThan(1.8);
    expect(active).toBeLessThan(2.6);
    run(s, 2, noInput);
    expect(s.telemetry.sintoniaTime).toBeCloseTo(active, 1);
  });

  it('does not change where the Handler and the Dog go', () => {
    const withCombo = createState(3, free);
    const without = createState(3, { ...free, sintonia: { ...free.sintonia, holdSeconds: 1e9 } });
    run(withCombo, 6, arc(1));
    run(without, 6, arc(1));
    expect(withCombo.handler).toEqual(without.handler);
    expect(withCombo.dog).toEqual(without.dog);
  });
});

describe('Sintonía through an S-curve', () => {
  const free = scenario({ leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor });

  it('keeps the flow through the inflection, where the Handler turns from left to right at the same rate', () => {
    const s = createState(1, free);
    // heading rises at 1 rad/s for 3 s, then falls at 1 rad/s: two arcs, one S
    const heading = (t: number) => (t < 3 ? t : 6 - t);
    const events = run(s, 5, (st) => ({ direction: { x: Math.cos(heading(st.time)), y: Math.sin(heading(st.time)) }, strength: 0.6, marker: false }));
    expect(events.filter((e) => e.type === 'sintonia-start')).toHaveLength(1);
    expect(events.some((e) => e.type === 'sintonia-end')).toBe(false);
    expect(s.sintonia.active).toBe(true);
  });
});
