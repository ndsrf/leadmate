import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStore } from './dogRecord';

/** The Dog record lives in AsyncStorage on a phone and in localStorage in the browser. */
export const dogStore: KeyValueStore = AsyncStorage;
