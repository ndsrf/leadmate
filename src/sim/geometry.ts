import { add, distance, dot, normalize, scale, sub, type Vec2 } from './vec';

/** A solid boundary segment (an indoor partition, a building front, a fence). */
export interface Wall {
  from: Vec2;
  to: Vec2;
}

export type SceneryTheme = 'indoor_apartment' | 'quiet_suburb' | 'urban_street' | 'open_park';

/** A prop of the scenery set. A prop with `visualShield` blocks line of sight (a parked car). */
export interface SceneryItem {
  type: string;
  pos: Vec2;
  visualShield?: boolean;
  /** Footprint radius of a shield in meters; defaults to `DEFAULT_SHIELD_RADIUS`. */
  radius?: number;
  /** Direction of a long prop's footprint, in radians from the x axis; 0 when absent. */
  angle?: number;
}

export const DEFAULT_SHIELD_RADIUS = 1.2;
/** Handler and Dog collide with walls as discs of this radius, in meters. */
export const BODY_RADIUS = 0.3;

const EPS = 1e-9;

const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;

/** The point of segment `a`-`b` closest to `p`. */
export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = sub(b, a);
  const len2 = dot(ab, ab);
  if (len2 < EPS) return a;
  const t = Math.max(0, Math.min(1, dot(sub(p, a), ab) / len2));
  return add(a, scale(ab, t));
}

/**
 * True when segments `p1`-`p2` and `q1`-`q2` cross strictly inside both: touching at an endpoint
 * does not count, so a leash resting on a wall corner does not intersect that wall.
 */
export function segmentsCross(p1: Vec2, p2: Vec2, q1: Vec2, q2: Vec2): boolean {
  const r = sub(p2, p1);
  const s = sub(q2, q1);
  const denom = cross(r, s);
  if (Math.abs(denom) < EPS) return false;
  const qp = sub(q1, p1);
  const t = cross(qp, s) / denom;
  const u = cross(qp, r) / denom;
  const margin = 1e-7;
  return t > margin && t < 1 - margin && u > margin && u < 1 - margin;
}

/** Pushes a disc of `radius` out of every wall it overlaps; movement along a wall is untouched (sliding). */
export function resolveWalls(pos: Vec2, walls: readonly Wall[], radius: number = BODY_RADIUS): Vec2 {
  let p = pos;
  // two passes settle a disc in a corner between two walls
  for (let pass = 0; pass < 2; pass++) {
    for (const w of walls) {
      const c = closestOnSegment(p, w.from, w.to);
      const d = distance(p, c);
      if (d >= radius) continue;
      if (d > EPS) {
        p = add(c, scale(normalize(sub(p, c)), radius));
      } else {
        // exactly on the wall: leave along its normal
        const n = normalize({ x: -(w.to.y - w.from.y), y: w.to.x - w.from.x });
        p = add(c, scale(n, radius));
      }
    }
  }
  return p;
}

/** Walls bucketed by a coarse grid, so a query only looks at the walls near a body or a leash. */
export interface WallIndex {
  all: readonly Wall[];
  cells: Map<string, Wall[]>;
}

const CELL = 4;
/** Up to this many walls are always returned whole: scenarios without scenery keep their exact behavior. */
const SMALL_SET = 16;

const cellKey = (i: number, j: number) => `${i},${j}`;

export function buildWallIndex(walls: readonly Wall[]): WallIndex {
  const cells = new Map<string, Wall[]>();
  if (walls.length > SMALL_SET) {
    for (const w of walls) {
      const [i0, i1] = [Math.floor(Math.min(w.from.x, w.to.x) / CELL), Math.floor(Math.max(w.from.x, w.to.x) / CELL)];
      const [j0, j1] = [Math.floor(Math.min(w.from.y, w.to.y) / CELL), Math.floor(Math.max(w.from.y, w.to.y) / CELL)];
      for (let i = i0; i <= i1; i++) {
        for (let j = j0; j <= j1; j++) {
          const key = cellKey(i, j);
          const list = cells.get(key);
          if (list) list.push(w);
          else cells.set(key, [w]);
        }
      }
    }
  }
  return { all: walls, cells };
}

/** The walls within `margin` meters of the segment `a`-`b` (all of them for a small set). */
export function wallsNear(index: WallIndex, a: Vec2, b: Vec2, margin = 2): readonly Wall[] {
  if (index.all.length <= SMALL_SET) return index.all;
  const i0 = Math.floor((Math.min(a.x, b.x) - margin) / CELL);
  const i1 = Math.floor((Math.max(a.x, b.x) + margin) / CELL);
  const j0 = Math.floor((Math.min(a.y, b.y) - margin) / CELL);
  const j1 = Math.floor((Math.max(a.y, b.y) + margin) / CELL);
  const found = new Set<Wall>();
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) for (const w of index.cells.get(cellKey(i, j)) ?? []) found.add(w);
  }
  return [...found];
}

function segmentHitsCircle(a: Vec2, b: Vec2, center: Vec2, radius: number): boolean {
  return distance(closestOnSegment(center, a, b), center) < radius;
}

/** True when nothing (walls, visual shields) blocks the view from `a` to `b`. */
export function hasLineOfSight(a: Vec2, b: Vec2, walls: readonly Wall[], scenery: readonly SceneryItem[] = []): boolean {
  for (const w of walls) if (segmentsCross(a, b, w.from, w.to)) return false;
  for (const item of scenery) {
    if (item.visualShield && segmentHitsCircle(a, b, item.pos, item.radius ?? DEFAULT_SHIELD_RADIUS)) return false;
  }
  return true;
}

/** The leash from the Handler to the Dog: its corner points (if any) and its length around them. */
export interface LeashPath {
  /** Handler, wrapped corner vertices in order, Dog. */
  points: Vec2[];
  length: number;
}

/** Corner vertices considered per query: the nearest ones to the straight line, so the cost stays O(k). */
const MAX_CORNERS = 6;

/**
 * The shortest leash path from `handler` to `dog` that does not cut through a wall: straight when
 * nothing is in the way, otherwise wrapped around wall corner vertices. Without walls this is
 * exactly the straight distance.
 */
export function leashPath(handler: Vec2, dog: Vec2, walls: readonly Wall[]): LeashPath {
  const straight = (): LeashPath => ({ points: [handler, dog], length: distance(handler, dog) });
  if (walls.length === 0 || !walls.some((w) => segmentsCross(handler, dog, w.from, w.to))) return straight();

  const mid = scale(add(handler, dog), 0.5);
  const corners = walls
    .flatMap((w) => [w.from, w.to])
    .map((v) => ({ v, d: distance(v, mid) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, MAX_CORNERS)
    .map((c) => c.v);

  const clear = (a: Vec2, b: Vec2) => !walls.some((w) => segmentsCross(a, b, w.from, w.to));
  const nodes = [handler, ...corners, dog];
  const last = nodes.length - 1;
  // Dijkstra over the tiny visibility graph
  const best = nodes.map(() => Infinity);
  const prev = nodes.map(() => -1);
  const done = nodes.map(() => false);
  best[0] = 0;
  for (let step = 0; step < nodes.length; step++) {
    let u = -1;
    for (let i = 0; i < nodes.length; i++) if (!done[i] && (u === -1 || best[i] < best[u])) u = i;
    if (u === -1 || best[u] === Infinity) break;
    done[u] = true;
    for (let v = 0; v < nodes.length; v++) {
      if (done[v] || !clear(nodes[u], nodes[v])) continue;
      const alt = best[u] + distance(nodes[u], nodes[v]);
      if (alt < best[v]) {
        best[v] = alt;
        prev[v] = u;
      }
    }
  }
  if (best[last] === Infinity) return straight();
  const points: Vec2[] = [];
  for (let i = last; i !== -1; i = prev[i]) points.unshift(nodes[i]);
  return { points, length: best[last] };
}

/** Leash length between two bodies: around wall corners when needed. */
export function leashLength(handler: Vec2, dog: Vec2, walls: readonly Wall[]): number {
  return walls.length === 0 ? distance(handler, dog) : leashPath(handler, dog, walls).length;
}

/** Length of a polyline through `points`. */
export function routeLength(points: readonly Vec2[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}
