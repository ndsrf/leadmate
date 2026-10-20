/** Longest a screen transition may take (ms); the new screen accepts input throughout. */
export const MAX_TRANSITION_MS = 350;

export interface TransitionSpec {
  kind: 'fade' | 'slide';
  durationMs: number;
  /** Never true: a transition must not stop the new screen from taking input. */
  blocksInput: false;
}

export interface MotionValues {
  /** Looping and bouncing animations are replaced by a static state. */
  reduced: boolean;
  transition: TransitionSpec;
  /** Spring for a pressed element; null means jump with no spring. */
  pressSpring: { damping: number; stiffness: number } | null;
  /** Whether the next-up marker pulses (otherwise it keeps a static highlight). */
  pulse: boolean;
}

/** One switch for all motion: under reduced motion everything is a fade or static, with the same information. */
export function motionValues(reduced: boolean): MotionValues {
  return {
    reduced,
    transition: { kind: reduced ? 'fade' : 'slide', durationMs: reduced ? 150 : 250, blocksInput: false },
    pressSpring: reduced ? null : { damping: 14, stiffness: 400 },
    pulse: !reduced,
  };
}
