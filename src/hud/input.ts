import type { SimInput } from '../sim/sim';
import { normalize, type Vec2 } from '../sim/vec';
import { unproject } from './iso';

/** Below this joystick deflection the Handler stands still (the Poste). */
export const JOYSTICK_DEAD_ZONE = 0.15;
const WALK_BAND = 0.15;
const QUICK_FROM = 0.88;

/**
 * Turns a raw joystick deflection (0-1) into a movement strength with soft detents: a dead zone
 * at the center, a walk detent around `walkStrength` and a quick detent at the rim.
 */
export function applyDetents(raw: number, walkStrength: number): number {
  const r = Math.max(0, Math.min(1, raw));
  if (r < JOYSTICK_DEAD_ZONE) return 0;
  if (Math.abs(r - walkStrength) <= WALK_BAND) return walkStrength;
  if (r >= QUICK_FROM) return 1;
  return r;
}

/** A screen-space direction (up is -y) as a world direction on the ground. */
export function screenToWorldDirection(screen: Vec2): Vec2 {
  return normalize(unproject(screen));
}

export interface Keys {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  /** Key 2: quick forward movement in place of W. */
  quick: boolean;
}

/**
 * Desktop debug input, aligned with the isometric grid: W is forward along the route (screen
 * up-right), S back, D down-right and A up-left. WASD moves at walk strength; 2 in place of W
 * moves quick forward.
 */
export function keyboardInput(keys: Keys, walkStrength: number): Omit<SimInput, 'marker'> {
  const forward = keys.w || keys.quick;
  const world = { x: (forward ? 1 : 0) - (keys.s ? 1 : 0), y: (keys.d ? 1 : 0) - (keys.a ? 1 : 0) };
  if (world.x === 0 && world.y === 0) return { direction: { x: 0, y: 0 }, strength: 0 };
  return { direction: normalize(world), strength: keys.quick && !keys.w ? 1 : walkStrength };
}
