import type { TextKey } from '../i18n';
import type { PlanItem } from './concerns';
import { starsShown } from './celebrations';
import { LESSONS } from './lessons/content';
import type { LessonDef } from './lessons/lesson';
import { MISSIONS } from './missions/content';
import { checkInOpensAt, opensAtMidnight, type MissionDef, type MissionState } from './missions/mission';
import { ALL_NODES as NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';
import type { Stars } from './stars';
import { findStretch, isWorldComplete, isWorldUnlocked, stopStatus, type Progress, type Stop, type StopLock, type WorldDef, WORLDS } from './world';

export type NodeState = 'locked' | 'open' | 'next' | 'waiting' | 'owed' | 'done';

/** What a Stop is, for its glyph and label: a theory or How-to-play Lesson, a Node or a Mission. */
export type StopKind = 'theory' | 'how-to-play' | 'node' | 'mission';

export interface MapStop {
  stop: Stop;
  kind: StopKind;
  title: TextKey;
  state: NodeState;
  /** 0-based Stretch of the World the Stop belongs to. */
  stretch: number;
  /** The Node of a Node Stop. */
  node?: NodeDef;
  /** Stars of a completed Node Stop (1 for one completed before stars existed); absent otherwise. */
  stars?: Stars;
  /** Why a locked Stop cannot open. */
  lock?: StopLock;
  /** An unread Lesson behind a completed Node: drawn open with an "optional" mark, never next-up. */
  optional?: boolean;
  /** A Mission passed with "Move on anyway". */
  keepPractising?: boolean;
  /** A waiting or owed Mission: when the check-in opens, and whether that is the next midnight ("Mañana"). */
  opensAt?: Date;
  opensTomorrow?: boolean;
  /** An open or owed Mission whose check-in is due: its badge reads "¿Cómo fue?". */
  checkInDue?: boolean;
  /** An Owed Mission, kept when it becomes next-up so it still shows its "Pendiente" mark. */
  owed?: boolean;
  /** Next-up because the Personal Plan names its Stretch: drawn with a "Start here" mark. */
  startHere?: boolean;
}

export interface MapWorld {
  world: WorldDef;
  unlocked: boolean;
  /** An unlocked Completed World: every Stop done, none owed. The map folds it to a header row. */
  complete: boolean;
  done: number;
  total: number;
  stops: MapStop[];
  /** The Owed Missions of the World, in trail order, for the "Cerrar el mundo" panel; empty when none. */
  owed: MapStop[];
  topics: TextKey;
  tier: 'free' | 'plus';
  preview: boolean;
  unlockRequirement?: {
    worldTitle: TextKey;
    worldNumber: number;
    /** The previous World's one missing Stop, when only one is left and it is not owed. */
    lastStopTitle?: TextKey;
    /** How many Owed Missions of the previous World are still to close, when they are all that is missing. */
    owedCount?: number;
  };
}

export interface MapModel {
  worlds: MapWorld[];
  /**
   * The first open, unfinished Stop in World order; failing that, the first Owed Mission whose check-in is due. Null
   * when there is none (all done, or a Mission waits).
   */
  nextUp: { worldId: string; stop: Stop; stopKind: StopKind } | null;
  /** The waiting Mission (or else the Owed Mission) the Dog rests at when nothing is next-up. */
  waitingAt?: { worldId: string; stop: Stop };
  allComplete: boolean;
}

/** Catalog lookups the map needs; defaults are the shipped content. */
export interface MapContent {
  worlds?: readonly WorldDef[];
  nodes?: readonly NodeDef[];
  lessons?: readonly LessonDef[];
  missions?: readonly MissionDef[];
  /** The Personal Plan; its first unlocked, unfinished Stretch is next-up. Absent or empty means trail order. */
  plan?: readonly PlanItem[];
}

function describe(stop: Stop, nodes: readonly NodeDef[], lessons: readonly LessonDef[], missions: readonly MissionDef[]): { kind: StopKind; title: TextKey; node?: NodeDef } {
  switch (stop.kind) {
    case 'node': {
      const node = nodes.find((n) => n.id === stop.id);
      return { kind: 'node', title: node?.title ?? ('' as TextKey), node };
    }
    case 'lesson': {
      const lesson = lessons.find((l) => l.id === stop.id);
      return { kind: lesson?.kind ?? 'theory', title: lesson?.title ?? ('' as TextKey) };
    }
    case 'mission':
      return { kind: 'mission', title: missions.find((m) => m.id === stop.id)?.title ?? ('' as TextKey) };
  }
}

/**
 * The World Map as data: every Stop is exactly one of locked, open, next, waiting, owed or done. The screen only
 * draws it. `now` decides whether a started or owed Mission is waiting or due.
 */
export function mapModel(progress: Progress, stars: Readonly<Record<string, Stars>>, now: Date, content: MapContent = {}): MapModel {
  const { worlds = WORLDS, nodes = NODES, lessons = LESSONS, missions = MISSIONS, plan = [] } = content;
  let nextUp: MapModel['nextUp'] = null;
  let waitingAt: MapModel['waitingAt'];
  let owedAt: MapModel['waitingAt'];
  const shownStars = { completedNodes: [...progress.completedNodes], stars: { ...stars } };

  const mapWorlds: MapWorld[] = worlds.map((world) => {
    const unlocked = isWorldUnlocked(world, progress, worlds);
    const stops: MapStop[] = world.stretches.flatMap((stretchStops, stretch) =>
      stretchStops.map((stop): MapStop => {
        const status = stopStatus(stop, progress, now, worlds, nodes);
        const base = { stop, stretch, ...describe(stop, nodes, lessons, missions) };
        switch (status.state) {
          case 'done': {
            const done: MapStop = { ...base, state: 'done' };
            if (stop.kind === 'node') done.stars = starsShown(shownStars, stop.id);
            if (stop.kind === 'mission' && progress.missions[stop.id]?.keepPractising) done.keepPractising = true;
            return done;
          }
          case 'locked':
            return { ...base, state: 'locked', lock: status.lock };
          case 'owed': {
            const state = progress.missions[stop.id];
            const owed: MapStop = { ...base, state: 'owed', owed: true };
            if (status.checkInDue) owed.checkInDue = true;
            else {
              if (!owedAt) owedAt = { worldId: world.id, stop };
              owed.opensAt = status.opensAt;
              owed.opensTomorrow = !!state && opensAtMidnight(state);
            }
            return owed;
          }
          case 'waiting': {
            if (!waitingAt) waitingAt = { worldId: world.id, stop };
            const state = progress.missions[stop.id];
            return { ...base, state: 'waiting', opensAt: status.opensAt, opensTomorrow: !!state && opensAtMidnight(state) };
          }
          case 'open': {
            if (status.satisfied) return { ...base, state: 'open', optional: true };
            const open: MapStop = { ...base, state: 'open' };
            if (status.checkInDue) open.checkInDue = true;
            if (nextUp === null) {
              nextUp = { worldId: world.id, stop, stopKind: base.kind };
              open.state = 'next';
            }
            return open;
          }
        }
      }),
    );

    let unlockRequirement: MapWorld['unlockRequirement'];
    if (!unlocked && world.unlockedBy) {
      const prev = worlds.find((w) => w.id === world.unlockedBy);
      if (prev) {
        const states = prev.stretches.flat().map((s) => ({ stop: s, state: stopStatus(s, progress, now, worlds, nodes).state }));
        const missing = states.filter((s) => s.state !== 'done');
        if (missing.length > 0 && missing.every((s) => s.state === 'owed')) unlockRequirement = { worldTitle: prev.title, worldNumber: prev.worldNumber, owedCount: missing.length };
        else {
          const only = missing.length === 1 ? describe(missing[0].stop, nodes, lessons, missions) : undefined;
          unlockRequirement = { worldTitle: prev.title, worldNumber: prev.worldNumber, lastStopTitle: only?.title };
        }
      }
    }

    const preview = world.preview ?? false;
    return {
      world,
      unlocked,
      complete: unlocked && isWorldComplete(world, progress),
      // an optional Lesson is done for the trail, so a World can be shown full
      done: stops.filter((s) => s.state === 'done' || s.optional).length,
      total: preview ? (world.nodeCount ?? 0) : stops.length,
      stops,
      owed: stops.filter((s) => s.owed),
      topics: world.topics,
      tier: world.tier ?? 'free',
      preview,
      unlockRequirement,
    };
  });
  nextUp = followPlan(mapWorlds, worlds, plan, nextUp);
  // with nothing else open, the first due Owed Mission is next-up
  if (nextUp === null) {
    for (const w of mapWorlds) {
      const due = w.stops.find((s) => s.state === 'owed' && s.checkInDue);
      if (due) {
        due.state = 'next';
        nextUp = { worldId: w.world.id, stop: due.stop, stopKind: due.kind };
        break;
      }
    }
  }
  waitingAt ??= owedAt;
  const playable = mapWorlds.filter((w) => !w.preview);
  const allComplete = nextUp === null && !waitingAt && playable.every((w) => w.stops.every((s) => s.state === 'done' || s.optional));
  return { worlds: mapWorlds, nextUp, waitingAt: nextUp === null ? waitingAt : undefined, allComplete };
}

/**
 * Moves next-up to the first Stop the Personal Plan points at: the first Stop still to do of the first plan Stretch
 * whose World is unlocked and whose Stop is open. A Stretch that is done, locked or waiting is passed over, so the
 * plan never changes which Worlds are locked, and with no such Stretch next-up stays where trail order put it.
 */
function followPlan(mapWorlds: MapWorld[], worlds: readonly WorldDef[], plan: readonly PlanItem[], nextUp: MapModel['nextUp']): MapModel['nextUp'] {
  for (const item of plan) {
    const found = findStretch(item.stretchId, worlds);
    const world = found && mapWorlds.find((w) => w.world.id === found.world.id);
    if (!found || !world || !world.unlocked) continue;
    const target = world.stops.filter((s) => s.stretch === found.stretch && s.state !== 'done' && !s.optional)[0];
    if (!target || (target.state !== 'open' && target.state !== 'next')) continue;
    if (target.state === 'open') {
      for (const w of mapWorlds) for (const s of w.stops) if (s.state === 'next') s.state = 'open';
      target.state = 'next';
      nextUp = { worldId: world.world.id, stop: target.stop, stopKind: target.kind };
    }
    target.startHere = true;
    return nextUp;
  }
  return nextUp;
}

/**
 * The next moment the map changes without the record changing: the earliest Mission check-in still to open after
 * `now`, when a waiting Mission turns due. Null when nothing is waiting, so the map needs no timer at all.
 */
export function nextMapChange(missions: Readonly<Record<string, MissionState>>, now: Date): Date | null {
  let next: Date | null = null;
  for (const state of Object.values(missions)) {
    const opens = checkInOpensAt(state);
    if (opens && opens.getTime() > now.getTime() && (!next || opens.getTime() < next.getTime())) next = opens;
  }
  return next;
}
