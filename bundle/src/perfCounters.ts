/** Counters for DOM views inside the Stage bundle, read by the `?perf=1` readout and `scripts/power.mjs`. */
export const domPerf = { renders: 0 };

/** Number of CSS/SVG animations currently running in the document (paused or finished ones are not counted). */
export function runningAnimations(): number {
  if (typeof document === 'undefined' || typeof document.getAnimations !== 'function') return 0;
  return document.getAnimations().filter((a) => a.playState === 'running').length;
}
