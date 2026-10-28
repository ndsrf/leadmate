import type { TextKey } from '../../i18n';
import { activityAt, addActivity } from '../activity';
import type { DogRecord } from '../dogRecord';
import { dayDiff, localDateString } from '../streak';

/** One piece of a Lesson, shown in declared order in a single scrollable column. */
export type LessonBlock =
  | { type: 'heading'; text: TextKey }
  | { type: 'text'; text: TextKey }
  | { type: 'tip'; text: TextKey }
  | { type: 'image'; art: string; alt: TextKey; caption: TextKey; placeholder?: boolean }
  | { type: 'video'; videoId: string; poster: string; alt: TextKey; caption: TextKey; placeholder?: boolean };

/** `theory` teaches the real dog; `how-to-play` teaches the simulator's controls and how to read the virtual Dog. */
export type LessonKind = 'theory' | 'how-to-play';

/** A standalone piece of theory in the Theory Library; all text is catalog keys so content is plain data. */
export interface LessonDef {
  id: string;
  title: TextKey;
  kind: LessonKind;
  /** Suggested day after the first Stage (Day 1 is the day it was completed); absent for a Lesson on a World's trail. */
  day?: number;
  minutes: number;
  /** Provisional text; shows the placeholder badge on the card and at the top of the Lesson. */
  placeholder?: boolean;
  blocks: LessonBlock[];
}

/**
 * The Lesson Day of the Dog: calendar days in the local timezone, the day the first Stage was completed
 * being Day 1. Null before that Stage, and for a clock set before it.
 */
export function lessonDay(record: Pick<DogRecord, 'onboarding'>, now: Date): number | null {
  const at = record.onboarding.firstStageCompletedAt;
  if (!at) return null;
  const start = new Date(at);
  if (Number.isNaN(start.getTime())) return null;
  const day = dayDiff(localDateString(start), localDateString(now)) + 1;
  return day >= 1 ? day : null;
}

/** The Lesson "for today": the oldest unread one whose suggested day has arrived (a catch-up queue). Trail Lessons have no day and never are. */
export function todaysLesson(lessons: readonly LessonDef[], readIds: readonly string[], day: number | null): LessonDef | null {
  if (day === null) return null;
  const read = new Set(readIds);
  const due = lessons.filter((l): l is LessonDef & { day: number } => l.day !== undefined && l.day <= day && !read.has(l.id));
  return due.reduce<(LessonDef & { day: number }) | null>((oldest, l) => (oldest === null || l.day < oldest.day ? l : oldest), null);
}

/** The record with the Lesson marked read; one-way, and a repeat changes nothing. */
export function markLessonRead(record: DogRecord, id: string, now: Date = new Date()): DogRecord {
  if (record.readLessons.includes(id)) return record;
  return { ...record, readLessons: [...record.readLessons, id], activityLog: addActivity(record.activityLog, activityAt(now, { kind: 'lesson', id })) };
}

export interface LibraryEntry {
  lesson: LessonDef;
  read: boolean;
  /** The Lesson "for today". */
  today: boolean;
}

/** The Library in fixed order, with the Lesson for today (if any) moved to the top. */
export function libraryEntries(lessons: readonly LessonDef[], readIds: readonly string[], day: number | null): LibraryEntry[] {
  const read = new Set(readIds);
  const today = todaysLesson(lessons, readIds, day);
  const entries = lessons.map((lesson) => ({ lesson, read: read.has(lesson.id), today: lesson.id === today?.id }));
  return [...entries.filter((e) => e.today), ...entries.filter((e) => !e.today)];
}
