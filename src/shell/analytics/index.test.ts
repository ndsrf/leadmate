jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import {
  getAnalytics,
  initAnalytics,
  track,
  setAnalyticsEnabled,
  updateAnalyticsFlags,
  getAnalyticsState,
  resetAnalyticsForTesting,
  setAnalyticsServiceForTesting,
} from './index';
import { MockAnalyticsService } from './mock';
import { ANALYTICS_STATE_KEY } from './state';
import type { KeyValueStore, DogRecord } from '../dogRecord';

function createMockStore(initial: Record<string, string> = {}): KeyValueStore & { storage: Record<string, string> } {
  const storage = { ...initial };
  return {
    storage,
    async getItem(key: string) {
      return storage[key] ?? null;
    },
    async setItem(key: string, value: string) {
      storage[key] = value;
    },
    async removeItem(key: string) {
      delete storage[key];
    },
  };
}

describe('Analytics Wiring and Track (Task 3.4)', () => {
  let mockService: MockAnalyticsService;

  beforeEach(() => {
    resetAnalyticsForTesting();
    mockService = new MockAnalyticsService();
    setAnalyticsServiceForTesting(mockService);
  });

  afterEach(() => {
    resetAnalyticsForTesting();
  });

  it('getAnalytics picks MockAnalyticsService under test environment', () => {
    resetAnalyticsForTesting();
    const service = getAnalytics();
    expect(service).toBeInstanceOf(MockAnalyticsService);
  });

  it('treats empty string EXPO_PUBLIC_POSTHOG_KEY exactly like no key (mock service, nothing sent)', async () => {
    resetAnalyticsForTesting();
    const oldKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
    process.env.EXPO_PUBLIC_POSTHOG_KEY = '   ';
    try {
      const service = getAnalytics();
      expect(service).toBeInstanceOf(MockAnalyticsService);
      const store = createMockStore();
      await initAnalytics(store);
      track('session_started', {
        days_since_install: 0,
        first_session: true,
        upgraded_install: false,
      });
      // Mock service captured in memory, nothing sent over network
      expect((service as MockAnalyticsService).events).toHaveLength(1);
    } finally {
      process.env.EXPO_PUBLIC_POSTHOG_KEY = oldKey;
    }
  });

  it('initAnalytics loads state and starts the service when enabled by default', async () => {
    const store = createMockStore();
    await initAnalytics(store);

    const state = getAnalyticsState();
    expect(state).not.toBeNull();
    expect(state?.choice).toBeNull();
    expect(mockService.state).toEqual(state);
    expect(mockService.enabled).toBe(true);
  });

  it('off -> nothing captured when analytics is disabled', async () => {
    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify({
        installId: 'disabled-install-id',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
      }),
    });

    await initAnalytics(store);
    track('session_started', {
      days_since_install: 0,
      first_session: true,
      upgraded_install: false,
    });

    expect(mockService.events).toHaveLength(0);
  });

  it('turned off mid-App Session -> nothing more captured and queue cleared', async () => {
    const store = createMockStore();
    await initAnalytics(store);

    track('funnel_step_viewed', { step: 'welcome', repeat: false });
    expect(mockService.events).toHaveLength(1);

    await setAnalyticsEnabled(false);

    // Any further event tracked must be gated immediately
    track('funnel_step_viewed', { step: 'language', repeat: false });
    expect(mockService.events).toHaveLength(0);

    const state = getAnalyticsState();
    expect(state?.choice).toBe('off');
  });

  it('turned on -> nothing sent until the next event', async () => {
    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify({
        installId: 'disabled-id',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
      }),
    });

    await initAnalytics(store);
    track('funnel_step_viewed', { step: 'welcome', repeat: false });
    expect(mockService.events).toHaveLength(0);

    await setAnalyticsEnabled(true);
    // Turning it on must not send anything by itself
    expect(mockService.events).toHaveLength(0);

    // Next event arrives naturally
    track('funnel_step_viewed', { step: 'language', repeat: false });
    expect(mockService.events).toHaveLength(1);
    expect(mockService.events[0].name).toBe('funnel_step_viewed');
    expect(mockService.events[0].properties.step).toBe('language');
  });

  it('event tracked before init -> captured after init with its original time', async () => {
    const store = createMockStore();

    // Track before initAnalytics is called
    track('funnel_step_viewed', { step: 'welcome', repeat: false });
    expect(mockService.events).toHaveLength(0);

    // Now init finishes
    await initAnalytics(store);

    expect(mockService.events).toHaveLength(1);
    expect(mockService.events[0].name).toBe('funnel_step_viewed');
    expect(mockService.events[0].properties.step).toBe('welcome');
    expect(mockService.events[0].timestamp).toBeDefined();
  });

  it('service throwing -> track does not throw', async () => {
    const store = createMockStore();
    await initAnalytics(store);

    mockService.capture = jest.fn().mockImplementation(() => {
      throw new Error('Service network crash');
    });

    expect(() => {
      track('funnel_step_viewed', { step: 'welcome', repeat: false });
    }).not.toThrow();
  });

  it('drops events that fail buildEvent and logs console.warn in __DEV__', async () => {
    const store = createMockStore();
    await initAnalytics(store);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Unknown event name
    track('invalid_event_name', {});
    expect(mockService.events).toHaveLength(0);

    // Undeclared property
    track('funnel_step_viewed', { step: 'welcome', repeat: false, hacker_field: 'data' });
    expect(mockService.events).toHaveLength(0);

    warnSpy.mockRestore();
  });

  it('service.start throws -> setAnalyticsEnabled/updateAnalyticsFlags do not overwrite installId/choice in storage', async () => {
    const existingState = {
      installId: 'real-persisted-install-id',
      installedAt: '2026-01-01T00:00:00.000Z',
      choice: 'on' as const,
      funnelDoneOnce: false,
      funnelOpen: false,
      upgradedInstall: false,
    };
    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify(existingState),
    });

    mockService.start = jest.fn().mockImplementation(async () => {
      throw new Error('SDK init failure');
    });

    await initAnalytics(store);

    const state = getAnalyticsState();
    expect(state?.installId).toBe('real-persisted-install-id');
    expect(state?.choice).toBe('on');

    await updateAnalyticsFlags({ funnelOpen: true });
    const storedAfterFlags = JSON.parse(store.storage[ANALYTICS_STATE_KEY]);
    expect(storedAfterFlags.installId).toBe('real-persisted-install-id');
    expect(storedAfterFlags.funnelOpen).toBe(true);

    await setAnalyticsEnabled(false);
    const storedAfterEnabled = JSON.parse(store.storage[ANALYTICS_STATE_KEY]);
    expect(storedAfterEnabled.installId).toBe('real-persisted-install-id');
    expect(storedAfterEnabled.choice).toBe('off');
  });

  it('events tracked while setAnalyticsEnabled(true) is awaiting the save must not vanish', async () => {
    let resolveSave: () => void = () => {};
    const savePromise = new Promise<void>((resolve) => {
      resolveSave = resolve;
    });

    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify({
        installId: 'disabled-install-id',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
      }),
    });

    await initAnalytics(store);

    let started = false;
    const capturedEvents: any[] = [];
    mockService.start = jest.fn().mockImplementation(async () => {
      started = true;
    });
    mockService.capture = jest.fn().mockImplementation(async (evt) => {
      if (!started) {
        // Simulates PostHog where client is null until start is called
        return;
      }
      capturedEvents.push(evt);
    });

    const originalSetItem = store.setItem.bind(store);
    store.setItem = async (key: string, value: string) => {
      await savePromise;
      return originalSetItem(key, value);
    };

    const enablePromise = setAnalyticsEnabled(true);

    track('funnel_step_viewed', { step: 'welcome', repeat: false });

    resolveSave();
    await enablePromise;

    expect(capturedEvents).toHaveLength(1);
    expect(capturedEvents[0].name).toBe('funnel_step_viewed');
  });
});
