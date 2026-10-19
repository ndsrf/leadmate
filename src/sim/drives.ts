import type { ScenarioConfig } from './config';
import type { Rng } from './rng';
import { normalize, rotate, sub, type Vec2 } from './vec';

export interface DriveContext {
  dog: Vec2;
  handler: Vec2;
  waypoint: Vec2;
  dt: number;
}

export interface DriveOutput {
  /** Unit direction, or the zero vector to stand still. */
  direction: Vec2;
  /** Meters per second. */
  speed: number;
}

/** What the Dog wants right now. Leash behavior never looks inside a Drive. */
export interface Drive {
  desire(context: DriveContext): DriveOutput;
}

/** Heads for the waypoint with a seeded random Wander so the path is not a straight line. */
export class GoalDrive implements Drive {
  private wander = 0;

  constructor(
    private readonly config: Pick<ScenarioConfig, 'dogGoalSpeed' | 'wanderMaxAngle' | 'wanderTurnRate'>,
    private readonly rng: Rng,
  ) {}

  desire({ dog, waypoint, dt }: DriveContext): DriveOutput {
    const { wanderMaxAngle, wanderTurnRate, dogGoalSpeed } = this.config;
    const next = this.wander + (this.rng.next() - 0.5) * 2 * wanderTurnRate * dt;
    this.wander = Math.max(-wanderMaxAngle, Math.min(wanderMaxAngle, next));
    return { direction: rotate(normalize(sub(waypoint, dog)), this.wander), speed: dogGoalSpeed };
  }
}
