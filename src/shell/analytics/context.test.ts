import { contextOf, runtimeOf, type ContextInput } from './context';
import { newDogRecord, type DogRecord } from '../dogRecord';
import { WORLDS, stopsOf } from '../world';
import { markLessonRead } from '../lessons/lesson';
import { markPuppyModuleCompleted } from '../puppyTrack';

const now = new Date('2026-11-18T10:00:00Z');

function withTrail(record: DogRecord, count: number): DogRecord {
  let out = record;
  let done = 0;
  for (const stop of stopsOf(WORLDS[0])) {
    if (done === count) break;
    if (stop.kind === 'lesson') out = markLessonRead(out, stop.id, now);
    else if (stop.kind === 'node') out = { ...out, completedNodes: [...out.completedNodes, stop.id] };
    else continue;
    done += 1;
  }
  return out;
}

function input(over: Partial<ContextInput> = {}): ContextInput {
  return {
    record: newDogRecord(),
    worlds: WORLDS,
    signedIn: false,
    sessionNumber: 1,
    secondsInSession: 0,
    buildProfile: 'production',
    executionEnvironment: 'standalone',
    platform: 'android',
    now,
    ...over,
  };
}

describe('contextOf', () => {
  it('describes a new install', () => {
    const ctx = contextOf(input());
    expect(ctx).toMatchObject({
      world_id: WORLDS[0].id,
      stops_done: 0,
      furthest_stop_index: -1,
      funnel_done: false,
      has_account: false,
      plus_status: 'free',
      session_number: 1,
      seconds_in_session: 0,
      platform: 'android',
      runtime: 'store',
    });
  });

  it('counts done trail Stops and leaves Satellite Stops out', () => {
    let record = withTrail({ ...newDogRecord(), ageBand: 'puppy' }, 7);
    record = markPuppyModuleCompleted(record, 'puppy-bite', now);
    const ctx = contextOf(input({ record }));
    expect(ctx.stops_done).toBe(7);
  });

  it('gives the furthest done trail index of the current World', () => {
    const record = withTrail(newDogRecord(), 3);
    const ctx = contextOf(input({ record }));
    const trail = stopsOf(WORLDS[0]);
    const lastDone = Math.max(...trail.map((s, i) => (record.completedNodes.includes(s.id) || record.readLessons.includes(s.id) ? i : -1)));
    expect(ctx.furthest_stop_index).toBe(lastDone);
    expect(ctx.world_id).toBe(WORLDS[0].id);
  });

  it('reports a finished Funnel, and an unfinished one after a reset', () => {
    const base = newDogRecord();
    const done = { ...base, onboarding: { ...base.onboarding, step: 'done' as const } };
    expect(contextOf(input({ record: done })).funnel_done).toBe(true);
    expect(contextOf(input({ record: { ...done, onboarding: { ...done.onboarding, step: 'welcome' as const } } })).funnel_done).toBe(false);
  });

  it('reports the account without an id', () => {
    const ctx = contextOf(input({ signedIn: true }));
    expect(ctx.has_account).toBe(true);
    expect(JSON.stringify(ctx)).not.toMatch(/user|email|account_id/);
  });

  describe('plus_status', () => {
    const base = newDogRecord();
    const trial = (startedAt: string): DogRecord => ({ ...base, onboarding: { ...base.onboarding, trialStartedAt: startedAt } });

    it('is trial while the Trial runs', () => {
      expect(contextOf(input({ record: trial('2026-11-16T10:00:00Z') })).plus_status).toBe('trial');
    });

    it('is free once the Trial expired or never started', () => {
      expect(contextOf(input({ record: trial('2026-11-01T10:00:00Z') })).plus_status).toBe('free');
      expect(contextOf(input()).plus_status).toBe('free');
    });

    it('is subscribed with an active store Subscription Tier, then free when it lapses', () => {
      const billing = { isSubscribed: true, expiresAt: '2026-12-01T00:00:00Z', lastVerifiedAt: now.toISOString(), tier: 'monthly' as const };
      expect(contextOf(input({ record: { ...base, billing } })).plus_status).toBe('subscribed');
      expect(contextOf(input({ record: { ...base, billing: { ...billing, expiresAt: '2026-11-10T00:00:00Z' } } })).plus_status).toBe('free');
      expect(contextOf(input({ record: { ...base, billing: { ...billing, isSubscribed: false } } })).plus_status).toBe('free');
    });

    it('is subscribed, not trial, for a subscriber still inside the Trial window', () => {
      const billing = { isSubscribed: true, expiresAt: null, lastVerifiedAt: now.toISOString() };
      expect(contextOf(input({ record: { ...trial('2026-11-16T10:00:00Z'), billing } })).plus_status).toBe('subscribed');
    });
  });

  it('carries the session number and seconds', () => {
    const ctx = contextOf(input({ sessionNumber: 4, secondsInSession: 20 }));
    expect(ctx.session_number).toBe(4);
    expect(ctx.seconds_in_session).toBe(20);
  });

  it('passes the screen through when given', () => {
    expect(contextOf(input({ screen: 'lesson' })).screen).toBe('lesson');
    expect(contextOf(input())).not.toHaveProperty('screen');
  });
});

describe('runtimeOf', () => {
  it('is web on web, whatever else', () => {
    expect(runtimeOf({ platform: 'web', executionEnvironment: 'bare', buildProfile: 'production' })).toBe('web');
  });
  it('is expo_go in the Expo Go client', () => {
    expect(runtimeOf({ platform: 'android', executionEnvironment: 'storeClient', buildProfile: undefined })).toBe('expo_go');
  });
  it('reads the EAS build profile otherwise', () => {
    const run = (buildProfile?: string) => runtimeOf({ platform: 'ios', executionEnvironment: 'standalone', buildProfile });
    expect(run('development')).toBe('dev_build');
    expect(run('preview')).toBe('preview');
    expect(run('closed_test')).toBe('closed_test');
    expect(run('production')).toBe('store');
    expect(run(undefined)).toBe('store');
    expect(run('something-else')).toBe('store');
  });
});
