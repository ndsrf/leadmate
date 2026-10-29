import type { TextKey } from '../i18n';
import type { DogRecord } from './dogRecord';
import { canCheckIn, checkInOpensAt, isOwed } from './missions/mission';
import { NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';

/** One place on a World's trail: a Lesson to read, a Node to play or a Mission to do on a real walk. */
export type Stop = { kind: 'lesson'; id: string } | { kind: 'node'; id: string } | { kind: 'mission'; id: string };

/** A World of the map: a titled trail of Stretches, opened by finishing the World before it. */
export interface WorldDef {
  id: string;
  title: TextKey;
  worldNumber: number;
  /** The trail: Stretches of Stops, each training one technique and ending in its Mission. */
  stretches: Stop[][];
  /** The World whose completion opens this one; absent for the first. */
  unlockedBy?: string;
  /** The thematic topics trained in this World. */
  topics: TextKey;
  /** Curriculum tier: free progression or LeadMate Plus. */
  tier?: 'free' | 'plus';
  /** True for roadmap preview worlds that do not yet have executable stages. */
  preview?: boolean;
  /** Planned Stop count of a preview World, whose `stretches` are empty. */
  nodeCount?: number;
}

const lesson = (id: string): Stop => ({ kind: 'lesson', id });
const node = (id: string): Stop => ({ kind: 'node', id });
const mission = (id: string): Stop => ({ kind: 'mission', id });

export const WORLDS: readonly WorldDef[] = [
  {
    id: 'home', title: 'world.1.title', worldNumber: 1, topics: 'world.1.topics', tier: 'free',
    stretches: [
      [lesson('theory-harness'), lesson('howto-tap-hold'), node('harness-ritual'), mission('mission-harness')],
      [lesson('theory-doorbell'), node('doorbell-mat'), mission('mission-doorbell')],
      [lesson('theory-poste'), node('poste-practice'), mission('mission-poste')],
    ],
  },
  {
    id: 'sidewalk', title: 'world.2.title', worldNumber: 2, unlockedBy: 'home', topics: 'world.2.topics', tier: 'free',
    stretches: [
      [lesson('theory-loose-leash'), lesson('howto-walking'), node('walk-distraction'), mission('mission-walk')],
      [lesson('theory-blind-corner'), node('blind-corner'), mission('mission-corners')],
      [lesson('theory-slack-u'), node('slack-u'), mission('mission-u-leash')],
    ],
  },
  {
    id: 'urban', title: 'world.3.title', worldNumber: 3, unlockedBy: 'sidewalk', topics: 'world.3.topics', tier: 'free',
    stretches: [
      [lesson('theory-leave-it'), lesson('howto-cues'), node('leave-it-intro'), mission('mission-leave-it')],
      [lesson('theory-visual-shields'), node('calm-zone-intro'), node('scooter-crossing'), mission('mission-shields')],
      [lesson('theory-choosing-cue'), node('urban-mix'), mission('mission-cue-choice')],
    ],
  },
  {
    id: 'park', title: 'world.4.title', worldNumber: 4, unlockedBy: 'urban', topics: 'world.4.topics', tier: 'free',
    stretches: [
      [lesson('theory-long-leash'), lesson('howto-long-leash'), node('park-jogger'), mission('mission-park-jogger')],
      [lesson('theory-park-mix'), node('park-mix'), mission('mission-park-mix')],
    ],
  },
  { id: 'recall', title: 'world.5.title', worldNumber: 5, stretches: [], unlockedBy: 'park', topics: 'world.5.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'cafe', title: 'world.6.title', worldNumber: 6, stretches: [], unlockedBy: 'recall', topics: 'world.6.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'trails', title: 'world.7.title', worldNumber: 7, stretches: [], unlockedBy: 'cafe', topics: 'world.7.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'crowds', title: 'world.8.title', worldNumber: 8, stretches: [], unlockedBy: 'trails', topics: 'world.8.topics', tier: 'plus', preview: true, nodeCount: 5 },
];

/**
 * What of the Dog record the trail reads, and whether the user has LeadMate Plus right now (`isPlus`), which opens
 * Plus Worlds; absent means a free user.
 */
export type Progress = Pick<DogRecord, 'completedNodes' | 'readLessons' | 'missions' | 'legacyNodes'> & { plus?: boolean };

/** Progress with only these Nodes completed (and nothing read, started or grandfathered). */
export function progressOf(completedNodes: readonly string[], more: Partial<Progress> = {}): Progress {
  return { completedNodes: [...completedNodes], readLessons: [], missions: {}, legacyNodes: [], ...more };
}

export function findWorld(id: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  return worlds.find((w) => w.id === id);
}

/** Every Stop of a World in trail order. */
export function stopsOf(world: WorldDef): Stop[] {
  return world.stretches.flat();
}

/** The Node ids of a World, in trail order. */
export function nodeIdsOf(world: WorldDef): string[] {
  return stopsOf(world).filter((s) => s.kind === 'node').map((s) => s.id);
}

export const sameStop = (a: Stop, b: Stop) => a.kind === b.kind && a.id === b.id;

/** Where a Stop sits: its World, its Stretch (0-based) and its index in that Stretch. */
export interface StopPlace {
  world: WorldDef;
  stretch: number;
  index: number;
}

export function placeOf(stop: Stop, worlds: readonly WorldDef[] = WORLDS): StopPlace | undefined {
  for (const world of worlds) {
    for (let stretch = 0; stretch < world.stretches.length; stretch++) {
      const index = world.stretches[stretch].findIndex((s) => sameStop(s, stop));
      if (index >= 0) return { world, stretch, index };
    }
  }
  return undefined;
}

/** The World number and 1-based Stretch number of a Lesson placed on a trail; undefined for a Library-only Lesson. */
export function placeOfLesson(lessonId: string, worlds: readonly WorldDef[] = WORLDS): { world: number; stretch: number } | undefined {
  const place = placeOf({ kind: 'lesson', id: lessonId }, worlds);
  return place && { world: place.world.worldNumber, stretch: place.stretch + 1 };
}

/** The Mission that ends a Stop's Stretch. */
export function missionOfStop(stop: Stop, worlds: readonly WorldDef[] = WORLDS): string | undefined {
  const place = placeOf(stop, worlds);
  const stretch = place?.world.stretches[place.stretch];
  const last = stretch?.[stretch.length - 1];
  return last?.kind === 'mission' ? last.id : undefined;
}

/** True when the Mission ends the last Stretch of its World: skipping it would open nothing, so it has no Day Skip. */
export function isLastMissionOfWorld(missionId: string, worlds: readonly WorldDef[] = WORLDS): boolean {
  const place = placeOf({ kind: 'mission', id: missionId }, worlds);
  if (!place) return false;
  const rest = place.world.stretches.slice(place.stretch).flat().slice(place.index + 1);
  return !rest.some((s) => s.kind === 'mission');
}

/** True when the Node is the last Node Stop of its Stretch, so closing its Debrief opens the Mission brief. */
export function isLastNodeOfStretch(nodeId: string, worlds: readonly WorldDef[] = WORLDS): boolean {
  const place = placeOf({ kind: 'node', id: nodeId }, worlds);
  if (!place) return false;
  const stretch = place.world.stretches[place.stretch];
  return stretch.slice(place.index + 1).every((s) => s.kind !== 'node');
}

/**
 * A Mission counts as passed for a Dog from before Missions (design decision 5): never started, and either a Node
 * Stop after it in its World is completed (the user already went past it, which the gate otherwise prevents), or
 * it is the World's last Mission and every Node Stop of its Stretch was completed before Missions existed.
 */
function isGrandfathered(world: WorldDef, stretch: number, progress: Progress): boolean {
  const own = world.stretches[stretch];
  const id = own[own.length - 1].id;
  if (progress.missions[id]?.startedAt) return false;
  const after = world.stretches.slice(stretch + 1).flat().filter((s) => s.kind === 'node');
  if (after.length > 0) return after.some((s) => progress.completedNodes.includes(s.id));
  const nodes = own.filter((s) => s.kind === 'node');
  return nodes.length > 0 && nodes.every((s) => progress.legacyNodes.includes(s.id));
}

/**
 * Done for gating, and whether that is only because a later Node of the World was already completed: a Lesson left
 * unread, or a Node added to the trail ahead of Nodes the user had already completed (the gate prevents it otherwise).
 * An Owed Mission is done for gating but `owed`, so it does not complete its World (ADR 0014).
 */
function doneness(world: WorldDef, stretch: number, index: number, progress: Progress): { done: boolean; satisfied?: boolean; grandfathered?: boolean; owed?: boolean } {
  const stop = world.stretches[stretch][index];
  if (stop.kind === 'mission') {
    if (progress.missions[stop.id]?.passedOn) return { done: true };
    if (isOwed(progress.missions[stop.id])) return { done: true, owed: true };
    return isGrandfathered(world, stretch, progress) ? { done: true, grandfathered: true } : { done: false };
  }
  if (stop.kind === 'node' ? progress.completedNodes.includes(stop.id) : progress.readLessons.includes(stop.id)) return { done: true };
  const later = [...world.stretches[stretch].slice(index + 1), ...world.stretches.slice(stretch + 1).flat()];
  const satisfied = later.some((s) => s.kind === 'node' && progress.completedNodes.includes(s.id));
  return satisfied ? { done: true, satisfied: true } : { done: false };
}

/** True when every Stop of the World is done (read, completed or passed, none owed); a preview World never is. */
export function isWorldComplete(world: WorldDef, progress: Progress): boolean {
  if (world.preview || world.stretches.length === 0) return false;
  return world.stretches.every((stops, s) => stops.every((_, i) => {
    const d = doneness(world, s, i, progress);
    return d.done && !d.owed;
  }));
}

/** A World is open when the one that unlocks it is complete; the first World is always open, and a Plus World needs Plus. */
export function isWorldUnlocked(world: WorldDef, progress: Progress, worlds: readonly WorldDef[] = WORLDS): boolean {
  if (world.tier === 'plus' && !progress.plus) return false;
  if (!world.unlockedBy) return true;
  const before = findWorld(world.unlockedBy, worlds);
  return before !== undefined && isWorldComplete(before, progress) && isWorldUnlocked(before, progress, worlds);
}

/** The World a Node belongs to. */
export function worldOfNode(nodeId: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  return worlds.find((w) => nodeIdsOf(w).includes(nodeId));
}

/** The Nodes of a World, in order. */
export function nodesOfWorld(world: WorldDef, nodes: readonly NodeDef[] = NODES): NodeDef[] {
  return nodeIdsOf(world).map((id) => nodes.find((n) => n.id === id)).filter((n): n is NodeDef => n !== undefined);
}

/** Why a Stop cannot be opened yet. */
export type StopLock =
  | { kind: 'world' }
  /** An earlier Mission of the World is not passed. */
  | { kind: 'mission'; id: string }
  /** Earlier Stops of the same Stretch are not done. */
  | { kind: 'stops'; stops: Stop[] }
  /** The Node's own prerequisite Nodes are missing. */
  | { kind: 'nodes'; ids: string[] };

/** Whether a Stop can be opened, independent of the time of day; null when it can. */
export function stopLock(stop: Stop, progress: Progress, worlds: readonly WorldDef[] = WORLDS, nodes: readonly NodeDef[] = NODES): StopLock | null {
  const place = placeOf(stop, worlds);
  if (!place) {
    // a Node off the trail (the guided first Stage) only needs its prerequisites
    const def = stop.kind === 'node' ? nodes.find((n) => n.id === stop.id) : undefined;
    const missing = def ? def.prerequisites.filter((id) => !progress.completedNodes.includes(id)) : [];
    return missing.length > 0 ? { kind: 'nodes', ids: missing } : null;
  }
  const { world, stretch, index } = place;
  if (!isWorldUnlocked(world, progress, worlds)) return { kind: 'world' };
  for (let s = 0; s < stretch; s++) {
    const last = world.stretches[s].length - 1;
    if (!doneness(world, s, last, progress).done) return { kind: 'mission', id: world.stretches[s][last].id };
  }
  const missing = world.stretches[stretch].slice(0, index).filter((_, i) => !doneness(world, stretch, i, progress).done);
  if (missing.length > 0) return { kind: 'stops', stops: missing };
  if (stop.kind === 'node') {
    const def = nodes.find((n) => n.id === stop.id);
    const ids = def ? def.prerequisites.filter((id) => !progress.completedNodes.includes(id)) : [];
    if (ids.length > 0) return { kind: 'nodes', ids };
  }
  return null;
}

export type StopState = 'locked' | 'open' | 'waiting' | 'owed' | 'done';

export interface StopStatus {
  state: StopState;
  lock?: StopLock;
  /** A Lesson left unread, or a Node left unplayed, behind a completed Node: done for gating, drawn open as optional, never next-up. */
  satisfied?: boolean;
  /** A Mission treated as passed for a Dog from before Missions. */
  grandfathered?: boolean;
  /** A waiting or owed Mission: when its check-in opens. */
  opensAt?: Date;
  /** An open or owed Mission whose check-in is due (as opposed to one not yet started). */
  checkInDue?: boolean;
}

/**
 * Where a Stop stands for the Dog at `now` (design decision 2). A satisfied Lesson or Node reports `open`; a started
 * Mission whose check-in has not opened reports `waiting`; an Owed Mission reports `owed`, due or not, unless its World is locked.
 */
export function stopStatus(stop: Stop, progress: Progress, now: Date, worlds: readonly WorldDef[] = WORLDS, nodes: readonly NodeDef[] = NODES): StopStatus {
  const place = placeOf(stop, worlds);
  const d = place ? doneness(place.world, place.stretch, place.index, progress) : { done: stop.kind === 'node' && progress.completedNodes.includes(stop.id) };
  const lock = stopLock(stop, progress, worlds, nodes);
  if (d.owed) {
    // an Owed Mission of a World that closed again (a Plus World after the trial) is locked with it
    if (lock?.kind === 'world') return { state: 'locked', lock };
    const state = progress.missions[stop.id];
    if (state && canCheckIn(state, now)) return { state: 'owed', checkInDue: true };
    return { state: 'owed', opensAt: (state && checkInOpensAt(state)) ?? undefined };
  }
  if (d.done && !d.satisfied) return d.grandfathered ? { state: 'done', grandfathered: true } : { state: 'done' };
  if (lock) return { state: 'locked', lock };
  if (d.satisfied) return { state: 'open', satisfied: true };
  if (stop.kind === 'mission') {
    const state = progress.missions[stop.id];
    if (state?.startedAt) {
      if (canCheckIn(state, now)) return { state: 'open', checkInDue: true };
      return { state: 'waiting', opensAt: checkInOpensAt(state) ?? undefined };
    }
  }
  return { state: 'open' };
}

/** A Node can be started when its Stop is open (or done, for a replay). */
export function isNodeOpen(node: NodeDef, progress: Progress, worlds: readonly WorldDef[] = WORLDS): boolean {
  return stopLock({ kind: 'node', id: node.id }, progress, worlds) === null;
}

/** The World to open the map on: the first playable one not yet complete (the last playable one when all are). */
export function currentWorld(progress: Progress, worlds: readonly WorldDef[] = WORLDS): WorldDef {
  const playable = worlds.filter((w) => !w.preview);
  return playable.find((w) => !isWorldComplete(w, progress)) ?? (playable[playable.length - 1] ?? worlds[0]);
}
