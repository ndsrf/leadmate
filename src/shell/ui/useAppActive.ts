import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { isLive, watchAppActive } from './live';

/** Whether the app is in the foreground. Timers and looping animations run only while it is. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => watchAppActive(AppState, setActive), []);
  return active;
}

/**
 * Whether a looping animation may run: the app is in the foreground and the screen that owns the animation is not
 * `covered` by another screen. Owners cancel their animation and show a static frame while this is false.
 */
export function useLive(covered = false): boolean {
  return isLive(useAppActive(), covered);
}
