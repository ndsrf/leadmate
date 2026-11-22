import type { DogRecord } from './dogRecord';
import { isPlus } from './plus';

/**
 * Picks a random Dog Game ID from the available IDs.
 * When multiple games exist and a `lastId` is provided, guarantees no immediate repeat.
 * When only a single game exists, returns that game even if it matches `lastId`.
 */
export function pickRandomGame(
  ids: string[],
  lastId?: string | null,
  rng: () => number = Math.random
): string | null {
  if (!ids || ids.length === 0) return null;
  if (ids.length === 1) return ids[0];

  const pool = lastId && ids.includes(lastId) ? ids.filter((id) => id !== lastId) : ids;
  const index = Math.min(Math.floor(rng() * pool.length), pool.length - 1);
  return pool[index];
}

/**
 * Checks whether a user has access to view the full content of a Dog Game.
 * A game with `free: true` is open to everyone.
 * A non-free game requires LeadMate Plus (either active subscription or active trial through `isPlus`).
 */
export function canSeeGame(
  game: { free?: boolean },
  plus: boolean | DogRecord | null | undefined,
  now: Date = new Date()
): boolean {
  if (game?.free) return true;
  if (typeof plus === 'boolean') return plus;
  if (plus && typeof plus === 'object') return isPlus(plus as DogRecord, now);
  return false;
}

export interface LockedBar {
  id: number;
  widthPercent: number;
  width: `${number}%`;
}

export interface LockedBarsOptions {
  minBars?: number;
  maxBars?: number;
  minWidth?: number;
  maxWidth?: number;
}

/**
 * Pure function that computes blurred-looking placeholder bars for gated content.
 * Bar count and widths are derived deterministically from the hidden text length and bounded.
 * Absolutely NO hidden text is included in the output.
 */
export function computeLockedBars(
  input: string | number | Array<string | undefined> | undefined,
  options: LockedBarsOptions = {}
): LockedBar[] {
  const minBars = options.minBars ?? 3;
  const maxBars = options.maxBars ?? 10;
  const minWidth = options.minWidth ?? 40;
  const maxWidth = options.maxWidth ?? 100;

  let length = 0;
  if (typeof input === 'number') {
    length = Math.max(0, input);
  } else if (typeof input === 'string') {
    length = input.trim().length;
  } else if (Array.isArray(input)) {
    length = input.reduce((acc, s) => acc + (typeof s === 'string' ? s.trim().length : 0), 0);
  }

  // Derive count: roughly 60 characters per bar, bounded by [minBars, maxBars]
  const count = Math.max(minBars, Math.min(maxBars, Math.ceil(length / 60) || minBars));

  const bars: LockedBar[] = [];
  for (let i = 0; i < count; i++) {
    let widthPercent: number;
    if (i === count - 1) {
      // Last bar is typically shorter: 45% - 70%
      const variance = (length + i * 29) % 26;
      widthPercent = Math.max(minWidth, Math.min(maxWidth, 45 + variance));
    } else {
      // Other bars are between 75% and 100%
      const variance = (length + i * 37) % (maxWidth - 75 + 1);
      widthPercent = Math.max(minWidth, Math.min(maxWidth, 75 + variance));
    }

    bars.push({
      id: i,
      widthPercent,
      width: `${widthPercent}%`,
    });
  }

  return bars;
}
