import { answerAlone, migrateRecord, newDogRecord, setHomeConcern, shouldAskAlone, type DogRecord } from './dogRecord';
import { hasDedicatedLesson } from './homeBehaviours';
import { findWorld, stopsOf, worldsFor } from './world';

/** A Dog that finished the Basics World, so World 2 is open. */
function inWorldTwo(more: Partial<DogRecord> = {}): DogRecord {
  const base = newDogRecord();
  const stops = stopsOf(findWorld('basics')!);
  return {
    ...base,
    readLessons: stops.filter((s) => s.kind === 'lesson').map((s) => s.id),
    completedNodes: stops.filter((s) => s.kind === 'node').map((s) => s.id),
    missions: Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z', passedOn: '2026-05-02' }])),
    ...more,
  };
}

/** Finishes every Stop of World 2 for the Dog. */
function worldTwoDone(r: DogRecord): DogRecord {
  const home = worldsFor(r.onboarding.plan, r).find((w) => w.id === 'home')!;
  const stops = stopsOf(home);
  return {
    ...r,
    readLessons: [...r.readLessons, ...stops.filter((s) => s.kind === 'lesson').map((s) => s.id)],
    completedNodes: [...r.completedNodes, ...stops.filter((s) => s.kind === 'node').map((s) => s.id)],
    missions: { ...r.missions, ...Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, { target: 'full' as const, skipRun: 0, attempts: [], startedAt: '2026-05-01T08:00:00.000Z', passedOn: '2026-05-02' }])) },
  };
}

describe('aloneAnswer on the Dog record', () => {
  it('reads a version 10 record as version 11 with no answer and every other field equal', () => {
    const v11 = newDogRecord();
    const v10 = { ...v11, version: 10 };
    const read = migrateRecord(v10);
    expect(read.version).toBe(11);
    expect(read.aloneAnswer).toBeUndefined();
    expect({ ...read, version: 0 }).toEqual({ ...v11, version: 0 });
  });

  it('keeps a valid answer and drops a junk value', () => {
    expect(migrateRecord({ version: 11, aloneAnswer: 'bad' }).aloneAnswer).toBe('bad');
    expect(migrateRecord({ version: 11, aloneAnswer: 'terrible' }).aloneAnswer).toBeUndefined();
    expect(migrateRecord({ version: 11, aloneAnswer: 3 }).aloneAnswer).toBeUndefined();
  });
});

describe('answerAlone', () => {
  it('"ok" records the answer and creates no Concern', () => {
    const r = answerAlone(newDogRecord(), 'ok');
    expect(r.aloneAnswer).toBe('ok');
    expect(r.homeConcerns.alone).toBeUndefined();
    expect(r.worldHome ?? []).not.toContain('alone');
  });

  it('"sometimes" sets level 2 and joins World 2', () => {
    const r = answerAlone(newDogRecord(), 'sometimes');
    expect(r.aloneAnswer).toBe('sometimes');
    expect(r.homeConcerns.alone).toBe(2);
    expect(r.worldHome).toContain('alone');
  });

  it('"bad" sets level 3 and joins World 2', () => {
    const r = answerAlone(newDogRecord(), 'bad');
    expect(r.aloneAnswer).toBe('bad');
    expect(r.homeConcerns.alone).toBe(3);
    expect(r.worldHome).toContain('alone');
  });

  it('"unknown" records the answer and creates no Concern', () => {
    const r = answerAlone(newDogRecord(), 'unknown');
    expect(r.aloneAnswer).toBe('unknown');
    expect(r.homeConcerns.alone).toBeUndefined();
  });

  it('after World 2 is complete the Concern stays out of World 2 (in Other Home Behaviours) but the question counts as answered', () => {
    const done = worldTwoDone(inWorldTwo());
    const r = answerAlone(done, 'bad');
    expect(r.homeConcerns.alone).toBe(3);
    expect(r.worldHome ?? []).not.toContain('alone');
    expect(r.aloneAnswer).toBe('bad');
  });

  it('is not progress: streak, diary, activity log and stars are untouched', () => {
    const before = inWorldTwo();
    for (const answer of ['ok', 'sometimes', 'bad', 'unknown'] as const) {
      const after = answerAlone(before, answer);
      expect(after.streak).toEqual(before.streak);
      expect(after.walkDiary).toEqual(before.walkDiary);
      expect(after.activityLog).toEqual(before.activityLog);
      expect(after.stars).toEqual(before.stars);
    }
  });
});

describe('making being alone a Concern another way', () => {
  it('counts as answered, by level, only when no answer is kept yet', () => {
    expect(setHomeConcern(newDogRecord(), 'alone', 1).aloneAnswer).toBe('sometimes');
    expect(setHomeConcern(newDogRecord(), 'alone', 2).aloneAnswer).toBe('sometimes');
    expect(setHomeConcern(newDogRecord(), 'alone', 3).aloneAnswer).toBe('bad');
    expect(setHomeConcern(answerAlone(newDogRecord(), 'unknown'), 'alone', 3).aloneAnswer).toBe('unknown');
    expect(setHomeConcern(newDogRecord(), 'alone', 0).aloneAnswer).toBeUndefined();
    expect(setHomeConcern(newDogRecord(), 'destroy', 2).aloneAnswer).toBeUndefined();
  });
});

describe('shouldAskAlone', () => {
  const lesson = hasDedicatedLesson('alone');

  it('asks a Dog in World 2 with no answer once there is a Lesson', () => {
    expect(shouldAskAlone(inWorldTwo())).toBe(lesson);
  });

  it('does not ask with World 2 locked', () => {
    expect(shouldAskAlone(newDogRecord())).toBe(false);
  });

  it('does not ask once answered or activated elsewhere', () => {
    expect(shouldAskAlone(answerAlone(inWorldTwo(), 'ok'))).toBe(false);
    expect(shouldAskAlone(setHomeConcern(inWorldTwo(), 'alone', 1))).toBe(false);
  });

  it('still asks after World 2 is complete', () => {
    expect(shouldAskAlone(worldTwoDone(inWorldTwo()))).toBe(lesson);
  });
});
