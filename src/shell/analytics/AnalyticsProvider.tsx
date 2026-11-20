import { useEffect, useState, type ReactNode } from 'react';
import { PostHog, PostHogProvider, type PostHogAutocaptureOptions } from 'posthog-react-native';
import { getAnalytics } from './index';
import { PostHogAnalyticsService } from './posthog';

/**
 * Touch autocapture only: no screens (we send `screen_viewed` ourselves). Lifecycle events are off on the client itself
 * (`captureAppLifecycleEvents: false`); this SDK version has no such option here.
 * `children` and `accessibilityLabel` are left out of `propsToCapture` so no screen text, where the Dog's name
 * appears, reaches a tap event; the element label falls back to the component name. `testID` and `ph-label`
 * must be fixed strings in code (a test enforces it).
 */
export const AUTOCAPTURE_OPTIONS: PostHogAutocaptureOptions = {
  captureTouches: true,
  captureScreens: false,
  propsToCapture: ['testID', 'ph-label'],
};

let placeholder: PostHog | null = null;

/** A client that never sends anything, held by the Provider until the real one starts, so the tree keeps its shape. */
function placeholderClient(): PostHog {
  if (!placeholder) {
    placeholder = new PostHog('phc_placeholder_never_sends', {
      disabled: true,
      persistence: 'memory',
      captureAppLifecycleEvents: false,
      enableSessionReplay: false,
    });
  }
  return placeholder;
}

function useStartedClient(service: unknown): PostHog | null {
  const posthogService = service instanceof PostHogAnalyticsService ? service : null;
  const [client, setClient] = useState<PostHog | null>(() => posthogService?.getClient() ?? null);
  useEffect(() => {
    if (!posthogService) return undefined;
    setClient(posthogService.getClient());
    return posthogService.onClient(setClient);
  }, [posthogService]);
  return client;
}

/**
 * Mounts touch autocapture around the app with our own SDK client. With no PostHog service (tests, a bundle without a key)
 * nothing is mounted. An opted-out client drops autocapture events like any other, so analytics off records no taps.
 */
export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const service = getAnalytics();
  const client = useStartedClient(service);
  if (!(service instanceof PostHogAnalyticsService)) return <>{children}</>;
  return (
    <PostHogProvider client={client ?? placeholderClient()} autocapture={AUTOCAPTURE_OPTIONS}>
      {children}
    </PostHogProvider>
  );
}
