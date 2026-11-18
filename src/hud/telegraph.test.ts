import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { defaultScenario, type ScenarioConfig } from '../sim/config';
import { routeDirection } from '../sim/harness';
import { createState, tick, type SimInput, type SimState } from '../sim/sim';
import { generateDailyStage } from '../shell/daily';
import { FIRST_WALK } from '../shell/onboarding/introNode';
import {
  beatsCrossed,
  checkInLead,
  TelegraphModel,
  type TelegraphView,
} from './telegraph';

function baseView(overrides?: Partial<TelegraphView>): TelegraphView {
  return {
    time: 0,
    dogMode: 'fixated',
    calmElapsed: 0,
    calmSeconds: 3,
    rewardWindow: null,
    nextCheckInAt: 10,
    dogLookUntil: 0,
    lookStartedAt: 0,
    lookCause: 'glance',
    ...overrides,
  };
}

describe('Telegraph ring progress (task 2.1)', () => {
  it('maps calmElapsed / calmSeconds to progress (1.5 / 3 -> 0.5, 4 s calm period)', () => {
    const model = new TelegraphModel();
    const state1 = model.update(baseView({ calmElapsed: 1.5, calmSeconds: 3 }), 'full');
    expect(state1.ring).not.toBeNull();
    expect(state1.ring?.progress).toBeCloseTo(0.5);

    const model2 = new TelegraphModel();
    const state2 = model2.update(baseView({ calmElapsed: 2.0, calmSeconds: 4 }), 'full');
    expect(state2.ring).not.toBeNull();
    expect(state2.ring?.progress).toBeCloseTo(0.5);
  });

  it('shows open ring while fixated with no calm yet at Full/Ring', () => {
    const fullModel = new TelegraphModel();
    const fullState = fullModel.update(baseView({ calmElapsed: 0, calmSeconds: 3 }), 'full');
    expect(fullState.ring).toEqual(
      expect.objectContaining({
        shown: true,
        progress: 0,
        phase: 'open',
        snap: false,
      })
    );

    const ringModel = new TelegraphModel();
    const ringState = ringModel.update(baseView({ calmElapsed: 0, calmSeconds: 3 }), 'ring');
    expect(ringState.ring).toEqual(
      expect.objectContaining({
        shown: true,
        progress: 0,
        phase: 'open',
        snap: false,
      })
    );
  });

  it('shows no ring at Late below 0.5', () => {
    const lateModel = new TelegraphModel();
    // 1.2 / 3 = 0.4 (< 0.5)
    const lateState = lateModel.update(baseView({ calmElapsed: 1.2, calmSeconds: 3 }), 'late');
    expect(lateState.ring?.shown).toBe(false);

    // at or above 0.5 it should show
    const lateState2 = lateModel.update(baseView({ calmElapsed: 1.5, calmSeconds: 3 }), 'late');
    expect(lateState2.ring?.shown).toBe(true);
    expect(lateState2.ring?.progress).toBeCloseTo(0.5);
  });

  it('shows no ring at Off', () => {
    const offModel = new TelegraphModel();
    const offState = offModel.update(baseView({ calmElapsed: 1.5, calmSeconds: 3 }), 'off');
    expect(offState.ring).toBeNull();
  });
});

describe('Telegraph ring phase logic (task 2.3)', () => {
  it('detects snap on calmElapsed drop while fixated, but not on new Fixation reset', () => {
    const model = new TelegraphModel();

    // Start in goal mode
    let state = model.update(baseView({ time: 0, dogMode: 'goal', calmElapsed: 0 }), 'full');
    expect(state.ring).toBeNull();

    // New Fixation begins at time 1
    state = model.update(baseView({ time: 1, dogMode: 'fixated', calmElapsed: 0 }), 'full');
    expect(state.ring?.snap).toBe(false);
    expect(state.ring?.phase).toBe('open');

    // Calm starts holding
    state = model.update(baseView({ time: 2, dogMode: 'fixated', calmElapsed: 1.0 }), 'full');
    expect(state.ring?.snap).toBe(false);
    expect(state.ring?.phase).toBe('closing');

    // Calm broken: calmElapsed drops back to 0 while fixated
    state = model.update(baseView({ time: 2.5, dogMode: 'fixated', calmElapsed: 0 }), 'full');
    expect(state.ring?.snap).toBe(true);
    expect(state.ring?.phase).toBe('open');

    // Calm held at 0 again: no drop from 0 to 0, snap false
    state = model.update(baseView({ time: 2.6, dogMode: 'fixated', calmElapsed: 0 }), 'full');
    expect(state.ring?.snap).toBe(false);
  });

  it('lands for 0.3s then shows good until window closes when calmElapsed >= calmSeconds', () => {
    const model = new TelegraphModel();

    // Fixation builds calm up to 3.0s
    model.update(baseView({ time: 1, dogMode: 'fixated', calmElapsed: 0, calmSeconds: 3 }), 'full');
    model.update(baseView({ time: 4, dogMode: 'fixated', calmElapsed: 3.0, calmSeconds: 3 }), 'full');

    // Reward window opens at time 4.0 with calmElapsed >= calmSeconds
    const rw = { openedAt: 4.0, closesAt: 5.1 };
    let state = model.update(
      baseView({ time: 4.0, dogMode: 'goal', calmElapsed: 3.0, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('landed');
    expect(state.ring?.progress).toBe(1);
    expect(state.ring?.shown).toBe(true);

    // At 4.29s (within 0.3s): still landed
    state = model.update(
      baseView({ time: 4.29, dogMode: 'goal', calmElapsed: 3.0, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('landed');

    // At 4.31s (after 0.3s): good
    state = model.update(
      baseView({ time: 4.31, dogMode: 'goal', calmElapsed: 3.0, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('good');
    expect(state.ring?.shown).toBe(true);

    // At 5.0s: still good
    state = model.update(
      baseView({ time: 5.0, dogMode: 'goal', calmElapsed: 3.0, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('good');

    // Window marked or closed at 5.11s: ring gone
    state = model.update(
      baseView({ time: 5.11, dogMode: 'goal', calmElapsed: 3.0, calmSeconds: 3, rewardWindow: null }),
      'full'
    );
    expect(state.ring).toBeNull();
  });

  it('fades ring without landing when window opens with calmElapsed < calmSeconds (e.g. Leave It)', () => {
    const model = new TelegraphModel();

    // Fixated mid-ring (1.5 / 3.0s)
    model.update(baseView({ time: 1, dogMode: 'fixated', calmElapsed: 1.5, calmSeconds: 3 }), 'full');

    // "Leave It" opens reward window with calmElapsed 1.5 < 3.0
    const rw = { openedAt: 2.0, closesAt: 3.1 };
    let state = model.update(
      baseView({ time: 2.0, dogMode: 'goal', calmElapsed: 1.5, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('fading');

    // Still fading at 2.1s
    state = model.update(
      baseView({ time: 2.1, dogMode: 'goal', calmElapsed: 1.5, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring?.phase).toBe('fading');

    // Faded out after fade duration (e.g. at 2.2s)
    state = model.update(
      baseView({ time: 2.2, dogMode: 'goal', calmElapsed: 1.5, calmSeconds: 3, rewardWindow: rw }),
      'full'
    );
    expect(state.ring).toBeNull();
  });

  it('fades ring when Fixation ends without a window', () => {
    const model = new TelegraphModel();

    // Fixated mid-ring
    model.update(baseView({ time: 1, dogMode: 'fixated', calmElapsed: 1.0, calmSeconds: 3 }), 'full');

    // Distractor leaves without reward window
    let state = model.update(
      baseView({ time: 2.0, dogMode: 'goal', calmElapsed: 0, calmSeconds: 3, rewardWindow: null }),
      'full'
    );
    expect(state.ring?.phase).toBe('fading');

    // Faded out after fade duration
    state = model.update(
      baseView({ time: 2.2, dogMode: 'goal', calmElapsed: 0, calmSeconds: 3, rewardWindow: null }),
      'full'
    );
    expect(state.ring).toBeNull();
  });
});

describe('beatsCrossed (task 2.4)', () => {
  it('reports beats at 1/4, 2/4 and 3/4', () => {
    // calmSeconds = 3 -> beats at 0.75, 1.5, 2.25
    expect(beatsCrossed(0, 0.5, 3)).toEqual([]);
    expect(beatsCrossed(0.5, 0.8, 3)).toEqual([1]);
    expect(beatsCrossed(0.8, 1.5, 3)).toEqual([2]);
    expect(beatsCrossed(1.5, 2.3, 3)).toEqual([3]);
    expect(beatsCrossed(2.3, 3.0, 3)).toEqual([]);

    // Multiple beats crossed in one tick
    expect(beatsCrossed(0.5, 1.6, 3)).toEqual([1, 2]);
    expect(beatsCrossed(0, 2.3, 3)).toEqual([1, 2, 3]);

    // calmSeconds = 4 -> beats at 1.0, 2.0, 3.0
    expect(beatsCrossed(0.5, 1.2, 4)).toEqual([1]);
    expect(beatsCrossed(1.9, 2.1, 4)).toEqual([2]);
    expect(beatsCrossed(2.5, 3.2, 4)).toEqual([3]);
  });

  it('reports each beat only once', () => {
    expect(beatsCrossed(0.7, 0.75, 3)).toEqual([1]);
    expect(beatsCrossed(0.75, 0.8, 3)).toEqual([]);
    expect(beatsCrossed(0.8, 1.4, 3)).toEqual([]);
  });

  it('returns empty while paused (no elapsed change)', () => {
    expect(beatsCrossed(0.75, 0.75, 3)).toEqual([]);
    expect(beatsCrossed(1.5, 1.5, 3)).toEqual([]);
    expect(beatsCrossed(0, 0, 3)).toEqual([]);
  });

  it('re-arms after a restart', () => {
    // Crossing beat 1 and 2
    expect(beatsCrossed(0, 1.6, 3)).toEqual([1, 2]);

    // Restart: calm drops from 1.6 to 0 (no forward progress)
    expect(beatsCrossed(1.6, 0, 3)).toEqual([]);

    // New calm hold starts from 0: crosses beat 1 again!
    expect(beatsCrossed(0, 0.8, 3)).toEqual([1]);
  });
});

describe('Check-in arc (task 2.5)', () => {
  it('respects lead time per assist level (0.9s at Full/Ring, 0.45s at Late, none at Off)', () => {
    expect(checkInLead('full')).toBe(0.9);
    expect(checkInLead('ring')).toBe(0.9);
    expect(checkInLead('late')).toBe(0.45);
    expect(checkInLead('off')).toBe(0);
  });

  it('builds only when in goal mode, 0 < nextCheckInAt - time <= lead, and dogLookUntil <= nextCheckInAt', () => {
    const model = new TelegraphModel();
    const nextCheckInAt = 10.0;

    // Time 9.0: 1.0s before check-in (> 0.9s lead at Full) -> no arc
    let state = model.update(
      baseView({ time: 9.0, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'full'
    );
    expect(state.checkInArc).toBeNull();

    // Time 9.1: 0.9s before check-in (starts building at Full)
    state = model.update(
      baseView({ time: 9.1, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'full'
    );
    expect(state.checkInArc).toEqual(
      expect.objectContaining({
        shown: true,
        phase: 'building',
      })
    );
    expect(state.checkInArc?.progress).toBeCloseTo(0);

    // Time 9.55: half way through 0.9s lead
    state = model.update(
      baseView({ time: 9.55, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'full'
    );
    expect(state.checkInArc?.progress).toBeCloseTo(0.5);

    // Ring assist also has 0.9s lead
    const ringModel = new TelegraphModel();
    state = ringModel.update(
      baseView({ time: 9.1, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'ring'
    );
    expect(state.checkInArc?.shown).toBe(true);

    // Late assist has 0.45s lead: at 9.1 it should be null, at 9.55 it starts building
    const lateModel = new TelegraphModel();
    state = lateModel.update(
      baseView({ time: 9.1, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'late'
    );
    expect(state.checkInArc).toBeNull();

    state = lateModel.update(
      baseView({ time: 9.55, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'late'
    );
    expect(state.checkInArc?.phase).toBe('building');
    expect(state.checkInArc?.progress).toBeCloseTo(0);

    // Off assist has no arc
    const offModel = new TelegraphModel();
    state = offModel.update(
      baseView({ time: 9.8, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }),
      'off'
    );
    expect(state.checkInArc).toBeNull();

    // If dog will already be looking at nextCheckInAt (dogLookUntil > nextCheckInAt), no arc
    const busyModel = new TelegraphModel();
    state = busyModel.update(
      baseView({ time: 9.5, dogMode: 'goal', nextCheckInAt, dogLookUntil: 10.5 }),
      'full'
    );
    expect(state.checkInArc).toBeNull();
  });

  it('lands on the tick a glance look starts after building', () => {
    const model = new TelegraphModel();
    const nextCheckInAt = 10.0;

    // Building at 9.5
    model.update(baseView({ time: 9.5, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }), 'full');

    // On tick 10.0, glance look starts
    let state = model.update(
      baseView({
        time: 10.0,
        dogMode: 'goal',
        nextCheckInAt: 15.0,
        dogLookUntil: 11.0,
        lookStartedAt: 10.0,
        lookCause: 'glance',
      }),
      'full'
    );
    expect(state.checkInArc?.phase).toBe('landed');
    expect(state.checkInArc?.progress).toBe(1);
    expect(state.checkInArc?.shown).toBe(true);

    // Stays landed for up to 0.3s
    state = model.update(
      baseView({
        time: 10.2,
        dogMode: 'goal',
        nextCheckInAt: 15.0,
        dogLookUntil: 11.0,
        lookStartedAt: 10.0,
        lookCause: 'glance',
      }),
      'full'
    );
    expect(state.checkInArc?.phase).toBe('landed');

    // After 0.3s, landed look ends
    state = model.update(
      baseView({
        time: 10.35,
        dogMode: 'goal',
        nextCheckInAt: 15.0,
        dogLookUntil: 11.0,
        lookStartedAt: 10.0,
        lookCause: 'glance',
      }),
      'full'
    );
    expect(state.checkInArc).toBeNull();
  });

  it('fades when dogMode leaves goal while building', () => {
    const model = new TelegraphModel();
    const nextCheckInAt = 10.0;

    // Building at 9.5
    model.update(baseView({ time: 9.5, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }), 'full');

    // Dog fixates at 9.6: dogMode leaves goal without glance
    let state = model.update(
      baseView({ time: 9.6, dogMode: 'fixated', calmElapsed: 0, nextCheckInAt, dogLookUntil: 0 }),
      'full'
    );
    expect(state.checkInArc?.phase).toBe('fading');

    // Fades out
    state = model.update(
      baseView({ time: 9.8, dogMode: 'fixated', calmElapsed: 0.2, nextCheckInAt, dogLookUntil: 0 }),
      'full'
    );
    expect(state.checkInArc).toBeNull();
  });

  it('fades when another look starts first while building', () => {
    const model = new TelegraphModel();
    const nextCheckInAt = 10.0;

    // Building at 9.5
    model.update(baseView({ time: 9.5, dogMode: 'goal', nextCheckInAt, dogLookUntil: 0 }), 'full');

    // Follow look starts at 9.6
    let state = model.update(
      baseView({
        time: 9.6,
        dogMode: 'goal',
        nextCheckInAt,
        dogLookUntil: 10.6,
        lookStartedAt: 9.6,
        lookCause: 'follow',
      }),
      'full'
    );
    expect(state.checkInArc?.phase).toBe('fading');

    // Faded out
    state = model.update(
      baseView({
        time: 9.8,
        dogMode: 'goal',
        nextCheckInAt,
        dogLookUntil: 10.6,
        lookStartedAt: 9.6,
        lookCause: 'follow',
      }),
      'full'
    );
    expect(state.checkInArc).toBeNull();
  });
});

describe('Telegraph sim-backed verification (task 2.6)', () => {
  const guidedScenario: ScenarioConfig = { ...defaultScenario, ...FIRST_WALK };
  const dailyScenario: ScenarioConfig = generateDailyStage('2026-05-17');
  const scentScenario: ScenarioConfig = {
    ...defaultScenario,
    ...parse(readFileSync('content/beta/nodes/park-not-that-one/node.yaml', 'utf8')).simulation.scenario,
  };

  const scenarios: [string, ScenarioConfig][] = [
    ['guided first Stage', guidedScenario],
    ['Daily Stage', dailyScenario],
    ['scent Stage', scentScenario],
  ];

  it.each(scenarios)('verifies landing frame invariants in %s across seeds 1 to 8', (_name, config) => {
    let totalLandedRings = 0;
    let totalLandedArcs = 0;

    for (let seed = 1; seed <= 8; seed++) {
      const state: SimState = createState(seed, config);
      const model = new TelegraphModel();
      let prevRingPhase: string | null = null;
      let prevArcPhase: string | null = null;
      let lastPredictedCheckInAt: number | null = null;

      for (let i = 0; i < 60 / config.fixedStep && !state.ended; i++) {
        const input: SimInput = {
          direction: routeDirection(config, state.handler),
          strength: state.dogMode === 'fixated' ? 0 : 0.6,
          marker: false,
          sniff: false,
        };

        const events = tick(state, input);

        const view: TelegraphView = {
          time: state.time,
          dogMode: state.dogMode,
          calmElapsed: state.calmElapsed,
          calmSeconds: state.config.calmSeconds,
          rewardWindow: state.rewardWindow,
          nextCheckInAt: state.nextCheckInAt,
          dogLookUntil: state.dogLookUntil,
          lookStartedAt: state.lookStartedAt,
          lookCause: state.lookCause,
        };

        const telegraph = model.update(view, 'full');

        // Track predicted check-in time while building
        if (telegraph.checkInArc?.phase === 'building') {
          lastPredictedCheckInAt = state.nextCheckInAt;
        } else if (telegraph.checkInArc?.phase === 'fading') {
          lastPredictedCheckInAt = null;
        }

        // 1. Ring landing frame equals a disengagement tick
        if (telegraph.ring?.phase === 'landed' && prevRingPhase !== 'landed') {
          totalLandedRings++;
          const hasDisengagement = events.some((e) => e.type === 'disengagement');
          expect(hasDisengagement).toBe(true);
        }

        // 2. Check-in arc landing frame equals a check-in-glance tick
        // and is within one fixed step of predicted time
        if (telegraph.checkInArc?.phase === 'landed' && prevArcPhase !== 'landed') {
          totalLandedArcs++;
          const hasGlance = events.some((e) => e.type === 'check-in-glance');
          expect(hasGlance).toBe(true);
          if (lastPredictedCheckInAt !== null) {
            expect(Math.abs(state.time - lastPredictedCheckInAt)).toBeLessThanOrEqual(
              config.fixedStep + 1e-4
            );
          }
          lastPredictedCheckInAt = null;
        }

        prevRingPhase = telegraph.ring?.phase ?? null;
        prevArcPhase = telegraph.checkInArc?.phase ?? null;
      }
    }

    // Verify that landings actually occurred and were asserted
    expect(totalLandedRings).toBeGreaterThan(0);
    expect(totalLandedArcs).toBeGreaterThan(0);
  });
});




