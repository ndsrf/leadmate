import { mergeLegacyNodes, type DogRecord } from '../dogRecord';
import { bestStars, type Stars } from '../stars';
import type { MissionAttempt, MissionState, SeenFix } from '../missions/mission';
import { diarySubject, type StreakRecord, type WalkDiaryEntry } from '../streak';

const union = <T>(first: readonly T[], second: readonly T[], key: (item: T) => string): T[] => {
  const seen = new Set(first.map(key));
  return [...first, ...second.filter((item) => !seen.has(key(item)))];
};

function mergeStars(a: Record<string, Stars>, b: Record<string, Stars>): Record<string, Stars> {
  const best = { ...a };
  for (const [id, stars] of Object.entries(b)) best[id] = bestStars(best[id], stars)!;
  return best;
}

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

/** The earlier of two local dates; a missing one never wins. */
const earlierDate = (a?: string, b?: string) => (a === undefined || b === undefined ? (a ?? b) : b < a ? b : a);

/**
 * One Mission on two devices: a passed Mission wins over an active one (earliest pass date), "keep practising"
 * from either side stays, the answers are unioned by time, and the side that started its wait later supplies
 * the wait, the target and the skip run.
 */
/**
 * Keeps one check-in answer per local date, as one device allows (`todaysAttempt`): a "completed" answer wins, so
 * the pass that `passedOn` records keeps its attempt; otherwise the earlier answer, which a single device would
 * have kept. Sorted by time.
 */
function oneAttemptPerDay(attempts: readonly MissionAttempt[]): MissionAttempt[] {
  const byDate = new Map<string, MissionAttempt>();
  for (const x of attempts) {
    const known = byDate.get(x.date);
    const passes = (y: MissionAttempt) => y.outcome === 'completed';
    if (!known || (passes(x) && !passes(known)) || (passes(x) === passes(known) && Date.parse(x.at) < Date.parse(known.at))) byDate.set(x.date, x);
  }
  return [...byDate.values()].sort((x, y) => Date.parse(x.at) - Date.parse(y.at));
}

function mergeMission(a: MissionState, b: MissionState): MissionState {
  const later = (b.startedAt ?? '') > (a.startedAt ?? '') ? b : a;
  const attempts = oneAttemptPerDay(union(a.attempts, b.attempts, (x) => x.at));
  const merged: MissionState = { ...later, attempts };
  const passedOn = earlierDate(a.passedOn, b.passedOn);
  if (passedOn) merged.passedOn = passedOn;
  if (a.keepPractising || b.keepPractising) merged.keepPractising = true;
  const focus = later.focus ?? a.focus ?? b.focus;
  if (focus) merged.focus = focus;
  return merged;
}

function mergeMissions(a: Record<string, MissionState>, b: Record<string, MissionState>): Record<string, MissionState> {
  const merged = { ...a };
  for (const [id, state] of Object.entries(b)) merged[id] = merged[id] ? mergeMission(merged[id], state) : state;
  return merged;
}

/** Seen Fixes unioned by Fix, keeping the time each was first shown. */
function mergeSeenFixes(a: readonly SeenFix[], b: readonly SeenFix[]): SeenFix[] {
  const byId = new Map<string, SeenFix>();
  for (const f of [...a, ...b]) {
    const known = byId.get(f.fixId);
    if (!known || Date.parse(f.at) < Date.parse(known.at)) byId.set(f.fixId, f);
  }
  return [...byId.values()];
}

/** The earlier of two optional ISO date-times; a missing one never wins. */
function earliest(a: string | null, b: string | null): string | null {
  if (a === null || b === null) return a ?? b;
  return Date.parse(b) < Date.parse(a) ? b : a;
}

/**
 * Resolves two copies of the same Dog (ADR 0006). The copy with the later `updatedAt` wins whole, Learning
 * Attributes included, which are never blended field by field. Records that only grow are then combined:
 * the Walk Diary (by date and Mission or Node), completed Nodes, read Lessons and seen Fixes by union, legacy Nodes by union less any Node a copy completed under Missions,
 * Mission state per Mission with a passed Mission winning, the best Daily Stage score per date, the best stars per Node (so a stale device can never lower them), and the longer Streak. The earliest first-Stage time is kept so a second device never restarts the first week.
 * A tie goes to `local`.
 */
export function resolve(local: DogRecord, remote: DogRecord): DogRecord {
  const remoteWins = Date.parse(remote.updatedAt) > Date.parse(local.updatedAt);
  const base = remoteWins ? remote : local;
  const other = remoteWins ? local : remote;
  const entryKey = (e: WalkDiaryEntry) => `${e.date}|${diarySubject(e)}`;
  return {
    ...base,
    readLessons: union(base.readLessons, other.readLessons, (id) => id),
    legacyNodes: mergeLegacyNodes(base, other),
    missions: mergeMissions(base.missions, other.missions),
    seenFixes: mergeSeenFixes(base.seenFixes, other.seenFixes),
    onboarding: { ...base.onboarding, firstStageCompletedAt: earliest(base.onboarding.firstStageCompletedAt, other.onboarding.firstStageCompletedAt) },
    walkDiary: union(base.walkDiary, other.walkDiary, entryKey),
    completedNodes: union(base.completedNodes, other.completedNodes, (id) => id),
    dailyBest: mergeDailyBest(base.dailyBest, other.dailyBest),
    stars: mergeStars(base.stars, other.stars),
    streak: mergeStreaks(base.streak, other.streak),
  };
}
