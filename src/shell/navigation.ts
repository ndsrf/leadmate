import { isOnboardingStep, pageForStep, type OnboardingStep } from './onboarding/flow';

export type Route<F = unknown> =
  | { name: 'splash' }
  | { name: 'funnel'; step: OnboardingStep }
  | { name: 'taste' }
  | { name: 'first-stage' }
  | { name: 'paywall' }
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
 * 4. Active flow (node, daily, warmup, auth, register) over map/settings.
 * 5. Settings screen if opened.
 * 6. Default: World Map.
 */
export function routeFor<F = unknown>({
  ready,
  onboardingStep,
  flow,
  accountFlow = false,
  settingsOpen = false,
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
  if (route.name === 'splash' || route.name === 'map' || route.name === 'funnel' || route.name === 'paywall') return 'exit';
  return 'consume';
}
