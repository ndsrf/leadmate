import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { KeyValueStore, DogRecord } from '../dogRecord';
import { getActiveContent } from '../content/runtime';
import { WORLDS, worldsFor, type WorldDef } from '../world';
import { buildEvent, contextProperties, type CommonProperties, type ContextProperties, type ScreenName } from './contract';
import { contextOf, runtimeOf } from './context';
import { SessionClock } from './session';
import {
  loadAnalyticsState,
  saveAnalyticsState,
  isEnabled,
  type AnalyticsState,
} from './state';
import type { AnalyticsService, AnalyticsEvent } from './types';
import { MockAnalyticsService } from './mock';
import { PostHogAnalyticsService, DEFAULT_POSTHOG_HOST } from './posthog';

export * from './contract';
export * from './state';
export * from './types';
export * from './mock';
export * from './posthog';
export * from './stages';
export * from './lessons';
export * from './stops';
export * from './screen';
export * from './context';

interface BufferedTrackEvent {
  name: string;
  props: Record<string, unknown>;
  timestamp: Date;
  /** The user's context when the event happened, kept so a late send does not change it. */
  context: Partial<ContextProperties>;
}

const BUFFER_CAP = 50;

let analyticsServiceInstance: AnalyticsService | null = null;
let customServiceForTesting: AnalyticsService | null = null;

let activeStore: KeyValueStore | null = null;
let activeRecord: DogRecord | null = null;
let activeState: AnalyticsState | null = null;
let isInitialized = false;
let isEnabling = false;
let activeScreen: ScreenName = 'splash';
let activeSignedIn = false;
let lastRegistered = '';
const sessionClock = new SessionClock();
let eventBuffer: BufferedTrackEvent[] = [];
const stateListeners = new Set<(state: AnalyticsState) => void>();

function notifyStateListeners(state: AnalyticsState): void {
  for (const listener of stateListeners) {
    try {
      listener(state);
    } catch {
      // Ignore listener errors
    }
  }
}

function isJest(): boolean {
  return (
    typeof process !== 'undefined' &&
    (Boolean(process.env.JEST_WORKER_ID) || process.env.NODE_ENV === 'test')
  );
}

function devWarn(message: string, error?: unknown): void {
  if (typeof __DEV__ !== 'undefined' && __DEV__ && !isJest()) {
    console.warn(`[analytics] ${message}`, error ?? '');
  }
}

export function getAnalytics(): AnalyticsService {
  if (customServiceForTesting) {
    return customServiceForTesting;
  }
  if (!analyticsServiceInstance) {
    const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
    if (isJest() || !posthogKey) {
      analyticsServiceInstance = new MockAnalyticsService();
    } else {
      const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;
      analyticsServiceInstance = new PostHogAnalyticsService(posthogKey, host, currentRuntime());
    }
    devWarn(
      analyticsServiceInstance instanceof MockAnalyticsService
        ? 'using MockAnalyticsService (no EXPO_PUBLIC_POSTHOG_KEY in this bundle): nothing is sent'
        : 'using PostHog'
    );
  }
  return analyticsServiceInstance;
}

export function setAnalyticsServiceForTesting(service: AnalyticsService | null): void {
  customServiceForTesting = service;
}

export function resetAnalyticsForTesting(): void {
  analyticsServiceInstance = null;
  customServiceForTesting = null;
  activeStore = null;
  activeRecord = null;
  activeState = null;
  isInitialized = false;
  isEnabling = false;
  eventBuffer = [];
  stateListeners.clear();
  activeScreen = 'splash';
  activeSignedIn = false;
  lastRegistered = '';
  sessionClock.restart();
}

export function getAnalyticsState(): AnalyticsState | null {
  return activeState;
}

export function updateAnalyticsRecord(record: DogRecord | null): void {
  activeRecord = record;
  registerSuperProperties();
}

/** The screen at the front now; every later event, and every tap, carries it. */
export function setAnalyticsScreen(screen: ScreenName): void {
  activeScreen = screen;
  registerSuperProperties();
}

export function getAnalyticsScreen(): ScreenName {
  return activeScreen;
}

export function setAnalyticsSignedIn(signedIn: boolean): void {
  activeSignedIn = signedIn;
  registerSuperProperties();
}

/** The app went to the background or came back: the App Session clock pauses while it is away. */
export function setAnalyticsForeground(foreground: boolean, now: number = Date.now()): void {
  if (foreground) sessionClock.foreground(now);
  else sessionClock.background(now);
}

/** A new App Session begins (a cold start, or a return after a long absence): raises `session_number`. */
export function startAnalyticsSession(now: number = Date.now()): void {
  sessionClock.restart(now);
  if (activeState) {
    activeState.sessionCount += 1;
    if (activeStore && activeState.installId !== 'in-memory-fallback') {
      void saveAnalyticsState(activeStore, activeState);
    }
  }
  registerSuperProperties();
}

export function flushAnalytics(): void {
  try {
    if (!activeState || !isEnabled(activeState)) return;
    const flushed = getAnalytics().flush();
    if (flushed && typeof flushed.catch === 'function') flushed.catch(() => {});
  } catch {
    // never throws
  }
}

/** `app_backgrounded` with the last screen, then a flush so it leaves before the OS may kill the app. */
export function trackAppBackgrounded(now: number = Date.now()): void {
  track('app_backgrounded', { screen: activeScreen, seconds_in_session: sessionClock.seconds(now) });
  flushAnalytics();
}

function currentRuntime(): ContextProperties['runtime'] {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'android';
  return runtimeOf({
    platform,
    executionEnvironment: Constants.executionEnvironment as string | undefined,
    buildProfile: process.env.EXPO_PUBLIC_BUILD_PROFILE?.trim() || undefined,
  });
}

function currentContext(now: number): Partial<ContextProperties> {
  const platform = Platform.OS === 'ios' || Platform.OS === 'android' || Platform.OS === 'web' ? Platform.OS : 'android';
  const buildProfile = process.env.EXPO_PUBLIC_BUILD_PROFILE?.trim() || undefined;
  const executionEnvironment = Constants.executionEnvironment as string | undefined;
  const sessionNumber = activeState?.sessionCount ?? 1;
  const secondsInSession = sessionClock.seconds(now);
  const record = activeRecord;
  if (!record) {
    return {
      screen: activeScreen,
      has_account: activeSignedIn,
      session_number: Math.max(1, sessionNumber),
      seconds_in_session: secondsInSession,
      platform,
      runtime: runtimeOf({ platform, executionEnvironment, buildProfile }),
    };
  }
  let worlds: readonly WorldDef[] = WORLDS;
  try {
    worlds = worldsFor(record.onboarding?.plan ?? [], record);
  } catch {
    // fall back to the authored Worlds
  }
  return contextOf({
    record,
    worlds,
    signedIn: activeSignedIn,
    sessionNumber,
    secondsInSession,
    screen: activeScreen,
    buildProfile,
    executionEnvironment,
    platform,
    now: new Date(now),
  });
}

/** Passes the context to the SDK as super properties (all but `seconds_in_session`) when it changed. */
function registerSuperProperties(): void {
  try {
    if (!isInitialized || !activeState || isEnabling || !isEnabled(activeState)) return;
    const props = contextProperties(currentContext(Date.now()), false);
    const key = JSON.stringify(props);
    if (key === lastRegistered) return;
    lastRegistered = key;
    const registered = getAnalytics().register(props);
    if (registered && typeof registered.catch === 'function') registered.catch(() => {});
  } catch (error) {
    devWarn('register failed', error);
  }
}

function getCommonProperties(capturedAt: Date, state: AnalyticsState, context: Partial<ContextProperties>): CommonProperties {
  const installedMs = Date.parse(state.installedAt);
  const secondsSinceInstall = Math.max(
    0,
    Math.floor((capturedAt.getTime() - (Number.isNaN(installedMs) ? capturedAt.getTime() : installedMs)) / 1000)
  );

  const appVersion = Constants.expoConfig?.version ?? '1.2.0';
  let contentVersion = 1;
  let contentChannel: 'stable' | 'beta' = 'stable';
  let language: 'es' | 'en' = 'es';

  try {
    const content = getActiveContent();
    if (content) {
      contentVersion = content.contentVersion ?? 1;
      contentChannel = content.channel === 'beta' ? 'beta' : 'stable';
      language = (activeRecord?.language ?? content.language ?? 'es') === 'en' ? 'en' : 'es';
    }
  } catch {
    // Fallback if content runtime is not initialized
  }

  return {
    app_version: appVersion,
    content_version: contentVersion,
    content_channel: contentChannel,
    language,
    seconds_since_install: secondsSinceInstall,
    ...context,
  };
}

async function flushBuffer(service: AnalyticsService, state: AnalyticsState): Promise<void> {
  const toFlush = [...eventBuffer];
  eventBuffer = [];

  for (const item of toFlush) {
    try {
      const common = getCommonProperties(item.timestamp, state, item.context);
      const built = buildEvent(item.name, item.props, common);
      if (built) {
        await service.capture({ ...built, timestamp: item.timestamp });
      }
    } catch {
      // Swallow individual event errors
    }
  }
}

function startSessionCounter(state: AnalyticsState): void {
  sessionClock.restart();
  state.sessionCount += 1;
  if (activeStore && state.installId !== 'in-memory-fallback') {
    void saveAnalyticsState(activeStore, state);
  }
}

export async function initAnalytics(
  store: KeyValueStore,
  record?: DogRecord | null
): Promise<AnalyticsState> {
  activeStore = store;
  activeRecord = record ?? null;

  let state: AnalyticsState;
  try {
    state = await loadAnalyticsState(store, undefined, undefined, record);
  } catch {
    state = {
      installId: 'in-memory-fallback',
      installedAt: new Date().toISOString(),
      choice: null,
      funnelDoneOnce: false,
      funnelOpen: false,
      upgradedInstall: false,
      sessionCount: 0,
    };
  }

  activeState = state;
  isInitialized = true;
  notifyStateListeners(state);

  const enabled = isEnabled(state);
  const service = getAnalytics();

  // opening the app is the start of an App Session
  startSessionCounter(state);

  if (enabled) {
    try {
      await service.start(state);
      await flushBuffer(service, state);
      registerSuperProperties();
    } catch (error) {
      devWarn('PostHog failed to start', error);
      // Guard service.start/flush failure: keep loaded state, do not clobber
      eventBuffer = [];
    }
  } else {
    devWarn('analytics is turned off in Settings: nothing is sent');
    // Discard pre-init events if analytics is disabled
    eventBuffer = [];
  }

  return state;
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  try {
    const timestamp = new Date();

    if (!isInitialized || !activeState || isEnabling) {
      if (activeState && !isEnabled(activeState) && !isEnabling) {
        return;
      }
      // Buffer in memory with cap 50
      if (eventBuffer.length >= BUFFER_CAP) {
        eventBuffer.shift(); // Drop oldest
      }
      eventBuffer.push({ name, props, timestamp, context: currentContext(timestamp.getTime()) });
      return;
    }

    if (!isEnabled(activeState)) {
      return; // Gated immediately when disabled
    }

    const common = getCommonProperties(timestamp, activeState, currentContext(timestamp.getTime()));
    const built = buildEvent(name, props, common);
    if (!built) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn(`[analytics] track dropped event "${name}" due to contract validation failure`);
      }
      return;
    }

    const service = getAnalytics();
    const capturePromise = service.capture({ ...built, timestamp });
    if (capturePromise && typeof capturePromise.catch === 'function') {
      capturePromise.catch((error: unknown) => devWarn(`capture failed for "${name}"`, error));
    }
  } catch (error) {
    devWarn(`track failed for "${name}"`, error);
    // track is synchronous, returns void, and never throws
  }
}

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  try {
    if (!activeState) {
      activeState = {
        installId: 'in-memory-fallback',
        installedAt: new Date().toISOString(),
        choice: enabled ? 'on' : 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
        sessionCount: 0,
      };
    } else {
      activeState.choice = enabled ? 'on' : 'off';
    }
    notifyStateListeners(activeState);

    const service = getAnalytics();
    if (enabled) {
      isEnabling = true;
      try {
        await service.setEnabled(true);
        if (activeState) {
          await service.start(activeState);
        }
        if (activeState) {
          await flushBuffer(service, activeState);
        }
      } finally {
        isEnabling = false;
      }
      lastRegistered = '';
      registerSuperProperties();
    } else {
      eventBuffer = [];
      lastRegistered = '';
      await service.setEnabled(false);
    }

    if (activeStore && activeState && activeState.installId !== 'in-memory-fallback') {
      await saveAnalyticsState(activeStore, activeState);
    }
  } catch {
    // Swallow every error
  }
}

export function useAnalyticsSetting(): {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
} {
  const state = getAnalyticsState();
  const [enabled, setEnabledLocal] = useState(() => isEnabled(state ?? { choice: null }));

  useEffect(() => {
    const current = getAnalyticsState();
    if (current) {
      setEnabledLocal(isEnabled(current));
    }
    const listener = (nextState: AnalyticsState) => {
      setEnabledLocal(isEnabled(nextState));
    };
    stateListeners.add(listener);
    return () => {
      stateListeners.delete(listener);
    };
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    setEnabledLocal(next);
    await setAnalyticsEnabled(next);
  }, []);

  return { enabled, setEnabled };
}

export async function updateAnalyticsFlags(
  flags: Partial<Pick<AnalyticsState, 'funnelDoneOnce' | 'funnelOpen'>>
): Promise<void> {
  try {
    if (!activeState) return;
    let changed = false;
    if (flags.funnelDoneOnce !== undefined && flags.funnelDoneOnce !== activeState.funnelDoneOnce) {
      activeState.funnelDoneOnce = flags.funnelDoneOnce;
      changed = true;
    }
    if (flags.funnelOpen !== undefined && flags.funnelOpen !== activeState.funnelOpen) {
      activeState.funnelOpen = flags.funnelOpen;
      changed = true;
    }
    if (changed && activeStore && activeState.installId !== 'in-memory-fallback') {
      await saveAnalyticsState(activeStore, activeState);
    }
  } catch {
    // Never throws
  }
}
