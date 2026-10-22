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
