import type { Vec2 } from '../sim/vec';

/** Screen pixels per meter along each screen axis; the route (+x) runs toward the upper right. */
export const PX_PER_M_X = 25;
export const PX_PER_M_Y = 12.5;
/** Screen pixels per meter of height. */
export const PX_PER_M_Z = 25;

export function project(world: Vec2, height = 0): Vec2 {
  return {
    x: (world.x + world.y) * PX_PER_M_X,
    y: (world.y - world.x) * PX_PER_M_Y - height * PX_PER_M_Z,
  };
}

/** Inverse of `project` for points on the ground. */
export function unproject(screen: Vec2): Vec2 {
  const a = screen.x / PX_PER_M_X; // x + y
  const b = screen.y / PX_PER_M_Y; // y - x
  return { x: (a - b) / 2, y: (a + b) / 2 };
}
