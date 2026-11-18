import {
  ANALYTICS_STATE_KEY,
  DEFAULT_ENABLED,
  isEnabled,
  readAnalyticsState,
  loadAnalyticsState,
  saveAnalyticsState,
  AnalyticsState,
  generateUuidV4,
} from './state';
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

describe('Analytics State (Task 3.1)', () => {
  describe('DEFAULT_ENABLED and isEnabled', () => {
    it('defaults to true when choice is null', () => {
      expect(DEFAULT_ENABLED).toBe(true);
      expect(isEnabled({ choice: null })).toBe(true);
    });

    it('returns true when choice is on', () => {
      expect(isEnabled({ choice: 'on' })).toBe(true);
    });

    it('returns false when choice is off', () => {
      expect(isEnabled({ choice: 'off' })).toBe(false);
    });

    it('with default mocked/set to false, null choice is off and on choice stays on', () => {
      expect(isEnabled({ choice: null }, false)).toBe(false);
      expect(isEnabled({ choice: 'on' }, false)).toBe(true);
      expect(isEnabled({ choice: 'off' }, false)).toBe(false);
    });
  });

  describe('generateUuidV4', () => {
    it('produces a valid UUID v4 format', () => {
      const id = generateUuidV4();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('readAnalyticsState', () => {
    it('parses valid analytics state', () => {
      const valid: AnalyticsState = {
        installId: '123e4567-e89b-12d3-a456-426614174000',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'on',
        funnelDoneOnce: true,
        funnelOpen: false,
        upgradedInstall: false,
      };
      expect(readAnalyticsState(valid)).toEqual(valid);
      expect(readAnalyticsState(JSON.stringify(valid))).toEqual(valid);
    });

    it('returns null on corrupt or invalid data', () => {
      expect(readAnalyticsState(null)).toBeNull();
      expect(readAnalyticsState(undefined)).toBeNull();
      expect(readAnalyticsState('not json')).toBeNull();
      expect(readAnalyticsState({})).toBeNull();
      expect(readAnalyticsState({ installId: '' })).toBeNull();
    });
  });

  describe('loadAnalyticsState', () => {
    it('creates fresh state when storage is empty', async () => {
      const store = createMockStore();
      const fixedNow = new Date('2026-11-18T01:00:00.000Z');
      const fixedId = 'custom-uuid-1';

      const state = await loadAnalyticsState(store, () => fixedId, fixedNow);

      expect(state.installId).toBe(fixedId);
      expect(state.installedAt).toBe(fixedNow.toISOString());
      expect(state.choice).toBeNull();
      expect(state.funnelDoneOnce).toBe(false);
      expect(state.funnelOpen).toBe(false);
      expect(state.upgradedInstall).toBe(false);

      // Verify it was persisted to storage
      expect(store.storage[ANALYTICS_STATE_KEY]).toBeDefined();
      const stored = JSON.parse(store.storage[ANALYTICS_STATE_KEY]);
      expect(stored.installId).toBe(fixedId);
    });

    it('marks upgradedInstall true when created for a record past welcome', async () => {
      const store = createMockStore();
      const recordPastWelcome = {
        onboarding: { step: 'dog' },
      } as unknown as DogRecord;

      const state = await loadAnalyticsState(store, () => 'upgraded-id', new Date(), recordPastWelcome);
      expect(state.upgradedInstall).toBe(true);
    });

    it('marks upgradedInstall false when record is at welcome', async () => {
      const store = createMockStore();
      const recordWelcome = {
        onboarding: { step: 'welcome' },
      } as unknown as DogRecord;

      const state = await loadAnalyticsState(store, () => 'new-id', new Date(), recordWelcome);
      expect(state.upgradedInstall).toBe(false);
    });

    it('loads existing state without mutating installId or upgradedInstall', async () => {
      const existing: AnalyticsState = {
        installId: 'existing-id',
        installedAt: '2026-01-01T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: true,
        funnelOpen: false,
        upgradedInstall: false,
      };
      const store = createMockStore({
        [ANALYTICS_STATE_KEY]: JSON.stringify(existing),
      });

      const state = await loadAnalyticsState(store, () => 'should-not-use', new Date());
      expect(state.installId).toBe('existing-id');
      expect(state.choice).toBe('off');
      expect(state.funnelDoneOnce).toBe(true);
    });

    it('recovers with fresh state on corrupt JSON in storage', async () => {
      const store = createMockStore({
        [ANALYTICS_STATE_KEY]: '{ corrupt json ...',
      });

      const state = await loadAnalyticsState(store, () => 'fresh-id', new Date());
      expect(state.installId).toBe('fresh-id');
    });

    it('recovers gracefully and never throws on storage errors', async () => {
      const throwingStore: KeyValueStore = {
        async getItem() {
          throw new Error('disk read failure');
        },
        async setItem() {
          throw new Error('disk write failure');
        },
        async removeItem() {},
      };

      await expect(loadAnalyticsState(throwingStore, () => 'fallback-id', new Date())).resolves.not.toThrow();
      const state = await loadAnalyticsState(throwingStore, () => 'fallback-id', new Date());
      expect(state.installId).toBe('fallback-id');
    });

    it('does not overwrite storage when getItem throws once, and subsequent load still reads choice off', async () => {
      const existing: AnalyticsState = {
        installId: 'existing-id',
        installedAt: '2026-01-01T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: true,
        funnelOpen: false,
        upgradedInstall: false,
      };
      let shouldThrow = true;
      const store = createMockStore({
        [ANALYTICS_STATE_KEY]: JSON.stringify(existing),
      });
      const originalGetItem = store.getItem.bind(store);
      store.getItem = async (key: string) => {
        if (shouldThrow) {
          throw new Error('transient read failure');
        }
        return originalGetItem(key);
      };

      const setItemSpy = jest.spyOn(store, 'setItem');

      // First load: getItem throws
      const fallbackState = await loadAnalyticsState(store, () => 'fallback-id', new Date());
      expect(fallbackState.installId).toBe('fallback-id');
      expect(setItemSpy).not.toHaveBeenCalled();

      // Second load: getItem succeeds
      shouldThrow = false;
      const secondState = await loadAnalyticsState(store, () => 'another-id', new Date());
      expect(secondState.installId).toBe('existing-id');
      expect(secondState.choice).toBe('off');
    });
  });

  describe('saveAnalyticsState', () => {
    it('persists state to storage', async () => {
      const store = createMockStore();
      const state: AnalyticsState = {
        installId: 'id-1',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'on',
        funnelDoneOnce: false,
        funnelOpen: true,
        upgradedInstall: false,
      };

      await saveAnalyticsState(store, state);
      expect(store.storage[ANALYTICS_STATE_KEY]).toBe(JSON.stringify(state));
    });

    it('swallows storage errors and never throws', async () => {
      const throwingStore: KeyValueStore = {
        async getItem() {
          return null;
        },
        async setItem() {
          throw new Error('disk write error');
        },
        async removeItem() {},
      };

      const state: AnalyticsState = {
        installId: 'id-1',
        installedAt: '2026-11-18T00:00:00.000Z',
        choice: 'off',
        funnelDoneOnce: false,
        funnelOpen: false,
        upgradedInstall: false,
      };

      await expect(saveAnalyticsState(throwingStore, state)).resolves.not.toThrow();
    });
  });
});
