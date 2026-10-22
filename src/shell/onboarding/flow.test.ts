import { inFunnel, pageForStep, type OnboardingStep, isOnboardingStep, nextStep, ONBOARDING_STEPS } from './flow';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';

function memoryStore(): KeyValueStore {
  const data = new Map<string, string>();
  return { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
}

describe('onboarding flow', () => {
  it('goes welcome, dog, taste, setup, diagnostic, plan, first-stage, paywall, done', () => {
    expect(ONBOARDING_STEPS).toEqual(['welcome', 'dog', 'taste', 'setup', 'diagnostic', 'plan', 'first-stage', 'paywall', 'done']);
    let step: OnboardingStep = ONBOARDING_STEPS[0];
    const seen: OnboardingStep[] = [step];
    while (nextStep(step) !== step) seen.push((step = nextStep(step)));
    expect(seen).toEqual([...ONBOARDING_STEPS]);
  });

  it('stays done once done', () => {
    expect(nextStep('done')).toBe('done');
  });

  it('shows the funnel until the paywall screen is passed', () => {
    expect(ONBOARDING_STEPS.filter(inFunnel)).toEqual(['welcome', 'dog', 'taste', 'setup', 'diagnostic', 'plan', 'first-stage', 'paywall']);
  });

  it('rejects unknown steps', () => {
    expect(isOnboardingStep('plan')).toBe(true);
    expect(isOnboardingStep('welcome')).toBe(true);
    expect(isOnboardingStep('nope')).toBe(false);
  });

  it.each(ONBOARDING_STEPS)('resumes at the persisted step %s after a restart', async (step) => {
    const store = memoryStore();
    await saveDogRecord(store, { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step } });
    expect((await loadDogRecord(store)).onboarding.step).toBe(step);
  });
});

describe('page for each step', () => {
  it.each([
    ['welcome', 'funnel'],
    ['dog', 'funnel'],
    ['taste', 'taste'],
    ['setup', 'funnel'],
    ['diagnostic', 'funnel'],
    ['plan', 'funnel'],
    ['first-stage', 'first-stage'],
    ['paywall', 'paywall'],
    ['done', 'home'],
  ] as const)('%s shows %s', (step, page) => {
    expect(pageForStep(step)).toBe(page);
  });

  it('never reaches home before the paywall screen is passed', () => {
    for (const step of ONBOARDING_STEPS.slice(0, ONBOARDING_STEPS.indexOf('done'))) expect(pageForStep(step)).not.toBe('home');
  });

  it('keeps the paywall out of the funnel pages and shows it after the first Stage', () => {
    expect(pageForStep('paywall')).not.toBe('funnel');
    expect(ONBOARDING_STEPS.indexOf('paywall')).toBe(ONBOARDING_STEPS.indexOf('first-stage') + 1);
  });
});
