import { ATTRIBUTE_KEYS, DEFAULT_ATTRIBUTES, DEFAULT_TRIGGER_PROFILE, type LearningAttributes } from '../sim/learning';
import { floorOf, LEARNING, nextPosture, updateLearning, updateTriggerProfile } from './learning';
import { payloadWith } from './testPayload';

const attrs = (o: Partial<LearningAttributes> = {}): LearningAttributes => ({ ...DEFAULT_ATTRIBUTES, ...o });
const success = payloadWith({ markerHits: 1, markerAccuracyMs: 0, posteSuccesses: 1, peakArousalScore: 40, calmEncounters: { skateboard: 1 } });
const poorRun = payloadWith({ pullPercentage: 80, missedOpportunities: 1, peakArousalScore: 100 });

describe('updateLearning', () => {
  it('improves attributes after a successful Stage', () => {
    const next = updateLearning(attrs(), success);
    expect(next.reactivityThreshold).toBeGreaterThan(DEFAULT_ATTRIBUTES.reactivityThreshold);
    expect(next.reconnectionLatency).toBeGreaterThan(DEFAULT_ATTRIBUTES.reconnectionLatency);
  });

  it('is a pure function', () => {
    const old = attrs();
    const snapshot = JSON.stringify(old);
    expect(updateLearning(old, success)).toEqual(updateLearning(old, success));
    expect(JSON.stringify(old)).toBe(snapshot);
  });

  it('gives a lower peak Arousal at the same difficulty a larger gain', () => {
    const calm = updateLearning(attrs(), payloadWith({ ...success, peakArousalScore: 30 }));
    const worked = updateLearning(attrs(), payloadWith({ ...success, peakArousalScore: 95 }));
    expect(calm.reactivityThreshold).toBeGreaterThan(worked.reactivityThreshold);
  });

  it('limits a poor run to the setback cap and the milestone floor', () => {
    const old = attrs({ reactivityThreshold: 0.5, reconnectionLatency: 0.7 });
    const next = updateLearning(old, poorRun);
    for (const key of ['reactivityThreshold', 'reconnectionLatency'] as const) {
      const floor = floorOf(old[key]);
      expect(next[key]).toBeLessThan(old[key]);
      expect(next[key]).toBeGreaterThanOrEqual(floor);
      expect(old[key] - next[key]).toBeLessThanOrEqual((old[key] - floor) * LEARNING.setbackShare + 1e-9);
    }
  });

  it('never falls below a milestone floor, however many poor runs', () => {
    let a = attrs({ reactivityThreshold: 0.7, reconnectionLatency: 0.4 });
    for (let i = 0; i < 200; i++) a = updateLearning(a, poorRun);
    expect(a.reactivityThreshold).toBeGreaterThanOrEqual(0.66);
    expect(a.reconnectionLatency).toBeGreaterThanOrEqual(0.33);
  });

  it('keeps every value within 0-1', () => {
    let a = attrs({ reactivityThreshold: 0.99, followChance: 0.99, checkInFrequency: 0.99, reconnectionLatency: 0.99 });
    for (let i = 0; i < 20; i++) a = updateLearning(a, payloadWith({ ...success, followMarks: 9, checkInHits: 9 }));
    for (const key of ATTRIBUTE_KEYS) expect(a[key]).toBeLessThanOrEqual(1);
  });

  it('raises followChance across Stages when the user marks follows', () => {
    let a = attrs();
    const first = a.followChance;
    for (let i = 0; i < 3; i++) {
      a = updateLearning(a, payloadWith({ followMarks: 2, checkInHits: 2 }));
    }
    expect(a.followChance).toBeGreaterThan(first);
    expect(a.checkInFrequency).toBeGreaterThan(DEFAULT_ATTRIBUTES.checkInFrequency);
  });

  it('does not reward an empty Stage', () => {
    expect(updateLearning(attrs(), payloadWith())).toEqual(attrs());
  });
});

describe('updateTriggerProfile', () => {
  it('lowers a level after enough calm encounters, counting across Stages', () => {
    const one = payloadWith({ calmEncounters: { child: 2 } });
    const first = updateTriggerProfile(DEFAULT_TRIGGER_PROFILE, {}, one);
    expect(first.profile.child).toBe(2);
    const second = updateTriggerProfile(first.profile, first.counts, one);
    expect(second.profile.child).toBe(1);
    expect(second.counts.child).toBe(1);
  });

  it('never raises a level and does not go below 0', () => {
    const profile = { ...DEFAULT_TRIGGER_PROFILE, dog: 0 as const };
    const next = updateTriggerProfile(profile, { dog: 5 }, payloadWith({ calmEncounters: { dog: 5 } }));
    expect(next.profile.dog).toBe(0);
    const poor = updateTriggerProfile(DEFAULT_TRIGGER_PROFILE, {}, poorRun);
    expect(poor.profile).toEqual(DEFAULT_TRIGGER_PROFILE);
  });
});

describe('visual posture', () => {
  const avg = (p: number) => attrs({ reconnectionLatency: p, reactivityThreshold: p, followChance: p, checkInFrequency: p });

  it('changes at 33% and 66% of average progress', () => {
    expect(nextPosture(avg(0.32), 0)).toBe(0);
    expect(nextPosture(avg(0.33), 0)).toBe(1);
    expect(nextPosture(avg(0.65), 1)).toBe(1);
    expect(nextPosture(avg(0.66), 1)).toBe(2);
  });

  it('never regresses', () => {
    expect(nextPosture(avg(0.1), 2)).toBe(2);
    expect(nextPosture(avg(0.4), 2)).toBe(2);
  });

  it('is first reached after a few good Stages from a new Dog', () => {
    let a = attrs();
    let stages = 0;
    while (nextPosture(a, 0) === 0 && stages < 20) {
      a = updateLearning(a, payloadWith({ ...success, followMarks: 2, checkInHits: 2 }));
      stages++;
    }
    expect(stages).toBeGreaterThanOrEqual(2);
    expect(stages).toBeLessThanOrEqual(5);
  });
});
