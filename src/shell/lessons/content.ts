import type { TextKey } from '../../i18n';
import { MEDIA_BASE } from '../ui/media';
import type { LessonBlock, LessonDef } from './lesson';
import { getActiveContent } from '../content/runtime';

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

function createArrayProxy<T>(getTarget: () => readonly T[]): readonly T[] {
  return new Proxy([] as unknown as readonly T[], {
    get(_target, prop, receiver) {
      const arr = getTarget();
      const value = Reflect.get(arr, prop, receiver);
      if (typeof value === 'function') {
        return value.bind(arr);
      }
      return value;
    },
    has(_target, prop) {
      return Reflect.has(getTarget(), prop);
    },
    ownKeys(_target) {
      return Reflect.ownKeys(getTarget());
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Reflect.getOwnPropertyDescriptor(getTarget(), prop);
    },
  });
}

const PUPPY_MODULE_IDS = ['puppy-bite', 'puppy-sound', 'puppy-vet'];

/** Dedicated companion lessons for puppies under 6 months (Satellite Stops in World 1). */
export const PUPPY_LESSONS: readonly LessonDef[] = createArrayProxy(() =>
  getActiveContent().resolved.lessons.filter((l) => PUPPY_MODULE_IDS.includes(l.id)),
);

/** Every Lesson of the Theory Library, in Library order: resolved from the active Content Pack. */
export const LESSONS: readonly LessonDef[] = createArrayProxy(() => getActiveContent().resolved.lessons);

export function findLesson(id: string): LessonDef | undefined {
  return LESSONS.find((l) => l.id === id);
}
