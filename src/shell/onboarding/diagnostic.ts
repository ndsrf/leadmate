import type { DogRecord } from '../dogRecord';
import { nextStep } from './flow';
import { BAND_LIMITS, type LatencyBand, latencyBand } from './latency';
import { buildPersonalPlan } from './plan';

export { BAND_LIMITS, type LatencyBand, latencyBand };

/** Diagnostic constants kept for reaction-latency scaling. */
export const DIAGNOSTIC = {
  /** A signal not answered within this time counts as this slow. */
  timeout: 1.5,
} as const;

/** Reaction latency (seconds) at the quick and slow ends of the map to the Dog's `reconnectionLatency`. */
export const LATENCY_MAP = { quick: 0.25, slow: 0.8, seedBest: 0.4, seedWorst: 0.1 } as const;

export function median(values: readonly number[]): number {
  if (values.length === 0) return DIAGNOSTIC.timeout;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** A quicker user starts with a Dog that answers sooner; clamped to the 0.1 to 0.4 band. */
export function seedFromLatency(latency: number): number {
  const { quick, slow, seedBest, seedWorst } = LATENCY_MAP;
  const f = (latency - quick) / (slow - quick);
  return Math.max(seedWorst, Math.min(seedBest, seedBest + f * (seedWorst - seedBest)));
}

/**
 * Records the Diagnostic at the end of onboarding: stores the latency, seeds `reconnectionLatency` once and moves on to
 * the plan. A record that already has a latency is returned as it is, so a replay changes nothing.
 */
export function recordDiagnostic(record: DogRecord, latency: number): DogRecord {
  if (record.onboarding.diagnosticLatency !== null) return record;
  const onboarding = { ...record.onboarding, diagnosticLatency: latency, step: record.onboarding.step === 'diagnostic' ? nextStep('diagnostic') : record.onboarding.step };
  const next = { ...record, attributes: { ...record.attributes, reconnectionLatency: seedFromLatency(latency) }, onboarding };
  return { ...next, onboarding: { ...onboarding, plan: buildPersonalPlan(next) } };
}
