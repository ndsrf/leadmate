import type { DogRecord } from '../dogRecord';
import { stopStatus, stopsOf, type WorldDef } from '../world';
import { progressAt } from '../plus';
import { isPuppyModuleId } from '../puppyTrack';

export interface StopCompletedProps {
  world_id: string;
  stop_id: string;
  stop_kind: 'lesson' | 'node' | 'mission';
  stop_index: number;
  [key: string]: unknown;
}

/**
 * Returns trail stops whose stopStatus transitioned from not 'done' to 'done'.
 * Skips Satellite Stops (which never gate anything and are not part of the main trail).
 * Returns empty array for identical records, replays, or owed missions.
 */
export function stopsNewlyDone(
  before: DogRecord,
  after: DogRecord,
  worlds: readonly WorldDef[],
  now: Date
): StopCompletedProps[] {
  if (before === after) return [];

  const beforeProgress = progressAt(before, now);
  const afterProgress = progressAt(after, now);

  const results: StopCompletedProps[] = [];

  for (const world of worlds) {
    const stops = stopsOf(world);
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      if (isPuppyModuleId(stop.id)) {
        continue;
      }

      const beforeStatus = stopStatus(stop, beforeProgress, now, worlds);
      const afterStatus = stopStatus(stop, afterProgress, now, worlds);

      if (beforeStatus.state !== 'done' && afterStatus.state === 'done') {
        results.push({
          world_id: world.id,
          stop_id: stop.id,
          stop_kind: stop.kind,
          stop_index: i,
        });
      }
    }
  }

  return results;
}
