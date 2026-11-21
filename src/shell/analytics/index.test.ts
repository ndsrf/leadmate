jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

import React, { useEffect } from 'react';
import { create, act } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

import {
  getAnalytics,
  initAnalytics,
  track,
  setAnalyticsEnabled,
  updateAnalyticsFlags,
  useAnalyticsSetting,
  getAnalyticsState,
  resetAnalyticsForTesting,
  setAnalyticsServiceForTesting,
  setAnalyticsScreen,
  setAnalyticsForeground,
  setAnalyticsSignedIn,
  startAnalyticsSession,
  trackAppBackgrounded,
  updateAnalyticsRecord,
} from './index';
import { newDogRecord } from '../dogRecord';
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

  it('useAnalyticsSetting re-reads state after initAnalytics resolves when mounted before init', async () => {
    function TestConsumer({ onChange }: { onChange: (val: boolean) => void }) {
      const { enabled } = useAnalyticsSetting();
      useEffect(() => {
        onChange(enabled);
      }, [enabled, onChange]);
      return null;
    }

    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify({
        installId: 'stored-id',
        installedAt: '2026-01-01T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
      }),
    });

    let currentEnabled: boolean | null = null;
    await act(async () => {
      create(
        React.createElement(TestConsumer, {
          onChange: (val: boolean) => {
            currentEnabled = val;
          },
        })
      );
    });

    // Before initAnalytics resolves, choice is null -> defaults to true
    expect(currentEnabled).toBe(true);

    // Now initAnalytics resolves with stored choice: 'off'
    await act(async () => {
      await initAnalytics(store);
    });

    // Hook must re-read state after initAnalytics resolves
    expect(currentEnabled).toBe(false);
  });
});

describe('Screens, context and sessions (Task 11.4)', () => {
  let mockService: MockAnalyticsService;

  beforeEach(() => {
    resetAnalyticsForTesting();
    mockService = new MockAnalyticsService();
    setAnalyticsServiceForTesting(mockService);
  });

  afterEach(() => {
    resetAnalyticsForTesting();
  });

  it('adds the context to every event', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    setAnalyticsScreen('map');
    track('lesson_opened', { lesson_id: 'l1', source: 'trail' });
    expect(mockService.events[0].properties).toMatchObject({
      screen: 'map',
      stops_done: 0,
      furthest_stop_index: -1,
      funnel_done: false,
      has_account: false,
      plus_status: 'free',
      session_number: 1,
      platform: 'ios',
      runtime: 'store',
    });
    expect(typeof mockService.events[0].properties.seconds_in_session).toBe('number');
  });

  it('keeps the screen an event was made on when it is sent late', async () => {
    setAnalyticsScreen('welcome');
    track('funnel_step_viewed', { step: 'welcome', repeat: false });
    setAnalyticsScreen('language');
    await initAnalytics(createMockStore(), newDogRecord());
    expect(mockService.events[0].properties.screen).toBe('welcome');
  });

  it('registers the context except seconds_in_session as super properties, again on a change', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    setAnalyticsScreen('map');
    expect(mockService.registered).toMatchObject({ screen: 'map', stops_done: 0, plus_status: 'free', platform: 'ios' });
    expect(mockService.registered).not.toHaveProperty('seconds_in_session');
    setAnalyticsScreen('shop');
    expect(mockService.registered.screen).toBe('shop');
    setAnalyticsSignedIn(true);
    expect(mockService.registered.has_account).toBe(true);
  });

  it('registers nothing while analytics is off', async () => {
    const store = createMockStore({
      [ANALYTICS_STATE_KEY]: JSON.stringify({ installId: 'i', installedAt: '2026-11-18T00:00:00.000Z', choice: 'off', funnelDoneOnce: false, funnelOpen: false, upgradedInstall: false }),
    });
    await initAnalytics(store, newDogRecord());
    setAnalyticsScreen('map');
    updateAnalyticsRecord(newDogRecord());
    expect(mockService.registered).toEqual({});
  });

  it('registers again after analytics is turned back on', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    setAnalyticsScreen('map');
    await setAnalyticsEnabled(false);
    await setAnalyticsEnabled(true);
    expect(mockService.registered.screen).toBe('map');
  });

  it('raises session_number with each App Session and saves it', async () => {
    const store = createMockStore();
    await initAnalytics(store, newDogRecord());
    expect(getAnalyticsState()?.sessionCount).toBe(1);
    startAnalyticsSession();
    track('lesson_opened', { lesson_id: 'l1', source: 'trail' });
    expect(mockService.events[0].properties.session_number).toBe(2);
    expect(JSON.parse(store.storage[ANALYTICS_STATE_KEY]).sessionCount).toBe(2);
  });

  it('counts foreground seconds only', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    startAnalyticsSession(1_000_000);
    setAnalyticsForeground(false, 1_010_000);
    setAnalyticsForeground(true, 2_810_000);
    const spy = jest.spyOn(Date, 'now').mockReturnValue(2_830_000);
    try {
      trackAppBackgrounded(2_830_000);
    } finally {
      spy.mockRestore();
    }
    expect(mockService.events[mockService.events.length - 1]?.name).toBe('app_backgrounded');
    expect(mockService.events[mockService.events.length - 1]?.properties.seconds_in_session).toBe(30);
  });

  it('sends app_backgrounded with the current screen and flushes', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    setAnalyticsScreen('lesson');
    trackAppBackgrounded();
    const event = mockService.events[mockService.events.length - 1];
    expect(event?.name).toBe('app_backgrounded');
    expect(event?.properties.screen).toBe('lesson');
    expect(mockService.flushed).toBe(true);
  });

  it('sends nothing on background while analytics is off', async () => {
    await initAnalytics(createMockStore(), newDogRecord());
    await setAnalyticsEnabled(false);
    trackAppBackgrounded();
    expect(mockService.events).toEqual([]);
    expect(mockService.flushed).toBe(false);
  });
});
