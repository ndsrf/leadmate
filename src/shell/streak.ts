/**
 * The daily Streak and the Walk Diary. Dates are local calendar days as `YYYY-MM-DD`; a Streak
 * never touches the Dog's Learning Attributes or Trigger Profile.
 */

export interface StreakRecord {
  /** Consecutive active days ending at `lastActiveDate`. */
  current: number;
  best: number;
  /** Local date of the last activity; empty before the first. */
  lastActiveDate: string;
}

export const NO_STREAK: StreakRecord = { current: 0, best: 0, lastActiveDate: '' };

export type DiaryOutcome = 'completed' | 'struggled' | 'skipped';
export const DIARY_OUTCOMES: readonly DiaryOutcome[] = ['completed', 'struggled', 'skipped'];

/**
 * One check-in on a real walk: on a Mission since Missions exist, and on a Node's Debrief before that (those
 * old entries keep only `nodeId`).
 */
export interface WalkDiaryEntry {
  date: string;
  nodeId?: string;
  missionId?: string;
  outcome: DiaryOutcome;
  /** The problem picked after "Costó un poco". */
  problemId?: string;
}

/** What an entry is about: its Mission, or its Node for an entry from before Missions. */
export const diarySubject = (e: WalkDiaryEntry): string => e.missionId ?? e.nodeId ?? '';

/** The local calendar date of `now`, as `YYYY-MM-DD`. */
export function localDateString(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isDateString(value: unknown): value is string {
  return typeof value === 'string' && DATE_PATTERN.test(value);
}

/** Whole calendar days from `from` to `to` (negative when `to` is earlier); counted in UTC so DST cannot shift a day. */
export function dayDiff(from: string, to: string): number {
  const utc = (d: string) => {
    const [y, m, day] = d.split('-').map(Number);
    return Date.UTC(y, m - 1, day);
  };
  return Math.round((utc(to) - utc(from)) / 86_400_000);
}

/**
 * Marks `date` as active: the same day changes nothing, the next day adds one, a longer gap starts
 * again at 1. An earlier date (the clock moved back) changes nothing.
 */
export function markActive(streak: StreakRecord, date: string): StreakRecord {
  if (!isDateString(date)) return streak;
  if (!isDateString(streak.lastActiveDate)) return { current: 1, best: Math.max(streak.best, 1), lastActiveDate: date };
  const gap = dayDiff(streak.lastActiveDate, date);
  if (gap < 0 || gap === 0) return streak;
  const current = gap === 1 ? streak.current + 1 : 1;
  return { current, best: Math.max(streak.best, current), lastActiveDate: date };
}

/**
 * The Streak to show on `today`: the stored count while it can still be kept alive (active today
 * or yesterday), 0 once a full day was missed. Showing 0 stores nothing.
 */
export function shownStreak(streak: StreakRecord, today: string): number {
  if (!isDateString(streak.lastActiveDate)) return 0;
  return dayDiff(streak.lastActiveDate, today) <= 1 ? streak.current : 0;
}

/** True when `today` is already marked active. */
export function activeToday(streak: StreakRecord, today: string): boolean {
  return streak.lastActiveDate === today;
}

/** Adds an entry, replacing an earlier one for the same Mission (or Node) on the same day. */
export function addDiaryEntry(diary: readonly WalkDiaryEntry[], entry: WalkDiaryEntry): WalkDiaryEntry[] {
  return [...diary.filter((e) => !(e.date === entry.date && diarySubject(e) === diarySubject(entry))), entry];
}
