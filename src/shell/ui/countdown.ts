/**
 * A countdown fed by a ticker's `dt`s. It reports the whole seconds left only when they change (so a screen
 * re-renders once a second, not on every tick) and fires `onTimeout` once, from the ticks alone.
 */
export function createCountdown(limitSeconds: number, onSecond: (secondsLeft: number) => void, onTimeout: () => void): { tick(dt: number): void; readonly timedOut: boolean } {
  let elapsed = 0;
  let shown = Math.ceil(limitSeconds);
  let timedOut = false;
  return {
    tick(dt) {
      if (timedOut) return;
      elapsed += dt;
      const remaining = limitSeconds - elapsed;
      if (remaining <= 0) {
        timedOut = true;
        onTimeout();
        return;
      }
      const whole = Math.ceil(remaining);
      if (whole !== shown) {
        shown = whole;
        onSecond(whole);
      }
    },
    get timedOut() {
      return timedOut;
    },
  };
}
