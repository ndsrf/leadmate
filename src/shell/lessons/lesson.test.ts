import { newDogRecord } from '../dogRecord';
import { lessonDay, markLessonRead, todaysLesson, type LessonDef } from './lesson';

const withStage = (iso: string | null) => ({ onboarding: { ...newDogRecord().onboarding, firstStageCompletedAt: iso } });
const local = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const lesson = (day: number): LessonDef => ({ id: `l${day}`, title: 'lesson.title' as never, kind: 'theory', day, minutes: 2, blocks: [] });
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
  const trail: LessonDef = { id: 'trail', title: 'lesson.title' as never, kind: 'theory', minutes: 2, blocks: [] };

  it('are never for today', () => {
    expect(todaysLesson([trail], [], 3)).toBeNull();
    expect(todaysLesson([trail, ...lessons], ['l1', 'l2'], 3)?.id).toBe('l3');
    expect(todaysLesson([trail, ...lessons], lessons.map((l) => l.id), 30)).toBeNull();
  });
});
