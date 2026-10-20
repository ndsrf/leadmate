import { DEFAULT_ATTRIBUTES } from '../../sim/learning';
import { newDogRecord } from '../dogRecord';
import { payloadWith } from '../testPayload';
import { completeFirstStage } from './firstStage';

describe('first Stage', () => {
  it('records its end, finishes the funnel and teaches the Dog', () => {
    const start = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'first-stage' as const } };
    const r = completeFirstStage(start, payloadWith({ followMarks: 3, markerHits: 1, markerAccuracyMs: 0, posteSuccesses: 1 }), new Date(2026, 4, 1, 12));
    expect(r.onboarding.step).toBe('done');
    expect(r.onboarding.firstStageCompletedAt).not.toBeNull();
    expect(r.attributes.followChance).toBeGreaterThan(DEFAULT_ATTRIBUTES.followChance);
    expect(r.streak.current).toBe(1);
  });
});
