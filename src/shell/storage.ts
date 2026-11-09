import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './dogRecord';
import { devSeedRecord, withDevSeed } from './devSeed';
import type { Language } from './voice';

/** The Dog record lives in AsyncStorage on a phone and in localStorage in the browser. */
export const dogStore: KeyValueStore = withDevSeed(
  AsyncStorage,
  // development web builds only: `?seed=lessons` skips onboarding (see devSeed.ts)
  (typeof __DEV__ !== 'undefined' && __DEV__) && typeof window !== 'undefined' && window.location ? devSeedRecord(window.location.search, new Date()) : null,
);

export const LANGUAGE_STORAGE_KEY = 'leadmate.language';

export async function loadStoredLanguage(store: { getItem: (k: string) => Promise<string | null> } = AsyncStorage): Promise<Language | null> {
  try {
    const raw = await store.getItem(LANGUAGE_STORAGE_KEY);
    if (raw === 'es' || raw === 'en') return raw;
    return null;
  } catch {
    return null;
  }
}

export async function saveStoredLanguage(lang: Language, store: { setItem: (k: string, v: string) => Promise<void> } = AsyncStorage): Promise<void> {
  try {
    await store.setItem(LANGUAGE_STORAGE_KEY, lang);
  } catch {
    // Ignore storage errors
  }
}
