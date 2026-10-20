import { useCallback, useEffect, useRef, useState } from 'react';
import { loadDogRecord, saveDogRecord, touch, type DogRecord, type KeyValueStore } from './dogRecord';

/** Loads the Dog record once and saves it after every change. `null` while loading. */
export function useDog(store: KeyValueStore): { record: DogRecord | null; update: (fn: (r: DogRecord) => DogRecord) => void; replace: (record: DogRecord) => void } {
  const [record, setRecord] = useState<DogRecord | null>(null);
  const latest = useRef<DogRecord | null>(null);

  useEffect(() => {
    let alive = true;
    loadDogRecord(store).then((r) => {
      if (!alive) return;
      latest.current = r;
      setRecord(r);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const commit = useCallback(
    (next: DogRecord) => {
      latest.current = next;
      setRecord(next);
      saveDogRecord(store, next).catch(() => {
        // the record stays in memory; the next change tries to save again
      });
    },
    [store],
  );

  const update = useCallback(
    (fn: (r: DogRecord) => DogRecord) => {
      if (latest.current) commit(touch(fn(latest.current), new Date()));
    },
    [commit],
  );

  /** Swaps in a record that sync resolved, keeping its own `updatedAt`. */
  const replace = useCallback((next: DogRecord) => commit(next), [commit]);

  return { record, update, replace };
}
