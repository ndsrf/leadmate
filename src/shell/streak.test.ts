import { addDiaryEntry, activeToday, diarySubject, dayDiff, localDateString, markActive, NO_STREAK, shownStreak, type StreakRecord } from './streak';

const streak = (current: number, last: string, best = current): StreakRecord => ({ current, best, lastActiveDate: last });

describe('local dates', () => {
  it('formats the local calendar day, not the UTC one', () => {
    expect(localDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateString(new Date(2026, 11, 31, 0, 1))).toBe('2026-12-31');
  });

  it('counts whole days across month, year and daylight-saving boundaries', () => {
    expect(dayDiff('2026-01-31', '2026-02-01')).toBe(1);
    expect(dayDiff('2025-12-31', '2026-01-01')).toBe(1);
    expect(dayDiff('2026-03-28', '2026-03-30')).toBe(2); // clocks change in Europe on 29 March
    expect(dayDiff('2026-10-24', '2026-10-26')).toBe(2);
    expect(dayDiff('2026-02-28', '2026-03-01')).toBe(1);
    expect(dayDiff('2026-05-03', '2026-05-01')).toBe(-2);
  });
});

describe('daily Streak', () => {
  it('starts at 1 with the first activity', () => {
    expect(markActive(NO_STREAK, '2026-05-01')).toEqual({ current: 1, best: 1, lastActiveDate: '2026-05-01' });
  });

  it('increments on the next calendar day', () => {
    expect(markActive(streak(3, '2026-05-01'), '2026-05-02')).toEqual({ current: 4, best: 4, lastActiveDate: '2026-05-02' });
  });

  it('keeps the count on a replay the same day', () => {
    const s = streak(3, '2026-05-01');
    expect(markActive(s, '2026-05-01')).toBe(s);
  });

  it('resets to 1 after a missed day and keeps the best', () => {
    expect(markActive(streak(5, '2026-05-01'), '2026-05-03')).toEqual({ current: 1, best: 5, lastActiveDate: '2026-05-03' });
    expect(markActive(streak(5, '2026-05-01'), '2026-06-20').current).toBe(1);
  });

  it('counts across a month boundary', () => {
    expect(markActive(streak(2, '2026-04-30'), '2026-05-01').current).toBe(3);
  });

  it('ignores an earlier date when the clock moved back', () => {
    const s = streak(4, '2026-05-10');
    expect(markActive(s, '2026-05-08')).toBe(s);
  });

  it('ignores a malformed date', () => {
    const s = streak(4, '2026-05-10');
    expect(markActive(s, 'yesterday')).toBe(s);
  });

  it('shows the Streak while it can be kept, and 0 once a day was missed, without storing anything', () => {
    const s = streak(6, '2026-05-01');
    expect(shownStreak(s, '2026-05-01')).toBe(6);
    expect(shownStreak(s, '2026-05-02')).toBe(6);
    expect(shownStreak(s, '2026-05-03')).toBe(0);
    expect(s.current).toBe(6);
    expect(shownStreak(NO_STREAK, '2026-05-03')).toBe(0);
    expect(activeToday(s, '2026-05-01')).toBe(true);
    expect(activeToday(s, '2026-05-02')).toBe(false);
  });
});

describe('Walk Diary entries', () => {
  it('keeps one entry per Node per day, the latest answer winning', () => {
    let diary = addDiaryEntry([], { date: '2026-05-01', nodeId: 'a', outcome: 'struggled' });
    diary = addDiaryEntry(diary, { date: '2026-05-01', nodeId: 'b', outcome: 'completed' });
    diary = addDiaryEntry(diary, { date: '2026-05-01', nodeId: 'a', outcome: 'completed' });
    expect(diary).toHaveLength(2);
    expect(diary.find((e) => e.nodeId === 'a')?.outcome).toBe('completed');
  });
});

describe('Walk Diary entries on Missions', () => {
  it('keys entries by Mission, or by Node for an old entry, so the two never replace each other', () => {
    let diary = addDiaryEntry([], { date: '2026-05-01', nodeId: 'a', outcome: 'struggled' });
    diary = addDiaryEntry(diary, { date: '2026-05-01', missionId: 'm', outcome: 'struggled', problemId: 'p' });
    diary = addDiaryEntry(diary, { date: '2026-05-01', missionId: 'm', outcome: 'completed' });
    expect(diary).toEqual([
      { date: '2026-05-01', nodeId: 'a', outcome: 'struggled' },
      { date: '2026-05-01', missionId: 'm', outcome: 'completed' },
    ]);
    expect(diary.map(diarySubject)).toEqual(['a', 'm']);
  });
});
