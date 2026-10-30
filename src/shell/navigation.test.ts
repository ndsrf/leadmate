import { ONBOARDING_STEPS } from './onboarding/flow';
import { canSkipDay, missionAfterDebrief, missionEntryOf, missionEntryView, missionForDebrief } from './missions/missionView';
import type { MissionState } from './missions/mission';
import { findWorld, isLastMissionOfWorld, progressOf, stopsOf } from './world';
import { backAction, isReadyToLeaveSplash, routeFor, type BackActionParams } from './navigation';

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

describe('Library and Lesson flows', () => {
  it('show over the map once onboarding is done', () => {
    for (const flow of [{ name: 'library' }, { name: 'lesson', id: 'calm-leash', returnTo: 'library' }, { name: 'lesson', id: 'theory-harness', returnTo: 'map' }, { name: 'mission', id: 'mission-harness', view: 'brief' }]) {
      expect(routeFor({ ready: true, onboardingStep: 'done', flow })).toEqual({ name: 'flow', flow });
    }
  });

  it('never override the funnel', () => {
    expect(routeFor({ ready: true, onboardingStep: 'welcome', flow: { name: 'library' } })).toEqual({ name: 'funnel', step: 'welcome' });
  });
});

describe('Mission flows', () => {
  const at = (h: number, day = 2) => new Date(2026, 4, day, h);
  const stretch1 = progressOf(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] });
  const started: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: at(9, 1).toISOString() };

  it('opens the Mission brief when the Debrief of a Stretch\'s last Node is closed', () => {
    expect(missionAfterDebrief('harness-ritual', stretch1, at(9))).toBe('mission-harness');
  });

  it('returns to the map after a Node that is not last, or when the Mission is started or passed', () => {
    expect(missionAfterDebrief('harness-ritual', { ...stretch1, missions: { 'mission-harness': started } }, at(9))).toBeNull();
    expect(missionAfterDebrief('harness-ritual', { ...stretch1, missions: { 'mission-harness': { ...started, passedOn: '2026-05-02' } } }, at(9))).toBeNull();
    expect(missionAfterDebrief('intro-node', stretch1, at(9))).toBeNull();
  });

  it('opens a Mission Stop on its brief, its wait or its check-in', () => {
    expect(missionEntryView(undefined, at(9))).toBe('brief');
    expect(missionEntryView({ target: 'full', skipRun: 0, attempts: [], focus: 'node.harness.exercise1' }, at(9))).toBe('brief');
    expect(missionEntryView(started, at(20, 1))).toBe('waiting');
    expect(missionEntryView(started, at(9, 2))).toBe('checkin');
  });

  it('opens a passed Mission on its passed screen, never on the wait', () => {
    expect(missionEntryView({ ...started, passedOn: '2026-05-02' }, at(9, 3))).toBe('passed');
  });

  it('opens a grandfathered Mission on its passed screen, so "Start mission" cannot un-grandfather it', () => {
    // a Node of World 1's second Stretch is completed: the first Stretch's Mission was gone past before Missions
    const legacy = progressOf(['harness-ritual', 'doorbell-mat'], { readLessons: ['theory-harness', 'howto-tap-hold', 'theory-doorbell'] });
    expect(missionEntryOf('mission-harness', legacy, at(9))).toBe('passed');
    expect(missionEntryOf('mission-doorbell', legacy, at(9))).toBe('brief');
  });

  it('offers a Day Skip only on a waiting Mission that is not owed', () => {
    const waiting = { ...stretch1, missions: { 'mission-harness': started } };
    expect(canSkipDay('mission-harness', waiting, at(20, 1))).toBe(true);
    expect(canSkipDay('mission-harness', stretch1, at(20, 1))).toBe(false);
    expect(canSkipDay('mission-harness', waiting, at(9, 2))).toBe(false);
    const owed = { ...stretch1, missions: { 'mission-harness': { ...started, skippedAt: at(20, 1).toISOString() } } };
    expect(canSkipDay('mission-harness', owed, at(21, 1))).toBe(false);
  });

  it('never offers a Day Skip on a World\'s last Mission', () => {
    expect(isLastMissionOfWorld('mission-poste')).toBe(true);
    expect(isLastMissionOfWorld('mission-doorbell')).toBe(false);
    const stops = stopsOf(findWorld('home')!);
    const all = progressOf(stops.filter((s) => s.kind === 'node').map((s) => s.id), {
      readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
      missions: { 'mission-harness': { ...started, passedOn: '2026-05-02' }, 'mission-doorbell': { ...started, passedOn: '2026-05-02' }, 'mission-poste': started },
    });
    expect(missionEntryOf('mission-poste', all, at(20, 1))).toBe('waiting');
    expect(canSkipDay('mission-poste', all, at(20, 1))).toBe(false);
  });

  it('names the Mission a Debrief is practice for', () => {
    expect(missionForDebrief('doorbell-mat')).toBe('mission-doorbell');
    expect(missionForDebrief('intro-node')).toBeUndefined();
  });

  it('shows the Mission flow over the map once onboarding is done, never over the funnel', () => {
    const flow = { name: 'mission', id: 'mission-harness', view: 'checkin' };
    expect(routeFor({ ready: true, onboardingStep: 'done', flow })).toEqual({ name: 'flow', flow });
    expect(routeFor({ ready: true, onboardingStep: 'welcome', flow })).toEqual({ name: 'funnel', step: 'welcome' });
  });
});

describe('backAction', () => {
  const base: BackActionParams = { route: { name: 'map' }, playingStage: false, paused: false, bundle: 'ready', hasScreenBack: false };
  const stage: BackActionParams = { ...base, route: { name: 'flow', flow: { name: 'node' } }, playingStage: true, hasScreenBack: true };

  it('leaves a Stage that failed to load through its back closure, or consumes the press without one', () => {
    expect(backAction({ ...stage, bundle: 'error' })).toBe('screen');
    expect(backAction({ ...stage, route: { name: 'taste' }, bundle: 'error', hasScreenBack: false })).toBe('consume');
  });

  it('consumes the press on the taste payoff and on Choose Dog', () => {
    expect(backAction({ ...stage, route: { name: 'taste' }, hasScreenBack: false, payoff: true })).toBe('consume');
    expect(backAction({ ...base, choosingDog: true })).toBe('consume');
  });

  it('pauses a running Stage and resumes a paused one', () => {
    expect(backAction(stage)).toBe('pause');
    expect(backAction({ ...stage, paused: true })).toBe('resume');
  });

  it('consumes the press while the Stage is loading', () => {
    expect(backAction({ ...stage, bundle: 'loading' })).toBe('consume');
  });

  it('leaves the app on the splash, the bare map, a funnel step and the onboarding paywall', () => {
    expect(backAction({ ...base, route: { name: 'splash' } })).toBe('exit');
    expect(backAction(base)).toBe('exit');
    expect(backAction({ ...base, route: { name: 'funnel', step: 'setup' } })).toBe('exit');
    expect(backAction({ ...base, route: { name: 'paywall' } })).toBe('exit');
  });

  it("runs a flow's own back closure, and consumes the press when it has none", () => {
    expect(backAction({ ...base, route: { name: 'flow', flow: { name: 'diary' } }, hasScreenBack: true })).toBe('screen');
    expect(backAction({ ...base, route: { name: 'flow', flow: { name: 'node' } } })).toBe('consume');
  });
});
