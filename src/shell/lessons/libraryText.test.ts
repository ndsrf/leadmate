import { readFileSync } from 'fs';
import { join } from 'path';
import { createTranslator } from '../../i18n';
import { FIRST_WEEK_LESSONS, findLesson, LESSONS } from './content';
import { libraryEntries } from './lesson';
import { fixEntries, fixEntryLabel, lessonKindLabel, lessonPlaceLabel, libraryEntryLabel } from './libraryText';

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
    expect(libraryEntryLabel(walking, t)).toBe(`Mundo 2 · Tramo 1. Cómo se juega. ${t('trail.howto-walking.title')}. 3 min. ${t('library.read')}.`);
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
