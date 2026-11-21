/**
 * PostHog Analytics Adapter
 *
 * UNVERIFIED ON DEVICE — task 1.2
 *
 * Verified configuration options and methods from installed `posthog-react-native` (4.87.0)
 * and `@posthog/core` (via node_modules/posthog-react-native/dist/ and node_modules/@posthog/core/dist/):
 *
 * 1. EU host:
 *    Option: `host: 'https://eu.i.posthog.com'` (default fallback if EXPO_PUBLIC_POSTHOG_HOST is unset).
 *    Cited from: `node_modules/@posthog/core/dist/types.d.ts` (line 7), `PostHogCoreOptions.host`.
 *
 * 2. No GeoIP:
 *    Option: `disableGeoip: true`.
 *    Cited from: `node_modules/@posthog/core/dist/types.d.ts` (line 178), `PostHogCoreOptions.disableGeoip`.
 *
 * 3. No person profiles:
 *    Option: `personProfiles: 'never'`.
 *    Cited from: `node_modules/@posthog/core/dist/types.d.ts` (line 238), `PostHogCoreOptions.personProfiles`.
 *
 * 4. No lifecycle/autocapture:
 *    Option: `captureAppLifecycleEvents: false`
 *    Cited from: `node_modules/posthog-react-native/dist/posthog-rn.d.ts` (line 35), `PostHogOptions.captureAppLifecycleEvents`.
 *    Option: `capturePushNotificationOpened: false`
 *    Cited from: `node_modules/posthog-react-native/dist/posthog-rn.d.ts` (line 176), `PostHogOptions.capturePushNotificationOpened`.
 *    Option: `enableSessionReplay: false`
 *    Cited from: `node_modules/posthog-react-native/dist/posthog-rn.d.ts` (line 47), `PostHogOptions.enableSessionReplay`.
 *    Touch autocapture comes from PostHogProvider (AnalyticsProvider.tsx) with screens off and only `testID`/`ph-label` captured.
 *    Session replay (`enableSessionReplay`) is on only for dev_build, preview and closed_test runtimes, all text, inputs and images masked.
 *
 * 5. Distinct-ID bootstrap:
 *    Option: `bootstrap: { distinctId: installId, isIdentifiedId: false }`.
 *    Cited from: `node_modules/@posthog/core/dist/types.d.ts` (lines 118-123), `PostHogCoreOptions.bootstrap`.
 *    The SDK is bootstrapped with our random installId and never identified (never call identify(), alias(), group()).
 *
 * 6. Opt-out:
 *    Method: `posthog.optOut()`.
 *    Cited from: `node_modules/posthog-react-native/dist/posthog-rn.d.ts` (line 610), `PostHog.optOut()`.
 *
 * 7. Queue clearing:
 *    Method: Calling `posthog.optOut()` gates further sends; queue clearance is achieved via
 *    `posthog.reset()` and clearing `PostHogPersistedProperty.Queue`.
 *    Cited from: `node_modules/@posthog/core/dist/types.d.ts` (line 272), `PostHogPersistedProperty.Queue`
 *    and `node_modules/@posthog/core/src/posthog-core-stateless.ts` (lines 1300, 1340).
 *
 * 8. Offline queue persistence:
 *    PostHog React Native defaults to `persistence: 'file'`, which leverages AsyncStorage
 *    (via optional/OptionalAsyncStorage.ts) to persist queued events across restarts,
 *    retrying with exponential backoff and dropping the oldest when maxQueueSize (1000) is exceeded.
 */

import { PostHog, PostHogPersistedProperty, type PostHogOptions } from 'posthog-react-native';
import type { AnalyticsService, AnalyticsEvent } from './types';
import type { AnalyticsState } from './state';

export const DEFAULT_POSTHOG_HOST = 'https://eu.i.posthog.com';

/** Session replay records only in dev builds, internal previews and the invited closed-test build, never in store builds, Expo Go or on web. */
export function replayAllowed(runtime: string | undefined): boolean {
  return runtime === 'dev_build' || runtime === 'preview' || runtime === 'closed_test';
}

/** The SDK options: privacy settings, offline queue, the install id as the distinct id and, for internal builds only, masked replay. */
export function buildPostHogOptions(host: string, installId: string, runtime?: string): PostHogOptions {
  const replay = replayAllowed(runtime);
  return {
    host,
    disableGeoip: true,
    personProfiles: 'never',
    captureAppLifecycleEvents: false,
    capturePushNotificationOpened: false,
    enableSessionReplay: replay,
    ...(replay
      ? {
          sessionReplayConfig: {
            maskAllTextInputs: true,
            maskAllImages: true,
            maskAllSandboxedViews: true,
            captureLog: false,
          },
        }
      : {}),
    maxQueueSize: 1000,
    flushAt: 20,
    flushInterval: 30000,
    bootstrap: {
      distinctId: installId,
      isIdentifiedId: false,
    },
  };
}

export class PostHogAnalyticsService implements AnalyticsService {
  private client: PostHog | null = null;
  private readonly clientListeners = new Set<(client: PostHog) => void>();

  constructor(
    private readonly apiKey: string,
    private readonly host: string = DEFAULT_POSTHOG_HOST,
    private readonly runtime?: string
  ) {}

  /** The SDK client once started (the touch autocapture Provider is handed this one). */
  public getClient(): PostHog | null {
    return this.client;
  }

  public onClient(listener: (client: PostHog) => void): () => void {
    this.clientListeners.add(listener);
    return () => {
      this.clientListeners.delete(listener);
    };
  }

  public async start(state: AnalyticsState): Promise<void> {
    if (this.client) {
      return;
    }

    this.client = new PostHog(this.apiKey, buildPostHogOptions(this.host, state.installId, this.runtime));

    for (const listener of this.clientListeners) {
      try {
        listener(this.client);
      } catch {
        // a listener never stops analytics
      }
    }

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // SDK logs every capture and flush request to the console in dev builds
      this.client.debug(true);
    }

    if (state.choice === 'off') {
      await this.client.optOut();
      try {
        (this.client as any).setPersistedProperty?.(PostHogPersistedProperty.Queue, []);
      } catch {
        // Best effort queue clearing
      }
    }
  }

  public async capture(event: AnalyticsEvent): Promise<void> {
    if (!this.client) {
      return;
    }

    const timestamp = event.timestamp
      ? event.timestamp instanceof Date
        ? event.timestamp
        : new Date(event.timestamp)
      : undefined;

    this.client.capture(
      event.name,
      event.properties,
      timestamp ? { timestamp } : undefined
    );
  }

  public async setEnabled(on: boolean): Promise<void> {
    if (!this.client) {
      return;
    }

    if (on) {
      await this.client.optIn();
    } else {
      await this.client.optOut();
      try {
        (this.client as any).setPersistedProperty?.(PostHogPersistedProperty.Queue, []);
      } catch {
        // Best effort queue clearing
      }
    }
  }

  public async register(properties: Record<string, string | number | boolean>): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.register(properties);
  }

  public async flush(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.flush();
  }
}
