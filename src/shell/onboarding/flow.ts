/** The funnel's steps in order; `first-stage` and `done` come after the paywall screen has been passed. */
export const ONBOARDING_STEPS = ['setup', 'diagnostic', 'plan', 'paywall', 'first-stage', 'done'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export function isOnboardingStep(v: unknown): v is OnboardingStep {
  return ONBOARDING_STEPS.includes(v as OnboardingStep);
}

/** The step after `step`; `done` stays `done`. */
export function nextStep(step: OnboardingStep): OnboardingStep {
  const i = ONBOARDING_STEPS.indexOf(step);
  return ONBOARDING_STEPS[Math.min(i + 1, ONBOARDING_STEPS.length - 1)];
}

/** True while the funnel (up to and including the paywall screen) still has to be shown. */
export function inFunnel(step: OnboardingStep): boolean {
  return ONBOARDING_STEPS.indexOf(step) < ONBOARDING_STEPS.indexOf('first-stage');
}

/** What the app shows for a persisted step: the funnel screens, the guided first Stage, or the World Map. */
export type OnboardingPage = 'funnel' | 'first-stage' | 'home';

export function pageForStep(step: OnboardingStep): OnboardingPage {
  return inFunnel(step) ? 'funnel' : step === 'first-stage' ? 'first-stage' : 'home';
}
