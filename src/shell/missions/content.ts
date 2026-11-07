import type { TextKey } from '../../i18n';
import type { Fix, MissionDef } from './mission';
import { getActiveContent } from '../content/runtime';

/** The Missions that end each Stretch of the playable Worlds, resolved from the active Content Pack. */
export const MISSIONS: readonly MissionDef[] = new Proxy([] as unknown as readonly MissionDef[], {
  get(_target, prop, receiver) {
    const missions = getActiveContent().resolved.missions;
    const value = Reflect.get(missions, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(missions);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getActiveContent().resolved.missions, prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getActiveContent().resolved.missions);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getActiveContent().resolved.missions, prop);
  },
});

export function findMission(id: string): MissionDef | undefined {
  return MISSIONS.find((m) => m.id === id);
}

/** Every Fix of every Mission, with the Mission and problem it belongs to; for the Library's "Tus ajustes". */
export function findFix(fixId: string): { mission: MissionDef; fix: Fix; problem: TextKey } | undefined {
  for (const m of MISSIONS) {
    const problem = m.problems.find((p) => p.fix.id === fixId);
    if (problem) return { mission: m, fix: problem.fix, problem: problem.label };
    if (m.generalFix.id === fixId) return { mission: m, fix: m.generalFix, problem: 'mission.problem.other' };
  }
  return undefined;
}
