import { defaultScenario, DEFAULT_SCENT_WALK, type DistractorConfig, type ScenarioConfig } from './config';
import { ScentDrive } from './drives';
import { feedbackKindOf } from './feedbackKinds';
import { DEFAULT_SNAPSHOT } from './learning';
import { buildPayload } from './payload';
import { createState, isDogLooking, isGoSniffAvailable, noInput, scentPulls, tick, type SimEvent, type SimInput, type SimState } from './sim';
import { scentFollowChance } from './scentWalk';
import { distance } from './vec';

const STEP = defaultScenario.fixedStep;

/** A scent Stage on an open field (no scenery in the way) with no Distractor, unless overridden. */
function stage(overrides: Partial<ScenarioConfig> = {}): ScenarioConfig {
  return {
    ...defaultScenario,
    world: 6,
    scenery: [],
    distractor: { ...defaultScenario.distractor, activateAfterMeters: 1e9 },
    scents: [{ pos: { x: 500, y: 500 }, strength: 'weak' }],
    ...overrides,
  };
}

const walk = (strength = 0.6, x = 1, y = 0): SimInput => ({ direction: { x, y }, strength, marker: false });
const stand: SimInput = noInput;

function run(state: SimState, seconds: number, input: SimInput | ((s: SimState) => SimInput) = stand): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++) events.push(...tick(state, typeof input === 'function' ? input(state) : input));
  return events;
}

/** Runs until an event of `type` happens; returns it and every event up to it. */
function runUntil<T extends SimEvent['type']>(state: SimState, type: T, input: SimInput | ((s: SimState) => SimInput) = stand, maxSeconds = 30) {
  const events: SimEvent[] = [];
  for (let i = 0; i < maxSeconds / STEP; i++) {
    const now = tick(state, typeof input === 'function' ? input(state) : input);
    events.push(...now);
    const found = now.find((e) => e.type === type);
    if (found) return { event: found as Extract<SimEvent, { type: T }>, events };
  }
  return { event: undefined, events };
}

const changes = (events: SimEvent[]) => events.filter((e): e is Extract<SimEvent, { type: 'walk-change' }> => e.type === 'walk-change');

describe('Autopilot', () => {
  it('rises over 10 s of straight, steady walking, and the scent pull grows with it', () => {
    const s = createState(1, stage());
    expect(s.scentWalk!.autopilot).toBe(0);
    run(s, 10, walk());
    expect(s.scentWalk!.autopilot).toBeGreaterThan(0.3);
    const nose = new ScentDrive({ dogGoalSpeed: 1.6, autopilotFloor: DEFAULT_SCENT_WALK.autopilotFloor, reachDistance: DEFAULT_SCENT_WALK.reachDistance });
    const spot = [{ pos: { x: 3, y: 0 }, pull: DEFAULT_SCENT_WALK.pull.normal, radius: 4 }];
    const pull = (autopilot: number) => nose.desire({ dog: { x: 0, y: 0 }, handler: { x: 0, y: 0 }, waypoint: { x: 0, y: 0 }, dt: STEP, scents: spot, autopilot }).weight!;
    expect(pull(s.scentWalk!.autopilot)).toBeGreaterThan(pull(0));
  });

  it('drops on a sudden stop after a straight stretch', () => {
    const s = createState(1, stage());
    run(s, 10, walk());
    const before = s.scentWalk!.autopilot;
    const events = run(s, 0.1, stand);
    expect(changes(events).map((e) => e.change)).toEqual(['stop']);
    expect(s.scentWalk!.autopilot).toBeLessThan(before - 0.25);
  });

  it('does not rise while the Handler weaves', () => {
    const s = createState(1, stage());
    run(s, 10, (st) => walk(0.6, 1, Math.sin(st.time * 3)));
    expect(s.scentWalk!.autopilot).toBeLessThan(0.1);
  });

  it('pulls the Dog to a normal Scent Spot until the leash is Taut when Autopilot is high', () => {
    const s = createState(2, stage({ scents: [{ pos: { x: 30, y: 3.2 }, strength: 'normal' }] }));
    let taut = false;
    run(s, 30, (st) => {
      if (st.handler.x > 24 && st.tension !== 'slack') taut = true;
      return walk();
    });
    expect(taut).toBe(true);
  });
});

describe('Plant and marking', () => {
  /** A hot spot (or a marking post) just off the path, 4 m ahead. */
  const spotAhead = (marking = false) => stage({ scents: [{ pos: { x: 5, y: 0.5 }, strength: marking ? 'normal' : 'hot', marking }] });

  it('Plants at a hot Scent Spot and holds still even with the leash Taut', () => {
    const s = createState(3, spotAhead());
    const { event } = runUntil(s, 'plant-start', walk());
    expect(event).toBeDefined();
    expect(s.dogMode).toBe('planted');
    expect(event!.seconds).toBeGreaterThanOrEqual(DEFAULT_SCENT_WALK.plantSeconds.min);
    expect(event!.seconds).toBeLessThanOrEqual(DEFAULT_SCENT_WALK.plantSeconds.max);
    const at = { ...s.dog };
    run(s, 0.5, stand);
    expect(distance(s.dog, at)).toBeLessThan(1e-9);
  });

  it('records a waited Plant when the Handler waits, and the spot no longer pulls', () => {
    const s = createState(3, spotAhead());
    runUntil(s, 'plant-start', walk());
    const { event } = runUntil(s, 'plant-end', stand, 10);
    expect(event).toMatchObject({ result: 'waited', followed: false, spot: 0 });
    expect(s.dogMode).toBe('goal');
    expect(s.scentWalk!.spots[0].sniffed).toBe(true);
    expect(scentPulls(s)).toEqual([]);
    expect(s.telemetry.scentWalk!.plantsWaited).toBe(1);
    expect(feedbackKindOf(event!)).toBe('waited-plant');
  });

  it('records a dragged Plant and raises Arousal when the Handler walks on into Rigid Pull', () => {
    const s = createState(3, spotAhead());
    runUntil(s, 'plant-start', walk());
    const before = s.arousal;
    const { event } = runUntil(s, 'plant-end', walk(), 10);
    expect(event).toMatchObject({ result: 'dragged' });
    expect(s.arousal).toBeGreaterThan(before);
    expect(s.telemetry.scentWalk!.plantsDragged).toBe(1);
    expect(feedbackKindOf(event!)).toBe('dragged-plant');
  });

  it('ends a Plant without Rigid Pull when the Dog follows a turn', () => {
    // a Dog that always follows
    const s = createState(3, spotAhead());
    s.dogTraits = { ...s.dogTraits, followChance: 1 };
    runUntil(s, 'plant-start', walk());
    run(s, 0.2, stand);
    const { event } = runUntil(s, 'plant-end', walk(0.6, 0, -1), 2);
    expect(event).toMatchObject({ result: 'waited', followed: true });
  });

  it('marks a marking post: waited when the Handler waits', () => {
    const s = createState(4, spotAhead(true));
    const { event: start } = runUntil(s, 'marking-start', walk());
    expect(start).toBeDefined();
    expect(s.dogMode).toBe('marking');
    const { event } = runUntil(s, 'marking-end', stand, 10);
    expect(event).toMatchObject({ result: 'waited' });
    expect(s.telemetry.scentWalk!.markingsWaited).toBe(1);
    expect(feedbackKindOf(event!)).toBe('waited-marking');
  });

  it('marks a marking post: interrupted by Rigid Pull, with Arousal', () => {
    const s = createState(4, { ...spotAhead(true), scentWalk: { markingSeconds: { min: 6, max: 6 } } });
    runUntil(s, 'marking-start', walk());
    const before = s.arousal;
    const { event } = runUntil(s, 'marking-end', walk(1), 10);
    expect(event).toMatchObject({ result: 'interrupted' });
    expect(s.arousal).toBeGreaterThan(before);
    expect(feedbackKindOf(event!)).toBe('interrupted-marking');
  });

  it('gives the same Plant for the same seed', () => {
    const plant = () => {
      const s = createState(9, spotAhead());
      return runUntil(s, 'plant-start', walk()).event;
    };
    expect(plant()).toEqual(plant());
  });
});

describe('sniffed spots and food', () => {
  const sniff: SimInput = { ...stand, sniff: true };

  it('stops pulling once the Dog has had a Go Sniff at it', () => {
    const s = createState(5, stage({ scents: [{ pos: { x: 2.5, y: 1.5 }, strength: 'normal' }] }));
    expect(scentPulls(s)).toHaveLength(1);
    const events = run(s, STEP, sniff);
    expect(events.find((e) => e.type === 'go-sniff-start')).toMatchObject({ scent: 'granted', spot: 0 });
    expect(s.scentWalk!.spots[0].sniffed).toBe(true);
    expect(scentPulls(s)).toEqual([]);
  });

  /** Food on the ground near the start that never raises Arousal, so the Dog does not fixate on it. */
  const food = (pos = { x: 1.4, y: 0.5 }): DistractorConfig => ({ kind: 'food', speed: 0, salience: 0, triggerRadius: 3, activateAfterMeters: 0, startOffset: 0, path: { from: pos, to: pos } });

  it('makes stationary food pull like a hot Scent Spot', () => {
    const s = createState(5, stage({ distractor: food() }));
    run(s, STEP, stand);
    expect(scentPulls(s)).toContainEqual({ pos: { x: 1.4, y: 0.5 }, pull: DEFAULT_SCENT_WALK.pull.hot, radius: DEFAULT_SCENT_WALK.radius.hot, spot: -1 });
  });

  it('lets the Dog eat the food on a Go Sniff at it', () => {
    const s = createState(5, stage({ distractor: food() }));
    run(s, 2, stand); // the food pulls the Dog to it
    const events = run(s, STEP, sniff);
    expect(events.find((e) => e.type === 'go-sniff-start')).toMatchObject({ scent: 'food' });
    const eaten = events.find((e) => e.type === 'food-eaten');
    expect(eaten).toBeDefined();
    expect(feedbackKindOf(eaten!)).toBe('food-eaten');
    expect(s.telemetry.scentWalk!.foodEaten).toBe(1);
    expect(scentPulls(s).filter((p) => p.spot === -1)).toEqual([]);
  });

  it('turns the Dog away from the food on "Leave It", and the food is not eaten', () => {
    const s = createState(5, stage({ distractor: food(), cues: ['lets-go', 'leave-it'] }));
    run(s, 0.5, stand);
    const events = run(s, STEP, { ...stand, cue: true, cueType: 'leave-it' });
    const left = events.find((e) => e.type === 'food-left');
    expect(left).toBeDefined();
    expect(feedbackKindOf(left!)).toBe('leave-it-food');
    expect(s.distractor.consumed).toBe(true);
    const later = run(s, 3, sniff);
    expect(later.some((e) => e.type === 'food-eaten')).toBe(false);
    expect(s.telemetry.scentWalk!.foodLeft).toBe(1);
  });

  it('turns a fixated Dog away from the food on "Leave It" (as with any food Distractor)', () => {
    const fixating: DistractorConfig = { ...food({ x: 4, y: 0.6 }), salience: 1, triggerRadius: 6 };
    const s = createState(5, stage({ distractor: fixating, cues: ['leave-it'], learning: { ...DEFAULT_SNAPSHOT, triggerProfile: { ...DEFAULT_SNAPSHOT.triggerProfile, food: 3 } } }));
    runUntil(s, 'fixation-start', stand, 20);
    expect(s.dogMode).toBe('fixated');
    const events = run(s, STEP, { ...stand, cue: true, cueType: 'leave-it' });
    expect(events.map((e) => e.type)).toEqual(expect.arrayContaining(['disengagement', 'food-left']));
  });
});

describe('changes', () => {
  /** Inputs that settle at `pace` for `preamble` seconds, then make one change of each kind. */
  const moves: Record<string, { pace: number; then: SimInput }> = {
    'left-turn': { pace: 0.3, then: walk(0.3, 0, 1) },
    'right-turn': { pace: 0.3, then: walk(0.3, 0, -1) },
    'u-turn': { pace: 0.3, then: walk(0.3, -Math.cos(0.17), Math.sin(0.17)) },
    'speed-up': { pace: 0.3, then: walk(0.6) },
    'slow-down': { pace: 0.6, then: walk(0.3) },
    stop: { pace: 0.3, then: stand },
  };

  it.each(Object.keys(moves))('counts a %s made on a Slack leash', (kind) => {
    const s = createState(6, stage());
    run(s, 1.5, walk(moves[kind].pace));
    expect(s.tension).toBe('slack');
    const counted = changes(run(s, 0.8, moves[kind].then));
    expect(counted.map((e) => e.change)).toEqual([kind]);
  });

  it.each(Object.keys(moves))('does not count a %s made on a Taut leash', (kind) => {
    // the Dog stands behind the Handler, who walks out to the end of the leash
    const s = createState(6, stage({ dogStart: { x: -0.2, y: 0 }, dogGoalSpeed: 0, leashTolerance: 0 }));
    run(s, 3, walk(moves[kind].pace));
    expect(s.tension).toBe('taut');
    expect(changes(run(s, 0.8, moves[kind].then))).toEqual([]);
  });

  it('counts no changes outside scent Stages', () => {
    const s = createState(6, { ...stage(), scents: undefined });
    expect(s.scentWalk).toBeNull();
    const events = [...run(s, 1.5, walk(0.3)), ...run(s, 0.5, walk(0.6)), ...run(s, 0.5, walk(0.6, 0, 1)), ...run(s, 0.5, stand)];
    expect(changes(events)).toEqual([]);
    expect(events.filter((e) => e.type === 'dog-follow').every((e) => !('change' in e))).toBe(true);
  });
});

describe('Novelty', () => {
  it('drops with repeats: the third right turn within 10 s is repeated', () => {
    const s = createState(7, stage());
    const dirs = [[0, -1], [-1, 0], [0, 1]];
    const events: SimEvent[] = [...run(s, 1, walk())];
    dirs.forEach(([x, y]) => events.push(...run(s, 3.5, walk(0.6, x, y))));
    const turns = changes(events).filter((e) => e.change === 'right-turn');
    expect(turns).toHaveLength(3);
    expect(turns[0]).toMatchObject({ novelty: 1, freshness: 'fresh' });
    expect(turns[2].novelty).toBeLessThan(turns[0].novelty);
    expect(turns[2].freshness).toBe('repeated');
  });

  it('recovers with time: a stop is fresh again after 30 s without one', () => {
    const s = createState(7, stage());
    for (let i = 0; i < 2; i++) {
      run(s, 1.5, walk());
      run(s, 0.3, stand);
    }
    expect(s.scentWalk!.novelty.stop).toBeLessThan(DEFAULT_SCENT_WALK.novelty.repeated);
    run(s, 30, walk());
    expect(s.scentWalk!.novelty.stop).toBeGreaterThanOrEqual(DEFAULT_SCENT_WALK.novelty.fresh);
  });

  it('makes the Dog follow a fresh U-turn more often than the same U-turn repeated, over many seeds', () => {
    let fresh = 0;
    let repeated = 0;
    const seeds = 300;
    for (let seed = 1; seed <= seeds; seed++) {
      const s = createState(seed, stage());
      const uTurns: boolean[] = [];
      for (const [x, ms] of [[1, 1], [-1, 1.2], [1, 1.2], [-1, 1.2]] as const) {
        changes(run(s, ms, walk(0.6, x, 0.01))).forEach((e) => e.change === 'u-turn' && uTurns.push(e.followed));
        s.ratio = 0; // keep each U-turn on Slack so all four are counted
      }
      if (uTurns[0]) fresh += 1;
      if (uTurns[2]) repeated += 1;
    }
    expect(fresh / seeds).toBeGreaterThan(repeated / seeds + 0.15);
  });

  it('sends a fresh move the Dog followed and a repeated move it ignored as Feedback kinds', () => {
    const e = (followed: boolean, freshness: 'fresh' | 'normal' | 'repeated'): SimEvent => ({ type: 'walk-change', time: 1, change: 'stop', novelty: 0.5, freshness, followed, pos: { x: 0, y: 0 } });
    expect(feedbackKindOf(e(true, 'fresh'))).toBe('fresh-move');
    expect(feedbackKindOf(e(false, 'repeated'))).toBe('repeated-move-ignored');
    expect(feedbackKindOf(e(true, 'repeated'))).toBeNull();
    expect(feedbackKindOf(e(false, 'fresh'))).toBeNull();
  });
});

describe('Chain', () => {
  /** A seed and Stage where the Dog follows the first left turn. */
  function followedTurn(): { s: SimState; events: SimEvent[] } {
    for (let seed = 1; seed < 50; seed++) {
      const s = createState(seed, stage());
      run(s, 1.5, walk());
      const events = run(s, STEP, walk(0.6, 0, 1));
      if (events.some((e) => e.type === 'dog-follow')) return { s, events };
    }
    throw new Error('no seed follows');
  }

  it('records turn, look, Marker and Go Sniff within 3 s as one Chain', () => {
    const { s, events } = followedTurn();
    expect(events.find((e) => e.type === 'dog-follow')).toMatchObject({ change: 'left-turn' });
    run(s, 0.15, walk(0.6, 0, 1));
    const marked = run(s, STEP, { ...walk(0.6, 0, 1), marker: true });
    expect(marked.map((e) => e.type)).toEqual(expect.arrayContaining(['check-in-hit', 'change-check-in']));
    expect(feedbackKindOf(marked.find((e) => e.type === 'change-check-in')!)).toBe('check-in-after-change');
    run(s, 0.5, stand);
    const sniffed = run(s, STEP, { ...stand, sniff: true });
    const chain = sniffed.find((e) => e.type === 'chain');
    expect(chain).toMatchObject({ change: 'left-turn', ending: 'sniff' });
    expect(feedbackKindOf(chain!)).toBe('chain');
    expect(s.telemetry.scentWalk!.chains).toBe(1);
  });

  it('records a Chain ended by 2 s of Slack walking', () => {
    const { s } = followedTurn();
    run(s, 0.15, walk(0.6, 0, 1));
    run(s, STEP, { ...walk(0.6, 0, 1), marker: true });
    const events = run(s, 2.2, walk(0.6, 0, 1));
    expect(events.find((e) => e.type === 'chain')).toMatchObject({ ending: 'walk' });
  });

  it('records no Chain without the Marker, or when the Handler just stands', () => {
    const { s } = followedTurn();
    expect(run(s, 5, walk(0.6, 0, 1)).some((e) => e.type === 'chain')).toBe(false);
    const again = followedTurn().s;
    run(again, 0.15, walk(0.6, 0, 1));
    run(again, STEP, { ...walk(0.6, 0, 1), marker: true });
    expect(run(again, 5, stand).some((e) => e.type === 'chain')).toBe(false);
  });
});

describe('Go Sniff in a scent Stage', () => {
  const sniff: SimInput = { ...stand, sniff: true };

  it('is available at any time on Slack, without a Disengagement', () => {
    const s = createState(8, stage());
    run(s, 0.5, walk());
    expect(isGoSniffAvailable(s)).toBe(true);
    const taut = createState(8, stage({ dogStart: { x: -0.2, y: 0 }, dogGoalSpeed: 0, leashTolerance: 0 }));
    run(taut, 3, walk());
    expect(isGoSniffAvailable(taut)).toBe(false);
  });

  it('runs its full duration even when Arousal is already 0 at the start', () => {
    const s = createState(8, stage());
    run(s, 0.5, stand);
    expect(s.arousal).toBe(0);
    tick(s, sniff);
    const { event, events } = runUntil(s, 'go-sniff-end', stand, 10);
    expect(event).toMatchObject({ reason: 'time' });
    expect(events.length).toBeGreaterThan(0);
    expect(event!.time).toBeGreaterThanOrEqual(defaultScenario.goSniff.durationSeconds - 2 * STEP);
  });

  it('takes the Dog to the nearest unsniffed Scent Spot in range: a granted sniff', () => {
    const s = createState(8, stage({ scents: [{ pos: { x: 3, y: 2 }, strength: 'weak' }, { pos: { x: 1, y: -1 }, strength: 'weak' }] }));
    const events = run(s, STEP, sniff);
    const start = events.find((e) => e.type === 'go-sniff-start');
    expect(start).toMatchObject({ scent: 'granted', spot: 1 });
    expect(feedbackKindOf(start!)).toBe('granted-sniff');
    run(s, 2, stand);
    expect(distance(s.dog, { x: 1, y: -1 })).toBeLessThan(DEFAULT_SCENT_WALK.reachDistance + 0.1);
    expect(s.telemetry.scentWalk!.sniffsGranted).toBe(1);
  });

  it('meanders with nothing to sniff when no spot is in range: an empty sniff', () => {
    const s = createState(8, stage());
    const start = run(s, STEP, sniff).find((e) => e.type === 'go-sniff-start');
    expect(start).toMatchObject({ scent: 'empty' });
    expect(feedbackKindOf(start!)).toBe('empty-sniff');
    expect(s.dogMode).toBe('sniffing');
    expect(s.telemetry.scentWalk!.sniffsEmpty).toBe(1);
  });

  it('adds Meter Points for a granted sniff', () => {
    const meters = [{ id: 'nose', labelKey: 'meter.nose', icon: 'nose', target: 40, meterPoints: { 'granted-sniff': 20 } }];
    const s = createState(8, stage({ scents: [{ pos: { x: 3, y: 1 }, strength: 'normal' }], meters }));
    const events = run(s, STEP, sniff);
    expect(events.find((e) => e.type === 'meter-points')).toMatchObject({ meterId: 'nose', kind: 'granted-sniff', points: 20 });
  });

  it('adds scentWalk and timeline to the payload', () => {
    const s = createState(8, stage());
    run(s, 1, walk());
    expect(Object.keys(buildPayload(s))).toEqual(expect.arrayContaining(['scentWalk', 'timeline']));
  });
});

describe('Jackpot', () => {
  const jackpot: SimInput = { ...stand, jackpot: true };

  /** Stands until the Dog glances at the Handler. */
  function untilLook(s: SimState) {
    runUntil(s, 'check-in-glance', stand, 60);
    run(s, 0.1, stand);
  }

  it('does nothing without a Jackpot budget', () => {
    const s = createState(10, stage());
    untilLook(s);
    expect(run(s, STEP, jackpot).filter((e) => e.type !== 'check-in-glance')).toEqual([]);
    expect(s.telemetry.jackpots.used).toBe(0);
  });

  it('is a smart Jackpot on a Check-in next to food, spending one Jackpot and no Mark', () => {
    const food: DistractorConfig = { kind: 'food', speed: 0, salience: 0, triggerRadius: 4, activateAfterMeters: 0, startOffset: 0, path: { from: { x: 2, y: 2.5 }, to: { x: 2, y: 2.5 } } };
    const s = createState(10, stage({ jackpotBudget: 2, distractor: food }));
    untilLook(s);
    const events = run(s, STEP, jackpot);
    expect(events.map((e) => e.type)).toEqual(['check-in-hit', 'jackpot']);
    const jp = events[1];
    expect(jp).toMatchObject({ result: 'smart', hit: 'check-in-hit' });
    expect(feedbackKindOf(jp)).toBe('smart-jackpot');
    expect(s.telemetry.jackpots).toEqual({ used: 1, smart: 1, wasted: 0 });
    expect(s.telemetry.marksUsed).toBe(0);
    expect(s.telemetry.checkInHits).toBe(1);
  });

  it('is a wasted Jackpot on an easy look on an empty path, and the hit still counts', () => {
    const s = createState(10, stage({ jackpotBudget: 2 }));
    untilLook(s);
    const events = run(s, STEP, jackpot);
    expect(events.find((e) => e.type === 'jackpot')).toMatchObject({ result: 'wasted' });
    expect(feedbackKindOf(events.find((e) => e.type === 'jackpot')!)).toBe('wasted-jackpot');
    expect(s.telemetry.checkInHits).toBe(1);
  });

  it('is smart on a Disengagement, and stops when the budget is spent', () => {
    const nearby = { ...defaultScenario.distractor, path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } }, activateAfterMeters: 0 };
    const s = createState(10, { ...defaultScenario, jackpotBudget: 1, distractor: nearby });
    runUntil(s, 'disengagement', stand, 40);
    const events = run(s, STEP, jackpot);
    expect(events.find((e) => e.type === 'jackpot')).toMatchObject({ result: 'smart', hit: 'marker-hit' });
    untilLook(s);
    expect(run(s, STEP, jackpot).some((e) => e.type === 'check-in-hit' || e.type === 'jackpot')).toBe(false);
    expect(s.telemetry.jackpots.used).toBe(1);
  });

  it('is judged like a Marker press when nothing is there to reward', () => {
    const s = createState(10, stage({ jackpotBudget: 1 }));
    expect(run(s, STEP, jackpot).map((e) => e.type)).toEqual(['marker-wasted']);
  });
});

describe('review fixes', () => {
  it('honours followCap even when the base follow chance is above it', () => {
    expect(scentFollowChance(0.8, 1, 0, 0.5, DEFAULT_SCENT_WALK)).toBeLessThanOrEqual(0.5);
    expect(scentFollowChance(0.4, 1, 0, 0.95, DEFAULT_SCENT_WALK)).toBeCloseTo(0.55);
  });

  it('stops the Dog and starts a look on a followed stop in a scent Stage', () => {
    const s = createState(11, stage());
    s.dogTraits = { ...s.dogTraits, followChance: 1 };
    run(s, 1.5, walk());
    const events = run(s, STEP, stand);
    expect(events.find((e) => e.type === 'dog-follow')).toMatchObject({ change: 'stop' });
    expect(isDogLooking(s)).toBe(true);
    const at = { ...s.dog };
    run(s, 0.5, stand);
    expect(distance(s.dog, at)).toBeLessThan(1e-9);
  });

  it('ends a scent-Stage Go Sniff with reason tension when the leash passes Slack', () => {
    const s = createState(11, stage());
    run(s, 0.5, stand);
    tick(s, { ...stand, sniff: true });
    expect(s.dogMode).toBe('sniffing');
    const { event } = runUntil(s, 'go-sniff-end', walk(1, -1, 0), 5);
    expect(event).toMatchObject({ reason: 'tension' });
    expect(event!.time).toBeLessThan(defaultScenario.goSniff.durationSeconds);
  });

  it.each([
    ['Plants at a hot spot', { strength: 'hot' as const }, 'plant-start'],
    ['marks a marking post', { strength: 'normal' as const, marking: true }, 'marking-start'],
  ])('%s in reach even when a weaker spot is nearer', (_name, spot, type) => {
    const s = createState(11, stage({ scents: [{ pos: { x: 1, y: 0.05 }, strength: 'weak' }, { pos: { x: 1, y: 0.25 }, ...spot }] }));
    const events = run(s, STEP, stand);
    expect(events.find((e) => e.type === type)).toMatchObject({ spot: 1 });
  });

  it('leaves no Taut correction pending for a turn the Planted Dog does not follow', () => {
    const s = createState(3, stage({ scents: [{ pos: { x: 5, y: 0.5 }, strength: 'hot' }], scentWalk: { plantSeconds: { min: 6, max: 6 } } }));
    runUntil(s, 'plant-start', walk());
    s.dogTraits = { ...s.dogTraits, followChance: 0 };
    run(s, 0.2, stand);
    const events = run(s, 1, walk(0.6, 0, -1));
    expect(changes(events).some((e) => e.change === 'right-turn' && !e.followed)).toBe(true);
    expect(s.correctionPending).toBeNull();
    expect(events.some((e) => e.type === 'dog-correction')).toBe(false);
  });

  it('reports a scent dragged past once, and counts it once', () => {
    const s = createState(12, stage({ scents: [{ pos: { x: 4, y: 3 }, strength: 'normal' }], scentWalk: { pull: { normal: 30 } } }));
    const events = run(s, 8, walk(1));
    const dragged = events.filter((e) => e.type === 'scent-dragged-past');
    expect(dragged).toHaveLength(1);
    expect(dragged[0]).toMatchObject({ spot: 0, pos: { x: 4, y: 3 } });
    expect(feedbackKindOf(dragged[0])).toBe('scent-dragged-past');
    expect(s.telemetry.scentWalk!.scentsDraggedPast).toBe(1);
  });
});
