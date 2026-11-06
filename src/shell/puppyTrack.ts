import type { TextKey } from '../i18n';
import type { DogRecord } from './dogRecord';
import { markLessonRead, type LessonDef } from './lessons/lesson';
import { PUPPY_LESSONS } from './lessons/content';

export { PUPPY_LESSONS };

export const PUPPY_BITE_ID = 'puppy-bite';
export const PUPPY_SOUND_ID = 'puppy-sound';
export const PUPPY_VET_ID = 'puppy-vet';

export const PUPPY_MODULE_IDS = [PUPPY_BITE_ID, PUPPY_SOUND_ID, PUPPY_VET_ID] as const;
export type PuppyModuleId = (typeof PUPPY_MODULE_IDS)[number];

export function isPuppyModuleId(id: string): id is PuppyModuleId {
  return PUPPY_MODULE_IDS.includes(id as PuppyModuleId);
}

/** Satellite stops in World 1 render exclusively when ageBand === 'puppy'. */
export function isPuppyRecord(record: { ageBand?: DogRecord['ageBand'] | null }): boolean {
  return record.ageBand === 'puppy';
}

/** True when this puppy companion module has been read / completed. */
export function isPuppyModuleCompleted(record: Pick<DogRecord, 'readLessons'>, id: PuppyModuleId): boolean {
  return record.readLessons.includes(id);
}

/** Marks a puppy module as completed in the Dog record's readLessons. */
export const markPuppyModuleCompleted = markLessonRead;

/** Defines how a puppy satellite stop anchors to a Stretch's key node in World 1. */
export interface PuppySatelliteStopDef {
  id: PuppyModuleId;
  lessonId: PuppyModuleId;
  /** The stop ID in World 1 this satellite stop anchors beside. */
  parentStopId: string;
  /** Index of the Stretch in World 1 (0: calm-hands, 1: home-rest, 2: calm-first). */
  stretchIndex: number;
  title: TextKey;
}

export const PUPPY_SATELLITE_STOPS: readonly PuppySatelliteStopDef[] = [
  {
    id: 'puppy-bite',
    lessonId: 'puppy-bite',
    parentStopId: 'calm-hands',
    stretchIndex: 0,
    title: 'trail.puppy-bite.title',
  },
  {
    id: 'puppy-sound',
    lessonId: 'puppy-sound',
    parentStopId: 'theory-home-rest',
    stretchIndex: 1,
    title: 'trail.puppy-sound.title',
  },
  {
    id: 'puppy-vet',
    lessonId: 'puppy-vet',
    parentStopId: 'theory-calm-first',
    stretchIndex: 2,
    title: 'trail.puppy-vet.title',
  },
];

export function satelliteStopForParent(parentStopId: string): PuppySatelliteStopDef | undefined {
  return PUPPY_SATELLITE_STOPS.find((s) => s.parentStopId === parentStopId);
}
