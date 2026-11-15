import type { ScenarioConfig } from './config';
import type { Rng } from './rng';
import { add, distance, normalize, rotate, scale, sub, type Vec2 } from './vec';

/** A smell the Dog can follow: where it is, how hard it pulls (before Autopilot) and how far it reaches. */
export interface ScentPull {
  pos: Vec2;
  /** Pull weight from the spot's strength (`ScentWalkConfig.pull`). */
  pull: number;
  /** Nose radius in meters. */
  radius: number;
}

export interface DriveContext {
  dog: Vec2;
  handler: Vec2;
  waypoint: Vec2;
  dt: number;
  /** The Handler's current heading (unit); used by a heading Goal. */
  handlerFacing?: Vec2;
  /** Smells in the scene that still pull (a scent Stage only). */
  scents?: readonly ScentPull[];
  /** Autopilot, 0 to 1 (a scent Stage only). */
  autopilot?: number;
}

export interface DriveOutput {
  /** Unit direction, or the zero vector to stand still. */
  direction: Vec2;
  /** Meters per second. */
  speed: number;
  /** How much this output counts in a `BlendDrive`; 1 when absent. */
  weight?: number;
}

/** What the Dog wants right now. Leash behavior never looks inside a Drive. */
export interface Drive {
  desire(context: DriveContext): DriveOutput;
}

/** Within this distance of its aim, in meters, a Drive slows down so the Dog settles instead of overshooting. */
const SETTLE_DISTANCE = 0.5;

/**
 * Heads for the waypoint with a seeded random Wander so the path is not a straight line. With the
 * `heading` target (scent Stages, ADR 0030) it aims `headingLead` meters ahead of the Handler along
 * the Handler's heading instead, so the Dog does not know the route.
 */
export class GoalDrive implements Drive {
  private wander = 0;

  constructor(
    private readonly config: Pick<ScenarioConfig, 'dogGoalSpeed' | 'wanderMaxAngle' | 'wanderTurnRate'>,
    private readonly rng: Rng,
    private readonly target: 'waypoint' | 'heading' = 'waypoint',
    private readonly headingLead = 0,
  ) {}

  desire({ dog, handler, waypoint, dt, handlerFacing }: DriveContext): DriveOutput {
    const { wanderMaxAngle, wanderTurnRate, dogGoalSpeed } = this.config;
    const next = this.wander + (this.rng.next() - 0.5) * 2 * wanderTurnRate * dt;
    this.wander = Math.max(-wanderMaxAngle, Math.min(wanderMaxAngle, next));
    if (this.target === 'waypoint') return { direction: rotate(normalize(sub(waypoint, dog)), this.wander), speed: dogGoalSpeed };
    const aim = add(handler, scale(handlerFacing ?? { x: 0, y: 0 }, this.headingLead));
    const d = distance(dog, aim);
    return { direction: rotate(normalize(sub(aim, dog)), this.wander), speed: dogGoalSpeed * Math.min(1, d / SETTLE_DISTANCE) };
  }
}

/**
 * The nose: heads for the nearest smell in range, weighted by its pull and by Autopilot
 * (`pull x (floor + (1 - floor) x autopilot)`); weight 0 with nothing in range.
 */
export class ScentDrive implements Drive {
  constructor(private readonly config: { dogGoalSpeed: number; autopilotFloor: number; reachDistance: number }) {}

  desire({ dog, scents = [], autopilot = 0 }: DriveContext): DriveOutput {
    const smell = nearestScent(dog, scents);
    if (!smell) return { direction: { x: 0, y: 0 }, speed: 0, weight: 0 };
    const { dogGoalSpeed, autopilotFloor, reachDistance } = this.config;
    const d = distance(dog, smell.pos);
    return {
      direction: normalize(sub(smell.pos, dog)),
      speed: dogGoalSpeed * Math.min(1, d / Math.max(reachDistance, 1e-6)),
      weight: smell.pull * (autopilotFloor + (1 - autopilotFloor) * autopilot),
    };
  }
}

/** The nearest smell whose nose radius reaches the Dog, or null. */
export function nearestScent<T extends ScentPull>(dog: Vec2, scents: readonly T[]): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const s of scents) {
    const d = distance(dog, s.pos);
    if (d <= s.radius && d < bestD) {
      best = s;
      bestD = d;
    }
  }
  return best;
}

/** Blends Drives by their weights: directions as a weighted sum of unit vectors, speeds as a weighted mean. */
export class BlendDrive implements Drive {
  constructor(private readonly drives: readonly Drive[]) {}

  desire(context: DriveContext): DriveOutput {
    // every Drive is asked every tick, so the seeded Wander draws stay in a fixed order
    const outputs = this.drives.map((d) => d.desire(context));
    let dir = { x: 0, y: 0 };
    let speed = 0;
    let total = 0;
    for (const o of outputs) {
      const w = o.weight ?? 1;
      if (w <= 0) continue;
      dir = add(dir, scale(o.direction, w));
      speed += o.speed * w;
      total += w;
    }
    return { direction: normalize(dir), speed: total > 0 ? speed / total : 0 };
  }
}
