import type { AppStateLike } from '../ui/live';

/** The part of the Supabase auth client that runs the token refresh timer. */
export interface AutoRefresh {
  startAutoRefresh(): Promise<void> | void;
  stopAutoRefresh(): Promise<void> | void;
}

/**
 * On iOS and Android, runs the session refresh timer only while the app is in the foreground: stopped in the
 * background, started again on return (which refreshes at once if the token is due). On the web it does nothing;
 * supabase-js ties refresh to page visibility there. Returns the unsubscribe.
 */
export function followAppState(auth: AutoRefresh, platform: string, appState: AppStateLike): () => void {
  if (platform === 'web') return () => {};
  // a failed start or stop is retried at the next change; it must not surface as an unhandled rejection
  const run = (call: () => Promise<void> | void) => {
    try {
      void Promise.resolve(call()).catch(() => {});
    } catch {
      // as above
    }
  };
  const apply = (state: string | null | undefined) => run(() => (state === 'active' ? auth.startAutoRefresh() : auth.stopAutoRefresh()));
  apply(appState.currentState);
  const sub = appState.addEventListener('change', apply);
  return () => {
    sub.remove();
    run(() => auth.stopAutoRefresh());
  };
}
