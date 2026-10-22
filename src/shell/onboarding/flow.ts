/** The funnel's steps in order; `done` comes after the paywall screen has been passed. */
export const ONBOARDING_STEPS = ['welcome', 'dog', 'taste', 'payoff', 'setup', 'diagnostic', 'plan', 'first-stage', 'paywall', 'done'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(v: unknown): v is OnboardingStep {
  return ONBOARDING_STEPS.includes(v as OnboardingStep);
}

/** The step after `step`; `done` stays `done`. */
export function nextStep(step: OnboardingStep): OnboardingStep {
  const i = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)];
}

/** True while the funnel (every step before `done`, the paywall included) still has to be shown. */
export function inFunnel(step: OnboardingStep): boolean {
  return ONBOARDING_STEPS.indexOf(step) < ONBOARDING_STEPS.indexOf('done');
}

/** What the app shows for a persisted step: the funnel screens, a Stage, the paywall, or the World Map. */
export type OnboardingPage = 'funnel' | 'taste' | 'first-stage' | 'paywall' | 'home';

export function pageForStep(step: OnboardingStep): OnboardingPage {
  switch (step) {
    case 'taste':
      return 'taste';
    case 'first-stage':
      return 'first-stage';
    case 'paywall':
      return 'paywall';
    case 'done':
      return 'home';
    default:
      return 'funnel';
  }
}
