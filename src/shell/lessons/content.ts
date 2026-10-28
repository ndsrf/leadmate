import type { TextKey } from '../../i18n';
import { LESSON_VIDEOS } from './lessonMedia';
import type { LessonBlock, LessonDef } from './lesson';

const IDS = ['calm-leash', 'body-language', 'smile-leash', 'marking-rewarding', 'sniffing-decompression'] as const;
const MINUTES = [3, 3, 4, 4, 4];
const ART = ['leash', 'body', 'smile', 'marker', 'sniff'];

/**
 * The first-week placeholder Lessons, Day 1 to Day 5, in the Library only. Text is provisional and so are the
 * videos; real content replaces these entries (and `lessonMedia.ts`) without code changes.
 */
export const FIRST_WEEK_LESSONS: readonly LessonDef[] = IDS.map((id, i): LessonDef => {
  const n = i + 1;
  const k = (name: string) => `lesson.${n}.${name}` as TextKey;
  return {
    id,
    title: k('title'),
    kind: 'theory',
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

/** A theory Lesson of a trail: why the technique works on the real dog, with one illustration. */
function theory(id: string, art: string, minutes = 3): LessonDef {
  const k = (name: string) => `trail.${id}.${name}` as TextKey;
  return {
    id,
    title: k('title'),
    kind: 'theory',
    minutes,
    placeholder: true,
    blocks: [
      { type: 'heading', text: k('heading') },
      { type: 'text', text: k('p1') },
      { type: 'image', art, alt: k('image.alt'), caption: k('image.caption'), placeholder: true },
      { type: 'text', text: k('p2') },
      { type: 'tip', text: k('tip') },
    ],
  };
}

/** A How-to-play Lesson: each control it covers, with an annotated (still pending) capture of the real control. */
function howToPlay(id: string, controls: number, minutes = 2): LessonDef {
  const k = (name: string) => `trail.${id}.${name}` as TextKey;
  const blocks: LessonBlock[] = [{ type: 'text', text: k('intro') }];
  for (let c = 1; c <= controls; c++) {
    blocks.push(
      { type: 'heading', text: k(`c${c}.heading`) },
      { type: 'text', text: k(`c${c}.text`) },
      { type: 'image', art: `howto/${id}/${c}`, alt: k(`c${c}.alt`), caption: k(`c${c}.caption`), placeholder: true },
    );
  }
  blocks.push({ type: 'tip', text: k('tip') });
  return { id, title: k('title'), kind: 'how-to-play', minutes, placeholder: true, blocks };
}

/** The Lessons placed on the trails of Worlds 1 to 4, in trail order (design decision 10). */
export const TRAIL_LESSONS: readonly LessonDef[] = [
  theory('theory-harness', 'body'),
  howToPlay('howto-tap-hold', 2),
  theory('theory-doorbell', 'marker'),
  theory('theory-poste', 'leash'),
  theory('theory-loose-leash', 'smile'),
  howToPlay('howto-walking', 4, 3),
  theory('theory-blind-corner', 'leash'),
  theory('theory-slack-u', 'smile'),
  theory('theory-leave-it', 'marker'),
  howToPlay('howto-cues', 2),
  theory('theory-visual-shields', 'body'),
  theory('theory-choosing-cue', 'marker'),
  theory('theory-long-leash', 'sniff'),
  howToPlay('howto-long-leash', 2),
  theory('theory-park-mix', 'sniff'),
];

/** Every Lesson of the Theory Library, in Library order: the first week, then the trail. */
export const LESSONS: readonly LessonDef[] = [...FIRST_WEEK_LESSONS, ...TRAIL_LESSONS];

export function findLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}
