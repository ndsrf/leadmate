import type { ScenarioConfig } from './config';
import { closestOnSegment, routeLength, segmentsCross, type SceneryItem, type SceneryTheme, type Wall } from './geometry';
import { createRng, type Rng } from './rng';
import { distance, type Vec2 } from './vec';

/** Props each theme may use; a scenario's scenery set has to match its theme. */
export const THEME_PROPS: Record<SceneryTheme, readonly string[]> = {
  indoor_apartment: ['door', 'coat_rack', 'shoe_rack', 'plant', 'lamp', 'elevator_panel', 'picture', 'cabinet', 'shelf', 'sofa', 'dog_bed', 'umbrella_stand', 'stool'],
  quiet_suburb: ['tree', 'conifer', 'hedge', 'mailbox', 'bench', 'lamp_post', 'fence', 'bush', 'bin', 'flower_bed', 'mailbox_row', 'garden_gnome', 'scooter'],
  urban_street: ['parked_car', 'lamp_post', 'bin', 'bench', 'tree', 'bus_stop', 'hydrant', 'sign', 'bike_rack', 'trash_can', 'kiosk', 'scooter', 'fountain', 'flower_bed'],
  open_park: ['tree', 'conifer', 'bench', 'bush', 'lamp_post', 'pond', 'picnic_table', 'bin', 'flower_bed', 'fountain', 'kiosk', 'sign'],
};

/** What a prop is as a physical thing: whether it blocks, and its footprint (a disc, or a segment for long props). */
export interface PropShape {
  solid: boolean;
  /** Disc footprint radius in meters. */
  radius?: number;
  /** Segment footprint length in meters, along the item's `angle`. */
  length?: number;
}

/** Footprints of the props. Wall-mounted or flat props are not solid; unknown types are a small solid disc. */
export const PROP_SHAPES: Record<string, PropShape> = {
  // indoor
  door: { solid: false },
  picture: { solid: false },
  elevator_panel: { solid: false },
  dog_bed: { solid: false },
  coat_rack: { solid: true, radius: 0.22 },
  shoe_rack: { solid: true, length: 0.9 },
  plant: { solid: true, radius: 0.25 },
  lamp: { solid: true, radius: 0.18 },
  cabinet: { solid: true, length: 1.0 },
  shelf: { solid: true, length: 1.3 },
  sofa: { solid: true, length: 1.8 },
  umbrella_stand: { solid: true, radius: 0.18 },
  stool: { solid: true, radius: 0.22 },
  // outdoor
  tree: { solid: true, radius: 0.35 },
  conifer: { solid: true, radius: 0.35 },
  bush: { solid: true, radius: 0.5 },
  hedge: { solid: true, length: 2.4 },
  mailbox: { solid: true, radius: 0.15 },
  mailbox_row: { solid: true, length: 1.6 },
  bench: { solid: true, length: 1.5 },
  lamp_post: { solid: true, radius: 0.12 },
  fence: { solid: true, length: 3 },
  bin: { solid: true, radius: 0.25 },
  trash_can: { solid: true, radius: 0.3 },
  flower_bed: { solid: true, length: 1.6 },
  garden_gnome: { solid: true, radius: 0.12 },
  scooter: { solid: true, radius: 0.22 },
  parked_car: { solid: true, length: 3.4 },
  bus_stop: { solid: true, length: 2.4 },
  hydrant: { solid: true, radius: 0.2 },
  sign: { solid: true, radius: 0.12 },
  bike_rack: { solid: true, length: 1.4 },
  kiosk: { solid: true, radius: 0.7 },
  fountain: { solid: true, radius: 1.0 },
  pond: { solid: true, radius: 1.8 },
  picnic_table: { solid: true, length: 1.8 },
};

const DEFAULT_SHAPE: PropShape = { solid: true, radius: 0.25 };

export const shapeOf = (type: string): PropShape => PROP_SHAPES[type] ?? DEFAULT_SHAPE;

const OCTAGON = 8;
/** A disc is an octagon whose edges are `radius` from the centre, so a body of any size sees at least the disc. */
const OCTAGON_CIRCUMRADIUS = 1 / Math.cos(Math.PI / OCTAGON);

/** Collision segments of one solid prop: a short capped segment for a long prop, an octagon for a round one. */
export function itemWalls(item: SceneryItem): Wall[] {
  const shape = shapeOf(item.type);
  if (!shape.solid) return [];
  if (shape.length) {
    const half = shape.length / 2;
    const dir = { x: Math.cos(item.angle ?? 0), y: Math.sin(item.angle ?? 0) };
    return [{ from: { x: item.pos.x - dir.x * half, y: item.pos.y - dir.y * half }, to: { x: item.pos.x + dir.x * half, y: item.pos.y + dir.y * half } }];
  }
  const r = (shape.radius ?? DEFAULT_SHAPE.radius!) * OCTAGON_CIRCUMRADIUS;
  const vertex = (k: number): Vec2 => {
    const a = ((k + 0.5) / OCTAGON) * Math.PI * 2;
    return { x: item.pos.x + Math.cos(a) * r, y: item.pos.y + Math.sin(a) * r };
  };
  return Array.from({ length: OCTAGON }, (_, k) => ({ from: vertex(k), to: vertex(k + 1) }));
}

/** The collision walls of every solid prop of a scenery set. */
export function propWalls(scenery: readonly SceneryItem[]): Wall[] {
  return scenery.flatMap(itemWalls);
}

/** Distance between two segments (0 when they cross). */
export function segmentDistance(a1: Vec2, a2: Vec2, b1: Vec2, b2: Vec2): number {
  if (segmentsCross(a1, a2, b1, b2)) return 0;
  return Math.min(
    distance(a1, closestOnSegment(a1, b1, b2)),
    distance(a2, closestOnSegment(a2, b1, b2)),
    distance(b1, closestOnSegment(b1, a1, a2)),
    distance(b2, closestOnSegment(b2, a1, a2)),
  );
}

function wallsGap(a: readonly Wall[], b: readonly Wall[]): number {
  let best = Infinity;
  for (const x of a) for (const y of b) best = Math.min(best, segmentDistance(x.from, x.to, y.from, y.to));
  return best;
}

/** Biggest distance from a prop's position to any point of its footprint. */
function reach(item: SceneryItem): number {
  const s = shapeOf(item.type);
  return s.length ? s.length / 2 : (s.radius ?? DEFAULT_SHAPE.radius!) * OCTAGON_CIRCUMRADIUS;
}

/** At least one outdoor prop per this many meters of route. */
export const METERS_PER_PROP = 3;
/** And never fewer than this many props in a walking scenario. */
export const MIN_PROPS = 12;
/** Indoors the count follows floor area: one prop per this many square meters. */
export const SQUARE_METERS_PER_PROP = 6;
/** Fewest props indoors. */
export const MIN_INDOOR_PROPS = 8;
/** A scenario uses at least this many different prop types. */
export const MIN_PROP_TYPES = 6;
/** Half the clear corridor along the route, in meters (the corridor is 1.2 m wide). */
export const CORRIDOR_HALF_WIDTH = 0.6;
/** Scattered props outdoors keep this far from the route (a leash length plus a body), so the Dog never has to get around one. */
const SCATTER_CLEARANCE = 2.6;
/** Smallest gap kept between two footprints, or a footprint and a wall, when scattering. */
const PROP_GAP = 0.1;
/** Footprints closer than this count as overlapping in validation. */
const OVERLAP_GAP = 0.05;

/** Props a route of `meters` needs outdoors. */
export function requiredProps(meters: number): number {
  return Math.max(MIN_PROPS, Math.ceil(meters / METERS_PER_PROP));
}

/** Props an indoor space of `area` square meters needs. */
export function requiredIndoorProps(area: number): number {
  return Math.max(MIN_INDOOR_PROPS, Math.ceil(area / SQUARE_METERS_PER_PROP));
}

/** Floor area of the walls' bounding box, or of the route's with a margin when there are none. */
function floorArea(route: readonly Vec2[], walls: readonly Wall[]): number {
  const pts = walls.length > 0 ? walls.flatMap((w) => [w.from, w.to]) : route;
  const pad = walls.length > 0 ? 0 : 3;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return (Math.max(...xs) - Math.min(...xs) + 2 * pad) * (Math.max(...ys) - Math.min(...ys) + 2 * pad);
}

/** Props a scenario of `theme` needs along `route`. */
export function requiredFor(theme: SceneryTheme, route: readonly Vec2[], walls: readonly Wall[] = []): number {
  return theme === 'indoor_apartment' ? requiredIndoorProps(floorArea(route, walls)) : requiredProps(routeLength(route));
}

/** The route as points, from the Handler's start to the end waypoint. */
export function routePoints(config: Pick<ScenarioConfig, 'handlerStart' | 'waypoints' | 'waypoint'>): Vec2[] {
  return [config.handlerStart, ...config.waypoints, config.waypoint];
}

const finite = (p: Vec2) => Number.isFinite(p.x) && Number.isFinite(p.y);

/** How far before and after a turn the Dog's corner-cutting line starts, in meters. */
const CHAMFER = 3.5;

/** The route's legs plus a line cutting each turn, which is where the Dog walks when it heads straight for the next waypoint. */
function corridorSegments(route: readonly Vec2[]): [Vec2, Vec2][] {
  const out: [Vec2, Vec2][] = [];
  for (let i = 1; i < route.length; i++) out.push([route[i - 1], route[i]]);
  for (let i = 1; i < route.length - 1; i++) {
    const before = distance(route[i - 1], route[i]);
    const after = distance(route[i], route[i + 1]);
    if (before === 0 || after === 0) continue;
    const d = Math.min(CHAMFER, before / 2, after / 2);
    const p1 = { x: route[i].x + ((route[i - 1].x - route[i].x) / before) * d, y: route[i].y + ((route[i - 1].y - route[i].y) / before) * d };
    const p2 = { x: route[i].x + ((route[i + 1].x - route[i].x) / after) * d, y: route[i].y + ((route[i + 1].y - route[i].y) / after) * d };
    out.push([p1, p2]);
  }
  return out;
}

/** Distance from the footprint `walls` to the route's corridor lines. */
function distanceToRoute(walls: readonly Wall[], route: readonly Vec2[]): number {
  let best = Infinity;
  for (const [a, b] of corridorSegments(route)) for (const w of walls) best = Math.min(best, segmentDistance(a, b, w.from, w.to));
  return best;
}

/** True when the footprint is within `gap` of a Boundary. */
function nearWall(footprint: readonly Wall[], walls: readonly Wall[], gap: number): boolean {
  return wallsGap(footprint, walls) < gap;
}

/**
 * Checks a scenario: valid geometry, a scenery set that matches the theme, the minimum density
 * (one prop per 3 m of route and at least 12 outdoors, by floor area and at least 8 indoors), at
 * least 6 prop types, and solids that overlap nothing and leave the route corridor clear.
 * Returns the problems found; empty means valid.
 */
export function validateScenario(config: ScenarioConfig): string[] {
  const errors: string[] = [];
  const route = routePoints(config);
  if (!route.every(finite)) errors.push('route has a point that is not a finite number');
  if (!THEME_PROPS[config.theme]) errors.push(`unknown theme "${config.theme}"`);
  config.walls.forEach((w, i) => {
    if (!finite(w.from) || !finite(w.to)) errors.push(`wall ${i} has a point that is not a finite number`);
    else if (distance(w.from, w.to) === 0) errors.push(`wall ${i} has no length`);
  });
  for (let i = 1; i < route.length; i++) {
    if (config.walls.some((w) => segmentsCross(route[i - 1], route[i], w.from, w.to))) errors.push(`route leg ${i} goes through a wall`);
  }
  const allowed = THEME_PROPS[config.theme] ?? [];
  for (const item of config.scenery) {
    if (!allowed.includes(item.type)) errors.push(`prop "${item.type}" does not belong to the ${config.theme} theme`);
    if (!finite(item.pos)) errors.push(`prop "${item.type}" has a position that is not a finite number`);
  }
  const need = requiredFor(config.theme, route, config.walls);
  if (config.scenery.length < need) errors.push(`scenery has ${config.scenery.length} props, the scenario needs at least ${need}`);
  const types = new Set(config.scenery.map((p) => p.type)).size;
  if (types < MIN_PROP_TYPES) errors.push(`scenery uses ${types} prop types, at least ${MIN_PROP_TYPES} are needed`);

  if (config.scenery.every((p) => finite(p.pos))) errors.push(...solidProblems(config, route));
  return errors;
}

/** Solids that overlap each other, a Boundary or a start, or intrude on the route corridor. */
function solidProblems(config: ScenarioConfig, route: readonly Vec2[]): string[] {
  const errors: string[] = [];
  if (!route.every(finite)) return errors;
  const solids = config.scenery.filter((p) => shapeOf(p.type).solid).map((item) => ({ item, walls: itemWalls(item) }));
  const starts = [config.handlerStart, config.dogStart];
  solids.forEach((a, i) => {
    const label = `${a.item.type} at (${a.item.pos.x.toFixed(1)}, ${a.item.pos.y.toFixed(1)})`;
    if (nearWall(a.walls, config.walls, OVERLAP_GAP)) errors.push(`${label} overlaps a wall`);
    if (starts.some((s) => wallsGap([{ from: s, to: s }], a.walls) < CORRIDOR_HALF_WIDTH)) errors.push(`${label} is on a start position`);
    const gap = distanceToRoute(a.walls, route);
    if (gap < CORRIDOR_HALF_WIDTH) {
      const segs = corridorSegments(route);
      let leg = segs.findIndex(([p, q]) => a.walls.some((w) => segmentDistance(p, q, w.from, w.to) < CORRIDOR_HALF_WIDTH)) + 1;
      if (leg > route.length - 1) leg = leg - (route.length - 1);
      errors.push(`${label} blocks route leg ${leg}`);
    }
    for (let j = i + 1; j < solids.length; j++) {
      const b = solids[j];
      if (distance(a.item.pos, b.item.pos) > reach(a.item) + reach(b.item) + OVERLAP_GAP) continue;
      if (wallsGap(a.walls, b.walls) < OVERLAP_GAP) errors.push(`${label} overlaps ${b.item.type} at (${b.item.pos.x.toFixed(1)}, ${b.item.pos.y.toFixed(1)})`);
    }
  });
  return errors;
}

export interface ScatterOptions {
  /** Props to use; defaults to every prop of the theme. */
  types?: readonly string[];
  /** Props per meter of route beyond the minimum; 0.25 gives one per 4 m. */
  perMeter?: number;
  /** Distance range from the route, in meters. */
  offset?: { min: number; max: number };
  /** Hand-placed props already in the Stage: they count toward the minimum and are never overlapped. */
  existing?: readonly SceneryItem[];
  /** Meters kept clear on each side of the route; defaults to 2.6 outdoors (a leash and a body) and 0.6 indoors. */
  clearance?: number;
  /** Positions to keep clear besides the route (the Dog's start, which `scatterScenery` assumes 1 m from the Handler's). */
  keepClear?: readonly Vec2[];
}

const SHIELDS: Record<string, number> = { parked_car: 1.4 };

/** Direction of the route leg closest to `pos`, in radians: long props lie along the path. */
function legAngle(route: readonly Vec2[], pos: Vec2): number {
  let best = 1;
  let bestD = Infinity;
  for (let i = 1; i < route.length; i++) {
    const d = distance(pos, closestOnSegment(pos, route[i - 1], route[i]));
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return Math.atan2(route[best].y - route[best - 1].y, route[best].x - route[best - 1].x);
}

/** A seeded shuffle of `types`, so consecutive picks are all different until the deck runs out. */
function shuffled<T>(rng: Rng, types: readonly T[]): T[] {
  const deck = [...types];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

/** Builds a prop at `pos`, lying along the route when it is a long one. */
function makeItem(type: string, pos: Vec2, route: readonly Vec2[]): SceneryItem {
  const radius = SHIELDS[type];
  const item: SceneryItem = radius ? { type, pos, visualShield: true, radius } : { type, pos };
  if (shapeOf(type).length) item.angle = legAngle(route, pos);
  return item;
}

/** Whether `item` fits: clear of the route corridor, the starts, the walls and every placed prop. */
function fits(item: SceneryItem, route: readonly Vec2[], starts: readonly Vec2[], walls: readonly Wall[], placed: readonly { item: SceneryItem; walls: Wall[] }[], clearance: number): boolean {
  const shape = shapeOf(item.type);
  if (!shape.solid) {
    // flat or wall-mounted: stands nowhere in the way, so it may sit against a wall
    return true;
  }
  const fp = itemWalls(item);
  if (distanceToRoute(fp, route) < clearance) return false;
  if (starts.some((s) => wallsGap([{ from: s, to: s }], fp) < clearance)) return false;
  if (nearWall(fp, walls, PROP_GAP)) return false;
  for (const other of placed) {
    if (distance(item.pos, other.item.pos) > reach(item) + reach(other.item) + PROP_GAP) continue;
    if (wallsGap(fp, other.walls) < PROP_GAP) return false;
  }
  return true;
}

/**
 * A scenery set placed along the route with a seeded random, alternating sides and keeping the
 * route corridor (1.2 m) clear of footprints; props never overlap each other, a wall or a start,
 * and consecutive picks differ until the theme's types run out. Long props lie along the path.
 * Solid props block the Handler and the Dog; visual shields also block sight.
 */
export function scatterScenery(
  theme: SceneryTheme,
  route: readonly Vec2[],
  seed: number,
  walls: ScenarioConfig['walls'] = [],
  options: ScatterOptions = {},
): SceneryItem[] {
  const types = options.types ?? THEME_PROPS[theme];
  const offset = options.offset ?? { min: 3, max: 8 };
  const total = routeLength(route);
  const existing = options.existing ?? [];
  const count = Math.max(requiredFor(theme, route, walls) - existing.length, Math.ceil(total * (options.perMeter ?? 0)), 0);
  const rng = createRng(seed);
  const clearance = options.clearance ?? (theme === 'indoor_apartment' ? CORRIDOR_HALF_WIDTH : SCATTER_CLEARANCE);
  const starts = [route[0], { x: route[0].x + 1, y: route[0].y }, ...(options.keepClear ?? [])];
  const placed = existing.filter((e) => shapeOf(e.type).solid).map((item) => ({ item, walls: itemWalls(item) }));
  const items: SceneryItem[] = [];
  let deck = shuffled(rng, types);
  let attempts = 0;
  while (items.length < count && attempts < count * 60) {
    attempts++;
    const slot = items.length;
    let along = ((slot + rng.next() * 0.8) / count) * total;
    let i = 1;
    while (i < route.length - 1 && along > distance(route[i - 1], route[i])) {
      along -= distance(route[i - 1], route[i]);
      i++;
    }
    const a = route[i - 1];
    const b = route[i];
    const len = distance(a, b) || 1;
    const t = Math.min(1, along / len);
    const base = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    const side = (slot + Math.floor(attempts / 40)) % 2 === 0 ? 1 : -1;
    const d = offset.min + rng.next() * (offset.max - offset.min);
    const pos = { x: base.x + (-(b.y - a.y) / len) * d * side, y: base.y + ((b.x - a.x) / len) * d * side };
    if (deck.length === 0) deck = shuffled(rng, types);
    const type = deck[0];
    const item = makeItem(type, pos, route);
    if (!fits(item, route, starts, walls, placed, clearance)) {
      // a type that keeps not fitting (too big for a corridor) goes to the back of the deck
      if (attempts % 4 === 0) deck.push(deck.shift()!);
      continue;
    }
    deck.shift();
    items.push(item);
    if (shapeOf(type).solid) placed.push({ item, walls: itemWalls(item) });
  }
  return items;
}

/** A small group of props stamped as one piece. Offsets are along the path and to its left, in meters. */
interface SetPiece {
  themes: readonly SceneryTheme[];
  parts: readonly { type: string; along: number; across: number }[];
}

const SET_PIECES: Record<string, SetPiece> = {
  bench_bin: { themes: ['quiet_suburb', 'urban_street', 'open_park'], parts: [{ type: 'bench', along: 0, across: 0 }, { type: 'bin', along: 1.2, across: 0.2 }] },
  tree_bush: { themes: ['quiet_suburb', 'open_park'], parts: [{ type: 'tree', along: 0, across: 0 }, { type: 'bush', along: 1.2, across: 0.3 }] },
  car_row: { themes: ['urban_street'], parts: [{ type: 'parked_car', along: 0, across: 0 }, { type: 'parked_car', along: 4, across: 0 }, { type: 'parked_car', along: 8, across: 0 }] },
};

/**
 * Seeded set pieces (bench + bin, tree + bush, a row of parked cars) placed as groups beside the
 * route, under the same clearance rules as scatter. Used by the Daily Stage so it is as lively as
 * the campaign; a piece that does not fit is skipped.
 */
export function scatterSetPieces(
  theme: SceneryTheme,
  route: readonly Vec2[],
  seed: number,
  walls: ScenarioConfig['walls'] = [],
  count = 3,
  options: Pick<ScatterOptions, 'existing' | 'offset' | 'clearance'> = {},
): SceneryItem[] {
  const rng = createRng(seed ^ 0x2545f491);
  const pieces = Object.values(SET_PIECES).filter((p) => p.themes.includes(theme));
  const offset = options.offset ?? { min: 3, max: 6 };
  const total = routeLength(route);
  const starts = [route[0], { x: route[0].x + 1, y: route[0].y }];
  const placed = (options.existing ?? []).filter((e) => shapeOf(e.type).solid).map((item) => ({ item, walls: itemWalls(item) }));
  const out: SceneryItem[] = [];
  for (let n = 0; n < count; n++) {
    for (let attempt = 0; attempt < 25; attempt++) {
      const piece = pieces[Math.floor(rng.next() * pieces.length)];
      let along = ((n + 0.2 + rng.next() * 0.6) / count) * total;
      let i = 1;
      while (i < route.length - 1 && along > distance(route[i - 1], route[i])) {
        along -= distance(route[i - 1], route[i]);
        i++;
      }
      const a = route[i - 1];
      const b = route[i];
      const len = distance(a, b) || 1;
      const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
      const left = { x: -dir.y, y: dir.x };
      const side = rng.next() < 0.5 ? 1 : -1;
      const d = offset.min + rng.next() * (offset.max - offset.min);
      const origin = { x: a.x + dir.x * Math.min(along, len), y: a.y + dir.y * Math.min(along, len) };
      const group = piece.parts.map((part) => {
        const pos = { x: origin.x + dir.x * part.along + left.x * (d * side + part.across), y: origin.y + dir.y * part.along + left.y * (d * side + part.across) };
        return makeItem(part.type, pos, route);
      });
      const mine: { item: SceneryItem; walls: Wall[] }[] = [];
      let ok = true;
      for (const item of group) {
        if (!fits(item, route, starts, walls, [...placed, ...mine], options.clearance ?? SCATTER_CLEARANCE)) {
          ok = false;
          break;
        }
        mine.push({ item, walls: itemWalls(item) });
      }
      if (!ok) continue;
      placed.push(...mine);
      out.push(...group);
      break;
    }
  }
  return out;
}

// -- Ground Cover ---------------------------------------------------------------------------------

export type GroundSurface = 'tile' | 'wood' | 'carpet' | 'paving' | 'cobble' | 'grass' | 'dirt' | 'sand' | 'asphalt';
export type DecorKind = 'rug' | 'puddle' | 'flower_patch' | 'painted_line';

/** A floor surface laid as a strip along a route leg. */
export interface GroundPatch {
  surface: GroundSurface;
  from: Vec2;
  to: Vec2;
  /** Half the strip's width in meters. */
  halfWidth: number;
}

/** A small flat decoration drawn on top of the floor. */
export interface GroundDecor {
  kind: DecorKind;
  pos: Vec2;
  /** Size along the path and across it, in meters. */
  size: Vec2;
  /** Direction of the first axis, in radians. */
  angle: number;
}

export interface GroundPlan {
  patches: GroundPatch[];
  decor: GroundDecor[];
}

/** Floor surfaces per theme: the base everywhere, and the patches laid along the path. */
export const GROUND_ZONES: Record<SceneryTheme, { base: GroundSurface; surfaces: readonly GroundSurface[]; decor: readonly DecorKind[]; halfWidth: number }> = {
  indoor_apartment: { base: 'tile', surfaces: ['tile', 'wood', 'carpet'], decor: ['rug'], halfWidth: 1.2 },
  quiet_suburb: { base: 'grass', surfaces: ['paving', 'cobble', 'grass'], decor: ['flower_patch', 'puddle', 'painted_line'], halfWidth: 1.8 },
  urban_street: { base: 'paving', surfaces: ['paving', 'cobble', 'asphalt'], decor: ['puddle', 'painted_line'], halfWidth: 2.2 },
  open_park: { base: 'grass', surfaces: ['grass', 'dirt', 'sand'], decor: ['flower_patch', 'puddle'], halfWidth: 1.6 },
};

/** Meters of one patch along the path. */
const PATCH_LENGTH = { min: 6, max: 14 };

/**
 * The floor of a Stage from its seed: patches of the theme's surfaces along the path (at least
 * two surfaces in all) and a few flat decorations. Purely cosmetic and pure, so the same seed
 * always lays the same floor.
 */
export function layoutGround(theme: SceneryTheme, route: readonly Vec2[], seed: number): GroundPlan {
  const zone = GROUND_ZONES[theme];
  const rng = createRng(seed ^ 0x7f4a7c15);
  const patches: GroundPatch[] = [];
  const decor: GroundDecor[] = [];
  const paths = zone.surfaces.filter((s) => s !== zone.base);
  let last: GroundSurface = zone.base;
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1];
    const b = route[i];
    const len = distance(a, b);
    if (len === 0) continue;
    const dir = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
    const angle = Math.atan2(dir.y, dir.x);
    for (let at = 0; at < len; ) {
      const span = Math.min(len - at, PATCH_LENGTH.min + rng.next() * (PATCH_LENGTH.max - PATCH_LENGTH.min));
      const options = paths.filter((s) => s !== last);
      const surface = options[Math.floor(rng.next() * options.length)] ?? paths[0];
      last = surface;
      patches.push({ surface, from: { x: a.x + dir.x * at, y: a.y + dir.y * at }, to: { x: a.x + dir.x * (at + span), y: a.y + dir.y * (at + span) }, halfWidth: zone.halfWidth });
      at += span;
    }
    const decorCount = Math.max(1, Math.round(len / 8));
    for (let k = 0; k < decorCount; k++) {
      const kind = zone.decor[Math.floor(rng.next() * zone.decor.length)];
      const t = (k + 0.2 + rng.next() * 0.6) / decorCount;
      const side = rng.next() < 0.5 ? 1 : -1;
      const across = kind === 'rug' || kind === 'painted_line' ? (kind === 'rug' ? 0 : zone.halfWidth * 0.5) : (zone.halfWidth + 0.6 + rng.next() * 1.5) * side;
      const size = kind === 'rug' ? { x: 2.2, y: 1.2 } : kind === 'painted_line' ? { x: 3, y: 0.12 } : kind === 'puddle' ? { x: 0.8 + rng.next() * 0.6, y: 0.5 + rng.next() * 0.4 } : { x: 1.2, y: 0.8 };
      decor.push({ kind, pos: { x: a.x + dir.x * len * t - dir.y * across, y: a.y + dir.y * len * t + dir.x * across }, size, angle });
    }
  }
  return { patches, decor };
}
