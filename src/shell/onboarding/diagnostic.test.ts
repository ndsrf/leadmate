import { newDogRecord, applyStage } from '../dogRecord';
import { payloadWith } from '../testPayload';
import { DIAGNOSTIC, latencyBand, median, recordDiagnostic, seedFromLatency } from './diagnostic';

describe('Diagnostic calculations', () => {
  it('takes the median', () => {
    expect(median([0.5, 0.2, 0.9])).toBe(0.5);
    expect(median([0.2, 0.4])).toBeCloseTo(0.3);
    expect(median([])).toBe(DIAGNOSTIC.timeout);
  });

  it('labels the latency band', () => {
    expect(latencyBand(0.3)).toBe('quick');
    expect(latencyBand(0.45)).toBe('steady');
    expect(latencyBand(0.7)).toBe('slow');
  });
});

describe('seeding the Dog from the Diagnostic', () => {
  it('maps latency into the 0.1 to 0.4 band, edges included', () => {
    expect(seedFromLatency(0.25)).toBeCloseTo(0.4);
    expect(seedFromLatency(0.8)).toBeCloseTo(0.1);
    expect(seedFromLatency(0.1)).toBeCloseTo(0.4);
    expect(seedFromLatency(5)).toBeCloseTo(0.1);
    expect(seedFromLatency(0.525)).toBeCloseTo(0.25);
  });

  it('builds the plan from the answers: biting as Main Concern puts its Home Stretch first', () => {
    const asked = { ...newDogRecord(), mainConcerns: ['bite-owner' as const], onboarding: { ...newDogRecord().onboarding, step: 'diagnostic' as const } };
    expect(recordDiagnostic(asked, 0.3).onboarding.plan[0]).toEqual({ stretchId: 'theory-bite-owner', concern: 'bite-owner' });
  });

  it('seeds once and moves to the plan', () => {
    const base = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'diagnostic' as const } };
    const first = recordDiagnostic(base, 0.3);
    expect(first.attributes.reconnectionLatency).toBeCloseTo(seedFromLatency(0.3));
    expect(first.onboarding).toMatchObject({ step: 'plan', diagnosticLatency: 0.3 });
    expect(recordDiagnostic(first, 0.7)).toBe(first);
  });

  it('leaves Learning Attributes unchanged when replayed after onboarding', () => {
    const played = applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 2 }), new Date());
    const done = { ...played, onboarding: { ...played.onboarding, step: 'done' as const, diagnosticLatency: 0.3 } };
    expect(recordDiagnostic(done, 0.9)).toBe(done);
    expect(recordDiagnostic(done, 0.9).attributes).toEqual(done.attributes);
  });
});
