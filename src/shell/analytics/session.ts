/** 30 minutes in milliseconds threshold for starting a new App Session on foreground return. */
export const SESSION_BACKGROUND_THRESHOLD_MS = 30 * 60 * 1000;

function toEpochMs(d: Date | number | string): number {
  if (d instanceof Date) return d.getTime();
  if (typeof d === 'number') return d;
  const parsed = Date.parse(d);
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Decides whether returning to the foreground constitutes a new App Session:
 * must have spent at least 30 minutes in the background.
 */
export function shouldStartSession(
  lastBackgroundAt: Date | number | string | null | undefined,
  now: Date | number | string = Date.now()
): boolean {
  if (!lastBackgroundAt) {
    return false;
  }
  const bgMs = toEpochMs(lastBackgroundAt);
  const nowMs = toEpochMs(now);
  if (nowMs < bgMs) {
    return false;
  }
  return nowMs - bgMs >= SESSION_BACKGROUND_THRESHOLD_MS;
}

/**
 * Whole seconds between start and now, clamped to >= 0.
 */
export function secondsSince(
  start: Date | number | string,
  now: Date | number | string = Date.now()
): number {
  const startMs = toEpochMs(start);
  const nowMs = toEpochMs(now);
  return Math.max(0, Math.floor((nowMs - startMs) / 1000));
}

/**
 * Whole days between start and now, clamped to >= 0.
 */
export function daysSince(
  start: Date | number | string,
  now: Date | number | string = Date.now()
): number {
  const startMs = toEpochMs(start);
  const nowMs = toEpochMs(now);
  return Math.max(0, Math.floor((nowMs - startMs) / (24 * 60 * 60 * 1000)));
}
