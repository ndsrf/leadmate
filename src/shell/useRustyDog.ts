import { useCallback, useState } from 'react';
import type { DogRecord } from './dogRecord';
import { isRusty, sessionCapacity, type WarmupOutcome } from './rusty';

type LastStage = Pick<DogRecord, 'lastStageDate'>;

export interface RustyDog {
  /** The Dog was Rusty when this App Session started. */
  rusty: boolean;
  warmup: WarmupOutcome;
  setWarmup: (next: WarmupOutcome | ((before: WarmupOutcome) => WarmupOutcome)) => void;
  /** The Dog's capacity for the next Stage. */
  capacity: number;
  /** Decides again from `record` and forgets the warm-up; with no record yet, it decides when one loads. */
  startSession: (record: LastStage | null) => void;
}

/**
 * Whether the Dog is Rusty and what became of its warm-up, for one App Session. The decision is made from
 * the first loaded record and again on `startSession`; in between, neither the clock nor the record changes
 * it. Nothing here is stored.
 */
export function useRustyDog(record: LastStage | null): RustyDog {
  // null until a record has been loaded
  const [decision, setDecision] = useState<boolean | null>(null);
  const [warmup, setWarmup] = useState<WarmupOutcome>('none');
  if (record && decision === null) setDecision(isRusty(record.lastStageDate, new Date()));

  const startSession = useCallback((next: LastStage | null) => {
    setDecision(next ? isRusty(next.lastStageDate, new Date()) : null);
    setWarmup('none');
  }, []);

  const rusty = decision === true;
  return { rusty, warmup, setWarmup, capacity: sessionCapacity(rusty, warmup), startSession };
}
