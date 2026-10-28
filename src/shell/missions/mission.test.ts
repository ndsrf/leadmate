import { acceptEasier, activeTarget, canCheckIn, canMoveOn, checkIn, checkInOpensAt, moveOn, NEW_MISSION, offerEasier, opensAtMidnight, startMission, todaysAttempt, type MissionState } from './mission';
import { TEST_MISSION } from './testMission';

/** Local time on May 2026. */
const may = (day: number, h: number, m = 0) => new Date(2026, 4, day, h, m);
const startedAt = (d: Date): MissionState => startMission(NEW_MISSION, d);

describe('Mission check-in opens on a later day', () => {
  it('is closed the same day and opens at the next midnight', () => {
    const s = startedAt(may(1, 9));
    expect(canCheckIn(s, may(1, 23, 59))).toBe(false);
    expect(checkInOpensAt(s)).toEqual(may(2, 0));
    expect(opensAtMidnight(s)).toBe(true);
  });

  it('started at 23:50 is still closed at 00:10 and opens at 07:50', () => {
    const s = startedAt(may(1, 23, 50));
    expect(canCheckIn(s, may(2, 0, 10))).toBe(false);
    expect(checkInOpensAt(s)).toEqual(may(2, 7, 50));
    expect(opensAtMidnight(s)).toBe(false);
  });

  it('started at 23:50 is open at 08:00 the next day', () => {
    expect(canCheckIn(startedAt(may(1, 23, 50)), may(2, 8))).toBe(true);
  });

  it('started yesterday at 18:00 is open at 10:00', () => {
    expect(canCheckIn(startedAt(may(1, 18)), may(2, 10))).toBe(true);
  });

  it('stays closed when the clock is earlier than the start', () => {
    expect(canCheckIn(startedAt(may(5, 9)), may(3, 10))).toBe(false);
  });

  it('is never open before "Start mission"', () => {
    expect(checkInOpensAt(NEW_MISSION)).toBeNull();
    expect(canCheckIn(NEW_MISSION, may(9, 9))).toBe(false);
    expect(checkIn(NEW_MISSION, 'completed', undefined, may(9, 9))).toBe(NEW_MISSION);
  });

  it('starts only once', () => {
    const s = startedAt(may(1, 9));
    expect(startMission(s, may(1, 10))).toBe(s);
  });
});

describe('Mission outcomes', () => {
  const s = startedAt(may(1, 9));

  it('passes on "¡Conseguido!"', () => {
    const after = checkIn(s, 'completed', undefined, may(2, 9));
    expect(after.passedOn).toBe('2026-05-02');
    expect(checkInOpensAt(after)).toBeNull();
  });

  it('switches to the easier target and restarts the wait on a struggle', () => {
    const after = checkIn(s, 'struggled', 'excited', may(2, 9));
    expect(after.passedOn).toBeUndefined();
    expect(after.target).toBe('easier');
    expect(activeTarget(TEST_MISSION, after)).toBe('test-fix-excited.easier');
    expect(canCheckIn(after, may(2, 20))).toBe(false);
    expect(canCheckIn(after, may(3, 9))).toBe(true);
  });

  it('passes on "¡Conseguido!" with the easier target active', () => {
    const struggled = checkIn(s, 'struggled', 'excited', may(2, 9));
    expect(checkIn(struggled, 'completed', undefined, may(3, 9)).passedOn).toBe('2026-05-03');
  });

  it('keeps the target on a skip and restarts the wait', () => {
    const after = checkIn(s, 'skipped', undefined, may(2, 9));
    expect(after.target).toBe('full');
    expect(after.skipRun).toBe(1);
    expect(canCheckIn(after, may(2, 22))).toBe(false);
  });

  it('offers the easier target after three skips in a row, and a struggle resets the run', () => {
    let st = s;
    st = checkIn(st, 'skipped', undefined, may(2, 9));
    st = checkIn(st, 'skipped', undefined, may(3, 9));
    expect(offerEasier(st)).toBe(false);
    const broken = checkIn(st, 'struggled', 'bites', may(4, 9));
    expect(broken.skipRun).toBe(0);
    st = checkIn(st, 'skipped', undefined, may(4, 9));
    expect(offerEasier(st)).toBe(true);
    const accepted = acceptEasier(st);
    expect(accepted.target).toBe('easier');
    expect(activeTarget(TEST_MISSION, accepted)).toBe('test-fix-general.easier');
    expect(offerEasier(accepted)).toBe(false);
  });

  it('offers "Move on anyway" only from the second struggle', () => {
    const once = checkIn(s, 'struggled', 'excited', may(2, 9));
    expect(canMoveOn(once)).toBe(false);
    expect(moveOn(once, may(2, 10))).toBe(once);
    const twice = checkIn(once, 'struggled', 'bites', may(3, 9));
    expect(canMoveOn(twice)).toBe(true);
    const moved = moveOn(twice, may(3, 10));
    expect(moved).toMatchObject({ passedOn: '2026-05-03', keepPractising: true });
  });

  it('accepts one answer per day', () => {
    const late = startedAt(may(1, 8));
    const first = checkIn(late, 'skipped', undefined, may(2, 9));
    expect(todaysAttempt(first, may(2, 21))?.outcome).toBe('skipped');
    expect(checkIn(first, 'completed', undefined, may(2, 21))).toBe(first);
  });

  it('records "Otra cosa" for a struggle with no problem', () => {
    expect(checkIn(s, 'struggled', undefined, may(2, 9)).attempts[0].problemId).toBe('other');
  });
});
