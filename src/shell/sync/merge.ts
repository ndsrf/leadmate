import type { DogRecord } from '../dogRecord';
import type { StreakRecord, WalkDiaryEntry } from '../streak';

const union = <T>(first: readonly T[], second: readonly T[], key: (item: T) => string): T[] => {
  const seen = new Set(first.map(key));
  return [...first, ...second.filter((item) => !seen.has(key(item)))];
};

function mergeStreaks(base: StreakRecord, other: StreakRecord): StreakRecord {
  // a Streak is a run, not a list of days: the run that was active later is the current one
  const later = other.lastActiveDate > base.lastActiveDate || (other.lastActiveDate === base.lastActiveDate && other.current > base.current) ? other : base;
  return { current: later.current, lastActiveDate: later.lastActiveDate, best: Math.max(base.best, other.best, later.current) };
}

function mergeDailyBest(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const best = { ...a };
  for (const [date, score] of Object.entries(b)) best[date] = Math.max(best[date] ?? 0, score);
  return best;
}

/**
 * Resolves two copies of the same Dog (ADR 0006). The copy with the later `updatedAt` wins whole, Learning
 * Attributes included, which are never blended field by field. Records that only grow are then combined:
 * the Walk Diary and completed Nodes by union, the best Daily Stage score per date, and the longer Streak.
 * A tie goes to `local`.
 */
export function resolve(local: DogRecord, remote: DogRecord): DogRecord {
  const remoteWins = Date.parse(remote.updatedAt) > Date.parse(local.updatedAt);
  const base = remoteWins ? remote : local;
  const other = remoteWins ? local : remote;
  const entryKey = (e: WalkDiaryEntry) => `${e.date}|${e.nodeId}`;
  return {
    ...base,
    walkDiary: union(base.walkDiary, other.walkDiary, entryKey),
    completedNodes: union(base.completedNodes, other.completedNodes, (id) => id),
    dailyBest: mergeDailyBest(base.dailyBest, other.dailyBest),
    streak: mergeStreaks(base.streak, other.streak),
  };
}
