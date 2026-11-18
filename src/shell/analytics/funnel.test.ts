import {
  funnelStepOf,
  FunnelTracker,
  type FunnelStepInput,
} from './funnel';
import { FUNNEL_STEPS, type FunnelStep } from './contract';

describe('Funnel Step Derivation (Task 5.3)', () => {
  it('covers every value in FUNNEL_STEPS', () => {
    const inputs: Array<{ expected: FunnelStep; input: FunnelStepInput }> = [
      { expected: 'welcome', input: { route: { name: 'funnel', step: 'welcome' } } },
      { expected: 'language', input: { route: { name: 'funnel', step: 'language' } } },
      { expected: 'dog', input: { route: { name: 'funnel', step: 'dog' } } },
      { expected: 'concern', input: { route: { name: 'funnel', step: 'concern' } } },
      { expected: 'taste_briefing', input: { route: { name: 'taste' }, tasteBriefed: false } },
      { expected: 'taste_stage', input: { route: { name: 'taste' }, tasteBriefed: true, tastePayoff: false } },
      { expected: 'taste_payoff', input: { route: { name: 'taste' }, tasteBriefed: true, tastePayoff: true } },
      { expected: 'setup_equipment', input: { route: { name: 'funnel', step: 'setup' }, setupPart: 'equipment' } },
      { expected: 'setup_weights', input: { route: { name: 'funnel', step: 'setup' }, setupPart: 'weights' } },
      { expected: 'setup_about', input: { route: { name: 'funnel', step: 'setup' }, setupPart: 'about' } },
      { expected: 'setup_home', input: { route: { name: 'funnel', step: 'setup' }, setupPart: 'home' } },
      { expected: 'setup_questions', input: { route: { name: 'funnel', step: 'setup' }, setupPart: 'questions' } },
      { expected: 'diagnostic', input: { route: { name: 'funnel', step: 'diagnostic' } } },
      { expected: 'plan', input: { route: { name: 'funnel', step: 'plan' } } },
      { expected: 'method', input: { route: { name: 'funnel', step: 'method' } } },
      { expected: 'first_primer', input: { route: { name: 'first-stage' }, introStep: 'primer' } },
      { expected: 'first_checkpoint', input: { route: { name: 'first-stage' }, introStep: 'checkpoint' } },
      { expected: 'first_walk', input: { route: { name: 'first-stage' }, introStep: 'simulation' } },
      { expected: 'first_debrief', input: { route: { name: 'first-stage' }, introStep: 'debrief' } },
      { expected: 'register_prompt', input: { route: { name: 'flow' }, flowName: 'register' } },
      { expected: 'account', input: { route: { name: 'flow' }, flowName: 'auth', isFunnelAuth: true } },
      { expected: 'paywall', input: { route: { name: 'paywall' } } },
      { expected: 'map', input: { route: { name: 'map' }, funnelOpen: true } },
    ];

    expect(inputs).toHaveLength(FUNNEL_STEPS.length);

    for (const { expected, input } of inputs) {
      expect(funnelStepOf(input)).toBe(expected);
    }
  });

  it('returns null for map when funnelOpen is false', () => {
    expect(funnelStepOf({ route: { name: 'map' }, funnelOpen: false })).toBeNull();
  });

  it('returns null for non-funnel routes and flows', () => {
    expect(funnelStepOf({ route: { name: 'splash' } })).toBeNull();
    expect(funnelStepOf({ route: { name: 'settings' } })).toBeNull();
    expect(funnelStepOf({ route: { name: 'flow' }, flowName: 'node' })).toBeNull();
    expect(funnelStepOf({ route: { name: 'flow' }, flowName: 'daily' })).toBeNull();
  });

  describe('FunnelTracker deduplication and state transitions', () => {
    it('reports a step on initial arrival, but returns null on re-render of the same step', () => {
      const tracker = new FunnelTracker({ funnelDoneOnce: false, funnelOpen: false });

      const step1 = tracker.stepChange({ route: { name: 'funnel', step: 'welcome' } });
      expect(step1).toEqual({ step: 'welcome', repeat: false, openChangedTo: true });

      // Re-render of welcome
      const step1ReRender = tracker.stepChange({ route: { name: 'funnel', step: 'welcome' } });
      expect(step1ReRender).toBeNull();

      // Advance to language
      const step2 = tracker.stepChange({ route: { name: 'funnel', step: 'language' } });
      expect(step2).toEqual({ step: 'language', repeat: false, openChangedTo: undefined });
    });

    it('upgraded install already past welcome/funnel sends no map', () => {
      // For an upgraded install, funnelOpen is false initially and onboarding step is 'done'
      const tracker = new FunnelTracker({ funnelDoneOnce: true, funnelOpen: false });
      const view = tracker.stepChange({ route: { name: 'map' } });
      expect(view).toBeNull();
    });

    it('second Funnel run after reset sends map with repeat true', () => {
      // User had already finished once before: funnelDoneOnce is true, but reset happened so funnelOpen is false
      const tracker = new FunnelTracker({ funnelDoneOnce: true, funnelOpen: false });

      // Starts over at welcome
      const welcome = tracker.stepChange({ route: { name: 'funnel', step: 'welcome' } });
      expect(welcome).toEqual({ step: 'welcome', repeat: true, openChangedTo: true });

      // Reaches map
      const map = tracker.stepChange({ route: { name: 'map' } });
      expect(map).toEqual({ step: 'map', repeat: true, openChangedTo: false, doneOnceChangedTo: true });
    });
  });
});
