import AsyncStorage from '@react-native-async-storage/async-storage';
import { AD_INTERSTITIAL_COOLDOWN_MS, AD_LAST_INTERSTITIAL_STORAGE_KEY } from './types';

/**
 * Retrieves the timestamp (milliseconds since epoch) of the most recent
 * Transition Interstitial impression from device storage.
 */
export async function getLastInterstitialTimestamp(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(AD_LAST_INTERSTITIAL_STORAGE_KEY);
    if (!raw) return null;
    const ms = Date.parse(raw);
    return Number.isNaN(ms) ? null : ms;
  } catch {
    return null;
  }
}

/**
 * Persists the current timestamp into device storage, resetting the cooldown window.
 */
export async function recordInterstitialImpression(now: Date = new Date()): Promise<void> {
  try {
    await AsyncStorage.setItem(AD_LAST_INTERSTITIAL_STORAGE_KEY, now.toISOString());
  } catch {
    // Graceful no-op on storage errors
  }
}

/**
 * Returns true if less than the cooldown duration (default 5 minutes) has elapsed
 * since the last interstitial impression.
 */
export async function isInterstitialCooldownActive(
  now: Date = new Date(),
  cooldownMs: number = AD_INTERSTITIAL_COOLDOWN_MS
): Promise<boolean> {
  const lastMs = await getLastInterstitialTimestamp();
  if (lastMs === null) return false;
  return now.getTime() - lastMs < cooldownMs;
}

/**
 * Clears the stored impression timestamp (e.g., during tests or user reset).
 */
export async function clearInterstitialTimestamp(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AD_LAST_INTERSTITIAL_STORAGE_KEY);
  } catch {
    // Graceful no-op
  }
}
