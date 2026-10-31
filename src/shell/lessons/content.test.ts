import { es } from '../../i18n';
import { videoEmbedUrl } from '../ui/media';
import { FIRST_WEEK_LESSONS, firstWeekLessons, LESSONS, theoryLesson, TRAIL_LESSONS } from './content';
import { lessonTextKeys, type LessonBlock } from './lesson';
import { LESSON_MEDIA } from './lessonMedia';
import { SUPPORTED_LANGUAGES, type Language } from '../voice';

describe('Lessons', () => {
  it('has unique ids, and the first week covers days 1 to 5', () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
    for (const day of [1, 2, 3, 4, 5]) expect(FIRST_WEEK_LESSONS.some((l) => l.day === day)).toBe(true);
  });

  it('only uses catalog keys, animation captions included', () => {
    for (const l of [...LESSONS, ...firstWeekLessons('https://media.example.com')]) {
      expect(es[l.title]).toBeTruthy();
      for (const key of lessonTextKeys(l.blocks)) expect({ key, text: es[key] }).toEqual({ key, text: expect.any(String) });
      for (const b of l.blocks) {
        if (b.type !== 'image' && b.type !== 'video') continue;
        expect(es[b.alt]).toBeTruthy();
        expect(es[b.caption]).toBeTruthy();
      }
    }
  });

  const youtubeIds = (l: { blocks: readonly LessonBlock[] }) => l.blocks.flatMap((b) => (b.type === 'video' && b.source.kind === 'youtube' ? [b.source.id] : []));

  it('shows each first-week Lesson its Spanish YouTube video, embeddable, and none where there is no Spanish one', () => {
    const byLesson = Object.fromEntries(FIRST_WEEK_LESSONS.map((l) => [l.id, youtubeIds(l)]));
    expect(byLesson).toEqual({
      'calm-leash': ['8Ba10_ycocY'],
      'body-language': ['76DSS5xNwtk'],
      'smile-leash': ['VgnWd0Yu_Rk'],
      'marking-rewarding': [],
      'sniffing-decompression': [],
    });
    for (const id of Object.values(byLesson).flat()) expect(videoEmbedUrl(id)).not.toBeNull();
  });

  it('never shows a YouTube video in another language than the Lessons', () => {
    for (const l of firstWeekLessons('', 'en' as Language)) expect(youtubeIds(l)).toEqual([]);
  });

  it('keys every YouTube id by a shipped language', () => {
    for (const media of Object.values(LESSON_MEDIA)) for (const lang of Object.keys(media.youtube ?? {})) expect(SUPPORTED_LANGUAGES).toContain(lang);
  });

  it('gives every first-week Lesson a Lesson Animation after its steps, with its own poster, when a media base is set', () => {
    for (const l of firstWeekLessons('https://media.example.com')) {
      const at = l.blocks.findIndex((b) => b.type === 'steps');
      expect(l.blocks[at + 1]).toMatchObject({ type: 'video', source: { kind: 'animation' }, poster: `${l.id}-anim` });
    }
  });

  it('places calm-leash\'s animation after the steps and its YouTube video after the comparison', () => {
    const [calm] = firstWeekLessons('https://media.example.com');
    const order = calm.blocks.filter((b) => ['steps', 'video', 'compare', 'tip'].includes(b.type)).map((b) => (b.type === 'video' ? `${b.source.kind}:${b.poster}` : b.type));
    expect(order).toEqual(['steps', 'animation:calm-leash-anim', 'compare', 'youtube:poster', 'tip']);
    expect(calm.blocks.find((b) => b.type === 'video' && b.source.kind === 'animation')).toMatchObject({ source: { key: 'calm-leash' }, alt: 'lesson.1.animation.alt', caption: 'lesson.1.animation.caption' });
  });

  it('leaves animation blocks out with no media base, and keeps the YouTube video', () => {
    for (const l of firstWeekLessons('')) {
      const kinds = l.blocks.flatMap((b) => (b.type === 'video' ? [b.source.kind] : []));
      expect(kinds).toEqual(youtubeIds(l).length > 0 ? ['youtube'] : []);
    }
  });

  it('mixes text and media in every Lesson', () => {
    for (const l of LESSONS) {
      expect(l.blocks.some((b) => b.type === 'text')).toBe(true);
      expect(l.blocks.some((b) => b.type === 'image' || b.type === 'video')).toBe(true);
    }
    // with hosting, every first-week Lesson has at least its Lesson Animation
    for (const l of firstWeekLessons('https://media.example.com')) for (const type of ['text', 'image', 'video'] as const) expect(l.blocks.some((b) => b.type === type)).toBe(true);
  });
});

describe('theoryLesson', () => {
  it('emits the teaching pattern in canonical order', () => {
    const lesson = theoryLesson('t', { keys: 'x', images: ['a', 'b', 'c'], steps: 3, takeaways: 2, compare: { do: 'd', dont: 'e' }, animation: 't', video: 'WPWbgzAd6C0', mediaBase: 'https://media.example.com' });
    expect(lesson.blocks.map((b) => b.type)).toEqual(['heading', 'text', 'heading', 'text', 'image', 'heading', 'steps', 'video', 'example', 'image', 'image', 'heading', 'compare', 'video', 'tip', 'takeaways']);
    expect(lesson.blocks.map((b) => ('text' in b ? b.text : 'art' in b ? b.art : b.type === 'steps' || b.type === 'takeaways' ? b.items.join() : b.type === 'video' ? b.source.kind : b.type))).toEqual([
      'x.heading', 'x.hook', 'lesson.section.why', 'x.why', 'a', 'lesson.section.how', 'x.step.1,x.step.2,x.step.3', 'animation', 'x.example.text', 'b', 'c', 'lesson.section.mistakes', 'compare', 'youtube', 'x.today', 'x.takeaway.1,x.takeaway.2',
    ]);
    expect(lesson).toMatchObject({ id: 't', title: 'x.title', kind: 'theory' });
  });

  it('leaves the videos out when there are none', () => {
    const lesson = theoryLesson('t', { keys: 'x', images: ['a'], steps: 3, takeaways: 2, day: 2 });
    expect(lesson.blocks.map((b) => b.type)).toEqual(['heading', 'text', 'heading', 'text', 'image', 'heading', 'steps', 'example', 'heading', 'compare', 'tip', 'takeaways']);
    expect(lesson).toMatchObject({ day: 2 });
  });
});

describe('trail Lessons', () => {
  it('have a kind, and the first-week Lessons are theory', () => {
    for (const l of LESSONS) expect(['theory', 'how-to-play']).toContain(l.kind);
    expect(FIRST_WEEK_LESSONS.every((l) => l.kind === 'theory')).toBe(true);
  });

  it('have no suggested day', () => {
    for (const l of TRAIL_LESSONS) expect(l.day).toBeUndefined();
  });

  it('show every control of a How-to-play Lesson with an image or video', () => {
    const howTo = TRAIL_LESSONS.filter((l) => l.kind === 'how-to-play');
    expect(howTo.map((l) => l.id)).toEqual(['howto-tap-hold', 'howto-walking', 'howto-cues', 'howto-long-leash']);
    for (const l of howTo) {
      const headings = l.blocks.filter((b) => b.type === 'heading').length;
      const media = l.blocks.filter((b) => b.type === 'image' || b.type === 'video').length;
      expect(media).toBeGreaterThan(0);
      expect(media).toBe(headings);
    }
  });

  it('cover the joystick, the leash, the Poste and Go Sniff before the first walk', () => {
    const walking = TRAIL_LESSONS.find((l) => l.id === 'howto-walking')!;
    const text = walking.blocks.map((b) => (b.type === 'heading' ? es[b.text] : '')).join(' ');
    for (const word of ['joystick', 'correa', 'Poste', 'Olfatear']) expect(text).toContain(word);
  });
});
