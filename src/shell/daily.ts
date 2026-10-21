import { defaultScenario, type DistractorConfig, type ScenarioConfig } from '../sim/config';
import type { DistractorKind } from '../sim/learning';
import { closestOnSegment, type SceneryTheme, type Wall } from '../sim/geometry';
import type { SimulationDebriefPayload } from '../sim/payload';
import { createRng, type Rng } from '../sim/rng';
import { routePoints, scatterScenery, scatterSetPieces } from '../sim/scenery';
import { distance, type Vec2 } from '../sim/vec';
import { recordDailyScore, type DailyResult, type DogRecord } from './dogRecord';
import type { WarmupOutcome } from './rusty';
import { localDateString, markActive } from './streak';

/**
 * "El Paseo del Día": one Stage per calendar day, built only from the local date (ADR 0005). Every
 * gameplay-critical part (route, walls, Distractor schedule, shields) comes from the date seed, so
 * everyone gets the same Stage on the same day and scores can be compared.
 */

export const DAILY_NODE_ID = 'daily-stage';

/** A stable 32-bit number for a `YYYY-MM-DD` date (FNV-1a). */
export function dateSeed(date: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < date.length; i++) {
    h ^= date.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

const THEMES: readonly SceneryTheme[] = ['quiet_suburb', 'urban_street', 'open_park'];

/** What each kind of Distractor of the Daily Stage is like: speed range in m/s and trigger radius. */
const KINDS: readonly { kind: DistractorKind; speed: [number, number]; radius: number }[] = [
  { kind: 'skateboard', speed: [3.4, 4.5], radius: 14 },
  { kind: 'bicycle', speed: [4, 5], radius: 16 },
  { kind: 'child', speed: [1.5, 2.2], radius: 10 },
  { kind: 'dog', speed: [2, 3], radius: 12 },
  { kind: 'other', speed: [3, 3.8], radius: 12 },
];

const between = (rng: Rng, lo: number, hi: number) => lo + rng.next() * (hi - lo);
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng.next() * items.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;

/** A corridor of axis-aligned legs that steps forward along x and sideways along y. */
function routeFor(rng: Rng): Vec2[] {
  const route: Vec2[] = [{ x: 0, y: 0 }];
  const legs = 4 + Math.floor(rng.next() * 3);
  let side = rng.next() < 0.5 ? 1 : -1;
  for (let i = 0; i < legs; i++) {
    const last = route[route.length - 1];
    const along = Math.round(between(rng, 14, 24));
    route.push(i % 2 === 0 ? { x: last.x + along, y: last.y } : { x: last.x, y: last.y + side * along });
    if (i % 2 === 1 && rng.next() < 0.5) side = -side;
  }
  return route;
}

function distanceToRoute(p: Vec2, route: readonly Vec2[]): number {
  let best = Infinity;
  for (let i = 1; i < route.length; i++) best = Math.min(best, distance(p, closestOnSegment(p, route[i - 1], route[i])));
  return best;
}

const WALL_CLEARANCE = 4;

/** The boundary box around the route, plus a few building blocks that keep clear of it. */
function wallsFor(rng: Rng, route: readonly Vec2[]): Wall[] {
  const xs = route.map((p) => p.x);
  const ys = route.map((p) => p.y);
  const margin = 7;
  const [x0, x1] = [Math.min(...xs) - margin, Math.max(...xs) + margin];
  const [y0, y1] = [Math.min(...ys) - margin, Math.max(...ys) + margin];
  const walls: Wall[] = [
    { from: { x: x0, y: y0 }, to: { x: x1, y: y0 } },
    { from: { x: x1, y: y0 }, to: { x: x1, y: y1 } },
    { from: { x: x1, y: y1 }, to: { x: x0, y: y1 } },
    { from: { x: x0, y: y1 }, to: { x: x0, y: y0 } },
  ];
  const blocks = 1 + Math.floor(rng.next() * 3);
  for (let attempt = 0, made = 0; attempt < 40 && made < blocks; attempt++) {
    const w = between(rng, 5, 10);
    const h = between(rng, 5, 10);
    const bx = between(rng, x0 + 2, x1 - w - 2);
    const by = between(rng, y0 + 2, y1 - h - 2);
    const corners: Vec2[] = [{ x: bx, y: by }, { x: bx + w, y: by }, { x: bx + w, y: by + h }, { x: bx, y: by + h }];
    const mids = corners.flatMap((c, i) => [c, { x: (c.x + corners[(i + 1) % 4].x) / 2, y: (c.y + corners[(i + 1) % 4].y) / 2 }]);
    const centre = { x: bx + w / 2, y: by + h / 2 };
    // clear of the route on every edge, and not sitting on it
    if (![...mids, centre].every((p) => distanceToRoute(p, route) >= WALL_CLEARANCE)) continue;
    const r = (n: number) => round1(n);
    corners.forEach((c, i) => walls.push({ from: { x: r(c.x), y: r(c.y) }, to: { x: r(corners[(i + 1) % 4].x), y: r(corners[(i + 1) % 4].y) } }));
    made++;
  }
  return walls;
}

/** A schedule of Distractors crossing legs of the route, each with its spawn time. */
function distractorsFor(rng: Rng, route: readonly Vec2[]): DistractorConfig[] {
  const count = 3 + Math.floor(rng.next() * 2);
  let spawn = round1(between(rng, 8, 16));
  const out: DistractorConfig[] = [];
  for (let i = 0; i < count; i++) {
    const kind = pick(rng, KINDS);
    const leg = 1 + Math.floor(rng.next() * (route.length - 1));
    const a = route[leg - 1];
    const b = route[leg];
    const t = between(rng, 0.35, 0.8);
    const at = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const len = distance(a, b);
    const perp = { x: -(b.y - a.y) / len, y: (b.x - a.x) / len };
    const reach = 5.5;
    const flip = rng.next() < 0.5 ? 1 : -1;
    out.push({
      ...defaultScenario.distractor,
      kind: kind.kind,
      speed: round1(between(rng, kind.speed[0], kind.speed[1])),
      triggerRadius: kind.radius,
      activateAfterMeters: 0,
      spawnAtSeconds: spawn,
      path: {
        from: { x: round1(at.x - perp.x * reach * flip), y: round1(at.y - perp.y * reach * flip) },
        to: { x: round1(at.x + perp.x * reach * flip), y: round1(at.y + perp.y * reach * flip) },
      },
    });
    spawn = round1(spawn + between(rng, 16, 26));
  }
  return out;
}

/** The Daily Stage for a local date, `YYYY-MM-DD`: the same scenario for the same date, always. */
export function generateDailyStage(date: string): ScenarioConfig {
  const seed = dateSeed(date);
  const rng = createRng(seed);
  const theme = pick(rng, THEMES);
  const route = routeFor(rng);
  const walls = wallsFor(rng, route);
  const distractors = distractorsFor(rng, route);
  const [handlerStart, ...rest] = route;
  const base: ScenarioConfig = {
    ...defaultScenario,
    world: 2,
    theme,
    handlerStart,
    dogStart: { x: handlerStart.x + 1, y: handlerStart.y },
    waypoint: rest[rest.length - 1],
    waypoints: rest.slice(0, -1),
    walls,
    cues: ['lets-go'],
    distractor: distractors[0],
    moreDistractors: distractors.slice(1),
    scenery: [],
  };
  // seeded set pieces (bench + bin, tree + bush, a row of parked cars), then scatter around them
  const points = routePoints(base);
  const pieces = scatterSetPieces(theme, points, seed ^ 0x3c6ef372, walls, 3);
  return { ...base, scenery: [...pieces, ...scatterScenery(theme, points, seed ^ 0x5bd1e995, walls, { existing: pieces })] };
}

/** Today's date in the user's time zone. */
export function todayString(now: Date = new Date()): string {
  return localDateString(now);
}

export interface DailyCompletion extends DailyResult {
  date: string;
  /** This was the first clear of the date, so it credited the Streak. */
  streakCredited: boolean;
}

/**
 * Finishing a Daily Stage: keeps the best score of the date, credits the Streak on the first clear
 * of the date and nothing else. Learning Attributes, Trigger Profile, posture, completed Nodes and
 * the last-Stage date are left exactly as they were.
 */
export function completeDaily(record: DogRecord, payload: SimulationDebriefPayload, now: Date): DailyCompletion {
  const date = localDateString(now);
  const scored = recordDailyScore(record, date, payload.handlingScore);
  const streak = scored.firstOfDay ? markActive(scored.record.streak, date) : scored.record.streak;
  const streakCredited = streak !== scored.record.streak;
  return { ...scored, record: streak === scored.record.streak ? scored.record : { ...scored.record, streak }, date, streakCredited };
}

/** A finished Daily Stage warms the Dog up for the session, as a warm-up walk would. */
export function warmupAfterDaily(_before: WarmupOutcome): WarmupOutcome {
  return 'completed';
}
