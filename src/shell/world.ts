import type { TextKey, Translate } from '../i18n';
import type { DogRecord } from './dogRecord';
import type { HomeConcern, HomeConcerns } from './concerns';
import { homeConcernOfStop, homeStretchStops, homeStretchesInWorldTwo } from './homeBehaviours';
import { canCheckIn, checkInOpensAt, isOwed } from './missions/mission';
import { ALL_NODES as NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';
import { requiredLessonsOf } from './nodes/readDog';
import { getActiveContent } from './content/runtime';

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

/** The static trail of Worlds, resolved from the active Content Pack. */
export const WORLDS: readonly WorldDef[] = new Proxy([] as unknown as readonly WorldDef[], {
  get(_target, prop, receiver) {
    const worlds = getActiveContent().resolved.worlds;
    const value = Reflect.get(worlds, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(worlds);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getActiveContent().resolved.worlds, prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getActiveContent().resolved.worlds);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getActiveContent().resolved.worlds, prop);
  },
});

/**
 * What of the Dog record the trail reads, and whether the user has LeadMate Plus right now (`isPlus`), which opens
 * Plus Worlds; absent means a free user.
 */
export type Progress = Pick<DogRecord, 'completedNodes' | 'readLessons' | 'missions' | 'legacyNodes'> & {
  plus?: boolean;
  /** The Dog's Home Concerns and the Home Stretches that belong to World 2; read by `worldsFor` only. */
  homeConcerns?: HomeConcerns;
  worldHome?: DogRecord['worldHome'];
  /**
   * Ids of Worlds the user completed. A World that completed once keeps opening the World after it, even when a content
   * update later adds Stretches to it and it is open again (it never relocks what it unlocked).
   */
  completedWorlds?: readonly string[];
};

/** Progress with only these Nodes completed (and nothing read, started or grandfathered). */
export function progressOf(completedNodes: readonly string[], more: Partial<Progress> = {}): Progress {
  return { completedNodes: [...completedNodes], readLessons: [], missions: {}, legacyNodes: [], ...more };
}

/** A World's visible title, "Mundo 2 · Casa y umbrales": its number and its name, which is keyed by id. */
export function worldTitle(world: Pick<WorldDef, 'title' | 'worldNumber'>, t: Translate): string {
  return t('world.numbered').replace('{n}', String(world.worldNumber)).replace('{title}', t(world.title));
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

/** The id of a Stretch: the id of its first Stop. */
export const stretchIdOf = (stretch: readonly Stop[]): string => stretch[0].id;

/** The Stretch a plan item names, with its World; undefined for an unknown id. */
export function findStretch(stretchId: string, worlds: readonly WorldDef[] = WORLDS): { world: WorldDef; stretch: number; stops: Stop[] } | undefined {
  for (const world of worlds) {
    const stretch = world.stretches.findIndex((stops) => stops.length > 0 && stretchIdOf(stops) === stretchId);
    if (stretch >= 0) return { world, stretch, stops: world.stretches[stretch] };
  }
  return undefined;
}

/** The id of the Stretch holding the Stop with this id (a Node id of an old plan, for one); undefined when none does. */
export function stretchIdContaining(stopId: string, worlds: readonly WorldDef[] = WORLDS): string | undefined {
  for (const world of worlds) for (const stops of world.stretches) if (stops.some((s) => s.id === stopId)) return stretchIdOf(stops);
  return undefined;
}

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
  // a Home Stretch is a Stretch of World 2 only for a Dog that has the Concern; off the trail it still ends in its Mission
  const stretch = place ? place.world.stretches[place.stretch] : homeStretchOfStop(stop);
  const last = stretch?.[stretch.length - 1];
  return last?.kind === 'mission' ? last.id : undefined;
}

/** The Home Stretch holding a Stop, whether or not it is in World 2; undefined for any other Stop. */
function homeStretchOfStop(stop: Stop): Stop[] | undefined {
  return homeStretchStops().map((h) => h.stops).find((stops) => stops.some((s) => sameStop(s, stop)));
}

/** The World holding the Lesson with this id, if placed on a World's trail or Home Stretch; undefined otherwise. */
export function worldOfLesson(lessonId: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  const place = placeOf({ kind: 'lesson', id: lessonId }, worlds);
  if (place) return place.world;
  if (homeStretchOfStop({ kind: 'lesson', id: lessonId })) return findWorld('home', worlds);
  return undefined;
}

/** The stops of the Stretch holding the Lesson with this id, looking across worlds and Home Stretches. */
export function stretchStopsContainingLesson(lessonId: string, worlds: readonly WorldDef[] = WORLDS): Stop[] | undefined {
  const place = placeOf({ kind: 'lesson', id: lessonId }, worlds);
  if (place) return place.world.stretches[place.stretch];
  return homeStretchOfStop({ kind: 'lesson', id: lessonId });
}

/** The Node ids of the Stretch containing the Lesson with this id. */
export function nodesOfStretchContainingLesson(lessonId: string, worlds: readonly WorldDef[] = WORLDS): string[] {
  const stops = stretchStopsContainingLesson(lessonId, worlds);
  return stops ? stops.filter((s) => s.kind === 'node').map((s) => s.id) : [];
}

/**
 * True when the lesson's stretch is completed: either a Node in the stretch is completed,
 * or (for node-less stretches) the stretch's Mission has been started or passed.
 */
export function isLessonStretchCompleted(lessonId: string, progress: Progress, worlds: readonly WorldDef[] = WORLDS): boolean {
  const stops = stretchStopsContainingLesson(lessonId, worlds);
  if (!stops) return false;
  const nodes = stops.filter((s) => s.kind === 'node');
  if (nodes.length > 0) {
    return nodes.some((n) => progress.completedNodes.includes(n.id));
  }
  const mission = stops.find((s) => s.kind === 'mission');
  if (mission) {
    const m = progress.missions[mission.id];
    return !!(m?.startedAt || m?.passedOn);
  }
  return false;
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
  const stretch = place ? place.world.stretches[place.stretch] : homeStretchOfStop({ kind: 'node', id: nodeId });
  if (!stretch) return false;
  const index = stretch.findIndex((s) => s.kind === 'node' && s.id === nodeId);
  return stretch.slice(index + 1).every((s) => s.kind !== 'node');
}

/**
 * True when the Stretch was inserted ahead of a Stretch the user had already reached (design Decision 11 of
 * rethink-unpredictable-walk-stage), told from progress alone: its Mission is neither passed nor owed, yet a Node is
 * completed or a Mission started in a later Stretch, which the Mission gate otherwise prevents. A Lesson read does not
 * count (the Library opens any Lesson), nor a Home Stretch (it keeps ADR 0023's rules), nor a user from before Missions
 * (a completed later Node is a legacy Node: their Mission is grandfathered instead).
 */
function isInserted(world: WorldDef, stretch: number, progress: Progress): boolean {
  const own = world.stretches[stretch];
  const last = own[own.length - 1];
  if (last.kind !== 'mission' || homeConcernOfStop(own[0])) return false;
  const state = progress.missions[last.id];
  if (state?.passedOn || isOwed(state)) return false;
  const later = world.stretches.slice(stretch + 1).filter((stops) => !homeConcernOfStop(stops[0])).flat();
  const completed = later.filter((s) => s.kind === 'node' && progress.completedNodes.includes(s.id));
  if (completed.some((s) => progress.legacyNodes.includes(s.id))) return false;
  return completed.length > 0 || later.some((s) => s.kind === 'mission' && !!progress.missions[s.id]?.startedAt);
}

/**
 * A Mission counts as passed for a Dog from before Missions (design decision 5): never started, and either a Node
 * Stop after it in its World is completed (the user already went past it, which the gate otherwise prevents), or
 * it is the World's last Mission and every Node Stop of its Stretch was completed before Missions existed.
 */
function isGrandfathered(world: WorldDef, stretch: number, progress: Progress): boolean {
  const own = world.stretches[stretch];
  const id = own[own.length - 1].id;
  if (progress.missions[id]?.startedAt || isInserted(world, stretch, progress)) return false;
  // a Home Node played from Other Home Behaviours before it joined World 2 says nothing about the Stops before it
  const after = world.stretches.slice(stretch + 1).flat().filter((s) => s.kind === 'node' && !homeConcernOfStop(s));
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
  // an inserted Stretch is played in order: what the user did in the Stretches after it does not satisfy its Stops
  const later = [...world.stretches[stretch].slice(index + 1), ...(isInserted(world, stretch, progress) ? [] : world.stretches.slice(stretch + 1).flat())];
  // in a World the user completed, a Mission passed after it also satisfies it: the Stop was added to a finished Stretch
  const grown = progress.completedWorlds?.includes(world.id) ?? false;
  const satisfied = later.some((s) => (s.kind === 'node' && !homeConcernOfStop(s) && progress.completedNodes.includes(s.id)) || (grown && s.kind === 'mission' && !!progress.missions[s.id]?.passedOn));
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

/**
 * True when every Stretch of the World is done except Stretches inserted ahead of ones the user reached: such a
 * Stretch's Mission stays to do, but it does not lock the next World the user could already reach (design Decision 11).
 */
function isCompleteButInserted(world: WorldDef, progress: Progress): boolean {
  if (world.preview || world.stretches.length === 0) return false;
  let inserted = false;
  const rest = world.stretches.every((stops, s) => {
    if (isInserted(world, s, progress)) return (inserted = true);
    return stops.every((_, i) => {
      const d = doneness(world, s, i, progress);
      return d.done && !d.owed;
    });
  });
  return inserted && rest;
}

/** A World is open when the one that unlocks it is complete; the first World is always open, and a Plus World needs Plus. */
export function isWorldUnlocked(world: WorldDef, progress: Progress, worlds: readonly WorldDef[] = WORLDS): boolean {
  if (world.tier === 'plus' && !progress.plus) return false;
  if (!world.unlockedBy) return true;
  const before = findWorld(world.unlockedBy, worlds);
  if (before === undefined) return false;
  const finished = isWorldComplete(before, progress) || (progress.completedWorlds?.includes(before.id) ?? false) || isCompleteButInserted(before, progress);
  return finished && isWorldUnlocked(before, progress, worlds);
}

/** True when a playable World's pack plans more Stops than it holds yet: the map says more Stretches are coming. */
export function hasMoreComing(world: Pick<WorldDef, 'preview' | 'nodeCount' | 'stretches'>): boolean {
  return !world.preview && world.stretches.length > 0 && (world.nodeCount ?? 0) > world.stretches.flat().length;
}

/** The Worlds this progress has completed, kept ahead of `stored` so a World never drops off the list by growing. */
export function completedWorldIds(progress: Progress, worlds: readonly WorldDef[] = WORLDS): string[] {
  const ids = new Set(progress.completedWorlds ?? []);
  for (const w of worlds) if (isWorldComplete(w, progress)) ids.add(w.id);
  return [...ids];
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
  /** Earlier Stops of the same Stretch are not done (a Lesson is never locked this way), or a Lesson the Node requires is unread (it must have been read, even when its Stretch is done). */
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
  // a Home Stretch the Dog already started stays open when it moved into a World that is still closed
  const startedHome = !!homeStretchOfStop(stop) && touched(world.stretches[stretch], progress);
  if (!isWorldUnlocked(world, progress, worlds) && !startedHome) return { kind: 'world' };
  for (let s = 0; s < stretch; s++) {
    const last = world.stretches[s].length - 1;
    const lastStop = world.stretches[s][last];
    // a Stretch inserted ahead of one the user already reached does not lock what they could reach before it
    if (isInserted(world, s, progress)) continue;
    if (!doneness(world, s, last, progress).done) {
      return lastStop.kind === 'mission' ? { kind: 'mission', id: lastStop.id } : { kind: 'stops', stops: [lastStop] };
    }
  }
  // the Lessons of a Stretch are all open at once; a Node or Mission needs every Stop before it done
  // a Node that opens after one Lesson (the close-view drill) does not wait for the Stretch's other Lessons
  const opensAfterLesson = stop.kind === 'node' ? nodes.find((n) => n.id === stop.id)?.opensAfterLesson : undefined;
  // a Mission the user already started stays reachable when Stops are added before it
  const startedMission = stop.kind === 'mission' && !!progress.missions[stop.id]?.startedAt;
  if (stop.kind !== 'lesson' && !startedMission) {
    const missing = world.stretches[stretch].slice(0, index).filter((s, i) => !(opensAfterLesson && s.kind === 'lesson') && !doneness(world, stretch, i, progress).done);
    if (missing.length > 0) return { kind: 'stops', stops: missing };
  }
  if (stop.kind === 'node') {
    const def = nodes.find((n) => n.id === stop.id);
    const unread = def ? requiredLessonsOf(def).filter((id) => !progress.readLessons.includes(id)).map((id): Stop => ({ kind: 'lesson', id })) : [];
    if (unread.length > 0) return { kind: 'stops', stops: unread };
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

/** True when the user has done anything in the Stretch: read a Lesson, completed a Node or started a Mission. */
function touched(stops: readonly Stop[], progress: Progress): boolean {
  return stops.some((s) => (s.kind === 'lesson' ? progress.readLessons.includes(s.id) : s.kind === 'node' ? progress.completedNodes.includes(s.id) : !!progress.missions[s.id]?.startedAt));
}

/**
 * The Worlds as this Dog walks them (ADR 0023): the Home Stretches of the Dog's Concerns join World 2, placed at
 * the beginning in Personal Plan order (biting first), followed by threshold Stretches. World 1 is strictly fixed
 * to its 3 foundational Stretches. Inside later Worlds, the Stretches the Personal Plan names come first, in plan
 * order, after any Stretch the user has already started (those keep their place so no progress moves). A Home Stretch
 * the plan does not name follows the plan's, biting first. A Stretch never moves before the Stretch holding a
 * prerequisite Node of one of its Nodes, or the Lesson one of them requires. With no plan and no Home Stretch this is `WORLDS`.
 */
export function worldsFor(plan: readonly { stretchId: string }[], progress: Progress, worlds: readonly WorldDef[] = WORLDS, nodes: readonly NodeDef[] = NODES): readonly WorldDef[] {
  const home = homeStretchesInWorldTwo(progress.homeConcerns ?? {}, progress.worldHome, (stops) => touched(stops, progress)).map((h) => h.stops);
  if (plan.length === 0 && home.length === 0) return worlds;
  let changed = false;
  const out = worlds.map((world) => {
    const own = world.id === 'home' ? home.filter((h) => !world.stretches.some((s) => stretchIdOf(s) === stretchIdOf(h))) : [];
    const all = [...world.stretches, ...own];
    if (all.length < 2) return world;
    const levelOf = (stops: Stop[]) => progress.homeConcerns?.[homeConcernOfStop(stops[0]) as HomeConcern] ?? 0;
    // a Home Stretch the plan does not name (it holds at most five) follows the plan's, the stronger Concern first
    const indexInPlan = (stops: Stop[]) => {
      const i = plan.findIndex((p) => p.stretchId === stretchIdOf(stops));
      return i >= 0 ? i : plan.length + (own.includes(stops) ? (4 - levelOf(stops)) / 10 : 1);
    };
    // In World 2: declared Home Stretches (biting first, then other home in plan order), followed by threshold Stretches
    const BITING_HOME = ['bite-owner', 'bite-others'];
    const group = (stops: Stop[], original: number) => {
      if (world.id !== 'home') return 0;
      if (own.includes(stops)) return BITING_HOME.includes(homeConcernOfStop(stops[0]) ?? '') ? 0 : 1;
      return 2;
    };
    // started Stretches first, then the plan's Stretches in plan order, then the rest in trail order
    const sorted = all
      .map((stops, original) => {
        const started = touched(stops, progress);
        if (world.id === 'basics') return { stops, key: [0, 0, 0, original] };
        if (world.id !== 'home') return { stops, key: started || plan.length === 0 ? [0, 0, 0, original] : [1, 0, indexInPlan(stops), original] };
        const stretchGroup = group(stops, original);
        const isHomeStretch = stretchGroup < 2;
        return { stops, key: [isHomeStretch ? 0 : 1, started ? 0 : 1, stretchGroup, indexInPlan(stops), original] };
      })
      .sort((a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1] || a.key[2] - b.key[2] || a.key[3] - b.key[3] || (a.key[4] ?? 0) - (b.key[4] ?? 0));
    // a Stretch never moves before the Stretch that holds a prerequisite Node, or a Lesson required by one of its Nodes, or it could not be opened
    const placed: Stop[][] = [];
    const pending = sorted.map((s) => s.stops);
    const holds = (stops: Stop[], stop: Stop) => stops.some((x) => sameStop(x, stop));
    const needs = (stops: Stop[]) => all.filter((other) => other !== stops && stops.some((x) => {
      const def = x.kind === 'node' ? nodes.find((n) => n.id === x.id) : undefined;
      return def !== undefined
        && (def.prerequisites.some((pre) => holds(other, { kind: 'node', id: pre })) || requiredLessonsOf(def).some((id) => holds(other, { kind: 'lesson', id })));
    }));
    while (pending.length > 0) {
      const next = pending.findIndex((stops) => needs(stops).every((dep) => placed.includes(dep)));
      placed.push(...pending.splice(next < 0 ? 0 : next, 1));
    }
    const stretches = placed;
    if (stretches.length === world.stretches.length && stretches.every((s, i) => s === world.stretches[i])) return world;
    changed = true;
    return { ...world, stretches };
  });
  return changed ? out : worlds;
}
