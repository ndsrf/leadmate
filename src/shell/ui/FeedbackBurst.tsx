import { View } from 'react-native';
import type { FeedbackTier } from '../../hud/feedback';
import type { FeedbackPolarity } from '../../sim/feedbackKinds';

/** One burst to show; a new `id` replaces the one still showing. All text is already translated. */
export interface FeedbackBurstProps {
  /** Rises once per event, so the same tier twice in a row still restarts the burst. */
  id: number;
  tier: FeedbackTier;
  polarity: FeedbackPolarity;
  /** The signal line, already filled with the Dog's name. */
  text: string;
  /** The Combo after this event; shown as a counter from 2 up. */
  combo: number;
  /** Called when the burst has finished its `TIER_SECONDS` and faded out. */
  onDone?: () => void;
}

/** STUB (final props): the shell burst drawing the four tiers. The real drawing lands with task 5.2. */
export function FeedbackBurst(_props: FeedbackBurstProps) {
  return <View pointerEvents="none" />;
}
