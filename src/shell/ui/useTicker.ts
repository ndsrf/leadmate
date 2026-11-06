import { useEffect, useRef } from 'react';
import { trackTimer } from './devPerf';
import { createTicker } from './ticker';
import { useAppActive } from './useAppActive';

/** Calls `onTick(dtSeconds)` every `intervalMs` while `running` and the app is in the foreground. `id` names the timer in the dev counters. */
export function useTicker(running: boolean, intervalMs: number, onTick: (dtSeconds: number) => void, id = 'ticker'): void {
  const active = useAppActive();
  const tick = useRef(onTick);
  tick.current = onTick;
  useEffect(() => {
    if (!running || !active) return;
    const ticker = createTicker(intervalMs, (dt) => tick.current(dt));
    ticker.start();
    const untrack = trackTimer(id);
    return () => {
      ticker.stop();
      untrack();
    };
  }, [running, active, intervalMs, id]);
}
