import type { TextKey } from '../../i18n';
import { LESSON_VIDEOS } from './lessonMedia';
import type { LessonDef } from './lesson';

const IDS = ['calm-leash', 'body-language', 'smile-leash', 'marking-rewarding', 'sniffing-decompression'] as const;
const MINUTES = [3, 3, 4, 4, 4];
const ART = ['leash', 'body', 'smile', 'marker', 'sniff'];

/**
 * The first-week placeholder Lessons, Day 1 to Day 5. Text is provisional and so are the videos; real
 * content replaces these entries (and `lessonMedia.ts`) without code changes.
 */
export const LESSONS: readonly LessonDef[] = IDS.map((id, i): LessonDef => {
  const n = i + 1;
  const k = (name: string) => `lesson.${n}.${name}` as TextKey;
  return {
    id,
    title: k('title'),
    day: n,
    minutes: MINUTES[i],
    placeholder: true,
    blocks: [
      { type: 'heading', text: k('heading') },
      { type: 'text', text: k('p1') },
      { type: 'image', art: ART[i], alt: k('image.alt'), caption: k('image.caption'), placeholder: true },
      { type: 'text', text: k('p2') },
      { type: 'video', videoId: LESSON_VIDEOS[id], poster: 'poster', alt: k('video.alt'), caption: k('video.caption'), placeholder: true },
      { type: 'tip', text: k('tip') },
    ],
  };
});
