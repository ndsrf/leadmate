import { defaultScenario, type ScenarioConfig } from '../sim/config';

/** Days away after which the Dog is Rusty. */
export const RUSTY_GAP_DAYS = 3;
/** Capacity multiplier for a session where the warm-up was skipped. */
export const RUSTY_CAPACITY = 0.8;
export const WARMUP_SECONDS = 40;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The Dog is Rusty after a gap of 3 or more days since the last Stage; no Stage yet is not a gap. */
export function isRusty(lastStageDate: string | null, now: Date): boolean {
  if (!lastStageDate) return false;
  const last = Date.parse(lastStageDate);
  if (!Number.isFinite(last)) return false;
  return now.getTime() - last >= RUSTY_GAP_DAYS * DAY_MS;
}

export type WarmupOutcome = 'none' | 'completed' | 'skipped';

/**
 * Capacity of the Dog for this session only: full after a warm-up or when there was no gap, reduced
 * when a Rusty Dog's warm-up was skipped. Nothing here is stored.
 */
export function sessionCapacity(rusty: boolean, outcome: WarmupOutcome): number {
  return rusty && outcome === 'skipped' ? RUSTY_CAPACITY : 1;
}

/** The warm-up walk: easy, 30 to 45 s, no Distractor, no Marks; the result never changes the Dog. */
export function warmupScenario(base: ScenarioConfig = defaultScenario): ScenarioConfig {
  return {
    ...base,
    distractor: { ...base.distractor, activateAfterMeters: 1e9 },
    markBudget: 0,
    endCondition: { kind: 'time-limit', seconds: WARMUP_SECONDS },
  };
}
