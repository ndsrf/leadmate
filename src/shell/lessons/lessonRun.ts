import type { LessonBlock, LessonDef } from './lesson';

/** What the Lesson screen draws: the blocks, then the "Done" action as the last, non-sticky item. */
export type LessonItem = LessonBlock | { type: 'done' };

export function lessonItems(lesson: LessonDef): LessonItem[] {
  return [...lesson.blocks, { type: 'done' }];
}

/** Reading progress 0-100 from the scroll offset; a Lesson that fits the screen counts as fully visible. */
export function readingProgress(offset: number, content: number, viewport: number): number {
  const range = content - viewport;
  if (!(range > 0)) return 100;
  return Math.max(0, Math.min(100, Math.round((offset / range) * 100)));
}
