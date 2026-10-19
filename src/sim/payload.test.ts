import { defaultScenario, type ScenarioConfig } from './config';
import { runScripted } from './harness';
import { BUNDLE_MESSAGE_TYPES, createOutbox, decode, encode, type BundleMessage } from './messages';
import { buildPayload } from './payload';
import { createState, type SimInput, type SimState } from './sim';

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
        'marksUsed', 'markBudget', 'seed',
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
