import type { ScenarioConfig } from './config';
import { FEEDBACK_ACTION_KINDS, feedbackKindOf, isFeedbackActionKind } from './feedbackKinds';
import type { SimEvent, SimState } from './sim';

/** A scenario declares at most this many Stage Meters. */
export const MAX_STAGE_METERS = 2;

/** A Stage Meter during a Stage: Meter Points so far, never above the target. */
export interface MeterValue {
  id: string;
  value: number;
  target: number;
}

/** The declared Stage Meters of a scenario, empty. */
export function initialMeters(config: ScenarioConfig): MeterValue[] {
  return (config.meters ?? []).map((m) => ({ id: m.id, value: 0, target: m.target }));
}

/**
 * Adds the Meter Points of this tick's actions to the meters they feed, capped at each target, and
 * reports each addition as a `meter-points` event. Uses no randomness, so meters follow the seed.
 */
export function addMeterPoints(state: SimState, events: SimEvent[]): void {
  const meters = state.config.meters;
  if (!meters || meters.length === 0) return;
  const reported = events.length;
  for (let i = 0; i < reported; i++) {
    const kind = feedbackKindOf(events[i]);
    if (!kind) continue;
    meters.forEach((m, j) => {
      const meter = state.meters[j];
      const add = Math.min(m.meterPoints[kind] ?? 0, meter.target - meter.value);
      if (add <= 0) return;
      meter.value += add;
      events.push({ type: 'meter-points', time: state.time, meterId: meter.id, kind, points: add, value: meter.value, full: meter.value >= meter.target });
    });
  }
}

/** Handling score from Stage Meters (ADR 0029): 1000 times the mean fill, rounded. */
export function meterScore(meters: readonly Pick<MeterValue, 'value' | 'target'>[]): number {
  const fill = meters.reduce((sum, m) => sum + Math.max(0, Math.min(1, m.value / m.target)), 0) / meters.length;
  return Math.round(1000 * fill);
}

const positive = (n: unknown) => typeof n === 'number' && Number.isFinite(n) && n > 0;
const text = (s: unknown) => typeof s === 'string' && s.length > 0;

/** What is wrong with a scenario's Stage Meters, each naming the meter and the field. */
export function meterProblems(config: ScenarioConfig): string[] {
  const meters = config.meters;
  if (meters === undefined) return [];
  if (!Array.isArray(meters)) return ['meters must be a list'];
  const errors: string[] = [];
  if (meters.length > MAX_STAGE_METERS) errors.push(`meters: at most ${MAX_STAGE_METERS} Stage Meters, found ${meters.length}`);
  const seen = new Set<string>();
  meters.forEach((m, i) => {
    if (!text(m?.id)) {
      errors.push(`meter ${i + 1}: id is missing`);
      return;
    }
    const name = `meter "${m.id}"`;
    if (seen.has(m.id)) errors.push(`${name}: id is used twice`);
    seen.add(m.id);
    if (!text(m.labelKey)) errors.push(`${name}: labelKey is missing`);
    if (!text(m.icon)) errors.push(`${name}: icon is missing`);
    if (!positive(m.target)) errors.push(`${name}: target must be a number above 0`);
    const points = Object.entries(m.meterPoints ?? {});
    if (points.length === 0) errors.push(`${name}: meterPoints adds no Meter Points`);
    for (const [kind, n] of points) {
      if (!isFeedbackActionKind(kind)) errors.push(`${name}: meterPoints has an unknown action kind "${kind}"`);
      else if (FEEDBACK_ACTION_KINDS[kind] !== 'right') errors.push(`${name}: meterPoints "${kind}" is a wrong action and cannot add Meter Points`);
      else if (!positive(n)) errors.push(`${name}: meterPoints "${kind}" must be a number above 0`);
    }
  });
  return errors;
}
