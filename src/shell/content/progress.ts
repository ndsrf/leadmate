/**
 * What the Content Pack downloader is doing right now, for the "updating content" banner. A tiny external store:
 * the updater reports into it and the UI reads it with `useSyncExternalStore`. Idle means no download in progress;
 * a check that finds nothing new never leaves idle, so the banner does not flash.
 */
export interface ContentProgress {
  active: boolean;
  done: number;
  total: number;
}

const IDLE: ContentProgress = { active: false, done: 0, total: 0 };
let state: ContentProgress = IDLE;
const listeners = new Set<() => void>();

function set(next: ContentProgress): void {
  state = next;
  listeners.forEach((l) => l());
}

export function getContentProgress(): ContentProgress {
  return state;
}

export function subscribeContentProgress(listener: () => void): () => void {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

/** `done` of `total` files are in; call with `done` 0 when the download starts. */
export function reportContentProgress(done: number, total: number): void {
  set({ active: true, done, total });
}

/** The download finished, failed or was abandoned. */
export function endContentProgress(): void {
  if (state.active) set(IDLE);
}
