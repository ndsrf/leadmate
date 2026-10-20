import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/** Whether the app is in the foreground. Timers and looping animations run only while it is. */
export function useAppActive(): boolean {
  const [active, setActive] = useState(AppState.currentState === 'active');
  useEffect(() => {
    setActive(AppState.currentState === 'active');
    const sub = AppState.addEventListener('change', (state) => setActive(state === 'active'));
    return () => sub.remove();
  }, []);
  return active;
}
