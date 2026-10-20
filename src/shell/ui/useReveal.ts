import { useCallback, useEffect, useRef, useState } from 'react';
import { startReveal, stepReveal, type RevealState, type RevealTarget } from '../reveal';
import { feedback } from './feedback';
import { useMotion } from './useMotion';
import { useTicker } from './useTicker';

const FRAME_MS = 33;

/**
 * Drives the result reveal on a timer. Each star plays its sound and haptic as it appears; `skip`
 * (any press) jumps to the end; under reduced motion it starts at `done`. The target is read once,
 * when the result opens.
 */
export function useReveal(target: RevealTarget): { state: RevealState; skip: () => void } {
  const { reduced } = useMotion();
  const [state, setState] = useState(() => startReveal(target, false));
  const live = useRef(state);

  // the OS preference arrives a moment after mount; an unfinished reveal then jumps to the end
  useEffect(() => {
    if (reduced && live.current.phase !== 'done') {
      live.current = stepReveal(live.current, { type: 'skip' }).state;
      setState(live.current);
    }
  }, [reduced]);

  // ticks only while the reveal is unfinished and the app is in the foreground
  useTicker(state.phase !== 'done', FRAME_MS, (dt) => {
    const out = stepReveal(live.current, { type: 'tick', dtMs: dt * 1000 });
    live.current = out.state;
    for (const e of out.events) feedback.star(e.n);
    setState(out.state);
  });

  const skip = useCallback(() => {
    live.current = stepReveal(live.current, { type: 'skip' }).state;
    setState(live.current);
  }, []);

  return { state, skip };
}
