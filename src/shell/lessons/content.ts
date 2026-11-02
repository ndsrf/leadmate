import type { TextKey } from '../../i18n';
import { MEDIA_BASE } from '../ui/media';
import { SUPPORTED_LANGUAGES, type Language } from '../voice';
import { LESSON_MEDIA } from './lessonMedia';
import type { LessonBlock, LessonDef } from './lesson';

/** What a theory Lesson names besides its catalog keys: its illustrations, how many steps and takeaways, optional Lesson Videos. */
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
  /** A Lesson Animation key, shown right after the steps with the poster `<id>-anim`; left out when `mediaBase` is empty. */
  animation?: string;
  /** A YouTube id in the Lesson's language, shown after the do / don't comparison. */
  video?: string;
  /** A safety note shown as the first block, before the Lesson (the professional-help or vet note). */
  notice?: TextKey;
  /** Where Lesson Animations are hosted; defaults to the configured `MEDIA_BASE`. */
  mediaBase?: string;
}

/**
 * A theory Lesson in the teaching pattern (see docs/content/lesson-guide.md): hook, why it happens, illustration, how
 * to do it as steps, an optional Lesson Animation, a worked example on a real walk, more illustrations, common mistakes as do / don't, an optional
 * YouTube video, a "try it today" tip and the takeaways. Keys under `spec.keys`: heading, hook, why, step.<n>,
 * example.title, example.text, do, dont, today, takeaway.<n>, image.<n>.alt/caption, animation.alt/caption, video.alt/caption.
 */
export function theoryLesson(id: string, spec: TheorySpec): LessonDef {
  const k = (name: string) => `${spec.keys}.${name}` as TextKey;
  const image = (art: string, n: number): LessonBlock => ({ type: 'image', art, alt: k(`image.${n}.alt`), caption: k(`image.${n}.caption`) });
  const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);
  const [first, ...more] = spec.images;
  const blocks: LessonBlock[] = [
    ...(spec.notice ? [{ type: 'notice', text: spec.notice } satisfies LessonBlock] : []),
    { type: 'heading', text: k('heading') },
    { type: 'text', text: k('hook') },
    { type: 'heading', text: 'lesson.section.why' },
    { type: 'text', text: k('why') },
    image(first, 1),
    { type: 'heading', text: 'lesson.section.how' },
    { type: 'steps', items: range(spec.steps).map((n) => k(`step.${n}`)) },
    ...(spec.animation && (spec.mediaBase ?? MEDIA_BASE)
      ? [{ type: 'video', source: { kind: 'animation', key: spec.animation }, poster: `${id}-anim`, alt: k('animation.alt'), caption: k('animation.caption') } satisfies LessonBlock]
      : []),
    { type: 'example', title: k('example.title'), text: k('example.text') },
    ...more.map((art, i) => image(art, i + 2)),
    { type: 'heading', text: 'lesson.section.mistakes' },
    { type: 'compare', do: { text: k('do'), art: spec.compare?.do }, dont: { text: k('dont'), art: spec.compare?.dont } },
  ];
  if (spec.video) blocks.push({ type: 'video', source: { kind: 'youtube', id: spec.video }, poster: 'poster', alt: k('video.alt'), caption: k('video.caption') });
  blocks.push({ type: 'tip', text: k('today') }, { type: 'takeaways', items: range(spec.takeaways).map((n) => k(`takeaway.${n}`)) });
  const lesson: LessonDef = { id, title: k('title'), kind: 'theory', blocks };
  if (spec.day !== undefined) lesson.day = spec.day;
  return lesson;
}

/** The language Lessons are built in: the one the app ships. */
const LESSON_LANGUAGE: Language = SUPPORTED_LANGUAGES[0];

/**
 * The first-week Lessons, Day 1 to Day 5, in the Library only, in the teaching pattern, with their Lesson Videos
 * (`lessonMedia.ts`). A Lesson gets a YouTube video only when it has one in `language`, never one in another language.
 */
export function firstWeekLessons(mediaBase: string = MEDIA_BASE, language: Language = LESSON_LANGUAGE): LessonDef[] {
  const media = (id: string) => ({ animation: LESSON_MEDIA[id]?.animation, video: LESSON_MEDIA[id]?.youtube?.[language], mediaBase });
  return [
    theoryLesson('calm-leash', { keys: 'lesson.1', day: 1, images: ['calm-leash-1', 'calm-leash-2'], steps: 5, takeaways: 3, ...media('calm-leash') }),
    theoryLesson('body-language', { keys: 'lesson.2', day: 2, images: ['body-language-1', 'body-language-2'], steps: 6, takeaways: 4, ...media('body-language') }),
    theoryLesson('smile-leash', { keys: 'lesson.3', day: 3, images: ['smile-leash-1', 'smile-leash-2'], steps: 5, takeaways: 4, ...media('smile-leash') }),
    theoryLesson('marking-rewarding', { keys: 'lesson.4', day: 4, images: ['marking-rewarding-1', 'marking-rewarding-2'], steps: 5, takeaways: 4, ...media('marking-rewarding') }),
    theoryLesson('sniffing-decompression', { keys: 'lesson.5', day: 5, images: ['sniffing-decompression-1', 'sniffing-decompression-2'], steps: 5, takeaways: 3, compare: { do: 'sniffing-decompression-do', dont: 'sniffing-decompression-dont' }, ...media('sniffing-decompression') }),
  ];
}

export const FIRST_WEEK_LESSONS: readonly LessonDef[] = firstWeekLessons();

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

/** The Lessons placed on the trails of the playable Worlds, in trail order. */
export const TRAIL_LESSONS: readonly LessonDef[] = [
  theoryLesson('theory-named-behaviours', { keys: 'trail.theory-named-behaviours', images: ['theory-named-behaviours-1', 'theory-named-behaviours-2'], steps: 5, takeaways: 3 }),
  theoryLesson('theory-dog-as-dog', { keys: 'trail.theory-dog-as-dog', images: ['theory-dog-as-dog-1', 'theory-dog-as-dog-2'], steps: 5, takeaways: 4, compare: { do: 'theory-dog-as-dog-do', dont: 'theory-dog-as-dog-dont' } }),
  howToPlay('howto-choose-action', 2),
  theoryLesson('theory-home-rest', { keys: 'trail.theory-home-rest', images: ['theory-home-rest-1', 'theory-home-rest-2'], steps: 5, takeaways: 4 }),
  theoryLesson('theory-calm-first', { keys: 'trail.theory-calm-first', images: ['theory-calm-first-1', 'theory-calm-first-2'], steps: 5, takeaways: 4 }),
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

/**
 * The Lessons of the Home Behaviours (`add-home-behaviour-training`), on no World's trail. The biting Lessons lead with the
 * professional-help note (the plan's own text) and the eating Lesson with the vet note. Their pictures are stand-ins.
 */
export const HOME_LESSONS: readonly LessonDef[] = [
  theoryLesson('theory-bite-owner', { keys: 'trail.theory-bite-owner', notice: 'plan.note.professional', images: ['body-language-1', 'theory-dog-as-dog-1'], steps: 6, takeaways: 4 }),
  theoryLesson('theory-bite-others', { keys: 'trail.theory-bite-others', notice: 'plan.note.professional', images: ['body-language-2', 'theory-visual-shields-1'], steps: 6, takeaways: 4 }),
  theoryLesson('theory-bark-home', { keys: 'trail.theory-bark-home', images: ['theory-calm-first-1', 'theory-calm-first-2'], steps: 6, takeaways: 4 }),
  theoryLesson('theory-destroy', { keys: 'trail.theory-destroy', images: ['theory-home-rest-1', 'theory-home-rest-2'], steps: 5, takeaways: 4 }),
  theoryLesson('theory-eat-objects', { keys: 'trail.theory-eat-objects', notice: 'lesson.note.vet', images: ['theory-leave-it-1', 'theory-leave-it-2'], steps: 6, takeaways: 4 }),
];

/** Every Lesson of the Theory Library, in Library order: the first week, then the trail, then the Home Behaviours. */
export const LESSONS: readonly LessonDef[] = [...FIRST_WEEK_LESSONS, ...TRAIL_LESSONS, ...HOME_LESSONS];

export function findLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}
