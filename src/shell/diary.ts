import type { ActivityEvent, ActivityKind } from './activity';
import type { DogRecord } from './dogRecord';
import { dayDiff, isDateString, localDateString, type DiaryOutcome, type WalkDiaryEntry } from './streak';

/**
 * The Diary screen's model: everything the record knows about each calendar day, gathered from the
 * Activity Log, the Walk Diary, the Daily best scores and the onboarding dates. Pure; dates are local
 * `YYYY-MM-DD`.
 */

/** A kind of mark a calendar day can carry. */
export type DayMark = ActivityKind | 'walk';
export const DAY_MARKS: readonly DayMark[] = ['node', 'daily', 'lesson', 'walk', 'first-stage'];

export interface DiaryDay {
  date: string;
  /** Logged activity of the day, in the order it happened. */
  events: ActivityEvent[];
  /** Real-world exercise check-ins of the day. */
  walks: WalkDiaryEntry[];
  /** Best Daily Stage score of the day, if one was played. */
  dailyBest?: number;
  /** The day the free trial started. */
  trialStarted: boolean;
}

function emptyDay(date: string): DiaryDay {
  return { date, events: [], walks: [], trialStarted: false };
}

const localDateOf = (iso: string | null): string | null => {
  if (iso === null) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : localDateString(new Date(ms));
};

/** Every day with something to show, newest first. */
export function diaryDays(record: DogRecord): DiaryDay[] {
  const days = new Map<string, DiaryDay>();
  const day = (date: string) => {
    let d = days.get(date);
    if (!d) days.set(date, (d = emptyDay(date)));
    return d;
  };
  for (const event of record.activityLog) day(event.date).events.push(event);
  for (const walk of record.walkDiary) day(walk.date).walks.push(walk);
  for (const [date, score] of Object.entries(record.dailyBest)) if (isDateString(date)) day(date).dailyBest = score;
  const trial = localDateOf(record.onboarding.trialStartedAt);
  if (trial) day(trial).trialStarted = true;
  // a first Stage played before the log existed still shows on its day
  const first = record.onboarding.firstStageCompletedAt;
  const firstDate = localDateOf(first);
  if (first && firstDate && !record.activityLog.some((e) => e.kind === 'first-stage')) {
    day(firstDate).events.push({ at: first, date: firstDate, kind: 'first-stage', id: '' });
  }
  for (const d of days.values()) d.events.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  return [...days.values()].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** The kinds of mark a day carries, in `DAY_MARKS` order. */
export function dayMarks(day: DiaryDay): DayMark[] {
  const kinds = new Set<DayMark>(day.events.map((e) => e.kind));
  if (day.walks.length > 0) kinds.add('walk');
  if (day.dailyBest !== undefined) kinds.add('daily');
  return DAY_MARKS.filter((k) => kinds.has(k));
}

/** An Active Day credited the Streak: anything but a Lesson read (or a trial start) alone. */
export function isActiveDay(day: DiaryDay): boolean {
  return dayMarks(day).some((m) => m !== 'lesson');
}

export interface DiaryTotals {
  /** Days that credited the Streak. */
  activeDays: number;
  nodeRuns: number;
  dailyRuns: number;
  lessonsRead: number;
  walks: Record<DiaryOutcome, number>;
  /** Best handling score of any logged Stage or Daily Stage. */
  bestScore: number | null;
  /** Local date of the first Active Day. */
  since: string | null;
}

export function diaryTotals(days: readonly DiaryDay[]): DiaryTotals {
  const totals: DiaryTotals = { activeDays: 0, nodeRuns: 0, dailyRuns: 0, lessonsRead: 0, walks: { completed: 0, struggled: 0, skipped: 0 }, bestScore: null, since: null };
  for (const day of days) {
    if (isActiveDay(day)) {
      totals.activeDays++;
      if (totals.since === null || day.date < totals.since) totals.since = day.date;
    }
    for (const e of day.events) {
      if (e.kind === 'node') totals.nodeRuns++;
      else if (e.kind === 'daily') totals.dailyRuns++;
      else if (e.kind === 'lesson') totals.lessonsRead++;
      if (e.stage) totals.bestScore = Math.max(totals.bestScore ?? 0, e.stage.score);
    }
    for (const w of day.walks) totals.walks[w.outcome]++;
    if (day.dailyBest !== undefined) totals.bestScore = Math.max(totals.bestScore ?? 0, day.dailyBest);
  }
  return totals;
}

export interface Month {
  year: number;
  /** 0 (January) to 11. */
  month: number;
}

export function monthOf(date: string): Month {
  const [y, m] = date.split('-').map(Number);
  return { year: y, month: m - 1 };
}

export function shiftMonth({ year, month }: Month, delta: number): Month {
  const index = year * 12 + month + delta;
  return { year: Math.floor(index / 12), month: ((index % 12) + 12) % 12 };
}

const pad = (n: number) => String(n).padStart(2, '0');

/** The days of a month as Monday-first weeks; cells outside the month are null. */
export function monthGrid({ year, month }: Month): (string | null)[][] {
  const first = `${year}-${pad(month + 1)}-01`;
  const next = shiftMonth({ year, month }, 1);
  const length = dayDiff(first, `${next.year}-${pad(next.month + 1)}-01`);
  // getUTCDay: 0 is Sunday; shift so Monday is column 0
  const lead = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7;
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= length; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Day of the week of a date, 0 (Monday) to 6 (Sunday). */
export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
}

/** Local `HH:MM` of an ISO date-time. */
export function timeOf(iso: string): string {
  const at = new Date(iso);
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}

/** The days of the Streak that is still alive on `today` (empty once it is broken), for the calendar. */
export function streakDates(lastActiveDate: string, current: number, today: string): Set<string> {
  const dates = new Set<string>();
  if (!isDateString(lastActiveDate) || dayDiff(lastActiveDate, today) > 1) return dates;
  const [y, m, d] = lastActiveDate.split('-').map(Number);
  for (let i = 0; i < current; i++) dates.add(localDateString(new Date(y, m - 1, d - i, 12)));
  return dates;
}
