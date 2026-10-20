import type { ScenarioConfig } from './config';
import { closestOnSegment, routeLength, segmentsCross, type SceneryItem, type SceneryTheme } from './geometry';
import { createRng } from './rng';
import { distance, type Vec2 } from './vec';

/** Props each theme may use; a scenario's scenery set has to match its theme. */
export const THEME_PROPS: Record<SceneryTheme, readonly string[]> = {
  indoor_apartment: ['door', 'coat_rack', 'shoe_rack', 'plant', 'lamp', 'mat', 'elevator_panel', 'picture', 'cabinet'],
  quiet_suburb: ['tree', 'conifer', 'hedge', 'mailbox', 'bench', 'lamp_post', 'fence', 'bush', 'bin'],
  urban_street: ['parked_car', 'lamp_post', 'bin', 'bench', 'tree', 'bus_stop', 'hydrant', 'sign', 'bike_rack'],
  open_park: ['tree', 'conifer', 'bench', 'bush', 'lamp_post', 'pond', 'picnic_table', 'bin'],
};

/** At least one prop per this many meters of route. */
export const METERS_PER_PROP = 5;
/** And never fewer than this many props in a walking scenario. */
export const MIN_PROPS = 8;

/** Props a route of `meters` needs. */
export function requiredProps(meters: number): number {
  return Math.max(MIN_PROPS, Math.ceil(meters / METERS_PER_PROP));
}

/** The route as points, from the Handler's start to the end waypoint. */
export function routePoints(config: Pick<ScenarioConfig, 'handlerStart' | 'waypoints' | 'waypoint'>): Vec2[] {
  return [config.handlerStart, ...config.waypoints, config.waypoint];
}

const finite = (p: Vec2) => Number.isFinite(p.x) && Number.isFinite(p.y);

/**
 * Checks a scenario: valid geometry, a scenery set that matches the theme, and the minimum density
 * (one prop per 5 m of route, at least 8). Returns the problems found; empty means valid.
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
  const need = requiredProps(routeLength(route));
  if (config.scenery.length < need) errors.push(`scenery has ${config.scenery.length} props, the route needs at least ${need}`);
  return errors;
}

export interface ScatterOptions {
  /** Props to use; defaults to every prop of the theme. */
  types?: readonly string[];
  /** Props per meter of route beyond the minimum; 0.25 gives one per 4 m. */
  perMeter?: number;
  /** Distance range from the route, in meters. */
  offset?: { min: number; max: number };
}

const SHIELDS: Record<string, number> = { parked_car: 1.4 };

/**
 * A scenery set placed along the route with a seeded random, alternating sides and never on the
 * route itself or on a wall. Decorative only: it never feeds the simulation, except for visual
 * shields, which block sight.
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
  const count = Math.max(requiredProps(routeLength(route)), Math.ceil(routeLength(route) * (options.perMeter ?? 0)));
  const rng = createRng(seed);
  const total = routeLength(route);
  const items: SceneryItem[] = [];
  let attempts = 0;
  while (items.length < count && attempts < count * 20) {
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
    const side = slot % 2 === 0 ? 1 : -1;
    const d = offset.min + rng.next() * (offset.max - offset.min);
    const pos = { x: base.x + (-(b.y - a.y) / len) * d * side, y: base.y + ((b.x - a.x) / len) * d * side };
    if (walls.some((w) => distance(closestOnSegment(pos, w.from, w.to), pos) < 0.8)) continue;
    const type = types[Math.floor(rng.next() * types.length)];
    const radius = SHIELDS[type];
    items.push(radius ? { type, pos, visualShield: true, radius } : { type, pos });
  }
  return items;
}
