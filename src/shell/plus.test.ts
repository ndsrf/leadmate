import { newDogRecord, updateMission, type DogRecord } from './dogRecord';
import { isOwed, startMission } from './missions/mission';
import { canStartTrial, isPlus, plusEndsAt, progressAt, startTrialThen, TRIAL_DAYS } from './plus';

const withTrial = (trialStartedAt: string | null): DogRecord => {
  const r = newDogRecord();
  return { ...r, onboarding: { ...r.onboarding, trialStartedAt } };
};
const start = new Date(2026, 4, 4, 18, 0);

describe('isPlus', () => {
  it('is Plus on the day the trial started', () => {
    expect(isPlus(withTrial(start.toISOString()), new Date(2026, 4, 4, 18, 5))).toBe(true);
  });

  it('is Plus until the 7 days end, and free from that moment', () => {
    const record = withTrial(start.toISOString());
    expect(TRIAL_DAYS).toBe(7);
    expect(isPlus(record, new Date(start.getTime() + 7 * 86_400_000 - 1))).toBe(true);
    expect(isPlus(record, new Date(start.getTime() + 7 * 86_400_000))).toBe(false);
  });

  it('is free 8 days later', () => {
    expect(isPlus(withTrial(start.toISOString()), new Date(2026, 4, 12, 18, 0))).toBe(false);
  });

  it('is free when the trial never started', () => {
    expect(isPlus(withTrial(null), start)).toBe(false);
  });

  it('is free when the clock is earlier than the trial start', () => {
    expect(isPlus(withTrial(start.toISOString()), new Date(2026, 4, 4, 17, 59))).toBe(false);
  });
});

describe('a Day Skip held by the paywall', () => {
  const waiting = (trialStartedAt: string | null) => updateMission(withTrial(trialStartedAt), 'mission-harness', (m) => startMission(m, new Date(2026, 4, 20, 9)));
  const now = new Date(2026, 4, 20, 18);

  it('is applied when "Empezar prueba" starts the trial', () => {
    const after = startTrialThen(waiting(null), { skipMission: 'mission-harness' }, now);
    expect(after.onboarding.trialStartedAt).toBe(now.toISOString());
    expect(isOwed(after.missions['mission-harness'])).toBe(true);
    expect(after.activityLog.map((e) => e.kind)).toEqual(['skip']);
  });

  it('is not applied when the trial already ended', () => {
    const after = startTrialThen(waiting(start.toISOString()), { skipMission: 'mission-harness' }, now);
    expect(after.onboarding.trialStartedAt).toBe(start.toISOString());
    expect(isOwed(after.missions['mission-harness'])).toBe(false);
    expect(after.activityLog).toEqual([]);
  });

  it('only starts the trial when nothing is pending', () => {
    const after = startTrialThen(waiting(null), undefined, now);
    expect(isPlus(after, now)).toBe(true);
    expect(isOwed(after.missions['mission-harness'])).toBe(false);
  });
});

describe('progress as the trail reads it', () => {
  it('carries whether the user is Plus at that moment', () => {
    const record = withTrial(start.toISOString());
    expect(progressAt(record, new Date(2026, 4, 5)).plus).toBe(true);
    expect(progressAt(record, new Date(2026, 4, 12)).plus).toBe(false);
    expect(progressAt(withTrial(null), start).plus).toBe(false);
  });

  it('knows when Plus ends: at the end of a running trial, never for a free user', () => {
    expect(plusEndsAt(withTrial(start.toISOString()), new Date(2026, 4, 5))).toEqual(new Date(start.getTime() + 7 * 86_400_000));
    expect(plusEndsAt(withTrial(start.toISOString()), new Date(2026, 4, 12))).toBeNull();
    expect(plusEndsAt(withTrial(null), start)).toBeNull();
  });

  it('can start the trial only when none was started or it is still running', () => {
    expect(canStartTrial(withTrial(null), start)).toBe(true);
    expect(canStartTrial(withTrial(start.toISOString()), new Date(2026, 4, 5))).toBe(true);
    expect(canStartTrial(withTrial(start.toISOString()), new Date(2026, 4, 12))).toBe(false);
  });
});
