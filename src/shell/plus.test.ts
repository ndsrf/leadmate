import { newDogRecord, updateMission, type DogRecord } from './dogRecord';
import { isOwed, startMission } from './missions/mission';
import { canStartTrial, computeTrialRecap, isPlus, plusEndsAt, progressAt, startTrialThen, subscribeThen, trialDaysRemaining, trialState, TRIAL_DAYS } from './plus';

const withTrial = (trialStartedAt: string | null, mockSubscribed?: boolean): DogRecord => {
  const r = newDogRecord();
  return { ...r, onboarding: { ...r.onboarding, trialStartedAt, mockSubscribed } };
};
const start = new Date(2026, 4, 4, 18, 0);

describe('trialState and trialDaysRemaining', () => {
  it('identifies unstarted trial', () => {
    expect(trialState(withTrial(null), start)).toBe('unstarted');
    expect(trialDaysRemaining(withTrial(null), start)).toBe(0);
  });

  it('identifies active trial with 5 days left (2 days elapsed)', () => {
    const twoDaysLater = new Date(start.getTime() + 2 * 86_400_000);
    const record = withTrial(start.toISOString());
    expect(trialState(record, twoDaysLater)).toBe('active');
    expect(trialDaysRemaining(record, twoDaysLater)).toBe(5);
  });

  it('identifies trial on its final day (6 days and 18 hours elapsed)', () => {
    const finalDay = new Date(start.getTime() + 6 * 86_400_000 + 18 * 3600_000);
    const record = withTrial(start.toISOString());
    expect(trialState(record, finalDay)).toBe('active');
    expect(trialDaysRemaining(record, finalDay)).toBe(1);
  });

  it('identifies expired trial (7 days and 1 hour elapsed)', () => {
    const expired = new Date(start.getTime() + 7 * 86_400_000 + 3600_000);
    const record = withTrial(start.toISOString());
    expect(trialState(record, expired)).toBe('expired');
    expect(trialDaysRemaining(record, expired)).toBe(0);
  });
});

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

  it('confers Plus when mockSubscribed is true even after trial expiry or without trial', () => {
    const expiredRecord = withTrial(start.toISOString(), true);
    const expiredDate = new Date(start.getTime() + 10 * 86_400_000);
    expect(isPlus(expiredRecord, expiredDate)).toBe(true);

    const noTrialRecord = withTrial(null, true);
    expect(isPlus(noTrialRecord, start)).toBe(true);
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

  it('supports kind: skip pending action', () => {
    const after = startTrialThen(waiting(null), { kind: 'skip', missionId: 'mission-harness' }, now);
    expect(after.onboarding.trialStartedAt).toBe(now.toISOString());
    expect(isOwed(after.missions['mission-harness'])).toBe(true);
  });

  it('supports kind: video pending action which starts trial without applying skip', () => {
    const after = startTrialThen(waiting(null), { kind: 'video', lessonId: 'intro' }, now);
    expect(after.onboarding.trialStartedAt).toBe(now.toISOString());
    expect(isPlus(after, now)).toBe(true);
    expect(after.activityLog).toEqual([]);
    expect(isOwed(after.missions['mission-harness'])).toBe(false);
  });

  it('supports subscribeThen with skip or video pending action', () => {
    const afterSkip = subscribeThen(waiting(start.toISOString()), { kind: 'skip', missionId: 'mission-harness' }, now);
    expect(afterSkip.onboarding.mockSubscribed).toBe(true);
    expect(isPlus(afterSkip, now)).toBe(true);
    expect(isOwed(afterSkip.missions['mission-harness'])).toBe(true);

    const afterVideo = subscribeThen(waiting(start.toISOString()), { kind: 'video', lessonId: 'intro' }, now);
    expect(afterVideo.onboarding.mockSubscribed).toBe(true);
    expect(isPlus(afterVideo, now)).toBe(true);
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

describe('computeTrialRecap', () => {
  it('correctly tallies videos watched from read lessons and skips used from activityLog', () => {
    const mockLessons = [
      { id: 'l1', blocks: [{ type: 'text' }, { type: 'video' }] },
      { id: 'l2', blocks: [{ type: 'text' }] },
      { id: 'l3', blocks: [{ type: 'video' }] },
    ];
    const record = newDogRecord();
    record.readLessons = ['l1', 'l2'];
    record.activityLog = [
      { kind: 'skip', id: 'm1', date: '2026-05-01', at: '2026-05-01T10:00:00Z' },
      { kind: 'node', id: 'n1', date: '2026-05-02', at: '2026-05-02T10:00:00Z' },
      { kind: 'skip', id: 'm2', date: '2026-05-03', at: '2026-05-03T10:00:00Z' },
    ];

    const stats = computeTrialRecap(record, mockLessons);
    expect(stats.videosWatched).toBe(1);
    expect(stats.skipsUsed).toBe(2);
  });
});
