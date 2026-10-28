/** The part of React Native's AppState the foreground watchers use, so they can be tested without React Native. */
export interface AppStateLike {
  currentState: string | null | undefined;
  addEventListener(type: 'change', listener: (state: string) => void): { remove(): void };
}

/** Calls `onChange(active)` now and whenever the app enters or leaves the foreground; returns the unsubscribe. */
export function watchAppActive(appState: AppStateLike, onChange: (active: boolean) => void): () => void {
  onChange(appState.currentState === 'active');
  const sub = appState.addEventListener('change', (state) => onChange(state === 'active'));
  return () => sub.remove();
}

/** Looping animations may run only while the app is in the foreground and their screen is not covered. */
export function isLive(appActive: boolean, covered = false): boolean {
  return appActive && !covered;
}
