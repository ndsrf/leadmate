import type { DogPose } from './pose';

/** Every Dog portrait layer of readable-dog design Decision 5. */
export const PORTRAIT_LAYER_NAMES = [
  'portrait_body',
  'portrait_head_level',
  'portrait_head_up',
  'portrait_head_down',
  'portrait_head_left',
  'portrait_head_right',
  'portrait_head_viewer',
  'portrait_ears_forward',
  'portrait_ears_neutral',
  'portrait_ears_back',
  'portrait_eyes_handler',
  'portrait_eyes_left',
  'portrait_eyes_right',
  'portrait_eyes_down',
  'portrait_tail_high',
  'portrait_tail_wag_a',
  'portrait_tail_wag_b',
  'portrait_tail_neutral',
  'portrait_tail_tucked',
] as const;

export type PortraitLayerName = (typeof PORTRAIT_LAYER_NAMES)[number];

export interface PortraitLayers {
  tail: string;
  body: string;
  head: string;
  ears: string;
  eyes: string;
  /** Stacking order: tail, body, head, ears, eyes (design Decision 5). */
  ordered: readonly [string, string, string, string, string];
}

export interface PortraitOptions {
  reducedMotion?: boolean;
}

/**
 * Pure mapping from derived Canine Posture to Dog portrait layer frames.
 *
 * Layers stack at one shared origin and pivot (0.5, 0.6172) in order:
 * tail, body, head, ears, eyes. Wag step alternates two wag frames at ~4 Hz
 * only while the tail is wagging (Decision 6).
 */
export function portraitLayers(
  pose: Pick<DogPose, 'gaze' | 'head' | 'ears' | 'tail'>,
  wagStep = 0,
  options?: PortraitOptions,
): PortraitLayers {
  const body = 'portrait_body';

  // Ears: forward, neutral, back
  let ears = 'portrait_ears_neutral';
  if (pose.ears === 'forward') ears = 'portrait_ears_forward';
  else if (pose.ears === 'back') ears = 'portrait_ears_back';

  // Tail: high, wag A/B, neutral, tucked
  let tail = 'portrait_tail_neutral';
  if (pose.tail === 'high') {
    tail = 'portrait_tail_high';
  } else if (pose.tail === 'tucked') {
    tail = 'portrait_tail_tucked';
  } else if (pose.tail === 'wagging') {
    if (options?.reducedMotion) {
      tail = 'portrait_tail_high';
    } else {
      tail = Math.floor(Math.abs(wagStep)) % 2 === 0 ? 'portrait_tail_wag_a' : 'portrait_tail_wag_b';
    }
  }

  // Head and eyes
  let head = 'portrait_head_level';
  let eyes = 'portrait_eyes_right';

  if (pose.gaze === 'handler') {
    head = 'portrait_head_viewer';
    eyes = 'portrait_eyes_handler';
  } else if (pose.gaze === 'away-left') {
    head = 'portrait_head_left';
    eyes = 'portrait_eyes_left';
  } else if (pose.gaze === 'away-right') {
    head = 'portrait_head_right';
    eyes = 'portrait_eyes_right';
  } else if (pose.gaze === 'ground' || pose.head === 'down') {
    head = 'portrait_head_down';
    eyes = 'portrait_eyes_down';
  } else {
    // Forward / distractor gaze
    head = pose.head === 'up' ? 'portrait_head_up' : 'portrait_head_level';
    eyes = 'portrait_eyes_right';
  }

  return {
    tail,
    body,
    head,
    ears,
    eyes,
    ordered: [tail, body, head, ears, eyes],
  };
}
