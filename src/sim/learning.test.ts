import { defaultScenario, type ScenarioConfig } from './config';
import { runScripted } from './harness';
import {
  averageProgress,
  DEFAULT_SNAPSHOT,
  resolveDog,
  type Equipment,
  type LearningAttributes,
  type LearningSnapshot,
  type TriggerLevel,
} from './learning';
import { buildPayload } from './payload';
import { createState, noInput, tick, type SimEvent, type SimInput, type SimState } from './sim';
import { distance } from './vec';

const STEP = defaultScenario.fixedStep;
const noDistractor = { ...defaultScenario.distractor, activateAfterMeters: 1e9 };
const nearby = {
  ...defaultScenario.distractor,
  path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } },
  activateAfterMeters: 0,
};
const quiet = { ...defaultScenario.ranges, checkInMeanInterval: { worst: 1e9, best: 1e9 } };

function snapshot(o: { attributes?: Partial<LearningAttributes>; level?: TriggerLevel; equipment?: Equipment; capacity?: number } = {}): LearningSnapshot {
  return {
    attributes: { ...DEFAULT_SNAPSHOT.attributes, ...o.attributes },
    triggerProfile: { ...DEFAULT_SNAPSHOT.triggerProfile, skateboard: o.level ?? 2 },
    equipment: o.equipment ?? 'collar',
    capacityMultiplier: o.capacity ?? 1,
    posture: 0,
  };
}

function scenario(o: Partial<ScenarioConfig> = {}, learning: LearningSnapshot = DEFAULT_SNAPSHOT): ScenarioConfig {
  return { ...defaultScenario, ranges: quiet, learning, ...o };
}

const move = (strength: number, x = 1, y = 0): SimInput => ({ direction: { x, y }, strength, marker: false });
const cue: SimInput = { ...noInput, cue: true };

function run(state: SimState, seconds: number, input: SimInput | ((s: SimState) => SimInput) = noInput): SimEvent[] {
  const events: SimEvent[] = [];
  for (let i = 0; i < Math.round(seconds / STEP); i++) events.push(...tick(state, typeof input === 'function' ? input(state) : input));
  return events;
}

function runUntil(state: SimState, type: SimEvent['type'], input: SimInput = noInput, maxSeconds = 30): SimEvent | undefined {
  for (let i = 0; i < maxSeconds / STEP; i++) {
    const found = tick(state, input).find((e) => e.type === type);
    if (found) return found;
  }
  return undefined;
}

/** A Dog with a Distractor placed `d` meters away, Handler beside the Dog; Arousal starts at 0. */
function withDistractorAt(d: number, config: ScenarioConfig = scenario({ distractor: nearby })): SimState {
  const s = createState(1, config);
  s.dog = { x: 0, y: 0 };
  s.handler = { x: 0, y: 0 };
  s.distractor.active = true;
  s.distractor.pos = { x: d, y: 0 };
  s.distractor.from = { x: d, y: 0 };
  s.distractor.to = { x: d, y: 1000 };
  return s;
}

/** Distance from the Dog to the Distractor when the Fixation starts, with a Handler who stands still. */
function fixationDistance(config: ScenarioConfig): number | undefined {
  const s = createState(5, config);
  for (let i = 0; i < 20 / STEP; i++) {
    if (tick(s, noInput).some((e) => e.type === 'fixation-start')) return distance(s.dog, s.distractor.pos);
  }
  return undefined;
}

describe('learning snapshot', () => {
  it('replays to the same payload for the same seed, inputs and snapshot', () => {
    const config = scenario({ distractor: nearby, endCondition: { kind: 'time-limit', seconds: 15 } }, snapshot({ level: 3, equipment: 'harness' }));
    const input = (s: SimState): SimInput => ({ ...move(s.time < 5 ? 1 : 0.6, 1, 0.2), cue: Math.round(s.time * 60) % 240 === 0 });
    const a = runScripted(7, input, config).payload;
    const b = runScripted(7, input, config).payload;
    expect(a).toEqual(b);
  });

  it('changes the Stage when the snapshot changes', () => {
    const config = (level: TriggerLevel) => scenario({ distractor: nearby, endCondition: { kind: 'time-limit', seconds: 10 } }, snapshot({ level }));
    expect(runScripted(7, () => noInput, config(3)).payload.peakArousalScore).not.toBe(runScripted(7, () => noInput, config(1)).payload.peakArousalScore);
  });

  it('maps progress to values and applies the capacity multiplier and Equipment only inside the Stage', () => {
    const full = resolveDog(snapshot({ attributes: { reactivityThreshold: 1, followChance: 1 } }));
    expect(full.reactivityThreshold).toBe(defaultScenario.ranges.reactivityThreshold.best);
    expect(full.followChance).toBe(1);
    const tired = resolveDog(snapshot({ attributes: { reactivityThreshold: 1, followChance: 1 }, capacity: 0.8 }));
    expect(tired.followChance).toBeCloseTo(0.8);
    expect(tired.reactivityThreshold).toBeLessThan(full.reactivityThreshold);
    const input = snapshot({ equipment: 'harness', capacity: 0.8 });
    const before = JSON.stringify(input.attributes);
    createState(1, scenario({}, input));
    expect(JSON.stringify(input.attributes)).toBe(before);
  });

  it('averages the four attributes', () => {
    expect(averageProgress({ reconnectionLatency: 0, reactivityThreshold: 1, followChance: 0.5, checkInFrequency: 0.5 })).toBeCloseTo(0.5);
  });
});

describe('Arousal', () => {
  it('starts at 0 each Stage', () => {
    const first = createState(5, scenario({ distractor: nearby }));
    run(first, 4);
    expect(first.arousal).toBeGreaterThan(0);
    expect(createState(5, scenario({ distractor: nearby })).arousal).toBe(0);
  });

  it('doubles the rise when the Distractor is half as far', () => {
    const rise = (d: number) => {
      const s = withDistractorAt(d);
      tick(s, noInput, 1e-6);
      return s.arousal;
    };
    expect(rise(4) / rise(8)).toBeCloseTo(2, 3);
  });

  it('scales the rise with the Trigger Profile level', () => {
    const rise = (level: TriggerLevel) => {
      const s = withDistractorAt(8, scenario({ distractor: nearby }, snapshot({ level })));
      tick(s, noInput, 1e-6);
      return s.arousal;
    };
    expect(rise(3) / rise(2)).toBeCloseTo(1.5, 3);
    expect(rise(1) / rise(2)).toBeCloseTo(0.5, 3);
  });

  it('ignores a Distractor outside its radius', () => {
    const s = withDistractorAt(defaultScenario.distractor.triggerRadius + 1);
    tick(s, noInput, 0.05);
    expect(s.arousal).toBe(0);
  });

  it('decays toward 0 when nothing raises it, and stays within 0-100', () => {
    const s = createState(1, scenario({ distractor: noDistractor }));
    s.arousal = 30;
    run(s, 5);
    expect(s.arousal).toBeCloseTo(30 - defaultScenario.arousal.decayPerSecond * 5, 1);
    run(s, 30);
    expect(s.arousal).toBe(0);
    const hot = withDistractorAt(1);
    run(hot, 3);
    expect(hot.arousal).toBeLessThanOrEqual(100);
  });
});

describe('Fixation from Arousal', () => {
  it('starts once Arousal reaches the reactivity threshold', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    const fixation = runUntil(s, 'fixation-start')!;
    expect(fixation).toBeDefined();
    expect(s.arousal).toBeGreaterThanOrEqual(s.dogTraits.reactivityThreshold);
    expect(s.dogMode).toBe('fixated');
  });

  it('reacts from farther away with a lower threshold', () => {
    const at = (p: number) => fixationDistance(scenario({ distractor: nearby }, snapshot({ attributes: { reactivityThreshold: p } })))!;
    expect(at(0)).toBeGreaterThan(at(0.5));
    expect(at(0.5)).toBeGreaterThan(at(1));
  });

  it('reacts from farther away to a stronger Trigger Profile level', () => {
    const at = (level: TriggerLevel) => fixationDistance(scenario({ distractor: nearby }, snapshot({ level })))!;
    expect(at(3)).toBeGreaterThan(at(2));
  });

  it('never fixates on a kind with level 0', () => {
    const s = createState(5, scenario({ distractor: nearby }, snapshot({ level: 0 })));
    const events = run(s, 12);
    expect(events.some((e) => e.type === 'fixation-start')).toBe(false);
    expect(s.arousal).toBe(0);
  });

  it('keeps raising Arousal while fixated near the Distractor', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    runUntil(s, 'fixation-start');
    const at = s.arousal;
    run(s, 0.3);
    expect(s.arousal).toBeGreaterThan(at);
  });

  it('lowers Arousal at Disengagement and by the reward amount on a Marker hit', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    const before = (() => {
      let last = 0;
      for (let i = 0; i < 20 / STEP; i++) {
        const events = tick(s, noInput);
        if (events.some((e) => e.type === 'disengagement')) return last;
        last = s.arousal;
      }
      return NaN;
    })();
    expect(s.arousal).toBeLessThan(before - defaultScenario.arousal.disengagementDrop + 1);
    const atWindow = s.arousal;
    tick(s, { ...noInput, marker: true });
    expect(atWindow - s.arousal).toBeGreaterThan(defaultScenario.arousal.markerHitDrop - 1);
  });
});

describe('Rigid Pull and Equipment', () => {
  /** A Dog that stays put while the Handler pushes against the leash. */
  const pulling = (equipment: Equipment) =>
    createState(1, scenario({ leashLength: 2, dogGoalSpeed: 0, distractor: noDistractor, pullStrength: 0 }, snapshot({ equipment })));

  it('raises Arousal faster in a collar than in a harness', () => {
    const collar = pulling('collar');
    const harness = pulling('harness');
    run(collar, 2, move(1));
    run(harness, 2, move(1));
    expect(collar.tension).toBe('rigid');
    expect(collar.arousal).toBeGreaterThan(harness.arousal);
    expect(collar.arousal / harness.arousal).toBeCloseTo(1.5, 0);
  });

  it('makes a Taut correction stronger with a collar', () => {
    const correction = (equipment: Equipment) => {
      const s = createState(1, scenario({ distractor: noDistractor, ranges: quiet }, snapshot({ equipment, attributes: { followChance: 0 } })));
      s.eventRng = { next: () => 0.99 };
      s.correctionPending = { dir: { x: 0, y: 1 }, until: 99 };
      s.ratio = 1;
      s.dog = { x: 1.8, y: 0 };
      tick(s, noInput);
      return s.steer!.until - s.time;
    };
    expect(correction('collar')).toBeGreaterThan(correction('harness'));
  });

  it('keeps stored attributes untouched when Equipment changes', () => {
    const a = createState(1, scenario({}, snapshot({ equipment: 'collar' })));
    const b = createState(1, scenario({}, snapshot({ equipment: 'harness' })));
    expect(a.config.learning.attributes).toEqual(b.config.learning.attributes);
  });
});

describe('abrupt stop measure', () => {
  /** Quick walk until the Dog is at the leash limit and moving outward. */
  const atLimit = (equipment: Equipment) => {
    const s = createState(1, scenario({ leashLength: 2, dogGoalSpeed: 3, distractor: noDistractor }, snapshot({ equipment })));
    run(s, 3, move(1));
    expect(s.ratio).toBeGreaterThanOrEqual(1);
    return s;
  };

  it('reports an abrupt stop with the Dog outward speed and bumps Arousal', () => {
    const s = atLimit('collar');
    const stop = tick(s, noInput).find((e) => e.type === 'poste-stop');
    expect(stop).toMatchObject({ abrupt: true });
    expect((stop as Extract<SimEvent, { type: 'poste-stop' }>).outwardSpeed).toBeGreaterThan(0);
    expect(s.arousal).toBeGreaterThan(0);
    expect(s.telemetry.harshStops).toBe(1);
  });

  it('bumps Arousal more with a collar than with a harness', () => {
    const bump = (equipment: Equipment) => {
      const s = atLimit(equipment);
      const a = s.arousal;
      const stop = tick(s, noInput).find((e) => e.type === 'poste-stop') as Extract<SimEvent, { type: 'poste-stop' }>;
      expect(s.arousal).toBeGreaterThan(a);
      return stop.arousalBump;
    };
    expect(bump('collar') / bump('harness')).toBeCloseTo(1 / 0.4, 3);
  });

  it('reports a smooth stop and a smaller bump when the Handler slowed first', () => {
    const abrupt = atLimit('collar');
    const bumpAbrupt = (tick(abrupt, noInput).find((e) => e.type === 'poste-stop') as Extract<SimEvent, { type: 'poste-stop' }>).arousalBump;
    const smooth = atLimit('collar');
    run(smooth, 1, move(smooth.config.walkStrength));
    const events = tick(smooth, noInput);
    const stop = events.find((e) => e.type === 'poste-stop') as Extract<SimEvent, { type: 'poste-stop' }>;
    expect(stop.abrupt).toBe(false);
    expect(stop.arousalBump).toBeLessThan(bumpAbrupt);
    expect(smooth.telemetry.harshStops).toBe(0);
  });

  it('ignores a stop away from the leash limit', () => {
    const s = createState(1, scenario({ leashLength: 100, dogGoalSpeed: 0, distractor: noDistractor }));
    run(s, 1, move(1));
    expect(tick(s, noInput).some((e) => e.type === 'poste-stop')).toBe(false);
  });
});

describe('Poste success', () => {
  it('counts a Disengagement during a stop made at the leash limit', () => {
    const s = createState(5, scenario({ distractor: nearby, leashLength: 2, dogGoalSpeed: 3 }));
    run(s, 1.3, move(1)); // reach the limit before the Distractor arrives
    const events = run(s, 15);
    expect(events.some((e) => e.type === 'poste-stop')).toBe(true);
    expect(events.some((e) => e.type === 'disengagement')).toBe(true);
    expect(s.telemetry.posteSuccesses).toBe(1);
  });

  it('counts nothing when the Handler was not at the limit', () => {
    const s = createState(5, scenario({ distractor: nearby, leashLength: 2, dogGoalSpeed: 0 }));
    run(s, 15);
    expect(s.telemetry.posteSuccesses).toBe(0);
  });
});

describe('Cue', () => {
  const calm = (equipment: Equipment = 'collar') =>
    createState(1, scenario({ distractor: noDistractor }, snapshot({ equipment })));
  const effect = (events: SimEvent[]) => (events.find((e) => e.type === 'cue') as Extract<SimEvent, { type: 'cue' }> | undefined)?.strength;

  it('makes the Dog look at the Handler and head toward them', () => {
    const s = calm();
    const events = tick(s, cue);
    expect(effect(events)).toBeGreaterThan(0);
    expect(s.dogLookUntil).toBeGreaterThan(s.time);
    expect(s.steer).not.toBeNull();
  });

  it('is about 30% as strong once the Dog is fixated', () => {
    const before = effect(tick(calm(), cue))!;
    const s = createState(5, scenario({ distractor: nearby }));
    runUntil(s, 'fixation-start');
    s.dogLookUntil = -1;
    const after = effect(tick(s, cue))!;
    expect(after / before).toBeCloseTo(0.3, 2);
  });

  it('does nothing inside the cooldown and works again after it', () => {
    const s = calm();
    expect(effect(tick(s, cue))).toBeDefined();
    run(s, 1);
    expect(effect(tick(s, cue))).toBeUndefined();
    run(s, 2.2);
    expect(effect(tick(s, cue))).toBeDefined();
  });

  it('weakens a repeat while the Dog already looks at the Handler', () => {
    const first = effect(tick(calm(), cue))!;
    const s = calm();
    s.dogLookUntil = 99;
    expect(effect(tick(s, cue))! / first).toBeCloseTo(defaultScenario.cue.repeatFactor, 3);
  });

  it('is stronger with a collar than with a harness', () => {
    expect(effect(tick(calm('collar'), cue))!).toBeGreaterThan(effect(tick(calm('harness'), cue))!);
  });

  it('lowers Arousal', () => {
    const s = calm();
    s.arousal = 50;
    tick(s, cue);
    expect(s.arousal).toBeLessThan(45);
  });

  describe('before a turn', () => {
    const turning = (cueFirst: boolean, wait: number) => {
      const s = createState(1, scenario({ distractor: noDistractor }, snapshot({ attributes: { followChance: 0.5 } })));
      s.eventRng = { next: () => 0.7 }; // follows only with a chance above 0.7
      if (cueFirst) tick(s, cue);
      run(s, wait, noInput);
      return tick(s, move(0.6, 0, 1)).some((e) => e.type === 'dog-follow');
    };

    it('raises the follow chance within 2 seconds', () => {
      expect(turning(false, 0.1)).toBe(false);
      expect(turning(true, 1)).toBe(true);
    });

    it('does not after 2 seconds', () => {
      expect(turning(true, 2.5)).toBe(false);
    });

    it('caps the boosted chance and leaves a higher base alone', () => {
      const s = createState(1, scenario({ distractor: noDistractor }, snapshot({ attributes: { followChance: 0.9 } })));
      s.eventRng = { next: () => 0.96 };
      tick(s, cue);
      expect(tick(s, move(0.6, 0, 1)).some((e) => e.type === 'dog-follow')).toBe(false);
    });
  });

  it('does not depend on audio: the same inputs always give the same Stage', () => {
    const config = scenario({ distractor: nearby, endCondition: { kind: 'time-limit', seconds: 10 } });
    const input = (s: SimState): SimInput => ({ ...noInput, cue: s.time > 1 && s.time < 1.02 });
    expect(runScripted(3, input, config).payload).toEqual(runScripted(3, input, config).payload);
  });
});

describe('telemetry', () => {
  it('reports the peak Arousal as the highest value reached', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    let max = 0;
    for (let i = 0; i < 12 / STEP; i++) {
      tick(s, noInput);
      max = Math.max(max, s.arousal);
    }
    expect(max).toBeGreaterThan(0);
    expect(buildPayload(s).peakArousalScore).toBe(Math.round(max));
  });

  it('counts follow marks only for looks after a followed turn', () => {
    const s = createState(1, scenario({ distractor: noDistractor }, snapshot({ attributes: { followChance: 1 } })));
    run(s, 0.5, move(0.6));
    run(s, 0.1, move(0.6, 0, 1)); // turn -> follow -> look
    tick(s, { ...noInput, marker: true });
    expect(s.telemetry.followMarks).toBe(1);
    expect(buildPayload(s).followMarks).toBe(1);
  });

  it('does not count a Check-in on a plain glance as a follow mark', () => {
    const s = createState(1, scenario({ distractor: noDistractor, ranges: { ...defaultScenario.ranges, checkInMeanInterval: { worst: 1, best: 1 } } }));
    runUntil(s, 'check-in-glance');
    tick(s, { ...noInput, marker: true });
    expect(s.telemetry.checkInHits).toBe(1);
    expect(s.telemetry.followMarks).toBe(0);
  });

  it('reports calm encounters per Distractor kind', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    runUntil(s, 'disengagement');
    tick(s, { ...noInput, marker: true });
    expect(buildPayload(s).calmEncounters).toEqual({ skateboard: 1 });
  });
});

describe('Reaction Tiers', () => {
  const T = resolveDog(DEFAULT_SNAPSHOT, quiet).reactivityThreshold;
  const calmStage = () => createState(1, scenario({ distractor: noDistractor }));
  const tierAt = (arousal: number) => {
    const s = calmStage();
    s.arousal = arousal;
    tick(s, noInput, 1e-6);
    return s.tier;
  };
  const changes = (events: SimEvent[]) => events.filter((e): e is Extract<SimEvent, { type: 'reaction-tier-change' }> => e.type === 'reaction-tier-change');

  it('is Calm below 60% of the reactivity threshold', () => expect(tierAt(0.59 * T)).toBe('calm'));
  it('is Alert from 60% up to the threshold', () => {
    expect(tierAt(0.61 * T)).toBe('alert');
    expect(tierAt(0.99 * T)).toBe('alert');
  });
  it('is Reactive at the threshold and above', () => {
    expect(tierAt(T + 0.5)).toBe('reactive');
    expect(tierAt(100)).toBe('reactive');
  });

  it('reports each crossing with the simulation time', () => {
    const s = calmStage();
    run(s, 0.5);
    s.arousal = 0.7 * T;
    const up = changes(tick(s, noInput));
    expect(up).toEqual([{ type: 'reaction-tier-change', time: s.time, tier: 'alert' }]);
    s.arousal = T + 1;
    const top = changes(tick(s, noInput));
    expect(top).toEqual([{ type: 'reaction-tier-change', time: s.time, tier: 'reactive' }]);
    expect(changes(tick(s, noInput))).toHaveLength(0); // no repeat while the tier holds
  });

  it('walks a nearby Distractor through Calm, Alert and Reactive in order', () => {
    const s = createState(5, scenario({ distractor: nearby }));
    const tiers = changes(run(s, 8)).map((e) => e.tier);
    expect(tiers.slice(0, 2)).toEqual(['alert', 'reactive']);
  });

  /** A Reactive Dog fixated on a Distractor that stands still 6 m ahead and keeps its Arousal up. */
  const lunger = () => {
    const stand = { ...nearby, speed: 0, salience: 4, path: { from: { x: 6, y: 0 }, to: { x: 6, y: 0.001 } } };
    const s = createState(1, scenario({ distractor: stand, dogGoalSpeed: 0 }));
    s.dog = { x: 1, y: 0 };
    s.handler = { x: 0, y: 0 };
    s.distractor.active = true;
    s.distractor.pos = { x: 6, y: 0 };
    s.arousal = T + 5;
    runUntil(s, 'fixation-start', noInput, 1);
    return s;
  };

  it('lunges: the Dog accelerates toward the Distractor at 1.5 m/s2 while Reactive', () => {
    const s = lunger();
    expect(s.tier).toBe('reactive');
    expect(s.dogMode).toBe('fixated');
    s.lungeSpeed = 0;
    run(s, 0.5);
    expect(s.lungeSpeed).toBeCloseTo(0.75, 1);
    run(s, 0.5);
    expect(s.lungeSpeed).toBeCloseTo(1.5, 1);
    expect(Math.hypot(s.dogDesired.x, s.dogDesired.y)).toBeCloseTo(defaultScenario.dogFixationSpeed + 1.5, 1);
  });

  it('stops lunging when the Dog is no longer Reactive', () => {
    const s = lunger();
    run(s, 1);
    expect(s.lungeSpeed).toBeGreaterThan(1);
    s.arousal = 0;
    tick(s, noInput);
    tick(s, noInput);
    expect(s.lungeSpeed).toBe(0);
  });

  it('keeps the Rigid Pull: a lunging Dog is not dragged by a Handler who keeps walking away', () => {
    const calm = createState(1, scenario({ distractor: noDistractor, dogGoalSpeed: 0 }));
    const lunging = lunger();
    for (const s of [lunging, calm]) {
      s.handler = { x: 0, y: 0 };
      s.dog = { x: 1.9, y: 0 };
    }
    const away = move(1, -1, 0);
    run(lunging, 0.5, away);
    run(calm, 0.5, away);
    expect(lunging.ratio).toBeGreaterThan(1);
    expect(lunging.dog.x).toBeGreaterThan(1.88); // braced against the leash
    expect(calm.dog.x).toBeLessThan(1.7); // an ordinary Dog is dragged along
  });

  it('slows an Alert Dog a little as it watches', () => {
    const speed = (arousal: number) => {
      const s = calmStage();
      s.arousal = arousal;
      tick(s, noInput); // the tier is refreshed from the Arousal
      tick(s, noInput);
      return Math.hypot(s.dogDesired.x, s.dogDesired.y);
    };
    expect(speed(0.7 * T)).toBeCloseTo(defaultScenario.dogGoalSpeed * defaultScenario.reaction.alertSlowdown, 2);
    expect(speed(0.1 * T)).toBeCloseTo(defaultScenario.dogGoalSpeed, 2);
  });

  it('recovers Reactive -> Alert -> Calm through standard decay once the line of sight breaks', () => {
    const wall = { from: { x: 3, y: -5 }, to: { x: 3, y: 5 } };
    const s = createState(1, scenario({ distractor: nearby, walls: [wall] }));
    s.dog = { x: 0, y: 0 };
    s.handler = { x: 0, y: 0 };
    s.distractor.active = true;
    s.distractor.pos = { x: 6, y: 0 };
    s.distractor.from = { x: 6, y: 0 };
    s.distractor.to = { x: 6, y: 1000 };
    s.arousal = 40;
    tick(s, noInput);
    const tiers = changes(run(s, 12)).map((e) => e.tier);
    expect(tiers).toEqual(['alert', 'calm']);
    expect(s.tier).toBe('calm');
    expect(s.arousal).toBeLessThan(0.6 * T);
  });

  it('recovers once the Distractor moves out of range', () => {
    const s = withDistractorAt(6);
    s.arousal = T + 5;
    tick(s, noInput);
    expect(s.tier).toBe('reactive');
    s.distractor.pos = { x: defaultScenario.distractor.triggerRadius + 5, y: 0 };
    s.distractor.from = { ...s.distractor.pos };
    s.distractor.to = { x: s.distractor.pos.x, y: 1000 };
    const tiers = changes(run(s, 6)).map((e) => e.tier);
    expect(tiers[0]).toBe('alert');
    expect(s.arousal).toBeLessThan(T + 5);
  });
});

describe('line of sight', () => {
  const car = { type: 'parked_car', pos: { x: 4, y: 0 }, visualShield: true };

  it('stops a parked car in between raising the Arousal, and the same car beside the line does not', () => {
    const rise = (scenery: ScenarioConfig['scenery']) => {
      const s = withDistractorAt(8, scenario({ distractor: nearby, scenery }));
      tick(s, noInput, 0.05);
      return s.arousal;
    };
    expect(rise([car])).toBe(0);
    expect(rise([{ ...car, pos: { x: 4, y: 5 } }])).toBeGreaterThan(0);
    expect(rise([{ ...car, visualShield: false }])).toBeGreaterThan(0); // a bush shields nothing
  });

  it('stops a wall in between raising the Arousal', () => {
    const s = withDistractorAt(8, scenario({ distractor: nearby, walls: [{ from: { x: 4, y: -5 }, to: { x: 4, y: 5 } }] }));
    tick(s, noInput, 0.05);
    expect(s.arousal).toBe(0);
  });

  it('raises the Arousal again when the Dog steps out from behind the shield', () => {
    const s = withDistractorAt(8, scenario({ distractor: nearby, scenery: [car] }));
    tick(s, noInput, 0.05);
    expect(s.arousal).toBe(0);
    s.dog = { x: 0, y: 6 };
    s.handler = { x: 0, y: 6 };
    tick(s, noInput, 0.05);
    expect(s.arousal).toBeGreaterThan(0);
  });
});
