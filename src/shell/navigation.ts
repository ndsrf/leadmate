import { isOnboardingStep, pageForStep, type OnboardingStep } from './onboarding/flow';

export type Route<F = unknown> =
  | { name: 'splash' }
  | { name: 'funnel'; step: OnboardingStep }
  | { name: 'taste' }
  | { name: 'first-stage' }
  | { name: 'paywall' }
  | { name: 'recap' }
  | { name: 'map' }
  | { name: 'settings' }
  | { name: 'flow'; flow: F };

export interface RouteForParams<F = unknown> {
  ready: boolean;
  onboardingStep?: OnboardingStep | string | null;
  flow?: F | null;
  /** The active flow is an account flow (login or registration), the only kind that may overlay the funnel. */
  accountFlow?: boolean;
  settingsOpen?: boolean;
  /** Whether the user has just expired their trial and has not yet seen the Value Recap. */
  needsRecap?: boolean;
}

/**
 * Pure routing function: decides the visible screen based on readiness,
 * the Dog's persisted onboarding step, and any active flow or settings overlay.
 *
 * Precedence:
 * 1. Splash until ready.
 * 2. Funnel steps ('welcome', 'dog', 'setup', 'diagnostic', 'plan'), the 'taste' and
 *    'first-stage' Stages and the 'paywall' win over any leftover flow/settings. The one exception is
 *    an account flow (login from 'welcome', registration at 'paywall'), which shows over its step.
 * 3. Active flow (node, daily, warmup, auth, register) over map/settings/recap.
 * 4. Value Recap on cold start / launch if trial expired and recap not yet seen.
 * 5. Settings screen if opened.
 * 6. Default: World Map.
 */
export function routeFor<F = unknown>({
  ready,
  onboardingStep,
  flow,
  accountFlow = false,
  settingsOpen = false,
  needsRecap = false,
}: RouteForParams<F>): Route<F> {
  if (!ready) {
    return { name: 'splash' };
  }
  if (isOnboardingStep(onboardingStep)) {
    if (accountFlow && flow != null && (onboardingStep === 'welcome' || onboardingStep === 'paywall')) {
      return { name: 'flow', flow };
    }
    const page = pageForStep(onboardingStep);
    if (page === 'funnel') return { name: 'funnel', step: onboardingStep };
    if (page !== 'home') return { name: page };
  }
  if (flow != null) {
    return { name: 'flow', flow };
  }
  if (needsRecap) {
    return { name: 'recap' };
  }
  if (settingsOpen) {
    return { name: 'settings' };
  }
  return { name: 'map' };
}

export interface SplashReadyParams {
  recordLoaded: boolean;
  fontLoaded: boolean;
  fontTimedOut?: boolean;
  minElapsed: boolean;
}

/**
 * Pure decision for leaving the splash screen:
 * requires record loaded, font loaded or timed out (2 s cap), and minimum splash duration elapsed (~2.2 s).
 */
export function isReadyToLeaveSplash({
  recordLoaded,
  fontLoaded,
  fontTimedOut = false,
  minElapsed,
}: SplashReadyParams): boolean {
  return recordLoaded && (fontLoaded || fontTimedOut) && minElapsed;
}

export type BackAction = 'pause' | 'resume' | 'screen' | 'consume' | 'exit';

export interface BackActionParams {
  route: Route;
  /** A Stage is on screen (Node simulation, Daily, warm-up, taste or the first Stage's walk). */
  playingStage: boolean;
  /** The Pause Menu is showing. */
  paused: boolean;
  bundle: 'loading' | 'ready' | 'error';
  /** The current screen registered a back closure (its own on-screen back, close or done). */
  hasScreenBack: boolean;
  /** The taste payoff is showing. */
  payoff?: boolean;
  /** The Choose Dog screen is showing. */
  choosingDog?: boolean;
}

/**
 * Pure decision for the system back button. First match wins:
 * 1. A Stage whose bundle failed to load: its back closure (the map), or consumed in onboarding.
 * 2. The taste payoff or Choose Dog: consumed, a choice is required.
 * 3. The Pause Menu is showing: resume. 4. The Stage is loading: consumed. 5. A running Stage: pause.
 * 6. The screen's own back closure. 7. Splash, the bare map, a funnel step or the onboarding paywall: leave the app.
 * 8. Anything else (a Checkpoint, a Minigame with no exit): consumed.
 */
export function backAction({ route, playingStage, paused, bundle, hasScreenBack, payoff = false, choosingDog = false }: BackActionParams): BackAction {
  if (playingStage && bundle === 'error') return hasScreenBack ? 'screen' : 'consume';
  if (payoff || choosingDog) return 'consume';
  if (playingStage && paused) return 'resume';
  if (playingStage && bundle === 'loading') return 'consume';
  if (playingStage) return 'pause';
  if (hasScreenBack) return 'screen';
  if (route.name === 'splash' || route.name === 'map' || route.name === 'funnel' || route.name === 'paywall' || route.name === 'recap') return 'exit';
  return 'consume';
}

/** Just enough of a flow to decide whether the Stage view is needed (a Node run, a Daily, or a warm-up). */
export interface StageViewFlow {
  name: string;
  /** Daily: the result is set once the walk is over. */
  result?: unknown;
  /** Node: the run, with its step and the Node's mode. */
  run?: { step: string; node: { mode: 'stage' | 'minigame' } };
}

export interface StageViewParams {
  route: Route<StageViewFlow>;
  /** The first Stage's introductory Node run, once it exists. */
  introStep?: string | null;
}

/**
 * Whether the Stage view (the embedded simulation bundle) must exist. True from the Primer of a Node that has a Stage
 * (so the load hides behind reading time) through its walk, for the Daily, warm-up, taste and first Stage; false on every
 * other screen, in every Minigame, and from the Debrief on.
 */
export function stageViewWanted({ route, introStep = null }: StageViewParams): boolean {
  if (route.name === 'taste') return true;
  if (route.name === 'first-stage') return introStep !== 'debrief';
  if (route.name !== 'flow') return false;
  const flow = route.flow;
  if (flow.name === 'warmup') return true;
  if (flow.name === 'daily') return flow.result == null;
  if (flow.name === 'node' && flow.run) return flow.run.node.mode === 'stage' && flow.run.step !== 'debrief';
  return false;
}

/**
 * What to do when the Stage view fails to load. Before the Stage begins (the player is still on the Primer or Checkpoint) the
 * first failure remounts the view silently; any later failure, or one during play, shows the error and retry screen.
 */
export function onStageViewFailure({ playing, silentRemountUsed }: { playing: boolean; silentRemountUsed: boolean }): 'remount' | 'error' {
  return !playing && !silentRemountUsed ? 'remount' : 'error';
}
