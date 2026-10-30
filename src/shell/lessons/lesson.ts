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
  | { type: 'video'; videoId: string; poster: string; alt: TextKey; caption: TextKey; placeholder?: boolean }
  /** A numbered how-to list. */
  | { type: 'steps'; items: TextKey[] }
  /** A short story of the technique on a real walk, set apart from the body. */
  | { type: 'example'; title: TextKey; text: TextKey }
  /** A common mistake: the right way ("do") next to the wrong one ("don't"), each optionally with bundled art. */
  | { type: 'compare'; do: CompareSide; dont: CompareSide }
  /** A short bulleted summary. */
  | { type: 'takeaways'; items: TextKey[] };

export interface CompareSide {
  text: TextKey;
  art?: string;
}

/** `theory` teaches the real dog; `how-to-play` teaches the simulator's controls and how to read the virtual Dog. */
export type LessonKind = 'theory' | 'how-to-play';

/** A standalone piece of theory in the Theory Library; all text is catalog keys so content is plain data. */
export interface LessonDef {
  id: string;
  title: TextKey;
  kind: LessonKind;
  /** Suggested day after the first Stage (Day 1 is the day it was completed); absent for a Lesson on a World's trail. */
  day?: number;
  /** Provisional text; shows the placeholder badge on the card and at the top of the Lesson. */
  placeholder?: boolean;
  blocks: LessonBlock[];
}

/** The catalog keys of a Lesson's reading text, in order: everything but image and video captions and alt text. */
export function lessonTextKeys(blocks: readonly LessonBlock[]): TextKey[] {
  return blocks.flatMap((b): TextKey[] => {
    switch (b.type) {
      case 'heading':
      case 'text':
      case 'tip':
        return [b.text];
      case 'steps':
      case 'takeaways':
        return b.items;
      case 'example':
        return [b.title, b.text];
      case 'compare':
        return [b.do.text, b.dont.text];
      default:
        return [];
    }
  });
}

/** The illustrations of a Lesson: every image block's art and every do / don't side's art, in order. */
export function lessonArtNames(blocks: readonly LessonBlock[]): string[] {
  return blocks.flatMap((b) => (b.type === 'image' ? [b.art] : b.type === 'compare' ? [b.do.art, b.dont.art].filter((a): a is string => a !== undefined) : []));
}

/** Words in a text: runs of letters or digits, so punctuation and dashes do not count. */
export function countWords(text: string): number {
  return text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)*/gu)?.length ?? 0;
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
