import type { TextKey } from '../../i18n';
import { LESSON_VIDEOS } from './lessonMedia';
import type { LessonBlock, LessonDef } from './lesson';

/** What a theory Lesson names besides its catalog keys: its illustrations, how many steps and takeaways, an optional video. */
export interface TheorySpec {
  /** Catalog prefix of the Lesson's keys, e.g. `lesson.1` or `trail.theory-poste`. */
  keys: string;
  day?: number;
  /** Bundled art: the first after "why", the rest after the worked example, each with `image.<n>.alt` / `.caption`. */
  images: [string, ...string[]];
  steps: number;
  takeaways: number;
  /** Bundled art of the "do" and "don't" sides, when the comparison has its own pictures. */
  compare?: { do?: string; dont?: string };
  /** A YouTube id; the stand-in videos keep their placeholder badge. */
  video?: { id: string; placeholder?: boolean };
  placeholder?: boolean;
}

/**
 * A theory Lesson in the teaching pattern (see docs/content/lesson-guide.md): hook, why it happens, illustration, how
 * to do it as steps, a worked example on a real walk, more illustrations, common mistakes as do / don't, an optional
 * video, a "try it today" tip and the takeaways. Keys under `spec.keys`: heading, hook, why, step.<n>, example.title,
 * example.text, do, dont, today, takeaway.<n>, image.<n>.alt/caption, video.alt/caption.
 */
export function theoryLesson(id: string, spec: TheorySpec): LessonDef {
  const k = (name: string) => `${spec.keys}.${name}` as TextKey;
  const image = (art: string, n: number): LessonBlock => ({ type: 'image', art, alt: k(`image.${n}.alt`), caption: k(`image.${n}.caption`), ...(spec.placeholder ? { placeholder: true } : {}) });
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  const [first, ...more] = spec.images;
  const blocks: LessonBlock[] = [
    { type: 'heading', text: k('heading') },
    { type: 'text', text: k('hook') },
    { type: 'heading', text: 'lesson.section.why' },
    { type: 'text', text: k('why') },
    image(first, 1),
    { type: 'heading', text: 'lesson.section.how' },
    { type: 'steps', items: range(spec.steps).map((n) => k(`step.${n}`)) },
    { type: 'example', title: k('example.title'), text: k('example.text') },
    ...more.map((art, i) => image(art, i + 2)),
    { type: 'heading', text: 'lesson.section.mistakes' },
    { type: 'compare', do: { text: k('do'), art: spec.compare?.do }, dont: { text: k('dont'), art: spec.compare?.dont } },
  ];
  if (spec.video) blocks.push({ type: 'video', videoId: spec.video.id, poster: 'poster', alt: k('video.alt'), caption: k('video.caption'), placeholder: spec.video.placeholder });
  blocks.push({ type: 'tip', text: k('today') }, { type: 'takeaways', items: range(spec.takeaways).map((n) => k(`takeaway.${n}`)) });
  const lesson: LessonDef = { id, title: k('title'), kind: 'theory', blocks };
  if (spec.day !== undefined) lesson.day = spec.day;
  if (spec.placeholder) lesson.placeholder = true;
  return lesson;
}

/**
 * The first-week Lessons, Day 1 to Day 5, in the Library only, in the teaching pattern; the videos are stand-ins
 * (`lessonMedia.ts`) and keep their placeholder badge.
 */
export const FIRST_WEEK_LESSONS: readonly LessonDef[] = [
  theoryLesson('calm-leash', { keys: 'lesson.1', day: 1, images: ['calm-leash-1', 'calm-leash-2'], steps: 5, takeaways: 3, video: { id: LESSON_VIDEOS['calm-leash'], placeholder: true } }),
  theoryLesson('body-language', { keys: 'lesson.2', day: 2, images: ['body-language-1', 'body-language-2'], steps: 6, takeaways: 4, video: { id: LESSON_VIDEOS['body-language'], placeholder: true } }),
  theoryLesson('smile-leash', { keys: 'lesson.3', day: 3, images: ['smile-leash-1', 'smile-leash-2'], steps: 5, takeaways: 4, video: { id: LESSON_VIDEOS['smile-leash'], placeholder: true } }),
  theoryLesson('marking-rewarding', { keys: 'lesson.4', day: 4, images: ['marking-rewarding-1', 'marking-rewarding-2'], steps: 5, takeaways: 4, video: { id: LESSON_VIDEOS['marking-rewarding'], placeholder: true } }),
  theoryLesson('sniffing-decompression', { keys: 'lesson.5', day: 5, images: ['sniffing-decompression-1', 'sniffing-decompression-2'], steps: 5, takeaways: 3, compare: { do: 'sniffing-decompression-do', dont: 'sniffing-decompression-dont' }, video: { id: LESSON_VIDEOS['sniffing-decompression'], placeholder: true } }),
];

/** A How-to-play Lesson: each control it covers, with an annotated capture of the real control (capture-controls.mjs). */
function howToPlay(id: string, controls: number): LessonDef {
  const k = (name: string) => `trail.${id}.${name}` as TextKey;
  const blocks: LessonBlock[] = [{ type: 'text', text: k('intro') }];
  for (let c = 1; c <= controls; c++) {
    blocks.push(
      { type: 'heading', text: k(`c${c}.heading`) },
      { type: 'text', text: k(`c${c}.text`) },
      { type: 'image', art: `${id}-${c}`, alt: k(`c${c}.alt`), caption: k(`c${c}.caption`) },
    );
  }
  blocks.push({ type: 'tip', text: k('tip') });
  return { id, title: k('title'), kind: 'how-to-play', blocks };
}

/** The Lessons placed on the trails of Worlds 1 to 4, in trail order (design decision 10). */
export const TRAIL_LESSONS: readonly LessonDef[] = [
  theoryLesson('theory-harness', { keys: 'trail.theory-harness', images: ['theory-harness-1', 'theory-harness-2'], steps: 5, takeaways: 4 }),
  howToPlay('howto-tap-hold', 2),
  theoryLesson('theory-doorbell', { keys: 'trail.theory-doorbell', images: ['theory-doorbell-1', 'theory-doorbell-2'], steps: 6, takeaways: 4 }),
  theoryLesson('theory-poste', { keys: 'trail.theory-poste', images: ['theory-poste-1', 'theory-poste-2'], steps: 5, takeaways: 3, compare: { do: 'theory-poste-do', dont: 'theory-poste-dont' } }),
  theoryLesson('theory-loose-leash', { keys: 'trail.theory-loose-leash', images: ['theory-loose-leash-1', 'theory-loose-leash-2'], steps: 5, takeaways: 4 }),
  howToPlay('howto-walking', 4),
  theoryLesson('theory-blind-corner', { keys: 'trail.theory-blind-corner', images: ['theory-blind-corner-1', 'theory-blind-corner-2'], steps: 5, takeaways: 4 }),
  theoryLesson('theory-slack-u', { keys: 'trail.theory-slack-u', images: ['theory-slack-u-1', 'theory-slack-u-2'], steps: 5, takeaways: 4, compare: { do: 'theory-slack-u-do', dont: 'theory-slack-u-dont' } }),
  theoryLesson('theory-leave-it', { keys: 'trail.theory-leave-it', images: ['theory-leave-it-1', 'theory-leave-it-2'], steps: 6, takeaways: 4, compare: { do: 'theory-leave-it-do', dont: 'theory-leave-it-dont' } }),
  howToPlay('howto-cues', 2),
  theoryLesson('theory-visual-shields', { keys: 'trail.theory-visual-shields', images: ['theory-visual-shields-1', 'theory-visual-shields-2'], steps: 5, takeaways: 4, compare: { do: 'theory-visual-shields-do', dont: 'theory-visual-shields-dont' } }),
  theoryLesson('theory-choosing-cue', { keys: 'trail.theory-choosing-cue', images: ['theory-choosing-cue-1'], steps: 5, takeaways: 3, compare: { do: 'theory-choosing-cue-do', dont: 'theory-choosing-cue-dont' } }),
  theoryLesson('theory-long-leash', { keys: 'trail.theory-long-leash', images: ['theory-long-leash-1', 'theory-long-leash-2'], steps: 5, takeaways: 4, compare: { do: 'theory-long-leash-do', dont: 'theory-long-leash-dont' } }),
  howToPlay('howto-long-leash', 2),
  theoryLesson('theory-park-mix', { keys: 'trail.theory-park-mix', images: ['theory-park-mix-1', 'theory-park-mix-2'], steps: 5, takeaways: 4 }),
];

/** Every Lesson of the Theory Library, in Library order: the first week, then the trail. */
export const LESSONS: readonly LessonDef[] = [...FIRST_WEEK_LESSONS, ...TRAIL_LESSONS];

export function findLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}
