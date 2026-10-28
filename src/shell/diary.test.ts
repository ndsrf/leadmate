import { ACTIVITY_LOG_MAX, activityAt, addActivity, readActivityLog, stageSummary } from './activity';
import { completeDaily } from './daily';
import { dayMarks, diaryDays, diaryTotals, monthGrid, shiftMonth, streakDates, weekdayOf } from './diary';
import { applyDiary, migrateRecord, newDogRecord } from './dogRecord';
import { markLessonRead } from './lessons/lesson';
import { WALK_DISTRACTION } from './nodes/content';
import { advance, onDebrief, startNode } from './nodes/node';
import { resolve } from './sync/merge';
import { payloadWith } from './testPayload';

const at = (d: number, h = 12) => new Date(2026, 4, d, h);

function debriefed(score: number) {
  let run = startNode(WALK_DISTRACTION);
  for (let i = 0; i < WALK_DISTRACTION.primerCards.length; i++) run = advance(run, { type: 'next' });
  run = advance(run, { type: 'answer', option: 0 });
  return advance(run, { type: 'finish', result: { kind: 'stage', payload: payloadWith({ handlingScore: score }) } });
}

describe('Activity Log', () => {
  it('logs a Node Debrief with its stars, Stage numbers and assigned exercise', () => {
    const r = onDebrief(newDogRecord(), debriefed(900), at(1, 9));
    expect(r.activityLog).toHaveLength(1);
    expect(r.activityLog[0]).toMatchObject({ date: '2026-05-01', kind: 'node', id: 'walk-distraction', stars: 3, stage: { score: 900 } });
    expect(typeof r.activityLog[0].exercise).toBe('string');
  });

  it('logs every Daily Stage play, a Lesson only the first time it is read', () => {
    let r = completeDaily(newDogRecord(), payloadWith({ handlingScore: 400 }), at(2, 9)).record;
    r = completeDaily(r, payloadWith({ handlingScore: 300 }), at(2, 10)).record;
    r = markLessonRead(markLessonRead(r, 'l1', at(3)), 'l1', at(4));
    expect(r.activityLog.map((e) => e.kind)).toEqual(['daily', 'daily', 'lesson']);
  });

  it('keeps only the newest entries', () => {
    let log = readActivityLog([]);
    for (let i = 0; i < ACTIVITY_LOG_MAX + 5; i++) log = addActivity(log, activityAt(new Date(2026, 0, 1, 0, i), { kind: 'lesson', id: String(i) }));
    expect(log).toHaveLength(ACTIVITY_LOG_MAX);
    expect(log[0].id).toBe('5');
  });

  it('drops unreadable entries when loading', () => {
    const good = activityAt(at(1), { kind: 'daily', id: '', stage: stageSummary(payloadWith({ handlingScore: 10 })) });
    const r = migrateRecord({ activityLog: [good, { ...good, kind: 'nap' }, { ...good, at: 'never' }, 3] });
    expect(r.activityLog).toEqual([good]);
    expect(migrateRecord({}).activityLog).toEqual([]);
  });

  it('unions two copies of the log when syncing', () => {
    const a = activityAt(at(1), { kind: 'lesson', id: 'a' });
    const b = activityAt(at(2), { kind: 'lesson', id: 'b' });
    const local = { ...newDogRecord(), activityLog: [a], updatedAt: '2026-05-03T00:00:00.000Z' };
    const remote = { ...newDogRecord(), activityLog: [a, b], updatedAt: '2026-05-01T00:00:00.000Z' };
    expect(resolve(local, remote).activityLog).toEqual([a, b]);
  });
});

describe('Diary days', () => {
  it('gathers the log, the Walk Diary and Daily bests by day, newest first', () => {
    let r = onDebrief(newDogRecord(), debriefed(500), at(1, 9));
    r = applyDiary(r, 'walk-distraction', 'struggled', at(1, 18));
    r = { ...r, dailyBest: { '2026-04-20': 700 } };
    const days = diaryDays(r);
    expect(days.map((d) => d.date)).toEqual(['2026-05-01', '2026-04-20']);
    expect(dayMarks(days[0])).toEqual(['node', 'walk']);
    expect(dayMarks(days[1])).toEqual(['daily']);
  });

  it('shows a first Stage from before the log on its day', () => {
    const r = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, firstStageCompletedAt: at(7).toISOString() } };
    expect(dayMarks(diaryDays(r)[0])).toEqual(['first-stage']);
  });

  it('adds up the totals', () => {
    let r = onDebrief(newDogRecord(), debriefed(500), at(1));
    r = completeDaily(r, payloadWith({ handlingScore: 800 }), at(2)).record;
    r = applyDiary(r, 'walk-distraction', 'completed', at(2));
    const totals = diaryTotals(diaryDays(r));
    expect(totals).toMatchObject({ activeDays: 2, nodeRuns: 1, dailyRuns: 1, bestScore: 800, since: '2026-05-01' });
    expect(totals.walks.completed).toBe(1);
  });
  it('counts a day with only a Lesson read as activity, not as an Active Day', () => {
    const r = markLessonRead(newDogRecord(), 'l1', at(3));
    const days = diaryDays(r);
    expect(dayMarks(days[0])).toEqual(['lesson']);
    expect(diaryTotals(days)).toMatchObject({ activeDays: 0, lessonsRead: 1, since: null });
  });
});

describe('calendar helpers', () => {
  it('lays a month out in Monday-first weeks', () => {
    // 1 October 2026 is a Thursday
    const weeks = monthGrid({ year: 2026, month: 9 });
    expect(weeks[0]).toEqual([null, null, null, '2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(monthGrid({ year: 2028, month: 1 }).flat().filter(Boolean)).toHaveLength(29);
  });

  it('moves between months across years', () => {
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(weekdayOf('2026-10-29')).toBe(3);
  });

  it('lists the days of a live Streak, none once it is broken', () => {
    expect([...streakDates('2026-05-03', 3, '2026-05-04')].sort()).toEqual(['2026-05-01', '2026-05-02', '2026-05-03']);
    expect(streakDates('2026-05-03', 3, '2026-05-06').size).toBe(0);
  });
});
