import { newDogRecord } from '../dogRecord';
import { inFunnel, ONBOARDING_STEPS } from './flow';
import { passPaywall } from './paywall';

const atPaywall = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'paywall' as const } };

describe('paywall stub', () => {
  it('records the trial start on Start trial and finishes the funnel', () => {
    const r = passPaywall(atPaywall, true, new Date('2026-05-01T10:00:00Z'));
    expect(r.onboarding.trialStartedAt).toBe('2026-05-01T10:00:00.000Z');
    expect(r.onboarding.step).toBe('done');
    expect(inFunnel(r.onboarding.step)).toBe(false);
  });

  it('continues without recording anything on Maybe later', () => {
    const r = passPaywall(atPaywall, false, new Date());
    expect(r.onboarding.trialStartedAt).toBeNull();
    expect(r.onboarding.step).toBe('done');
  });

  it('treats the close control like Maybe later: it continues and records no trial', () => {
    // the close control calls the same handler as Maybe later
    const closed = passPaywall(atPaywall, false, new Date('2026-05-01T10:00:00Z'));
    expect(closed.onboarding.trialStartedAt).toBeNull();
    expect(closed.onboarding.step).toBe('done');
    expect(closed).toEqual(passPaywall(atPaywall, false, new Date('2030-01-01T00:00:00Z')));
  });

  it('does not restart a trial that already started', () => {
    const started = passPaywall(atPaywall, true, new Date('2026-05-01T10:00:00Z'));
    expect(passPaywall({ ...started, onboarding: { ...started.onboarding, step: 'paywall' } }, true, new Date('2026-06-01T00:00:00Z')).onboarding.trialStartedAt).toBe('2026-05-01T10:00:00.000Z');
  });

  it('comes after the diagnostic card, the plan and the first Stage', () => {
    expect(ONBOARDING_STEPS.indexOf('plan')).toBeLessThan(ONBOARDING_STEPS.indexOf('first-stage'));
    expect(ONBOARDING_STEPS.indexOf('first-stage')).toBeLessThan(ONBOARDING_STEPS.indexOf('paywall'));
  });

  it('gates nothing: both choices leave the record playable and the funnel finished', () => {
    for (const trial of [true, false]) expect(inFunnel(passPaywall(atPaywall, trial, new Date()).onboarding.step)).toBe(false);
  });
});
