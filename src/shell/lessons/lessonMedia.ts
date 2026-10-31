import type { Language } from '../voice';

/** A Lesson's Lesson Videos: a Lesson Animation key and, per language, a YouTube id spoken in that language. */
export interface LessonMediaEntry {
  /** A hosted clip (docs/content/lesson-animation-prompts.md); it has no words, so it serves every language. */
  animation?: string;
  /** YouTube ids by language. A Lesson with no id for the active language shows no YouTube video. */
  youtube?: Partial<Record<Language, string>>;
}

/**
 * The Lesson Videos of each Lesson, by Lesson id. Swapping one is an edit here (and its `video.alt` / `video.caption`
 * keys). The YouTube videos are picked from public dog-training channels and are listed in
 * docs/content/stand-in-content.md until reviewed.
 */
export const LESSON_MEDIA: Record<string, LessonMediaEntry> = {
  'calm-leash': { animation: 'calm-leash', youtube: { es: '8Ba10_ycocY' } },
  'body-language': { animation: 'body-language', youtube: { es: '76DSS5xNwtk' } },
  'smile-leash': { animation: 'smile-leash', youtube: { es: 'VgnWd0Yu_Rk' } },
  'marking-rewarding': { animation: 'marking-rewarding' },
  'sniffing-decompression': { animation: 'sniffing-decompression' },
};
