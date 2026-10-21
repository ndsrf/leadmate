import { defaultScenario, type ScenarioConfig } from './config';
import { buildPayload, type SimulationDebriefPayload } from './payload';
import { closestOnSegment, leashPath } from './geometry';
import { propWalls, routePoints } from './scenery';
import { createState, tick, type SimEvent, type SimInput, type SimState } from './sim';
import { add, distance, normalize, scale, sub, type Vec2 } from './vec';

export interface ScriptedStage {
  state: SimState;
  events: SimEvent[];
  payload: SimulationDebriefPayload;
}

/**
 * Runs a Stage without any rendering: `inputs(state)` is asked for the input of every tick
 * until the Stage ends (or `maxSeconds` passes). Same seed and inputs give the same result.
 */
export function runScripted(
  seed: number,
  inputs: (state: SimState) => SimInput,
  config: ScenarioConfig = defaultScenario,
  maxSeconds = 600,
): ScriptedStage {
  const state = createState(seed, config);
  const events: SimEvent[] = [];
  const maxTicks = Math.round(maxSeconds / config.fixedStep);
  for (let i = 0; i < maxTicks && !state.ended; i++) {
    events.push(...tick(state, inputs(state)));
  }
  return { state, events, payload: buildPayload(state) };
}

/**
 * The direction a Handler who follows the route takes: toward the point `lookahead` meters further
 * along the route than the closest point to `pos`, so corners are rounded without leaving the corridor.
 */
export function routeDirection(config: ScenarioConfig, pos: Vec2, lookahead = 2.5): Vec2 {
  const route = routePoints(config);
  let leg = 1;
  let best = Infinity;
  for (let i = 1; i < route.length; i++) {
    const d = distance(pos, closestOnSegment(pos, route[i - 1], route[i]));
    if (d < best - 1e-9) {
      best = d;
      leg = i;
    }
  }
  let at = closestOnSegment(pos, route[leg - 1], route[leg]);
  let left = lookahead;
  for (let i = leg; i < route.length && left > 0; i++) {
    const step = distance(at, route[i]);
    if (step >= left) {
      const t = left / step;
      at = { x: at.x + (route[i].x - at.x) * t, y: at.y + (route[i].y - at.y) * t };
      left = 0;
    } else {
      at = route[i];
      left -= step;
    }
  }
  return normalize(sub(at, pos));
}

/** Closest point of the route to `pos`. */
function nearestRoutePoint(config: ScenarioConfig, pos: Vec2): Vec2 {
  const route = routePoints(config);
  let best = route[0];
  for (let i = 1; i < route.length; i++) {
    const c = closestOnSegment(pos, route[i - 1], route[i]);
    if (distance(pos, c) < distance(pos, best)) best = c;
  }
  return best;
}

/**
 * A scripted Handler that follows the route, eases off at Rigid Pull, steps aside when it has been
 * stuck on something, and when its leash is wrapped around an Obstacle walks to unwind it, as a
 * player would. Keeps a little memory, which resets when the clock goes back (a new run).
 */
export function routeWalker(config: ScenarioConfig): (state: SimState) => { direction: Vec2; strength: number } {
  const props = propWalls(config.scenery);
  let anchor = { pos: config.handlerStart, time: 0 };
  let side: { dir: Vec2; until: number } | null = null;
  return (s) => {
    if (s.time < anchor.time) {
      anchor = { pos: s.handler, time: s.time };
      side = null;
    }
    if (distance(s.handler, anchor.pos) > 0.3) anchor = { pos: s.handler, time: s.time };
    let direction = routeDirection(config, s.handler);
    let strength = s.ratio >= 1 ? 0.3 : 1;
    if (props.length > 0) {
      const path = leashPath(s.handler, s.dog, props);
      if (path.points.length > 2) {
        // aim just outside the wrap corner, away from what the leash bends around
        const corner = path.points[1];
        const inside = normalize(add(normalize(sub(s.handler, corner)), normalize(sub(path.points[2], corner))));
        direction = normalize(sub(add(corner, scale(inside, -0.6)), s.handler));
        strength = 0.6;
      }
    }
    if (side && s.time < side.until) return { direction: side.dir, strength: 0.6 };
    if (s.time - anchor.time > 2) {
      const toRoute = sub(nearestRoutePoint(config, s.handler), s.handler);
      const left = { x: -direction.y, y: direction.x };
      const dir = left.x * toRoute.x + left.y * toRoute.y >= 0 ? left : scale(left, -1);
      side = { dir: normalize(add(scale(dir, 1), scale(direction, 0.3))), until: s.time + 1.5 };
      anchor = { pos: s.handler, time: s.time };
      return { direction: side.dir, strength: 0.6 };
    }
    return { direction, strength };
  };
}
