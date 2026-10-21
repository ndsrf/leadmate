import { validateScenario } from '../sim/scenery';
import { routeWalker, runScripted } from '../sim/harness';
import { activeDistractor, type SimInput, type SimState } from '../sim/sim';
import { closestOnSegment, segmentsCross } from '../sim/geometry';
import { distance } from '../sim/vec';
import { completeDaily, dateSeed, generateDailyStage, warmupAfterDaily } from './daily';
import { applyStage, newDogRecord, recordDailyScore } from './dogRecord';
import { isRusty, sessionCapacity } from './rusty';
import { payloadWith } from './testPayload';
import { localDateString } from './streak';

const noon = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const DATES = ['2026-01-01', '2026-02-28', '2026-05-17', '2026-10-20', '2026-12-31', '2027-03-08'];

describe('date seed', () => {
  it('is the same for a date and different for another', () => {
    expect(dateSeed('2026-05-17')).toBe(dateSeed('2026-05-17'));
    expect(dateSeed('2026-05-17')).not.toBe(dateSeed('2026-05-18'));
  });

  it('is built from the local calendar date, not the UTC one', () => {
    const lateEvening = new Date(2026, 4, 17, 23, 30);
    expect(localDateString(lateEvening)).toBe('2026-05-17');
  });
});

describe('Daily Stage generator', () => {
  it('generates the identical Stage for the same date, every time', () => {
    for (const date of DATES) expect(generateDailyStage(date)).toEqual(generateDailyStage(date));
  });

  it('fixes the corridor, the walls and the whole Distractor schedule by the date', () => {
    const a = generateDailyStage('2026-05-17');
    const b = generateDailyStage('2026-05-17');
    expect(b.waypoints).toEqual(a.waypoints);
    expect(b.waypoint).toEqual(a.waypoint);
    expect(b.walls).toEqual(a.walls);
    const schedule = (c: typeof a) => [c.distractor, ...c.moreDistractors].map((d) => [d.kind, d.speed, d.spawnAtSeconds, d.path]);
    expect(schedule(b)).toEqual(schedule(a));
    expect(schedule(a).length).toBeGreaterThanOrEqual(3);
  });

  it('makes a new layout and schedule on a new date', () => {
    const a = generateDailyStage('2026-05-17');
    const b = generateDailyStage('2026-05-18');
    expect(b.waypoints).not.toEqual(a.waypoints);
    expect([b.distractor, ...b.moreDistractors]).not.toEqual([a.distractor, ...a.moreDistractors]);
  });

  it.each(DATES)('makes a valid, dense Stage with the route clear of walls on %s', (date) => {
    const c = generateDailyStage(date);
    expect(validateScenario(c)).toEqual([]);
    const route = [c.handlerStart, ...c.waypoints, c.waypoint];
    for (const wall of c.walls) for (let i = 1; i < route.length; i++) expect(segmentsCross(route[i - 1], route[i], wall.from, wall.to)).toBe(false);
    // building blocks keep their distance from the route
    for (const wall of c.walls) for (let i = 1; i < route.length; i++) {
      expect(distance(closestOnSegment(wall.from, route[i - 1], route[i]), wall.from)).toBeGreaterThan(3.9);
    }
  });

  it('spawns the Distractors in order, by time', () => {
    const c = generateDailyStage('2026-10-20');
    const times = [c.distractor, ...c.moreDistractors].map((d) => d.spawnAtSeconds ?? 0);
    expect(times).toEqual([...times].sort((a, b) => a - b));
    expect(times[0]).toBeGreaterThan(0);
  });

  it.each(DATES)('can be walked to the end on %s, with the same result on a replay', (date) => {
    const c = generateDailyStage(date);
    const seed = dateSeed(date);
    const walk = routeWalker(c);
    const play = (s: SimState): SimInput => {
      const stand = s.dogMode === 'fixated' || s.dogMode === 'holding';
      const { direction, strength } = walk(s);
      return { direction, strength: stand ? 0 : strength, marker: false, cue: s.dogMode === 'fixated', cueType: 'lets-go' };
    };
    const first = runScripted(seed, play, c, 900);
    expect(first.state.ended).toBe(true);
    expect(activeDistractor(first.state)).toBeDefined();
    const second = runScripted(seed, play, c, 900);
    expect(second.payload).toEqual(first.payload);
    expect(first.payload.handlingScore).toBeGreaterThan(0);
  });
});

describe('Daily Stage winnability', () => {
  it('can be walked to the end, with solid props in the way, on 200 different dates', () => {
    for (let i = 0; i < 200; i++) {
      const date = new Date(Date.UTC(2026, 0, 1 + i)).toISOString().slice(0, 10);
      const c = generateDailyStage(date);
      expect(validateScenario(c)).toEqual([]);
      const walk = routeWalker(c);
      const { state } = runScripted(
        dateSeed(date),
        (s: SimState): SimInput => {
          const stand = s.dogMode === 'fixated' || s.dogMode === 'holding';
          const { direction, strength } = walk(s);
          return { direction, strength: stand ? 0 : strength, marker: false, cue: s.dogMode === 'fixated', cueType: 'lets-go' };
        },
        c,
        300,
      );
      if (!state.ended) throw new Error(`the Daily Stage of ${date} was not finished in 300 s`);
    }
  });
});

describe('Daily Stage lifecycle', () => {
  const played = () => applyStage(newDogRecord(), payloadWith({ followMarks: 3, posteSuccesses: 1, markerHits: 1, markerAccuracyMs: 100 }), noon(2026, 5, 10));

  it('records the score, credits the Streak on the first clear and clears Rusty Dog for the session', () => {
    const record = played();
    const done = completeDaily(record, payloadWith({ handlingScore: 640 }), noon(2026, 5, 17));
    expect(done).toMatchObject({ date: '2026-05-17', firstOfDay: true, streakCredited: true, best: 640 });
    expect(done.record.dailyBest).toEqual({ '2026-05-17': 640 });
    expect(done.record.streak).toEqual({ current: 1, best: 1, lastActiveDate: '2026-05-17' });
    expect(warmupAfterDaily('none')).toBe('completed');
    expect(warmupAfterDaily('skipped')).toBe('completed');
    // a Rusty Dog whose warm-up was skipped is back to full capacity afterwards
    expect(sessionCapacity(true, 'skipped')).toBeLessThan(1);
    expect(sessionCapacity(true, warmupAfterDaily('skipped'))).toBe(1);
  });

  it('leaves the Learning Attributes, Trigger Profile, posture, Nodes and last-Stage date untouched', () => {
    const record = { ...played(), completedNodes: ['poste-practice'] };
    const done = completeDaily(record, payloadWith({ handlingScore: 900, calmEncounters: { skateboard: 5 }, followMarks: 9 }), noon(2026, 5, 17));
    expect(done.record.attributes).toEqual(record.attributes);
    expect(done.record.triggerProfile).toEqual(record.triggerProfile);
    expect(done.record.calmCounts).toEqual(record.calmCounts);
    expect(done.record.posture).toBe(record.posture);
    expect(done.record.completedNodes).toEqual(['poste-practice']);
    expect(done.record.lastStageDate).toBe(record.lastStageDate);
    expect(done.record.posteFailures).toBe(record.posteFailures);
  });

  it('does not increment the Streak again on a replay the same day', () => {
    const first = completeDaily(newDogRecord(), payloadWith({ handlingScore: 400 }), noon(2026, 5, 17));
    const replay = completeDaily(first.record, payloadWith({ handlingScore: 700 }), noon(2026, 5, 17));
    expect(replay).toMatchObject({ firstOfDay: false, streakCredited: false, improved: true, best: 700 });
    expect(replay.record.streak.current).toBe(1);
  });

  it('keeps the better of two scores through replays', () => {
    let record = completeDaily(newDogRecord(), payloadWith({ handlingScore: 700 }), noon(2026, 5, 17)).record;
    record = completeDaily(record, payloadWith({ handlingScore: 500 }), noon(2026, 5, 17)).record;
    expect(record.dailyBest['2026-05-17']).toBe(700);
  });

  it('extends the Streak on the next day', () => {
    const day1 = completeDaily(newDogRecord(), payloadWith({ handlingScore: 100 }), noon(2026, 5, 17));
    const day2 = completeDaily(day1.record, payloadWith({ handlingScore: 100 }), noon(2026, 5, 18));
    expect(day2.record.streak.current).toBe(2);
    expect(day2.streakCredited).toBe(true);
  });

  it('does not credit the Streak twice when a Node already marked the day', () => {
    const fromNode = { ...newDogRecord(), streak: { current: 4, best: 4, lastActiveDate: '2026-05-17' } };
    const done = completeDaily(fromNode, payloadWith({ handlingScore: 100 }), noon(2026, 5, 17));
    expect(done.record.streak.current).toBe(4);
    expect(done.streakCredited).toBe(false);
  });

  it('does not make a Dog Rusty or less Rusty by itself', () => {
    const record = played();
    const done = completeDaily(record, payloadWith({ handlingScore: 100 }), noon(2026, 6, 30));
    expect(isRusty(done.record.lastStageDate, noon(2026, 6, 30))).toBe(isRusty(record.lastStageDate, noon(2026, 6, 30)));
  });

  it('scores are kept per date by the record', () => {
    const r = recordDailyScore(newDogRecord(), '2026-05-17', 321).record;
    expect(r.dailyBest).toEqual({ '2026-05-17': 321 });
  });
});
