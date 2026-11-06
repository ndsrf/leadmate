import { useEffect, useRef } from 'react';
import { trackLoop } from './devPerf';
import { useMotion } from './useMotion';
import { useLive } from './useAppActive';

/**
 * The one gate for an endless animation: the app is in the foreground, the owning screen is not `covered`, motion is
 * not reduced and the visual state `needed` motion. Owners run their loop only while this is true.
 */
export function useMotionGate(needed = true, covered = false): boolean {
  const { reduced } = useMotion();
  const live = useLive(covered);
  return live && needed && !reduced;
}

/**
 * Runs an endless animation only while `open`: `start` when the gate opens, `stop` when it closes (or the owner
 * unmounts). The loop is reported to the dev counters while it runs. Pass stable `start`/`stop` (useCallback).
 */
export function useEndlessLoop(id: string, open: boolean, start: () => void, stop: () => void): void {
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    if (!open) return;
    start();
    const untrack = trackLoop(id);
    const stopThis = stopRef.current; // the stop of the loop this effect started, not a later one
    return () => {
      stopThis();
      untrack();
    };
  }, [id, open, start]);
}
