import AsyncStorage from '@react-native-async-storage/async-storage';

export type ContentChannel = 'stable' | 'beta';

export const CONTENT_CHANNEL_STORAGE_KEY = '@leadmate:content_channel';
export const BETA_UNLOCKED_STORAGE_KEY = '@leadmate:beta_unlocked';

export interface ChannelSettingStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/**
 * Returns the default content channel for this build:
 * 'beta' in dev builds (__DEV__ === true), 'stable' in production.
 */
export function defaultContentChannel(isDev?: boolean): ContentChannel {
  const dev =
    isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  return dev ? 'beta' : 'stable';
}

/**
 * Loads the device-only content channel setting.
 * Defaults to 'stable' (or 'beta' in dev) if unset or invalid.
 * Stored strictly on the device in AsyncStorage; never synced or in the Dog record.
 */
export async function loadContentChannel(
  storage: ChannelSettingStorage = AsyncStorage,
  isDev?: boolean
): Promise<ContentChannel> {
  try {
    const raw = await storage.getItem(CONTENT_CHANNEL_STORAGE_KEY);
    if (raw === 'beta' || raw === 'stable') {
      return raw;
    }
  } catch {
    // Fall through to default
  }
  return defaultContentChannel(isDev);
}

/**
 * Persists the device-only content channel setting.
 */
export async function saveContentChannel(
  channel: ContentChannel,
  storage: ChannelSettingStorage = AsyncStorage
): Promise<void> {
  if (channel !== 'beta' && channel !== 'stable') {
    throw new Error(`Invalid channel "${channel}". Must be "beta" or "stable".`);
  }
  await storage.setItem(CONTENT_CHANNEL_STORAGE_KEY, channel);
}

/**
 * Whether the tester unlock is enabled (7-tap gesture).
 * In __DEV__, always returns true.
 * In production, checks the device-only BETA_UNLOCKED_STORAGE_KEY.
 */
export async function isBetaUnlocked(
  storage: ChannelSettingStorage = AsyncStorage,
  isDev?: boolean
): Promise<boolean> {
  const dev =
    isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');
  if (dev) return true;
  try {
    const val = await storage.getItem(BETA_UNLOCKED_STORAGE_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

/**
 * Sets the beta unlocked flag on the device.
 */
export async function setBetaUnlocked(
  unlocked: boolean,
  storage: ChannelSettingStorage = AsyncStorage
): Promise<void> {
  if (unlocked) {
    await storage.setItem(BETA_UNLOCKED_STORAGE_KEY, 'true');
  } else {
    await storage.removeItem(BETA_UNLOCKED_STORAGE_KEY);
  }
}
