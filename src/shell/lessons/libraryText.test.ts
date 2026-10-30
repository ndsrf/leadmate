import { readFileSync } from 'fs';
import { join } from 'path';
import { createTranslator } from '../../i18n';
import { FIRST_WEEK_LESSONS, findLesson, LESSONS } from './content';
import { libraryEntries } from './lesson';
import { fixEntries, fixEntryLabel, lessonKindLabel, lessonPlaceLabel, libraryEntryLabel, readingMinutes } from './libraryText';
import type { Translate } from '../../i18n';
import type { LessonBlock } from './lesson';

const t = createTranslator();

describe('Library entries', () => {
  it('names the kind of every Lesson in text', () => {
    expect(lessonKindLabel(findLesson('theory-harness')!, t)).toBe('Teoría');
    expect(lessonKindLabel(findLesson('howto-walking')!, t)).toBe('Cómo se juega');
  });

  it('shows the suggested day of a first-week Lesson and the trail place of a trail Lesson', () => {
    expect(lessonPlaceLabel(FIRST_WEEK_LESSONS[2], t)).toBe('Día 3');
    expect(lessonPlaceLabel(findLesson('howto-walking')!, t)).toBe('Mundo 2 · Tramo 1');
    expect(lessonPlaceLabel(findLesson('theory-park-mix')!, t)).toBe('Mundo 4 · Tramo 2');
  });

  it('lists every Lesson with its place, kind, title, minutes and read state for a screen reader', () => {
    const entries = libraryEntries(LESSONS, ['howto-walking'], 3);
    expect(entries).toHaveLength(LESSONS.length);
    const walking = entries.find((e) => e.lesson.id === 'howto-walking')!;
    expect(libraryEntryLabel(walking, t)).toBe(`Mundo 2 · Tramo 1. Cómo se juega. ${t('trail.howto-walking.title')}. ${readingMinutes(walking.lesson, t)} min. ${t('library.read')}.`);
  });
});

describe('reading time', () => {
  const words = (n: number) => Array.from({ length: n }, () => 'palabra').join(' ');
  const blocks = (texts: number[], images: number, videos = 0): LessonBlock[] => [
    ...texts.map((_, i) => ({ type: 'text' as const, text: `w.${i}` as never })),
    ...Array.from({ length: images }, () => ({ type: 'image' as const, art: 'a', alt: 'x' as never, caption: 'x' as never })),
    ...Array.from({ length: videos }, () => ({ type: 'video' as const, videoId: 'v', poster: 'p', alt: 'x' as never, caption: 'x' as never })),
  ];
  const catalog = (texts: number[]): Translate => ((key: string) => (key.startsWith('w.') ? words(texts[Number(key.slice(2))]) : 'ignored alt and caption text')) as Translate;

  it('takes 450 words and two illustrations to at least 3 minutes', () => {
    const texts = [200, 150, 100];
    expect(readingMinutes({ blocks: blocks(texts, 2) }, catalog(texts))).toBe(3); // 150 s + 20 s
  });

  it('counts videos, never rounds below one minute, and follows the text as it grows', () => {
    expect(readingMinutes({ blocks: [] }, catalog([]))).toBe(1);
    expect(readingMinutes({ blocks: blocks([170], 0, 1) }, catalog([170]))).toBe(2); // 56.7 s + 30 s
    const lesson = { blocks: blocks([300, 0], 1) };
    expect(readingMinutes(lesson, catalog([300, 0]))).toBe(2);
    expect(readingMinutes(lesson, catalog([300, 400]))).toBe(5);
  });

  it('counts the words of steps, examples, do / don\'t and takeaways too', () => {
    const t = ((key: string) => (key === 'none' ? '' : words(90))) as Translate;
    const rich: LessonBlock[] = [
      { type: 'steps', items: ['a' as never, 'b' as never] },
      { type: 'example', title: 'none' as never, text: 'c' as never },
      { type: 'compare', do: { text: 'd' as never }, dont: { text: 'e' as never } },
      { type: 'takeaways', items: ['f' as never] },
    ];
    expect(readingMinutes({ blocks: rich }, t)).toBe(3); // 540 words
  });
});

describe('"Tus ajustes"', () => {
  it('is empty, so hidden, before any Fix was shown', () => {
    expect(fixEntries([])).toEqual([]);
  });

  it('lists seen Fixes most recent first, each with its Mission and problem', () => {
    const entries = fixEntries([
      { fixId: 'fix-harness-excited', missionId: 'mission-harness', at: '2026-05-02T09:00:00.000Z' },
      { fixId: 'fix-doorbell-general', missionId: 'mission-doorbell', at: '2026-05-05T09:00:00.000Z' },
      { fixId: 'gone', missionId: 'x', at: '2026-05-06T09:00:00.000Z' },
    ]);
    expect(entries.map((e) => e.fix.id)).toEqual(['fix-doorbell-general', 'fix-harness-excited']);
    expect(fixEntryLabel(entries[1], t)).toBe(`${t('mission.harness.title')} · Se excita al ver el arnés`);
    expect(fixEntryLabel(entries[0], t)).toBe(`${t('mission.doorbell.title')} · Otra cosa`);
  });

  it('opens a Fix from bundled data only, so it reads offline', () => {
    // a Fix is catalog text plus bundled or pending images: nothing to fetch
    for (const { fix } of fixEntries([{ fixId: 'fix-harness-excited', missionId: 'mission-harness', at: '2026-05-02T09:00:00.000Z' }])) {
      for (const b of fix.blocks) expect(b.type).not.toBe('video');
    }
    const screen = readFileSync(join(__dirname, '..', 'screens', 'MissionScreens.tsx'), 'utf8');
    expect(screen).not.toMatch(/fetch\(|supabase/);
  });
});
