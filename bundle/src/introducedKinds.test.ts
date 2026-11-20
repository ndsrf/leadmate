import { FeedbackDecider } from '../../src/hud/feedback';
import type { SimEvent } from '../../src/sim/sim';
import { defaultScenario, type ScenarioConfig } from '../../src/sim/config';
import { createState, isGoSniffAvailable, noInput, tick, type SimState } from '../../src/sim/sim';
import { introducedKinds } from '../../src/shell/introductions';
import { goSniffInput, goSniffOffered, isIntroduced, resolveIntroducedKinds } from './introducedKinds';

const follow: SimEvent = { type: 'dog-follow', time: 0 };
const checkIn: SimEvent = { type: 'check-in-hit', time: 0, grade: 'good' };

describe('Introduced kinds of a started Stage', () => {
  it('prefers the Stage options, then the last start message, else leaves the set absent', () => {
    expect(resolveIntroducedKinds(['a'], ['b'])).toEqual(['a']);
    expect(resolveIntroducedKinds(undefined, ['b'])).toEqual(['b']);
    expect(resolveIntroducedKinds(undefined, undefined)).toBeUndefined();
  });

  it('answers every kind without the field and only the given kinds with it', () => {
    const run = (set: readonly string[] | undefined) => new FeedbackDecider({ introducedKinds: set }).step({ time: 0, events: [follow, checkIn] });
    expect(new FeedbackDecider({ introducedKinds: undefined }).step({ time: 0, events: [follow] })?.kind).toBe('followed-turn');
    expect(run(['check-in-hit'])?.kind).toBe('check-in-hit');
    expect(new FeedbackDecider({ introducedKinds: ['check-in-hit'] }).step({ time: 0, events: [follow] })).toBeNull();
  });

  it('hides Go Sniff unless go-sniff is Introduced or the field is absent', () => {
    expect(isIntroduced(undefined, 'go-sniff')).toBe(true);
    expect(isIntroduced(['check-in-hit'], 'go-sniff')).toBe(false);
    expect(isIntroduced(['check-in-hit', 'go-sniff'], 'go-sniff')).toBe(true);
  });
});

describe('Go Sniff button and input gate (introduce-walk-feedback-gradually 3.4)', () => {
  const STEP = defaultScenario.fixedStep;
  const STARTING = introducedKinds({ kind: 'first' });
  const WITH_SNIFF = [...STARTING, 'go-sniff'];

  const run = (s: SimState, seconds: number) => {
    for (let i = 0; i < Math.round(seconds / STEP); i++) tick(s, noInput);
  };

  /** A scent Stage on an open field: Go Sniff is on offer at any time on Slack. */
  const scentStage = (): SimState => {
    const config: ScenarioConfig = {
      ...defaultScenario,
      world: 6,
      scenery: [],
      distractor: { ...defaultScenario.distractor, activateAfterMeters: 1e9 },
      scents: [{ pos: { x: 500, y: 500 }, strength: 'weak' }],
    };
    const s = createState(8, config);
    run(s, 0.5);
    return s;
  };

  /** A Stage right after an unmarked Reward Window closed: the post-Disengagement offer is open. */
  const postDisengagement = (): SimState => {
    const config: ScenarioConfig = {
      ...defaultScenario,
      distractor: { ...defaultScenario.distractor, path: { from: { x: 3, y: -12 }, to: { x: 3, y: 12 } }, activateAfterMeters: 0 },
    };
    const s = createState(5, config);
    for (let i = 0; i < 30 / STEP; i++) if (tick(s, noInput).some((e) => e.type === 'disengagement')) break;
    run(s, 1.3);
    s.dog = { ...s.handler }; // beside the Handler: the leash stays Slack
    tick(s, noInput);
    return s;
  };

  const stages: [string, () => SimState][] = [
    ['a scent Stage', scentStage],
    ['a post-Disengagement offer', postDisengagement],
  ];

  describe.each(stages)('in %s', (_name, make) => {
    it('has the offer in the sim (so the gate is what hides it)', () => {
      expect(isGoSniffAvailable(make())).toBe(true);
    });

    it('shows no button and sends no sniff input when go-sniff is not Introduced', () => {
      const s = make();
      expect(goSniffOffered(STARTING, s)).toBe(false);
      expect(goSniffInput(true, STARTING)).toBe(false); // button press or keyboard N
    });

    it('shows the button and sends the sniff input when go-sniff is Introduced', () => {
      const s = make();
      expect(goSniffOffered(WITH_SNIFF, s)).toBe(true);
      expect(goSniffInput(true, WITH_SNIFF)).toBe(true);
    });

    it('shows the button and sends the sniff input when the field is absent', () => {
      const s = make();
      expect(goSniffOffered(undefined, s)).toBe(true);
      expect(goSniffInput(true, undefined)).toBe(true);
    });
  });

  it('sends no sniff input without a press, whatever the set', () => {
    expect(goSniffInput(false, WITH_SNIFF)).toBe(false);
    expect(goSniffInput(false, undefined)).toBe(false);
  });

  it("New player's Daily Stage: no button with the daily set of no completed Nodes", () => {
    const daily = introducedKinds({ kind: 'daily', completedNodes: [] });
    expect(daily).not.toContain('go-sniff');
    expect(goSniffOffered(daily, scentStage())).toBe(false);
    expect(goSniffOffered(daily, postDisengagement())).toBe(false);
    expect(goSniffInput(true, daily)).toBe(false);
  });
});
