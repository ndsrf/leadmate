import { inFunnel, pageForStep, type OnboardingStep, isOnboardingStep, nextStep, ONBOARDING_STEPS } from './flow';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
}

describe('onboarding flow', () => {
  it('goes setup, diagnostic, plan, paywall, first-stage, done', () => {
    expect(ONBOARDING_STEPS).toEqual(['setup', 'diagnostic', 'plan', 'paywall', 'first-stage', 'done']);
    let step: OnboardingStep = ONBOARDING_STEPS[0];
    const seen: OnboardingStep[] = [step];
    while (nextStep(step) !== step) seen.push((step = nextStep(step)));
    expect(seen).toEqual([...ONBOARDING_STEPS]);
  });

  it('stays done once done', () => {
    expect(nextStep('done')).toBe('done');
  });

  it('shows the funnel only until the paywall screen is passed', () => {
    expect(ONBOARDING_STEPS.filter(inFunnel)).toEqual(['setup', 'diagnostic', 'plan', 'paywall']);
  });

  it('rejects unknown steps', () => {
    expect(isOnboardingStep('plan')).toBe(true);
    expect(isOnboardingStep('welcome')).toBe(false);
  });

  it.each(ONBOARDING_STEPS)('resumes at the persisted step %s after a restart', async (step) => {
    const store = memoryStore();
    await saveDogRecord(store, { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step } });
    expect((await loadDogRecord(store)).onboarding.step).toBe(step);
  });
});

describe('page for each step', () => {
  it.each([
    ['setup', 'funnel'],
    ['diagnostic', 'funnel'],
    ['plan', 'funnel'],
    ['paywall', 'funnel'],
    ['first-stage', 'first-stage'],
    ['done', 'home'],
  ] as const)('%s shows %s', (step, page) => {
    expect(pageForStep(step)).toBe(page);
  });

  it('never reaches home before the paywall screen is passed', () => {
    for (const step of ONBOARDING_STEPS.slice(0, ONBOARDING_STEPS.indexOf('first-stage'))) expect(pageForStep(step)).not.toBe('home');
  });
});
