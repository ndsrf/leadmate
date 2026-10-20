import { defaultScenario, type ScenarioConfig } from './config';
import { runScripted } from './harness';
import { BUNDLE_MESSAGE_TYPES, SHELL_MESSAGE_TYPES, createOutbox, decode, encode, type BundleMessage, type ShellMessage } from './messages';
import { buildPayload, handlingScore, SCORE_WEIGHTS, type SimulationDebriefPayload } from './payload';
import { createState, noInput, tick, type SimInput, type SimState } from './sim';

const scenario = (o: Partial<ScenarioConfig>): ScenarioConfig => ({ ...defaultScenario, ...o });
const nearbyDistractor = {
  ...defaultScenario.distractor,
  path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } },
  activateAfterMeters: 0,
};

/** Walk toward the waypoint, stop for the Skateboarder, press the Marker 300 ms after Disengagement. */
function player(config: ScenarioConfig) {
  let disengagedAt: number | null = null;
  return (s: SimState): SimInput => {
    if (s.rewardWindow && disengagedAt === null) disengagedAt = s.rewardWindow.openedAt;
    const marker = disengagedAt !== null && Math.abs(s.time - (disengagedAt + 0.3)) < config.fixedStep / 2;
    const stop = s.dogMode === 'fixated' || s.rewardWindow !== null;
    const direction = { x: config.waypoint.x - s.handler.x, y: config.waypoint.y - s.handler.y };
    return { direction, strength: stop ? 0 : 0.6, marker };
  };
}

describe('SimulationDebriefPayload', () => {
  const config = scenario({});

  it('has every field and sums the tension shares to 100', () => {
    const { payload } = runScripted(11, player(config), config);
    expect(Object.keys(payload).sort()).toEqual(
      [
        'durationSeconds', 'slackPercentage', 'tautPercentage', 'pullPercentage', 'markerAccuracyMs',
        'markerHits', 'markerMisses', 'reactiveMarkers', 'missedOpportunities', 'checkInHits',
        'followMarks', 'posteSuccesses', 'harshStops', 'peakArousalScore', 'calmEncounters',
        'marksUsed', 'markBudget', 'seed', 'sintoniaTimeSeconds', 'goSniffs', 'handlingScore', 'configVersion',
      ].sort(),
    );
    expect(payload.slackPercentage + payload.tautPercentage + payload.pullPercentage).toBeGreaterThanOrEqual(99);
    expect(payload.slackPercentage + payload.tautPercentage + payload.pullPercentage).toBeLessThanOrEqual(101);
    expect(payload.seed).toBe(11);
    expect(payload.durationSeconds).toBeGreaterThan(0);
  });

  it('reports Marker accuracy as press minus Disengagement', () => {
    const { payload } = runScripted(11, player(config), config);
    expect(payload.markerHits).toBe(1);
    expect(payload.markerAccuracyMs).toBeGreaterThanOrEqual(290);
    expect(payload.markerAccuracyMs).toBeLessThanOrEqual(320);
  });

  it('reports Marks used out of the budget and Check-in hits', () => {
    const { payload } = runScripted(11, player(config), config);
    expect(payload.marksUsed).toBe(1);
    expect(payload.markBudget).toBe(defaultScenario.markBudget);
    expect(payload.checkInHits).toBe(0);
    const fresh = buildPayload(createState(1, scenario({ markBudget: 3 })));
    expect(fresh).toMatchObject({ marksUsed: 0, markBudget: 3, checkInHits: 0 });
  });

  it('leaves markerAccuracyMs out when there was no hit', () => {
    const payload = buildPayload(createState(1));
    expect('markerAccuracyMs' in payload).toBe(false);
    expect(payload.slackPercentage).toBe(100);
  });

  it('counts a missed Distractor when the Handler never stops', () => {
    const c = scenario({ distractor: nearbyDistractor, endCondition: { kind: 'time-limit', seconds: 15 } });
    const { payload } = runScripted(5, () => ({ direction: { x: 0, y: 1 }, strength: 0.6, marker: false }), c);
    expect(payload.missedOpportunities).toBe(1);
    expect(payload.markerHits).toBe(0);
    expect(payload.markerAccuracyMs).toBeUndefined();
  });

  it('reproduces the same payload for the same seed and inputs', () => {
    const a = runScripted(99, player(config), config).payload;
    const b = runScripted(99, player(config), config).payload;
    expect(a).toEqual(b);
    expect(runScripted(100, player(config), config).payload.seed).toBe(100);
  });
});

describe('message adapter', () => {
  it('round-trips bundle messages and ignores foreign ones', () => {
    const message: BundleMessage = { type: 'error', message: 'boom' };
    expect(decode<BundleMessage>(encode(message), BUNDLE_MESSAGE_TYPES)).toEqual(message);
    expect(decode<BundleMessage>('not json', BUNDLE_MESSAGE_TYPES)).toBeNull();
    expect(decode<BundleMessage>({ type: 'webpack-hmr' }, BUNDLE_MESSAGE_TYPES)).toBeNull();
  });

  it('decodes the suspend and wake shell messages', () => {
    for (const type of ['suspend', 'wake'] as const) {
      expect(decode<ShellMessage>(encode({ type }), SHELL_MESSAGE_TYPES)).toEqual({ type });
    }
  });

  it('sends the same payload shape through the native bridge and the browser parent', () => {
    const payload = runScripted(3, player(scenario({})), scenario({})).payload;
    const native: string[] = [];
    const browser: string[] = [];
    createOutbox({ ReactNativeWebView: { postMessage: (d) => native.push(d) } })({ type: 'debrief', payload });
    const self = {};
    createOutbox({ self, parent: { postMessage: (d) => browser.push(d) } })({ type: 'debrief', payload });
    expect(native).toHaveLength(1);
    expect(browser).toEqual(native);
  });

  it('stays silent on a standalone page', () => {
    const win: { parent?: { postMessage: () => void }; self?: unknown } = {};
    win.self = win;
    win.parent = win as never;
    expect(() => createOutbox(win)({ type: 'ready' })).not.toThrow();
  });
});

describe('Sintonía telemetry', () => {
  it('aggregates the seconds of active Sintonía into the payload', () => {
    const free = scenario({ leashLength: 100, dogGoalSpeed: 0, distractor: { ...defaultScenario.distractor, activateAfterMeters: 1e9 } });
    const s = createState(1, free);
    for (let i = 0; i < 6 * 60; i++) tick(s, { direction: { x: Math.cos(s.time), y: Math.sin(s.time) }, strength: 0.6, marker: false });
    const p = buildPayload(s);
    expect(p.sintoniaTimeSeconds).toBeCloseTo(s.telemetry.sintoniaTime, 1);
    expect(p.sintoniaTimeSeconds).toBeGreaterThan(3);
    expect(p.sintoniaTimeSeconds).toBeLessThanOrEqual(p.durationSeconds);
  });

  it('is 0 for a Stage without it', () => {
    const s = createState(1, scenario({ distractor: { ...defaultScenario.distractor, activateAfterMeters: 1e9 } }));
    for (let i = 0; i < 120; i++) tick(s, noInput);
    expect(buildPayload(s).sintoniaTimeSeconds).toBe(0);
  });
});

describe('handling score', () => {
  const perfect: Omit<SimulationDebriefPayload, 'handlingScore' | 'configVersion'> = {
    durationSeconds: 100, slackPercentage: 100, tautPercentage: 0, pullPercentage: 0, markerAccuracyMs: 0, markerHits: 3,
    markerMisses: 0, reactiveMarkers: 0, missedOpportunities: 0, checkInHits: 0, followMarks: 0, posteSuccesses: 0, harshStops: 0,
    peakArousalScore: 0, calmEncounters: {}, marksUsed: 3, markBudget: 5, seed: 1, sintoniaTimeSeconds: 40, goSniffs: 0,
  };

  it('weights add up to 1000', () => expect(Object.values(SCORE_WEIGHTS).reduce((a, b) => a + b, 0)).toBe(1000));
  it('gives 1000 for a perfect Stage', () => expect(handlingScore(perfect)).toBe(1000));

  it('scores composure out of 400 from 100 minus the peak Arousal', () => {
    expect(handlingScore({ ...perfect, peakArousalScore: 50 })).toBe(800);
    expect(handlingScore({ ...perfect, peakArousalScore: 100 })).toBe(600);
  });

  it('scores the Slack share out of 300', () => expect(handlingScore({ ...perfect, slackPercentage: 50 })).toBe(850));

  it('scores Marker accuracy out of 200, falling to 0 at the end of the Reward Window', () => {
    expect(handlingScore({ ...perfect, markerAccuracyMs: 550 })).toBe(900);
    expect(handlingScore({ ...perfect, markerAccuracyMs: 1100 })).toBe(800);
  });

  it('gives no Marker points when there were encounters but no hit, and all of them when there were none', () => {
    expect(handlingScore({ ...perfect, markerAccuracyMs: undefined, markerHits: 0, missedOpportunities: 1 })).toBe(800);
    expect(handlingScore({ ...perfect, markerAccuracyMs: undefined, markerHits: 0 })).toBe(1000);
  });

  it('scores Sintonía out of 100, full at 40% of the Stage', () => {
    expect(handlingScore({ ...perfect, sintoniaTimeSeconds: 20 })).toBe(950);
    expect(handlingScore({ ...perfect, sintoniaTimeSeconds: 0 })).toBe(900);
    expect(handlingScore({ ...perfect, sintoniaTimeSeconds: 90 })).toBe(1000);
  });

  it('stays within 0 to 1000 and ends up in every payload', () => {
    expect(handlingScore({ ...perfect, peakArousalScore: 300, slackPercentage: -5 })).toBeGreaterThanOrEqual(0);
    const { payload } = runScripted(11, player(scenario({})), scenario({}));
    expect(payload.handlingScore).toBeGreaterThanOrEqual(0);
    expect(payload.handlingScore).toBeLessThanOrEqual(1000);
    expect(payload.handlingScore).toBe(handlingScore(payload));
  });

  it('is the same for the same seed and inputs, so a replay can be compared', () => {
    const config = scenario({});
    expect(runScripted(11, player(config), config).payload.handlingScore).toBe(runScripted(11, player(config), config).payload.handlingScore);
  });
});

describe('Reaction Tier bridge event', () => {
  it('round-trips through the bridge with its tier and simulation time', () => {
    const message: BundleMessage = { type: 'reaction-tier-change', tier: 'reactive', time: 12.5 };
    expect(decode<BundleMessage>(encode(message), BUNDLE_MESSAGE_TYPES)).toEqual(message);
  });

  it('goes native and browser the same way', () => {
    const native: string[] = [];
    createOutbox({ ReactNativeWebView: { postMessage: (d) => native.push(d) } })({ type: 'reaction-tier-change', tier: 'alert', time: 3 });
    expect(JSON.parse(native[0])).toEqual({ type: 'reaction-tier-change', tier: 'alert', time: 3 });
  });

  it('carries the Cue type on playCue', () => {
    const message: BundleMessage = { type: 'playCue', cueType: 'leave-it' };
    expect(decode<BundleMessage>(encode(message), BUNDLE_MESSAGE_TYPES)).toEqual(message);
  });
});
