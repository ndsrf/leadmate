import { useEffect, useRef } from 'react';
import { createTicker } from './ticker';
import { useAppActive } from './useAppActive';

/** Calls `onTick(dtSeconds)` every `intervalMs` while `running` and the app is in the foreground. */
export function useTicker(running: boolean, intervalMs: number, onTick: (dtSeconds: number) => void): void {
  const active = useAppActive();
  const tick = useRef(onTick);
  tick.current = onTick;
  useEffect(() => {
    if (!running || !active) return;
    const ticker = createTicker(intervalMs, (dt) => tick.current(dt));
    ticker.start();
    return () => ticker.stop();
  }, [running, active, intervalMs]);
}
