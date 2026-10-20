import { feedback as defaultFeedback, type Feedback } from './feedback';

/**
 * What a press does: play the press feedback and then run the action, both synchronously, so the
 * action is never delayed by feedback. A disabled control does neither.
 */
export function handlePress(onPress: () => void, disabled = false, fb: Pick<Feedback, 'press'> = defaultFeedback): void {
  if (disabled) return;
  fb.press();
  onPress();
}
