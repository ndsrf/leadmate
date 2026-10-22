import { DEFAULT_ATTRIBUTES } from '../../sim/learning';
import { loadDogRecord, newDogRecord, saveDogRecord, type KeyValueStore } from '../dogRecord';
import { payloadWith } from '../testPayload';
import { completeFirstStage } from './firstStage';

describe('first Stage', () => {
  it('records its end, moves on to the paywall (before any registration prompt) and teaches the Dog', () => {
    const start = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'first-stage' as const } };
    const r = completeFirstStage(start, payloadWith({ followMarks: 3, markerHits: 1, markerAccuracyMs: 0, posteSuccesses: 1 }), new Date(2026, 4, 1, 12));
    expect(r.onboarding.step).toBe('paywall');
    expect(r.onboarding.firstStageCompletedAt).not.toBeNull();
    expect(r.attributes.followChance).toBeGreaterThan(DEFAULT_ATTRIBUTES.followChance);
    expect(r.streak.current).toBe(1);
  });

  it('persists the paywall step before the registration prompt opens, so a restart during registration resumes at the paywall', async () => {
    const data = new Map<string, string>();
    const store: KeyValueStore = { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
    const start = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'first-stage' as const } };
    await saveDogRecord(store, completeFirstStage(start, payloadWith({}), new Date(2026, 4, 1, 12)));
    expect((await loadDogRecord(store)).onboarding.step).toBe('paywall');
  });
});
