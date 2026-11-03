import { ONBOARDING_STEPS } from './onboarding/flow';
import { canSkipDay, missionAfterDebrief, missionEntryOf, missionEntryView, missionForDebrief } from './missions/missionView';
import type { MissionState } from './missions/mission';
import { findWorld, isLastMissionOfWorld, missionOfStop, progressOf, stopsOf, worldsFor } from './world';
import { withBasicsDone } from './testProgress';
import { backAction, isReadyToLeaveSplash, trialModalOwnsBack, onStageViewFailure, routeFor, stageViewWanted, type BackActionParams } from './navigation';

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
    for (const step of ['welcome', 'dog', 'concern', 'setup', 'diagnostic', 'plan'] as const) {
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

  it('routes to recap when needsRecap is true on cold start past onboarding', () => {
    expect(routeFor({ ready: true, onboardingStep: 'done', needsRecap: true, flow: null })).toEqual({
      name: 'recap',
    });
    expect(routeFor({ ready: true, onboardingStep: 'setup', needsRecap: true, flow: null })).toEqual({
      name: 'funnel',
      step: 'setup',
    });
    // Active flow is not preempted mid-session by recap
    const activeFlow = { name: 'warmup' };
    expect(routeFor({ ready: true, onboardingStep: 'done', needsRecap: true, flow: activeFlow })).toEqual({
      name: 'flow',
      flow: activeFlow,
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
  const stretch1 = withBasicsDone(progressOf(['harness-ritual'], { readLessons: ['theory-harness', 'howto-tap-hold'] }));
  const started: MissionState = { target: 'full', skipRun: 0, attempts: [], startedAt: at(9, 1).toISOString() };

  it('opens the Mission brief when the Debrief of a Stretch\'s last Node is closed', () => {
    expect(missionAfterDebrief('harness-ritual', stretch1, at(9))).toBe('mission-harness');
  });

  it('returns to the map after a Node that is not last, or when the Mission is started or passed', () => {
    expect(missionAfterDebrief('harness-ritual', { ...stretch1, missions: { ...stretch1.missions, 'mission-harness': started } }, at(9))).toBeNull();
    expect(missionAfterDebrief('harness-ritual', { ...stretch1, missions: { ...stretch1.missions, 'mission-harness': { ...started, passedOn: '2026-05-02' } } }, at(9))).toBeNull();
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
    const waiting = { ...stretch1, missions: { ...stretch1.missions, 'mission-harness': started } };
    expect(canSkipDay('mission-harness', waiting, at(20, 1))).toBe(true);
    expect(canSkipDay('mission-harness', stretch1, at(20, 1))).toBe(false);
    expect(canSkipDay('mission-harness', waiting, at(9, 2))).toBe(false);
    const owed = { ...stretch1, missions: { ...stretch1.missions, 'mission-harness': { ...started, skippedAt: at(20, 1).toISOString() } } };
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

  it('offers a Day Skip on a waiting Home Mission of World 1 (not its last), none off the trail, and opens it like any Mission', () => {
    const home = progressOf([], { missions: { 'mission-bark-home': started } });
    expect(missionEntryOf('mission-bark-home', progressOf([]), at(9))).toBe('brief');
    expect(missionEntryOf('mission-bark-home', home, at(20, 1))).toBe('waiting');
    expect(canSkipDay('mission-bark-home', home, at(20, 1))).toBe(false); // Other Home Behaviours: not on a trail
    // the Basics Stretch that teaches how to play comes first in World 1, so it is done before the Home Stretch is reached
    const basics = stopsOf(findWorld('basics')!);
    const mine = progressOf(['bark-home', ...basics.filter((s) => s.kind === 'node').map((s) => s.id)], {
      readLessons: ['theory-bark-home', ...basics.filter((s) => s.kind === 'lesson').map((s) => s.id)],
      missions: { 'mission-bark-home': started, 'mission-dog-as-dog': { ...started, passedOn: '2026-05-02' } },
      homeConcerns: { 'bark-home': 1 },
    });
    const worlds = worldsFor([{ stretchId: 'theory-bark-home' }], mine);
    expect(canSkipDay('mission-bark-home', mine, at(20, 1), worlds)).toBe(true);
    expect(missionEntryOf('mission-bark-home', home, at(9, 2))).toBe('checkin');
    const passed = progressOf([], { missions: { 'mission-bark-home': { ...started, passedOn: '2026-05-02' } } });
    expect(missionEntryOf('mission-bark-home', passed, at(9, 3))).toBe('passed');
  });

  it('names the Home Mission a Home Node\'s Debrief practises, on or off the trail', () => {
    expect(missionForDebrief('bark-home')).toBe('mission-bark-home');
    expect(missionForDebrief('eat-objects')).toBe('mission-eat-objects');
    expect(missionOfStop({ kind: 'node', id: 'bark-home' })).toBe('mission-bark-home');
    // off the trail (Other Home Behaviours) the Mission is open and follows the Debrief like any Stretch's
    expect(missionAfterDebrief('bark-home', progressOf(['bark-home']), at(9))).toBe('mission-bark-home');
    // in World 1 the Dog's own worlds find it too, once the Stretch is reachable
    const worlds = worldsFor([], progressOf([], { homeConcerns: { 'bark-home': 1 } }));
    const done = progressOf(['dog-as-dog', 'home-rest', 'calm-first', 'bark-home'], { homeConcerns: { 'bark-home': 1 } });
    expect(missionForDebrief('bark-home', worlds)).toBe('mission-bark-home');
    expect(missionAfterDebrief('bark-home', done, at(9), worlds)).toBeNull(); // locked behind the Basics Missions
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

  it('routes paywall flow with pending actions over the map', () => {
    const videoFlow = { name: 'paywall', then: { kind: 'video' as const, lessonId: 'l1', returnTo: 'library' as const } };
    expect(routeFor({ ready: true, onboardingStep: 'done', flow: videoFlow })).toEqual({ name: 'flow', flow: videoFlow });

    const skipFlow = { name: 'paywall', then: { kind: 'skip' as const, missionId: 'mission-harness' } };
    expect(routeFor({ ready: true, onboardingStep: 'done', flow: skipFlow })).toEqual({ name: 'flow', flow: skipFlow });
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

  it('consumes the press on the taste briefing', () => {
    expect(backAction({ ...base, route: { name: 'taste' }, playingStage: false, hasScreenBack: false, briefing: true })).toBe('consume');
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
    expect(backAction({ ...base, route: { name: 'recap' } })).toBe('exit');
    expect(backAction({ ...base, route: { name: 'recap' }, hasScreenBack: true })).toBe('screen');
  });

  it("runs a flow's own back closure, and consumes the press when it has none", () => {
    expect(backAction({ ...base, route: { name: 'flow', flow: { name: 'diary' } }, hasScreenBack: true })).toBe('screen');
    expect(backAction({ ...base, route: { name: 'flow', flow: { name: 'node' } } })).toBe('consume');
  });
});

describe('trialModalOwnsBack', () => {
  // mirrors App.tsx: withBack is last-write-wins and mapWith runs after the overlay registered its own back
  const currentBack = (modalOpen: boolean, overlayBack: (() => void) | null, modalBack: () => void) => {
    let current = overlayBack;
    if (trialModalOwnsBack({ trialModalOpen: modalOpen, hasOverlay: overlayBack !== null })) current = modalBack;
    return current;
  };
  const modalBack = () => {};
  const overlayBack = () => {};

  it('keeps the Library, Diary and Lesson back current when the modal is closed', () => {
    expect(currentBack(false, overlayBack, modalBack)).toBe(overlayBack);
  });

  it('leaves the bare map with no back, so system back exits the app', () => {
    const current = currentBack(false, null, modalBack);
    expect(current).toBeNull();
    expect(backAction({ route: { name: 'map' }, playingStage: false, paused: false, bundle: 'ready', hasScreenBack: current !== null })).toBe('exit');
  });

  it('makes the open modal close on back when nothing is over the map', () => {
    expect(currentBack(true, null, modalBack)).toBe(modalBack);
  });

  it('never replaces an overlay screen back, modal open or not', () => {
    expect(currentBack(true, overlayBack, modalBack)).toBe(overlayBack);
    expect(currentBack(false, overlayBack, modalBack)).toBe(overlayBack);
  });
});

describe('stageViewWanted', () => {
  const node = (mode: 'stage' | 'minigame' | 'close_exercise', step: string) => ({ name: 'flow' as const, flow: { name: 'node', run: { step, node: { mode } } } });

  it('is false on shell screens', () => {
    for (const route of [{ name: 'map' }, { name: 'settings' }, { name: 'recap' }, { name: 'splash' }, { name: 'paywall' }] as const) {
      expect(stageViewWanted({ route })).toBe(false);
    }
    expect(stageViewWanted({ route: { name: 'flow', flow: { name: 'library' } } })).toBe(false);
    expect(stageViewWanted({ route: { name: 'funnel', step: 'welcome' } })).toBe(false);
  });

  it('is true from the Primer through the walk of a Stage Node, false at the Debrief', () => {
    for (const step of ['primer', 'checkpoint', 'simulation']) expect(stageViewWanted({ route: node('stage', step) })).toBe(true);
    expect(stageViewWanted({ route: node('stage', 'debrief') })).toBe(false);
  });

  it('is true from the Primer through simulation for a close exercise Node, false at the Debrief', () => {
    for (const step of ['primer', 'checkpoint', 'simulation']) expect(stageViewWanted({ route: node('close_exercise', step) })).toBe(true);
    expect(stageViewWanted({ route: node('close_exercise', 'debrief') })).toBe(false);
  });

  it('is never true for a Minigame Node, even one that carries a scenario', () => {
    for (const step of ['primer', 'checkpoint', 'simulation', 'debrief']) expect(stageViewWanted({ route: node('minigame', step) })).toBe(false);
  });

  it('is true for the Daily until its result, the warm-up, the taste and the first Stage until its Debrief', () => {
    expect(stageViewWanted({ route: { name: 'flow', flow: { name: 'daily', result: null } } })).toBe(true);
    expect(stageViewWanted({ route: { name: 'flow', flow: { name: 'daily', result: {} } } })).toBe(false);
    expect(stageViewWanted({ route: { name: 'flow', flow: { name: 'warmup' } } })).toBe(true);
    expect(stageViewWanted({ route: { name: 'taste' } })).toBe(true);
    expect(stageViewWanted({ route: { name: 'first-stage' }, introStep: 'primer' })).toBe(true);
    expect(stageViewWanted({ route: { name: 'first-stage' }, introStep: 'debrief' })).toBe(false);
  });
});

describe('onStageViewFailure', () => {
  it('remounts silently once before play, then reports the error', () => {
    expect(onStageViewFailure({ playing: false, silentRemountUsed: false })).toBe('remount');
    expect(onStageViewFailure({ playing: false, silentRemountUsed: true })).toBe('error');
  });

  it('reports the error when the failure happens during play', () => {
    expect(onStageViewFailure({ playing: true, silentRemountUsed: false })).toBe('error');
  });
});
