import { newDogRecord, RECORD_KEY, type DogRecord, type KeyValueStore } from './dogRecord';
import type { MissionState } from './missions/mission';
import { WORLDS, stopsOf, type WorldDef } from './world';
import { localDateString } from './streak';

/**
 * Parses the target world from search query parameters.
 * Supports:
 * - Direct world ID: `?seed=recall`, `?seed=basics`, `?seed=home`, `?seed=sidewalk`, `?seed=urban`, `?seed=park`, `?seed=cafe`, `?seed=trails`, `?seed=crowds`
 * - Numbered/prefixed shortcuts: `?seed=world6`, `?seed=world-6`, `?seed=w6`, `?seed=w-6`
 * - Secondary parameters: `?seed=world&w=6` or `?seed=world&world=6` or `?seed=world&id=recall`
 */
export function parseTargetWorld(params: URLSearchParams, worlds: readonly WorldDef[] = WORLDS): WorldDef | null {
  const seed = (params.get('seed') ?? '').trim().toLowerCase();
  if (!seed) return null;

  // 1. Direct world ID match (e.g. ?seed=basics, ?seed=recall)
  const byId = worlds.find((w) => w.id.toLowerCase() === seed);
  if (byId) return byId;

  // 2. Pattern match (e.g. ?seed=world6, ?seed=world-6, ?seed=w6, ?seed=w-6)
  const numMatch = seed.match(/^(?:world[-_]?|w[-_]?)(\d+)$/);
  if (numMatch) {
    const num = Number(numMatch[1]);
    return worlds.find((w) => w.worldNumber === num) ?? null;
  }

  // 3. ?seed=world or ?seed=w with secondary parameter (&w=..., &world=..., &id=...)
  if (seed === 'world' || seed === 'w') {
    const target = (params.get('w') ?? params.get('world') ?? params.get('id') ?? '').trim().toLowerCase();
    if (!target) return null;
    const num = Number(target);
    if (!Number.isNaN(num) && num > 0) {
      return worlds.find((w) => w.worldNumber === num) ?? null;
    }
    return worlds.find((w) => w.id.toLowerCase() === target) ?? null;
  }

  return null;
}

/**
 * A development shortcut for web/dev builds:
 * - `?seed=worldN` / `?seed=wN` / `?seed=<worldId>` jumps directly to any World (1-9).
 *   All previous worlds are marked completed (with nodes, lessons, and missions done).
 *   Plus is automatically enabled so Plus Worlds (6-9) unlock immediately.
 *   Lessons of the active stretch are pre-read by default so its Stage Node is unlocked (override with `&clean=1`).
 *   Optional params: `&stretch=N` to jump to a later Stretch, `&lang=en|es`, `&clean=1|fresh=1` for unread lessons.
 * - `?seed=lessons` opens a Dog that has finished onboarding with its first Stage on Day 1,
 *   and `&day=N` moves today to Day N (default 3).
 *
 * Null for any other address.
 */
export function devSeedRecord(search: string, now: Date, worlds: readonly WorldDef[] = WORLDS): DogRecord | null {
  const params = new URLSearchParams(search);

  const targetWorld = parseTargetWorld(params, worlds);
  if (targetWorld) {
    const day = Math.max(1, Math.min(60, Math.floor(Number(params.get('day'))) || Math.max(3, targetWorld.worldNumber * 2 + 1)));
    const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1), 12);
    const passedDate = localDateString(first);
    const base = newDogRecord();

    // Collect all worlds that come before the target world (by worldNumber)
    const priorWorlds = worlds.filter((w) => w.worldNumber < targetWorld.worldNumber);
    const completedWorlds = priorWorlds.map((w) => w.id);

    const completedNodes: string[] = [];
    const readLessons: string[] = [];
    const missions: Record<string, MissionState> = {};
    const stars: DogRecord['stars'] = {};

    for (const pw of priorWorlds) {
      for (const stop of stopsOf(pw)) {
        if (stop.kind === 'node') {
          if (!completedNodes.includes(stop.id)) completedNodes.push(stop.id);
          stars[stop.id] = 3;
        } else if (stop.kind === 'lesson') {
          if (!readLessons.includes(stop.id)) readLessons.push(stop.id);
        } else if (stop.kind === 'mission') {
          missions[stop.id] = {
            target: 'full',
            skipRun: 0,
            attempts: [],
            startedAt: first.toISOString(),
            passedOn: passedDate,
          };
        }
      }
    }

    // Inside target world:
    // If &stretch=N is specified (N > 1), mark stretches 1..(N-1) as complete
    const targetStretch = Math.max(1, Math.floor(Number(params.get('stretch'))) || 1);
    for (let s = 0; s < Math.min(targetStretch - 1, targetWorld.stretches.length); s++) {
      for (const stop of targetWorld.stretches[s]) {
        if (stop.kind === 'node') {
          if (!completedNodes.includes(stop.id)) completedNodes.push(stop.id);
          stars[stop.id] = 3;
        } else if (stop.kind === 'lesson') {
          if (!readLessons.includes(stop.id)) readLessons.push(stop.id);
        } else if (stop.kind === 'mission') {
          missions[stop.id] = {
            target: 'full',
            skipRun: 0,
            attempts: [],
            startedAt: first.toISOString(),
            passedOn: passedDate,
          };
        }
      }
    }

    // Unless ?fresh=1 / ?clean=1 / ?locked=1, mark the active stretch's lessons as read
    // so the Stage Node is immediately unlocked and playable (lessons can still be opened and re-read).
    const isClean = params.has('fresh') || params.has('clean') || params.has('locked');
    if (!isClean) {
      const activeStretchIndex = Math.min(targetStretch - 1, Math.max(0, targetWorld.stretches.length - 1));
      const activeStretches = targetWorld.stretches[activeStretchIndex] ?? [];
      for (const stop of activeStretches) {
        if (stop.kind === 'lesson' && !readLessons.includes(stop.id)) {
          readLessons.push(stop.id);
        }
      }
    }

    const lang = params.get('lang')?.toLowerCase();
    const language = lang === 'en' ? 'en' : 'es';
    const name = params.get('name')?.trim() || 'Migas';

    return {
      ...base,
      name,
      language,
      completedWorlds,
      completedNodes,
      readLessons,
      missions,
      stars,
      onboarding: {
        ...base.onboarding,
        step: 'done',
        firstStageCompletedAt: first.toISOString(),
        mockSubscribed: true,
      },
      updatedAt: now.toISOString(),
    };
  }

  if (params.get('seed') !== 'lessons') return null;
  const day = Math.max(1, Math.min(60, Math.floor(Number(params.get('day'))) || 3));
  const first = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day - 1), 12);
  const base = newDogRecord();
  return { ...base, name: 'Migas', onboarding: { ...base.onboarding, step: 'done', firstStageCompletedAt: first.toISOString() }, updatedAt: now.toISOString() };
}

/** The store that answers the first read of the Dog record with the seed; everything after reads and writes normally. */
export function withDevSeed(store: KeyValueStore, seed: DogRecord | null): KeyValueStore {
  if (!seed) return store;
  let pending = true;
  return {
    getItem: async (key) => {
      if (pending && key === RECORD_KEY) {
        pending = false;
        return JSON.stringify(seed);
      }
      return store.getItem(key);
    },
    setItem: (key, value) => store.setItem(key, value),
    removeItem: store.removeItem?.bind(store),
  };
}
