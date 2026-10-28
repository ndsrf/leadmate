import type { DogRecord } from './dogRecord';
import type { Stars } from './stars';
import { shownStreak, type StreakRecord } from './streak';
import { isNodeOpen, isWorldUnlocked, WORLDS } from './world';
import { NODES } from './nodes/content';

/** What just finished: a Node's Debrief, a Mission check-in or a Daily Stage. */
export type Completion =
  | { kind: 'node'; nodeId: string }
  | { kind: 'mission'; missionId: string }
  | { kind: 'daily'; improved: boolean; firstOfDay: boolean; best: number };

export type Celebration =
  | { type: 'first-completion'; nodeId: string }
  | { type: 'mission-passed'; missionId: string }
  | { type: 'new-best-stars'; nodeId: string; stars: Stars }
  | { type: 'unlock-world'; worldId: string }
  | { type: 'unlock-node'; nodeId: string }
  | { type: 'streak-day'; days: number }
  | { type: 'daily-new-best'; score: number };

/** The stars a Node shows: its stored best, or 1 for a Node completed before stars existed; none when not completed. */
export function starsShown(record: Pick<DogRecord, 'completedNodes' | 'stars'>, nodeId: string): Stars | undefined {
  if (record.stars[nodeId] !== undefined) return record.stars[nodeId];
  return record.completedNodes.includes(nodeId) ? 1 : undefined;
}

/**
 * The celebrations earned by one completion, from the record before and after it. A pure diff: each
 * event appears at most once, and diffing a record against itself yields nothing, so revisiting a
 * screen never repeats one. Nothing here is ever taken away.
 */
export function celebrationsFor(before: DogRecord, after: DogRecord, completion: Completion): Celebration[] {
  const out: Celebration[] = [];
  if (completion.kind === 'node') {
    const id = completion.nodeId;
    const wasDone = before.completedNodes.includes(id);
    const isDone = after.completedNodes.includes(id);
    if (!wasDone && isDone) out.push({ type: 'first-completion', nodeId: id });
    const was = starsShown(before, id);
    const now = starsShown(after, id);
    if (wasDone && was !== undefined && now !== undefined && now > was) out.push({ type: 'new-best-stars', nodeId: id, stars: now });
  } else if (completion.kind === 'mission') {
    const id = completion.missionId;
    if (!before.missions[id]?.passedOn && after.missions[id]?.passedOn) out.push({ type: 'mission-passed', missionId: id });
  } else if (completion.improved && !completion.firstOfDay) {
    out.push({ type: 'daily-new-best', score: completion.best });
  }
  if (completion.kind !== 'daily') {
    const worldsOpened = WORLDS.filter((w) => !isWorldUnlocked(w, before) && isWorldUnlocked(w, after));
    for (const world of worldsOpened) out.push({ type: 'unlock-world', worldId: world.id });
    // a Node in a World that just opened is covered by that World's celebration
    for (const node of NODES) {
      if (worldsOpened.some((w) => w.stretches.flat().some((s) => s.kind === 'node' && s.id === node.id))) continue;
      if (!isNodeOpen(node, before) && isNodeOpen(node, after)) out.push({ type: 'unlock-node', nodeId: node.id });
    }
  }
  if (after.streak.lastActiveDate !== before.streak.lastActiveDate && after.streak.lastActiveDate !== '' && after.streak.current > 0) {
    out.push({ type: 'streak-day', days: after.streak.current });
  }
  return out;
}

export interface StreakStatus {
  /** Days to show; 0 when there is no running Streak. */
  days: number;
  /** `start` is a neutral invitation, never a loss message. */
  mode: 'running' | 'start';
}

/** The Streak chip's state: a lapsed Streak simply shows the neutral start state and nothing is stored or removed. */
export function streakStatus(streak: StreakRecord, today: string): StreakStatus {
  const days = shownStreak(streak, today);
  return days > 0 ? { days, mode: 'running' } : { days: 0, mode: 'start' };
}
