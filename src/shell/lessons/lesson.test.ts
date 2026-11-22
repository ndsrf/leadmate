import { newDogRecord } from '../dogRecord';
import { progressOf, type WorldDef } from '../world';
import { lessonDay, markLessonRead, todaysLesson, unlockedLibraryLessons, type LessonDef } from './lesson';

const withStage = (iso: string | null) => ({ onboarding: { ...newDogRecord().onboarding, firstStageCompletedAt: iso } });
const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const lesson = (day: number): LessonDef => ({ id: `l${day}`, title: 'lesson.title' as never, kind: 'theory', day, blocks: [] });
const lessons = [1, 2, 3, 4, 5].map(lesson);

describe('lessonDay', () => {
  const first = local(2026, 6, 1, 9).toISOString();
  it('counts the first-Stage day as Day 1 and then calendar days', () => {
    expect(lessonDay(withStage(first), local(2026, 6, 1, 18))).toBe(1);
    expect(lessonDay(withStage(first), local(2026, 6, 3))).toBe(3);
    expect(lessonDay(withStage(first), local(2026, 6, 10))).toBe(10);
  });

  it('has no Day before the first Stage', () => {
    expect(lessonDay(withStage(null), local(2026, 6, 3))).toBeNull();
  });

  it('crosses midnight, not 24 hours', () => {
    const late = local(2026, 6, 1, 23, 50).toISOString();
    expect(lessonDay(withStage(late), local(2026, 6, 2, 0, 10))).toBe(2);
    expect(lessonDay(withStage(late), local(2026, 6, 1, 23, 55))).toBe(1);
  });

  it('has no Day for a clock set before the first Stage or an unreadable time', () => {
    expect(lessonDay(withStage(first), local(2026, 5, 20))).toBeNull();
    expect(lessonDay(withStage('nope'), local(2026, 6, 3))).toBeNull();
  });
});

describe('todaysLesson', () => {
  it('picks the due unread Lesson', () => {
    expect(todaysLesson(lessons, ['l1', 'l2'], 3)?.id).toBe('l3');
  });

  it('catches up with the oldest unread', () => {
    expect(todaysLesson(lessons, [], 5)?.id).toBe('l1');
  });

  it('has none before the first Stage', () => {
    expect(todaysLesson(lessons, [], null)).toBeNull();
  });

  it('has none when everything due is read, even with later Lessons unread', () => {
    expect(todaysLesson(lessons, ['l1', 'l2'], 2)).toBeNull();
  });

  it('counts a Lesson read ahead of its day as read, and ignores unknown ids', () => {
    expect(todaysLesson(lessons, ['l3', 'ghost'], 3)?.id).toBe('l1');
    expect(todaysLesson(lessons, ['l1', 'l2', 'l3', 'ghost'], 3)).toBeNull();
  });
});

describe('markLessonRead', () => {
  it('adds once and never removes', () => {
    const once = markLessonRead(newDogRecord(), 'l1');
    expect(once.readLessons).toEqual(['l1']);
    expect(markLessonRead(once, 'l1')).toBe(once);
  });
});

describe('trail Lessons', () => {
  const trail: LessonDef = { id: 'trail', title: 'lesson.title' as never, kind: 'theory', blocks: [] };

  it('are never for today', () => {
    expect(todaysLesson([trail], [], 3)).toBeNull();
    expect(todaysLesson([trail, ...lessons], ['l1', 'l2'], 3)?.id).toBe('l3');
    expect(todaysLesson([trail, ...lessons], lessons.map((l) => l.id), 30)).toBeNull();
  });
});

describe('unlockedLibraryLessons', () => {
  const trailLesson: LessonDef = { id: 'trail-1', title: 'lesson.title' as never, kind: 'theory', blocks: [] };
  const mockWorld: WorldDef = {
    id: 'mock-w1',
    title: 'mock.title' as never,
    worldNumber: 1,
    topics: 'mock.topics' as never,
    stretches: [
      [
        { kind: 'lesson', id: 'trail-1' },
        { kind: 'node', id: 'node-1' },
        { kind: 'mission', id: 'mission-1' },
      ],
      [
        { kind: 'lesson', id: 'trail-nodeless' },
        { kind: 'mission', id: 'mission-2' },
      ],
    ],
  };
  const mockWorlds = [mockWorld];
  const nodelessLesson: LessonDef = { id: 'trail-nodeless', title: 'lesson.title' as never, kind: 'theory', blocks: [] };
  const allCatalog: readonly LessonDef[] = [...lessons, trailLesson, nodelessLesson];

  it('hides unread first-week lessons before the first Stage (day null)', () => {
    const p = progressOf([]);
    expect(unlockedLibraryLessons(lessons, p, null, mockWorlds)).toEqual([]);
  });

  it('retains read lessons even before the first stage', () => {
    const p = progressOf([], { readLessons: ['l1', 'trail-1'] });
    const unlocked = unlockedLibraryLessons(allCatalog, p, null, mockWorlds);
    expect(unlocked.map((l) => l.id)).toEqual(['l1', 'trail-1']);
  });

  it('unlocks first-week lessons up to current day and keeps future lessons hidden', () => {
    const p = progressOf([]);
    expect(unlockedLibraryLessons(lessons, p, 1, mockWorlds).map((l) => l.id)).toEqual(['l1']);
    expect(unlockedLibraryLessons(lessons, p, 3, mockWorlds).map((l) => l.id)).toEqual(['l1', 'l2', 'l3']);
  });

  it('unlocks a future first-week lesson if it was already read', () => {
    const p = progressOf([], { readLessons: ['l4'] });
    expect(unlockedLibraryLessons(lessons, p, 2, mockWorlds).map((l) => l.id)).toEqual(['l1', 'l2', 'l4']);
  });

  it('hides trail lessons when their node, world, and mission are not completed', () => {
    const p = progressOf([]);
    const unlocked = unlockedLibraryLessons([trailLesson], p, 5, mockWorlds);
    expect(unlocked).toEqual([]);
  });

  it('unlocks a trail lesson when any node in its stretch is completed', () => {
    const p = progressOf(['node-1']);
    const unlocked = unlockedLibraryLessons([trailLesson], p, 5, mockWorlds);
    expect(unlocked.map((l) => l.id)).toEqual(['trail-1']);
  });

  it('unlocks a trail lesson in a node-less stretch when its mission is passed', () => {
    const nodeless: LessonDef = { id: 'trail-nodeless', title: 'lesson.title' as never, kind: 'theory', blocks: [] };
    const pStarted = progressOf([], { missions: { 'mission-2': { target: 'full', skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z' } } });
    expect(unlockedLibraryLessons([nodeless], pStarted, 5, mockWorlds)).toEqual([]);

    const pPassed = progressOf([], { missions: { 'mission-2': { target: 'full', skipRun: 0, attempts: [], passedOn: '2026-05-01' } } });
    expect(unlockedLibraryLessons([nodeless], pPassed, 5, mockWorlds).map((l) => l.id)).toEqual(['trail-nodeless']);
  });

  it('unlocks all trail lessons of a completed world', () => {
    const p = progressOf([], { completedWorlds: ['mock-w1'] });
    const unlocked = unlockedLibraryLessons(allCatalog, p, null, mockWorlds);
    expect(unlocked.map((l) => l.id)).toEqual(['trail-1', 'trail-nodeless']);
  });
});
