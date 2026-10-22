import { ONBOARDING_STEPS } from './onboarding/flow';
import { isReadyToLeaveSplash, routeFor } from './navigation';

describe('routeFor', () => {
  it('returns splash until ready', () => {
    expect(routeFor({ ready: false, onboardingStep: 'setup', flow: null, settingsOpen: false })).toEqual({
      name: 'splash',
    });
    expect(routeFor({ ready: false, onboardingStep: 'done', flow: { name: 'node' }, settingsOpen: true })).toEqual({
      name: 'splash',
    });
  });

  it('funnel wins over a left-over flow and settings', () => {
    for (const step of ['welcome', 'dog', 'setup', 'diagnostic', 'plan'] as const) {
      expect(
        routeFor({
          ready: true,
          onboardingStep: step,
          flow: { name: 'node' },
          settingsOpen: true,
        }),
      ).toEqual({
        name: 'funnel',
        step,
      });
    }
  });

  it('maps every step to exactly one screen', () => {
    for (const step of ONBOARDING_STEPS) {
      const route = routeFor({ ready: true, onboardingStep: step, flow: { name: 'node' }, settingsOpen: true });
      if (step === 'done') expect(route.name).toBe('flow');
      else expect(['funnel', 'taste', 'first-stage', 'paywall']).toContain(route.name);
    }
    expect(routeFor({ ready: true, onboardingStep: 'paywall' })).toEqual({ name: 'paywall' });
    expect(routeFor({ ready: true, onboardingStep: 'taste' })).toEqual({ name: 'taste' });
  });

  it('shows login over the welcome screen and registration over the paywall, but no other flow', () => {
    const auth = { name: 'auth' };
    expect(routeFor({ ready: true, onboardingStep: 'welcome', flow: auth, accountFlow: true })).toEqual({ name: 'flow', flow: auth });
    expect(routeFor({ ready: true, onboardingStep: 'paywall', flow: auth, accountFlow: true })).toEqual({ name: 'flow', flow: auth });
    expect(routeFor({ ready: true, onboardingStep: 'setup', flow: auth, accountFlow: true })).toEqual({ name: 'funnel', step: 'setup' });
    expect(routeFor({ ready: true, onboardingStep: 'welcome', flow: auth })).toEqual({ name: 'funnel', step: 'welcome' });
  });

  it('registration shows before the paywall, and the paywall follows it however registration ends', () => {
    const register = { name: 'register' };
    const auth = { name: 'auth' };
    expect(routeFor({ ready: true, onboardingStep: 'paywall', flow: register, accountFlow: true })).toEqual({ name: 'flow', flow: register });
    expect(routeFor({ ready: true, onboardingStep: 'paywall', flow: auth, accountFlow: true })).toEqual({ name: 'flow', flow: auth });
    // not now, or an account created: the flow is gone and the persisted step decides, never the map
    expect(routeFor({ ready: true, onboardingStep: 'paywall', flow: null })).toEqual({ name: 'paywall' });
  });

  it('first-stage wins over a left-over flow and settings', () => {
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'first-stage',
        flow: { name: 'daily' },
        settingsOpen: true,
      }),
    ).toEqual({
      name: 'first-stage',
    });
  });

  it('map is default when ready and past onboarding', () => {
    expect(routeFor({ ready: true, onboardingStep: 'done', flow: null, settingsOpen: false })).toEqual({
      name: 'map',
    });
    expect(routeFor({ ready: true, onboardingStep: null, flow: null })).toEqual({
      name: 'map',
    });
  });

  it('settings and flows over the map', () => {
    // Settings over map
    expect(routeFor({ ready: true, onboardingStep: 'done', flow: null, settingsOpen: true })).toEqual({
      name: 'settings',
    });

    // Flow over map
    const flow = { name: 'warmup' };
    expect(routeFor({ ready: true, onboardingStep: 'done', flow, settingsOpen: false })).toEqual({
      name: 'flow',
      flow,
    });

    // Flow over settings
    expect(routeFor({ ready: true, onboardingStep: 'done', flow, settingsOpen: true })).toEqual({
      name: 'flow',
      flow,
    });
  });

  it('auth returns to Settings when opened from there, and returns to Map when opened from prompt/banner', () => {
    // 1. Opened from Settings: settingsOpen is true
    const authFlowFromSettings = { name: 'auth', mode: 'login' };
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'done',
        flow: authFlowFromSettings,
        settingsOpen: true,
      }),
    ).toEqual({
      name: 'flow',
      flow: authFlowFromSettings,
    });

    // When auth finishes, flow is cleared while settingsOpen remains true
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'done',
        flow: null,
        settingsOpen: true,
      }),
    ).toEqual({
      name: 'settings',
    });

    // When settings closes, returns to map
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'done',
        flow: null,
        settingsOpen: false,
      }),
    ).toEqual({
      name: 'map',
    });

    // 2. Opened from banner/prompt: settingsOpen is false
    const authFlowFromBanner = { name: 'auth', mode: 'signup' };
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'done',
        flow: authFlowFromBanner,
        settingsOpen: false,
      }),
    ).toEqual({
      name: 'flow',
      flow: authFlowFromBanner,
    });

    // When auth finishes, returns straight to map
    expect(
      routeFor({
        ready: true,
        onboardingStep: 'done',
        flow: null,
        settingsOpen: false,
      }),
    ).toEqual({
      name: 'map',
    });
  });
});

describe('isReadyToLeaveSplash', () => {
  it('waits for record loaded, font loaded or timed out, and minimum time elapsed', () => {
    // Nothing ready
    expect(
      isReadyToLeaveSplash({
        recordLoaded: false,
        fontLoaded: false,
        fontTimedOut: false,
        minElapsed: false,
      }),
    ).toBe(false);

    // Record and font ready, but min time not elapsed
    expect(
      isReadyToLeaveSplash({
        recordLoaded: true,
        fontLoaded: true,
        fontTimedOut: false,
        minElapsed: false,
      }),
    ).toBe(false);

    // Record and min elapsed, but font not ready and not timed out
    expect(
      isReadyToLeaveSplash({
        recordLoaded: true,
        fontLoaded: false,
        fontTimedOut: false,
        minElapsed: true,
      }),
    ).toBe(false);

    // Record loaded, font loaded, min elapsed -> ready!
    expect(
      isReadyToLeaveSplash({
        recordLoaded: true,
        fontLoaded: true,
        fontTimedOut: false,
        minElapsed: true,
      }),
    ).toBe(true);

    // Record loaded, font timed out (fontLoaded=false), min elapsed -> ready!
    expect(
      isReadyToLeaveSplash({
        recordLoaded: true,
        fontLoaded: false,
        fontTimedOut: true,
        minElapsed: true,
      }),
    ).toBe(true);
  });
});
