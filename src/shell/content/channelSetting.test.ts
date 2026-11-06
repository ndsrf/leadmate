import {
  BETA_UNLOCKED_STORAGE_KEY,
  CONTENT_CHANNEL_STORAGE_KEY,
  defaultContentChannel,
  isBetaUnlocked,
  loadContentChannel,
  saveContentChannel,
  setBetaUnlocked,
} from './channelSetting';
import { newDogRecord } from '../dogRecord';

class MemoryStorage {
  store = new Map<string, string>();
  async getItem(key: string): Promise<string | null> {
    return this.store.get(key) ?? null;
  }
  async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }
  async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

describe('Content channel setting (Task 5.1)', () => {
  let storage: MemoryStorage;

  beforeEach(() => {
    storage = new MemoryStorage();
  });

  describe('defaultContentChannel', () => {
    it('defaults to stable in production and beta in development builds', () => {
      expect(defaultContentChannel(false)).toBe('stable');
      expect(defaultContentChannel(true)).toBe('beta');
    });
  });

  describe('loadContentChannel and saveContentChannel', () => {
    it('returns default when unset in storage', async () => {
      expect(await loadContentChannel(storage, false)).toBe('stable');
      expect(await loadContentChannel(storage, true)).toBe('beta');
    });

    it('persists and loads channel choice', async () => {
      await saveContentChannel('beta', storage);
      expect(await storage.getItem(CONTENT_CHANNEL_STORAGE_KEY)).toBe('beta');
      expect(await loadContentChannel(storage, false)).toBe('beta');

      await saveContentChannel('stable', storage);
      expect(await storage.getItem(CONTENT_CHANNEL_STORAGE_KEY)).toBe('stable');
      expect(await loadContentChannel(storage, true)).toBe('stable');
    });

    it('rejects invalid channel', async () => {
      await expect(saveContentChannel('invalid' as any, storage)).rejects.toThrow(/Invalid channel/);
    });
  });

  describe('device-only: not in Dog record or sync', () => {
    it('contentChannel does not exist on the Dog record', () => {
      const dog = newDogRecord();
      expect((dog as any).contentChannel).toBeUndefined();
      expect((dog as any).channel).toBeUndefined();
    });
  });

  describe('isBetaUnlocked and setBetaUnlocked', () => {
    it('always returns true in development builds', async () => {
      expect(await isBetaUnlocked(storage, true)).toBe(true);
    });

    it('defaults to false in production until unlocked, and can be locked again', async () => {
      expect(await isBetaUnlocked(storage, false)).toBe(false);

      await setBetaUnlocked(true, storage);
      expect(await storage.getItem(BETA_UNLOCKED_STORAGE_KEY)).toBe('true');
      expect(await isBetaUnlocked(storage, false)).toBe(true);

      // Hide / lock again
      await setBetaUnlocked(false, storage);
      expect(await storage.getItem(BETA_UNLOCKED_STORAGE_KEY)).toBeNull();
      expect(await isBetaUnlocked(storage, false)).toBe(false);
    });
  });
});
