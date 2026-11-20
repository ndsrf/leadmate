import type { DogRecord } from '../dogRecord';
import { currentWorld, stopStatus, stopsOf, type WorldDef } from '../world';
import { progressAt, trialState } from '../plus';
import { isPuppyModuleId } from '../puppyTrack';
import type { ContextProperties, ScreenName } from './contract';

export type Runtime = ContextProperties['runtime'];
export type Platform = ContextProperties['platform'];

export interface RuntimeInput {
  platform: Platform;
  /** `Constants.executionEnvironment`: 'storeClient' is Expo Go. */
  executionEnvironment?: string;
  /** `EXPO_PUBLIC_BUILD_PROFILE`, set per `eas.json` profile. */
  buildProfile?: string;
}

/** Where the app runs: web, Expo Go, or the EAS build profile (production or unset counts as the store build). */
export function runtimeOf({ platform, executionEnvironment, buildProfile }: RuntimeInput): Runtime {
  if (platform === 'web') return 'web';
  if (executionEnvironment === 'storeClient') return 'expo_go';
  if (buildProfile === 'development') return 'dev_build';
  if (buildProfile === 'preview') return 'preview';
  if (buildProfile === 'closed_test') return 'closed_test';
  return 'store';
}

export interface ContextInput extends RuntimeInput {
  record: DogRecord;
  worlds: readonly WorldDef[];
  signedIn: boolean;
  /** 1 for the first App Session of the install. */
  sessionNumber: number;
  /** Foreground seconds since the App Session began. */
  secondsInSession: number;
  screen?: ScreenName;
  now: Date;
}

/** The user's context for every event: progress, plan, account, session, platform and runtime. */
export function contextOf(input: ContextInput): ContextProperties {
  const { record, worlds, signedIn, sessionNumber, secondsInSession, screen, now } = input;
  const progress = progressAt(record, now);

  let stopsDone = 0;
  for (const world of worlds) {
    for (const stop of stopsOf(world)) {
      if (isPuppyModuleId(stop.id)) continue;
      if (stopStatus(stop, progress, now, worlds).state === 'done') stopsDone += 1;
    }
  }

  const world = currentWorld(progress, worlds);
  let furthest = -1;
  stopsOf(world).forEach((stop, index) => {
    if (isPuppyModuleId(stop.id)) return;
    if (stopStatus(stop, progress, now, worlds).state === 'done') furthest = index;
  });

  const billing = record.billing;
  const expiresMs = billing?.expiresAt ? Date.parse(billing.expiresAt) : NaN;
  const subscribed = Boolean(billing?.isSubscribed) && (Number.isNaN(expiresMs) || now.getTime() < expiresMs);
  const plusStatus: ContextProperties['plus_status'] = subscribed || record.onboarding.mockSubscribed
    ? 'subscribed'
    : trialState(record, now) === 'active'
      ? 'trial'
      : 'free';

  return {
    ...(screen ? { screen } : {}),
    ...(world ? { world_id: world.id } : {}),
    stops_done: stopsDone,
    furthest_stop_index: furthest,
    funnel_done: record.onboarding.step === 'done',
    has_account: signedIn,
    plus_status: plusStatus,
    session_number: Math.max(1, sessionNumber),
    seconds_in_session: Math.max(0, Math.floor(secondsInSession)),
    platform: input.platform,
    runtime: runtimeOf(input),
  } as ContextProperties;
}
