import type { DogRecord } from './dogRecord';
import { NEW_MISSION } from './missions/mission';
import { findWorld, stopsOf } from './world';

type TrailProgress = Pick<DogRecord, 'completedNodes' | 'readLessons' | 'missions'>;

/**
 * Test fixture: `p` with the Basics World done (its Lessons read, Nodes completed and Missions passed), the way a
 * user who has moved on to Home & Thresholds has it. Ids and Mission states already in `p` are kept.
 */
export function withBasicsDone<T extends TrailProgress>(p: T): T {
  const stops = stopsOf(findWorld('basics')!);
  const ids = (kind: 'lesson' | 'node') => stops.filter((s) => s.kind === kind).map((s) => s.id);
  const passed = Object.fromEntries(stops.filter((s) => s.kind === 'mission').map((s) => [s.id, { ...NEW_MISSION, passedOn: '2026-04-01' }]));
  return {
    ...p,
    completedNodes: [...new Set([...ids('node'), ...p.completedNodes])],
    readLessons: [...new Set([...ids('lesson'), ...p.readLessons])],
    missions: { ...passed, ...p.missions },
  };
}
