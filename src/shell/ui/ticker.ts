export interface Ticker {
  start(): void;
  stop(): void;
}

/**
 * A repeating timer whose ticks carry the real seconds since the last tick (capped, so a stall does not make a
 * giant step). Stopping and starting again does not count the stopped time.
 */
export function createTicker(intervalMs: number, onTick: (dtSeconds: number) => void, maxDt = 0.2, now: () => number = Date.now): Ticker {
  let timer: ReturnType<typeof setInterval> | null = null;
  return {
    start() {
      if (timer !== null) return;
      let last = now();
      timer = setInterval(() => {
        const t = now();
        const dt = Math.min(maxDt, (t - last) / 1000);
        last = t;
        onTick(dt);
      }, intervalMs);
    },
    stop() {
      if (timer === null) return;
      clearInterval(timer);
      timer = null;
    },
  };
}
