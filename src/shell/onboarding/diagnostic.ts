import { createRng } from '../../sim/rng';
import type { DogRecord } from '../dogRecord';
import { nextStep } from './flow';
import { buildWalkPlan } from './plan';

/**
 * The Diagnostic Minigame: a 15-second reaction test. A signal lights up at random moments and the user taps
 * as fast as they can. It is not a Stage and never goes through `applyStage`.
 */
export const DIAGNOSTIC = {
  seconds: 15,
  /** Seconds of waiting before each signal, drawn between these bounds. */
  gap: { min: 0.8, max: 2.2 },
  /** A signal not answered within this time counts as this slow. */
  timeout: 1.5,
} as const;

/** Reaction latency (seconds) at the quick and slow ends of the map to the Dog's `reconnectionLatency`. */
export const LATENCY_MAP = { quick: 0.25, slow: 0.8, seedBest: 0.4, seedWorst: 0.1 } as const;
export const BAND_LIMITS = { quick: 0.35, slow: 0.55 } as const;

export type LatencyBand = 'quick' | 'steady' | 'slow';

export interface DiagnosticState {
  seed: number;
  t: number;
  /** Seconds at which the current signal appears; null while one is showing. */
  signalAt: number | null;
  signalShownAt: number | null;
  reactions: number[];
  /** Taps while no signal was showing. */
  earlyTaps: number;
  done: boolean;
}

function drawGap(seed: number, n: number): number {
  const rng = createRng(seed * 17 + n * 613);
  return DIAGNOSTIC.gap.min + rng.next() * (DIAGNOSTIC.gap.max - DIAGNOSTIC.gap.min);
}

export function newDiagnostic(seed: number): DiagnosticState {
  return { seed, t: 0, signalAt: drawGap(seed, 0), signalShownAt: null, reactions: [], earlyTaps: 0, done: false };
}

/** Advances by `dt` seconds; `tapped` is a tap during this step. Pure. */
export function stepDiagnostic(state: DiagnosticState, dt: number, tapped: boolean): DiagnosticState {
  if (state.done) return state;
  let s: DiagnosticState = { ...state, t: state.t + dt };
  if (s.signalShownAt === null && s.signalAt !== null && s.t >= s.signalAt) s = { ...s, signalShownAt: s.signalAt, signalAt: null };
  if (s.signalShownAt !== null) {
    const waited = s.t - s.signalShownAt;
    if (tapped || waited >= DIAGNOSTIC.timeout) {
      const reaction = tapped ? Math.max(0, waited) : DIAGNOSTIC.timeout;
      s = { ...s, reactions: [...s.reactions, reaction], signalShownAt: null, signalAt: s.t + drawGap(s.seed, s.reactions.length + 1) };
    }
  } else if (tapped) s = { ...s, earlyTaps: s.earlyTaps + 1 };
  return s.t >= DIAGNOSTIC.seconds ? { ...s, done: true } : s;
}

export function median(values: readonly number[]): number {
  if (values.length === 0) return DIAGNOSTIC.timeout;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const diagnosticLatency = (state: DiagnosticState) => median(state.reactions);

export function latencyBand(latency: number): LatencyBand {
  return latency < BAND_LIMITS.quick ? 'quick' : latency < BAND_LIMITS.slow ? 'steady' : 'slow';
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
  return {
    ...record,
    attributes: { ...record.attributes, reconnectionLatency: seedFromLatency(latency) },
    onboarding: { ...record.onboarding, diagnosticLatency: latency, plan: buildWalkPlan(latency, record.triggerProfile), step: record.onboarding.step === 'diagnostic' ? nextStep('diagnostic') : record.onboarding.step },
  };
}

/** Paws in the progress row: the signals a 15-second run is expected to hold. The run still ends on time, never on the paw count. */
export const DIAGNOSTIC_PAWS = 5;

/** Paws to show filled: one per reaction that answered a signal in time (a signal left to time out is not a response). */
export function pawsFilled(state: Pick<DiagnosticState, 'reactions'>, total = DIAGNOSTIC_PAWS): number {
  return Math.min(total, state.reactions.filter((r) => r < DIAGNOSTIC.timeout).length);
}
