import type { Vec2 } from './vec';

/** Tension Ratio below this is Slack. */
export const SLACK_MAX = 0.85;
/** Tension Ratio above this is Rigid Pull. */
export const RIGID_MIN = 1.0;
/** Float noise allowed when comparing a ratio with a threshold. */
export const RATIO_EPSILON = 1e-6;

export type EndCondition = { kind: 'reach-waypoint' } | { kind: 'time-limit'; seconds: number };

export interface DistractorConfig {
  /** Meters per second. */
  speed: number;
  /** Fixation starts when the Distractor is within this distance of the Dog. */
  triggerRadius: number;
  /** The Distractor appears once the Dog has covered this distance from its start. */
  activateAfterMeters: number;
  /**
   * Without `path`, the Distractor crosses the route at right angles, starting this far to the
   * side, aimed at where a Dog walking at its Goal speed will be when the Distractor arrives.
   */
  startOffset: number;
  /** Fixed path in meters, instead of one aimed at the Dog. */
  path?: { from: Vec2; to: Vec2 };
}

/** Every tunable of a Stage. 1 world unit = 1 m. */
export interface ScenarioConfig {
  fixedStep: number;
  leashLength: number;
  /** Extra distance the Handler can be pushed past the leash length (shows as Rigid Pull). */
  leashTolerance: number;
  /** Handler speed at movement strength 1. */
  quickSpeed: number;
  /** Movement strength of a walk (joystick detent, keyboard). */
  walkStrength: number;
  handlerStart: Vec2;
  dogStart: Vec2;
  waypoint: Vec2;
  waypointRadius: number;
  dogGoalSpeed: number;
  dogFixationSpeed: number;
  dogReturnSpeed: number;
  /** The Dog is back at the Handler's side within this distance. */
  dogReturnDistance: number;
  /** Maximum Wander deviation from the straight line to the waypoint, in radians. */
  wanderMaxAngle: number;
  /** Wander turn rate, in radians per second. */
  wanderTurnRate: number;
  distractor: DistractorConfig;
  /** Handler stopped without Rigid Pull for this long ends a Fixation. */
  calmSeconds: number;
  rewardWindowSeconds: number;
  /** Marks available per Stage; every Marker press spends one. */
  markBudget: number;
  /** How long a Dog's look at the Handler counts as a Check-in, in seconds. */
  checkInWindow: number;
  /** Average seconds between the Dog's Check-in glances (each gap is seeded, 0.5x to 1.5x). */
  checkInMeanInterval: number;
  /** Chance, 0 to 1, that the Dog turns with the Handler after a turn on Slack. */
  followChance: number;
  /** A Handler heading change bigger than this, in radians, counts as a turn. */
  turnAngle: number;
  /** How long a follow or a Taut correction steers the Dog toward the Handler's heading. */
  followSeconds: number;
  /** How long a Dog that did not follow waits for the leash to reach Taut and correct it. */
  correctionWaitSeconds: number;
  /** Speed in m/s at which Rigid Pull drags the Dog toward the Handler; 0 disables it. */
  pullStrength: number;
  endCondition: EndCondition;
}

export const defaultScenario: ScenarioConfig = {
  fixedStep: 1 / 60,
  leashLength: 2,
  leashTolerance: 0.1,
  quickSpeed: 2.0,
  walkStrength: 0.6,
  handlerStart: { x: 0, y: 0 },
  dogStart: { x: 1, y: 0 },
  waypoint: { x: 90, y: 0 },
  waypointRadius: 2,
  dogGoalSpeed: 1.6,
  dogFixationSpeed: 1.0,
  dogReturnSpeed: 1.6,
  dogReturnDistance: 1,
  wanderMaxAngle: 0.5,
  wanderTurnRate: 2,
  distractor: {
    speed: 4,
    triggerRadius: 8,
    activateAfterMeters: 30,
    startOffset: 28,
  },
  calmSeconds: 3,
  rewardWindowSeconds: 1.1,
  markBudget: 5,
  checkInWindow: 1.0,
  checkInMeanInterval: 8,
  followChance: 0.7,
  turnAngle: Math.PI / 4,
  followSeconds: 1.5,
  correctionWaitSeconds: 4,
  pullStrength: 0.8,
  endCondition: { kind: 'reach-waypoint' },
};
