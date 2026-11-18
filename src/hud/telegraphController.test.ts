import { defaultScenario, type ScenarioConfig } from '../sim/config';
import { routeWalker } from '../sim/harness';
import { buildPayload } from '../sim/payload';
import { createState, tick, type SimEvent, type SimInput, type SimState } from '../sim/sim';
import { FIRST_WALK } from '../shell/onboarding/introNode';
import { generateDailyStage } from '../shell/daily';
import type { AssistLevel, AssistState } from './markerAssist';
import { TelegraphController, type TelegraphTickContext } from './telegraphController';
import type { TelegraphView } from './telegraph';

const assist = (level: AssistLevel, successRun = 0, failRun = 0): AssistState => ({ level, successRun, failRun });
const view = (o: Partial<TelegraphView> = {}): TelegraphView => ({
  time: 0, dogMode: 'goal', calmElapsed: 0, calmSeconds: 3, rewardWindow: null, nextCheckInAt: 99, dogLookUntil: 0, lookStartedAt: -1, lookCause: null, ...o,
}) as TelegraphView;
const ctx = (o: Partial<TelegraphTickContext> = {}): TelegraphTickContext => ({ pre: { dogMode: 'goal', calmElapsed: 0 }, marksUsed: 0, markBudget: 10, ...o });
const hit: SimEvent = { type: 'marker-hit', time: 1, accuracyMs: 100, grade: 'perfect' } as SimEvent;
const miss: SimEvent = { type: 'marker-late', time: 1 } as SimEvent;
const fixStart: SimEvent = { type: 'fixation-start', time: 1 };

describe('TelegraphController level sampling', () => {
  it('uses Full in the guided first Stage and with always-on help, whatever the stored level', () => {
    expect(new TelegraphController({ assist: assist('off'), guidedFirstStage: true }).level).toBe('full');
    expect(new TelegraphController({ assist: assist('late'), alwaysTimingHelp: true }).level).toBe('full');
    expect(new TelegraphController({ assist: assist('late') }).level).toBe('late');
  });

  it('does not change the level of a ring on screen when the assist steps; applies it at the next Fixation', () => {
    const c = new TelegraphController({ assist: assist('full', 2, 0) });
    c.step(view({ time: 1, dogMode: 'fixated', calmElapsed: 0 }), [fixStart], ctx());
    const stepped = c.step(view({ time: 1.1, dogMode: 'fixated', calmElapsed: 0.1 }), [hit], ctx());
    expect(stepped.assistChanged?.level).toBe('ring');
    expect(c.level).toBe('full'); // still the sampled level while the ring is up
    c.step(view({ time: 5 }), [], ctx()); // ring gone
    c.step(view({ time: 6 }), [], ctx());
    c.step(view({ time: 6.1 }), [], ctx());
    expect(c.level).toBe('ring');
    c.step(view({ time: 7, dogMode: 'fixated' }), [fixStart], ctx());
    expect(c.level).toBe('ring');
  });
});

describe('TelegraphController outcomes', () => {
  it('steps the assist after three Marker hits and reports each change', () => {
    const c = new TelegraphController({ assist: assist('full') });
    expect(c.step(view(), [hit], ctx()).assistChanged).toEqual(assist('full', 1, 0));
    c.step(view(), [hit], ctx());
    expect(c.step(view(), [hit], ctx()).assistChanged).toEqual(assist('ring'));
    expect(c.step(view(), [], ctx()).assistChanged).toBeNull();
  });

  it('steps back up after two failures', () => {
    const c = new TelegraphController({ assist: assist('late') });
    c.step(view(), [miss], ctx());
    expect(c.step(view(), [miss], ctx()).assistChanged).toEqual(assist('ring'));
  });

  it('counts a reactive press as a failure only while the calm period is under way (state before the tick)', () => {
    const reactive: SimEvent = { type: 'marker-reactive', time: 1 };
    const a = new TelegraphController({ assist: assist('ring') });
    a.step(view(), [reactive, reactive], ctx({ pre: { dogMode: 'fixated', calmElapsed: 1 } }));
    expect(a.step(view(), [], ctx()).assistChanged).toBeNull();
    const b = new TelegraphController({ assist: assist('ring') });
    expect(b.step(view(), [reactive, reactive], ctx({ pre: { dogMode: 'fixated', calmElapsed: 1 } })).assistChanged).not.toBeNull();
    const c = new TelegraphController({ assist: assist('ring') });
    expect(c.step(view(), [reactive, reactive], ctx({ pre: { dogMode: 'goal', calmElapsed: 0 } })).assistChanged).toBeNull();
  });

  it('never updates the assist with always-on help or in the Taste Stage', () => {
    for (const opts of [{ alwaysTimingHelp: true }, { isTasteStage: true }]) {
      const c = new TelegraphController({ assist: assist('full'), ...opts });
      for (let i = 0; i < 5; i++) expect(c.step(view(), [hit], ctx()).assistChanged).toBeNull();
    }
  });

  it('counts outcomes in the guided first Stage', () => {
    const c = new TelegraphController({ assist: assist('full'), guidedFirstStage: true });
    expect(c.step(view(), [hit], ctx()).assistChanged).toEqual(assist('full', 1, 0));
  });
});

describe('TelegraphController beats and highlight', () => {
  it('sends count-in beats at Full only, once each, and again after a restart', () => {
    const c = new TelegraphController({ assist: assist('full') });
    const beats: number[] = [];
    const run = (calm: number, t: number) => beats.push(...c.step(view({ time: t, dogMode: 'fixated', calmElapsed: calm }), t === 1 ? [fixStart] : [], ctx()).beats);
    run(0, 1); run(0.8, 2); run(1.6, 3); run(2.4, 4);
    expect(beats).toEqual([1, 2, 3]);
    run(0, 5); run(0.8, 6);
    expect(beats).toEqual([1, 2, 3, 1]);
    const r = new TelegraphController({ assist: assist('ring') });
    expect(r.step(view({ time: 1, dogMode: 'fixated', calmElapsed: 0 }), [fixStart], ctx()).beats).toEqual([]);
    expect(r.step(view({ time: 2, dogMode: 'fixated', calmElapsed: 2.5 }), [], ctx()).beats).toEqual([]);
  });

  it('highlights the Marker only at Full during a landed window', () => {
    for (const [level, expected] of [['full', true], ['ring', false]] as const) {
      const c = new TelegraphController({ assist: assist(level) });
      c.step(view({ time: 1, dogMode: 'fixated', calmElapsed: 0 }), [fixStart], ctx());
      c.step(view({ time: 3.9, dogMode: 'fixated', calmElapsed: 2.9 }), [], ctx());
      const landed = c.step(view({ time: 4, dogMode: 'holding', calmElapsed: 3, rewardWindow: { openedAt: 4, closesAt: 5.1 } }), [], ctx());
      expect(landed.ring?.phase).toBe('landed');
      expect(landed.highlight).toBe(expected);
      const good = c.step(view({ time: 4.5, dogMode: 'holding', calmElapsed: 3, rewardWindow: { openedAt: 4, closesAt: 5.1 } }), [], ctx());
      expect(good.ring?.phase).toBe('good');
      expect(good.highlight).toBe(false);
      expect(good.goodLeft).toBeCloseTo(0.6 / 1.1);
    }
  });

  it('reports a snap with the progress the ring had before it', () => {
    const c = new TelegraphController({ assist: assist('full') });
    c.step(view({ time: 1, dogMode: 'fixated', calmElapsed: 0 }), [fixStart], ctx());
    c.step(view({ time: 2, dogMode: 'fixated', calmElapsed: 1.5 }), [], ctx());
    const snap = c.step(view({ time: 2.02, dogMode: 'fixated', calmElapsed: 0 }), [], ctx());
    expect(snap.ring?.snap).toBe(true);
    expect(snap.snapFromProgress).toBeCloseTo(0.5);
    expect(snap.snapAge).toBe(0);
  });
});

/** Same seed and inputs, with the telegraph computed at each level, with always-on help, and not computed: identical payloads (telegraph-marker-timing 6.4). */
describe('telegraph never changes a seeded Stage', () => {
  const cases: [string, ScenarioConfig][] = [
    ['guided first Stage', { ...defaultScenario, ...FIRST_WALK }],
    ['Daily Stage', generateDailyStage('2026-05-17')],
  ];

  function run(seed: number, config: ScenarioConfig, controller: TelegraphController | null): string {
    const state: SimState = createState(seed, config);
    const walk = routeWalker(config);
    let pressed = -1;
    for (let i = 0; i < 90 / config.fixedStep && !state.ended; i++) {
      const w = walk(state);
      const stand = state.dogMode === 'fixated' || state.dogMode === 'holding';
      const win = state.rewardWindow;
      const marker = !!win && pressed !== win.openedAt && state.time >= win.openedAt + 0.2 ? ((pressed = win.openedAt), true) : false;
      const input: SimInput = { direction: w.direction, strength: stand ? 0 : w.strength, marker, sniff: false };
      const pre = { dogMode: state.dogMode as string, calmElapsed: state.calmElapsed };
      const events = tick(state, input);
      controller?.step(
        { time: state.time, dogMode: state.dogMode, calmElapsed: state.calmElapsed, calmSeconds: state.config.calmSeconds, rewardWindow: state.rewardWindow, nextCheckInAt: state.nextCheckInAt, dogLookUntil: state.dogLookUntil, lookStartedAt: state.lookStartedAt, lookCause: state.lookCause },
        events,
        { pre, marksUsed: state.telemetry.marksUsed, markBudget: state.config.markBudget },
      );
    }
    return JSON.stringify(buildPayload(state));
  }

  it.each(cases)('gives identical debrief payloads in the %s', (_n, config) => {
    for (const seed of [1, 2, 3]) {
      const none = run(seed, config, null);
      for (const level of ['full', 'ring', 'late', 'off'] as const) {
        expect(run(seed, config, new TelegraphController({ assist: assist(level) }))).toBe(none);
      }
      expect(run(seed, config, new TelegraphController({ assist: assist('off'), alwaysTimingHelp: true }))).toBe(none);
      expect(run(seed, config, new TelegraphController({ assist: assist('full'), guidedFirstStage: true }))).toBe(none);
    }
  });
});
