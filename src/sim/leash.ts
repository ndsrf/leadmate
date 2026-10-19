import { RATIO_EPSILON, RIGID_MIN, SLACK_MAX } from './config';
import { distance, type Vec2 } from './vec';

export type TensionState = 'slack' | 'taut' | 'rigid';

export function tensionRatio(handler: Vec2, dog: Vec2, leashLength: number): number {
  return distance(handler, dog) / leashLength;
}

/** Slack below 0.85, Taut from 0.85 to 1.0, Rigid Pull above 1.0. */
export function classifyTension(ratio: number): TensionState {
  if (ratio > RIGID_MIN + RATIO_EPSILON) return 'rigid';
  if (ratio >= SLACK_MAX) return 'taut';
  return 'slack';
}

export interface Point3 {
  x: number;
  y: number;
  /** Height above the ground, in meters. */
  z: number;
}

export interface LeashCurve {
  start: Point3;
  control: Point3;
  end: Point3;
}

/** Height of the Handler's hand and of the Dog's collar. */
export const HAND_HEIGHT = 1.0;
export const COLLAR_HEIGHT = 0.4;

/**
 * Quadratic Bézier from the Handler's hand to the Dog's collar. The control point sags by the
 * slack in the leash (a rope of length L over a chord c sags about sqrt(3c(L-c)/8)) and the
 * curve flattens once the leash is fully extended.
 */
export function leashCurve(handler: Vec2, dog: Vec2, leashLength: number): LeashCurve {
  const start: Point3 = { x: handler.x, y: handler.y, z: HAND_HEIGHT };
  const end: Point3 = { x: dog.x, y: dog.y, z: COLLAR_HEIGHT };
  const chord = distance(handler, dog);
  const sag = Math.sqrt(Math.max(0, (3 * chord * (leashLength - chord)) / 8));
  const control: Point3 = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: (start.z + end.z) / 2 - 2 * sag,
  };
  return { start, control, end };
}

export function leashPoint(curve: LeashCurve, t: number): Point3 {
  const u = 1 - t;
  const a = u * u;
  const b = 2 * u * t;
  const c = t * t;
  return {
    x: a * curve.start.x + b * curve.control.x + c * curve.end.x,
    y: a * curve.start.y + b * curve.control.y + c * curve.end.y,
    z: a * curve.start.z + b * curve.control.z + c * curve.end.z,
  };
}
