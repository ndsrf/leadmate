import { LessonTimer } from './lessons';

describe('LessonTimer (Task 7.1)', () => {
  it('measures seconds on screen and records furthest progress on close', () => {
    const t0 = 10000;
    const timer = new LessonTimer({
      lessonId: 'marking-timing',
      source: 'trail',
      startTime: t0,
    });

    expect(timer.isOpen).toBe(true);
    expect(timer.lessonId).toBe('marking-timing');
    expect(timer.source).toBe('trail');

    // Scroll down to 40%
    timer.updateProgress(40);
    // Scroll down to 85%
    timer.updateProgress(85);
    // Scroll back up to 20% - furthest progress stays 85%
    timer.updateProgress(20);

    const done = timer.close('done', t0 + 45000);
    expect(done).toEqual({
      lesson_id: 'marking-timing',
      closed_by: 'done',
      seconds_on_screen: 45,
      scrolled_percent: 85,
    });
    expect(timer.isOpen).toBe(false);

    // Second close returns null (once only)
    expect(timer.close('done', t0 + 50000)).toBeNull();
    expect(timer.close('back', t0 + 50000)).toBeNull();
  });

  it('closes with back and handles zero progress', () => {
    const t0 = 10000;
    const timer = new LessonTimer({
      lessonId: 'leash-reactivity',
      source: 'library',
      startTime: t0,
    });

    const back = timer.close('back', t0 + 12300);
    expect(back).toEqual({
      lesson_id: 'leash-reactivity',
      closed_by: 'back',
      seconds_on_screen: 12,
      scrolled_percent: 0,
    });
  });

  it('pauses and resumes foreground time during backgrounding', () => {
    const t0 = 10000;
    const timer = new LessonTimer({
      lessonId: 'calm-greetings',
      source: 'video_unlock',
      startTime: t0,
    });

    // 10s active
    // App backgrounded for 60s
    timer.pause(t0 + 10000);
    timer.resume(t0 + 70000);

    // 5s active after returning (total active: 15s)
    timer.updateProgress(62.7);
    const done = timer.close('done', t0 + 75000);

    expect(done).toEqual({
      lesson_id: 'calm-greetings',
      closed_by: 'done',
      seconds_on_screen: 15,
      scrolled_percent: 63,
    });
  });

  it('clamps scrolled percent between 0 and 100 and rounds to integer', () => {
    const timer = new LessonTimer({
      lessonId: 'dog-body-language',
      source: 'trail',
      startTime: 1000,
    });

    timer.updateProgress(-10);
    expect(timer.furthestPercent).toBe(0);

    timer.updateProgress(105);
    expect(timer.furthestPercent).toBe(100);

    const done = timer.close('done', 2000);
    expect(done?.scrolled_percent).toBe(100);
  });
});
