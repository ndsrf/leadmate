import { stopsNewlyDone } from './stops';
import { newDogRecord, passMissionDirectly, type DogRecord } from '../dogRecord';
import { WORLDS, stopsOf } from '../world';
import { markLessonRead } from '../lessons/lesson';
import { DOG_AS_DOG_NODE } from '../nodes/content';
import { markPuppyModuleCompleted } from '../puppyTrack';
import { NEW_MISSION } from '../missions/mission';

describe('stopsNewlyDone (Task 8.1)', () => {
  const now = new Date('2026-11-18T10:00:00Z');

  it('returns newly completed node with world_id, stop_id, stop_kind, and 0-based stop_index', () => {
    const before: DogRecord = newDogRecord();
    const after: DogRecord = {
      ...before,
      completedNodes: [DOG_AS_DOG_NODE.id],
    };

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done.length).toBe(1);
    expect(done[0]).toEqual({
      world_id: WORLDS[0].id,
      stop_id: DOG_AS_DOG_NODE.id,
      stop_kind: 'node',
      stop_index: stopsOf(WORLDS[0]).findIndex((s) => s.id === DOG_AS_DOG_NODE.id),
    });
  });

  it('replay of an already done Node returns nothing', () => {
    const before: DogRecord = {
      ...newDogRecord(),
      completedNodes: [DOG_AS_DOG_NODE.id],
    };
    const after: DogRecord = {
      ...before,
      // replayed: record may update other fields but completedNodes already had it
      stars: { [DOG_AS_DOG_NODE.id]: 3 },
    };

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done).toEqual([]);
  });

  it('identical record returns nothing', () => {
    const record: DogRecord = newDogRecord();
    expect(stopsNewlyDone(record, record, WORLDS, now)).toEqual([]);
  });

  it('newly read trail lesson returns stop_completed', () => {
    const before: DogRecord = newDogRecord();
    const world1Stops = stopsOf(WORLDS[0]);
    const lessonStop = world1Stops.find((s) => s.kind === 'lesson');
    expect(lessonStop).toBeDefined();

    const after = markLessonRead(before, lessonStop!.id, now);
    const done = stopsNewlyDone(before, after, WORLDS, now);

    expect(done.length).toBe(1);
    expect(done[0]).toEqual({
      world_id: WORLDS[0].id,
      stop_id: lessonStop!.id,
      stop_kind: 'lesson',
      stop_index: world1Stops.indexOf(lessonStop!),
    });
  });

  it('satellite stop returns nothing', () => {
    const before: DogRecord = { ...newDogRecord(), ageBand: 'puppy' };
    const after = markPuppyModuleCompleted(before, 'puppy-bite', now);

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done).toEqual([]);
  });

  it('mission that is only started returns nothing', () => {
    const before: DogRecord = newDogRecord();
    const after: DogRecord = {
      ...before,
      missions: {
        'mission-dog-as-dog': {
          ...NEW_MISSION,
          startedAt: now.toISOString(),
        },
      },
    };

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done).toEqual([]);
  });

  it('day skip that leaves mission owed returns nothing', () => {
    const before: DogRecord = newDogRecord();
    const after: DogRecord = {
      ...before,
      missions: {
        'mission-dog-as-dog': {
          ...NEW_MISSION,
          startedAt: now.toISOString(),
          skippedAt: now.toISOString(),
        },
      },
    };

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done).toEqual([]);
  });

  it('passing an owed mission returns it', () => {
    const world1Stops = stopsOf(WORLDS[0]);
    const missionStop = world1Stops.find((s) => s.kind === 'mission')!;
    expect(missionStop).toBeDefined();

    const before: DogRecord = {
      ...newDogRecord(),
      missions: {
        [missionStop.id]: {
          ...NEW_MISSION,
          startedAt: now.toISOString(),
          skippedAt: now.toISOString(),
        },
      },
    };
    const after = passMissionDirectly(before, missionStop.id, now);

    const done = stopsNewlyDone(before, after, WORLDS, now);
    expect(done.length).toBe(1);
    expect(done[0]).toEqual({
      world_id: WORLDS[0].id,
      stop_id: missionStop.id,
      stop_kind: 'mission',
      stop_index: world1Stops.indexOf(missionStop),
    });
  });
});
