import { newDogRecord, RECORD_KEY, type DogRecord, type KeyValueStore } from './dogRecord';

/**
 * A development shortcut for the web build: `?seed=lessons` opens a Dog that has finished onboarding with its
 * first Stage on Day 1, and `&day=N` moves today to Day N (default 3). Null for any other address.
 */
export function devSeedRecord(search: string, now: Date): DogRecord | null {
  const params = new URLSearchParams(search);
  if (params.get('seed') !== 'lessons') return null;
  const day = Math.max(1, Math.min(60, Math.floor(Number(params.get('day'))) || 3));
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1), 12);
  const base = newDogRecord();
  return { ...base, name: 'Migas', onboarding: { ...base.onboarding, step: 'done', firstStageCompletedAt: first.toISOString() }, updatedAt: now.toISOString() };
}

/** The store that answers the first read of the Dog record with the seed; everything after reads and writes normally. */
export function withDevSeed(store: KeyValueStore, seed: DogRecord | null): KeyValueStore {
  if (!seed) return store;
  let pending = true;
  return {
    getItem: async (key) => {
      if (pending && key === RECORD_KEY) {
        pending = false;
        return JSON.stringify(seed);
      }
      return store.getItem(key);
    },
    setItem: (key, value) => store.setItem(key, value),
    removeItem: store.removeItem?.bind(store),
  };
}
