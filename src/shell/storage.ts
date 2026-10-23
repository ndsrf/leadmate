import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './dogRecord';
import { devSeedRecord, withDevSeed } from './devSeed';

/** The Dog record lives in AsyncStorage on a phone and in localStorage in the browser. */
export const dogStore: KeyValueStore = withDevSeed(
  AsyncStorage,
  // development web builds only: `?seed=lessons` skips onboarding (see devSeed.ts)
  __DEV__ && typeof window !== 'undefined' && window.location ? devSeedRecord(window.location.search, new Date()) : null,
);
