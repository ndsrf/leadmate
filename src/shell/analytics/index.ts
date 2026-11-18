import { Platform } from 'react-native';
import Constants from 'expo-constants';
import type { KeyValueStore, DogRecord } from '../dogRecord';
import { getActiveContent } from '../content/runtime';
import { buildEvent, type CommonProperties } from './contract';
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

interface BufferedTrackEvent {
  name: string;
  props: Record<string, unknown>;
  timestamp: Date;
}

const BUFFER_CAP = 50;

let analyticsServiceInstance: AnalyticsService | null = null;
let customServiceForTesting: AnalyticsService | null = null;

let activeStore: KeyValueStore | null = null;
let activeRecord: DogRecord | null = null;
let activeState: AnalyticsState | null = null;
let isInitialized = false;
let eventBuffer: BufferedTrackEvent[] = [];

function isJest(): boolean {
  return (
    typeof process !== 'undefined' &&
    (Boolean(process.env.JEST_WORKER_ID) || process.env.NODE_ENV === 'test')
  );
}

function isWeb(): boolean {
  return typeof Platform !== 'undefined' && Platform.OS === 'web';
}

export function getAnalytics(): AnalyticsService {
  if (customServiceForTesting) {
    return customServiceForTesting;
  }
  if (!analyticsServiceInstance) {
    const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY?.trim();
    if (isJest() || isWeb() || !posthogKey) {
      analyticsServiceInstance = new MockAnalyticsService();
    } else {
      const host = process.env.EXPO_PUBLIC_POSTHOG_HOST?.trim() || DEFAULT_POSTHOG_HOST;
      analyticsServiceInstance = new PostHogAnalyticsService(posthogKey, host);
    }
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
  eventBuffer = [];
}

export function getAnalyticsState(): AnalyticsState | null {
  return activeState;
}

export function updateAnalyticsRecord(record: DogRecord | null): void {
  activeRecord = record;
}

function getCommonProperties(capturedAt: Date, state: AnalyticsState): CommonProperties {
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
  };
}

export async function initAnalytics(
  store: KeyValueStore,
  record?: DogRecord | null
): Promise<AnalyticsState> {
  activeStore = store;
  activeRecord = record ?? null;

  try {
    const state = await loadAnalyticsState(store, undefined, undefined, record);
    activeState = state;
    isInitialized = true;

    const enabled = isEnabled(state);
    const service = getAnalytics();

    if (enabled) {
      await service.start(state);

      // Flush buffered events
      const toFlush = [...eventBuffer];
      eventBuffer = [];

      for (const item of toFlush) {
        try {
          const common = getCommonProperties(item.timestamp, state);
          const built = buildEvent(item.name, item.props, common);
          if (built) {
            await service.capture({ ...built, timestamp: item.timestamp });
          }
        } catch {
          // Swallow individual event errors
        }
      }
    } else {
      // Discard pre-init events if analytics is disabled
      eventBuffer = [];
    }

    return state;
  } catch {
    // Graceful fallback to fresh in-memory state
    activeState = {
      installId: 'in-memory-fallback',
      installedAt: new Date().toISOString(),
      choice: null,
      funnelDoneOnce: false,
      funnelOpen: false,
      upgradedInstall: false,
    };
    isInitialized = true;
    eventBuffer = [];
    return activeState;
  }
}

export function track(name: string, props: Record<string, unknown> = {}): void {
  try {
    const timestamp = new Date();

    if (!isInitialized || !activeState) {
      // Buffer in memory with cap 50
      if (eventBuffer.length >= BUFFER_CAP) {
        eventBuffer.shift(); // Drop oldest
      }
      eventBuffer.push({ name, props, timestamp });
      return;
    }

    if (!isEnabled(activeState)) {
      return; // Gated immediately when disabled
    }

    const common = getCommonProperties(timestamp, activeState);
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
      capturePromise.catch(() => {});
    }
  } catch {
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
      };
    } else {
      activeState.choice = enabled ? 'on' : 'off';
    }

    if (activeStore && activeState) {
      await saveAnalyticsState(activeStore, activeState);
    }

    const service = getAnalytics();
    await service.setEnabled(enabled);

    if (enabled && activeState) {
      await service.start(activeState);
    }
  } catch {
    // Swallow every error
  }
}

export function useAnalyticsSetting(): {
  enabled: boolean;
  setEnabled: (next: boolean) => Promise<void>;
} {
  const React = require('react');
  const state = getAnalyticsState();
  const [enabled, setEnabledLocal] = React.useState(() => isEnabled(state ?? { choice: null }));

  React.useEffect(() => {
    const current = getAnalyticsState();
    setEnabledLocal(isEnabled(current ?? { choice: null }));
  }, []);

  const setEnabled = React.useCallback(async (next: boolean) => {
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
    if (changed && activeStore) {
      await saveAnalyticsState(activeStore, activeState);
    }
  } catch {
    // Never throws
  }
}
