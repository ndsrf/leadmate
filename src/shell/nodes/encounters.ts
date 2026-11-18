import type { DistractorKind } from '../../sim/learning';
import { skippedSimulationPayload, type SimulationDebriefPayload } from '../../sim/payload';
import type { ReactionTier } from '../../sim/sim';

import type { EncounterAim } from '../content/schema';
export type { EncounterAim };

export type PawReason = 'aim' | 'reactive' | 'pull' | 'reactive-marker' | 'late' | 'perfect';

export interface PawResult {
  paws: 1 | 2 | 3;
  next: PawReason | null;
}

export interface EncounterAttempt {
  payload: SimulationDebriefPayload;
  paws: 1 | 2 | 3;
}

export interface EncounterSeriesEntry {
  id: string;
  attempts?: readonly EncounterAttempt[];
  kept?: EncounterAttempt | null;
  attemptsCount?: number;
}

export const KEEP_SLACK_MAX_PULL = 25;
export const CLEAN_MAX_PULL = 10;

const TIER_ORDER: Record<ReactionTier, number> = { calm: 0, alert: 1, reactive: 2 };

export function keptAttempt(attempts: readonly EncounterAttempt[]): EncounterAttempt | null {
  if (attempts.length === 0) return null;
  let best = attempts[0];
  for (let i = 1; i < attempts.length; i++) {
    if (attempts[i].paws >= best.paws) {
      best = attempts[i];
    }
  }
  return best;
}

export function combineEncounterPayloads(
  entries: readonly EncounterSeriesEntry[],
  seriesLengthOrOptions?: number | { skipped?: boolean; seriesLength?: number } | boolean,
  maybeSkipped?: boolean,
): SimulationDebriefPayload {
  let isSkipped = false;
  let seriesLength = entries.length;

  if (typeof seriesLengthOrOptions === 'boolean') {
    isSkipped = seriesLengthOrOptions;
  } else if (typeof seriesLengthOrOptions === 'number') {
    seriesLength = seriesLengthOrOptions;
    isSkipped = !!maybeSkipped;
  } else if (seriesLengthOrOptions && typeof seriesLengthOrOptions === 'object') {
    isSkipped = !!seriesLengthOrOptions.skipped;
    seriesLength = seriesLengthOrOptions.seriesLength ?? entries.length;
  }

  const encounterSummaries: { id: string; paws: number; attempts: number; seed?: number }[] = [];
  const keptAttempts: EncounterAttempt[] = [];

  for (const entry of entries) {
    const kept = entry.kept ?? (entry.attempts ? keptAttempt(entry.attempts) : null);
    const attempts = entry.attempts ? entry.attempts.length : (entry.attemptsCount ?? (kept ? 1 : 0));
    const summary: { id: string; paws: number; attempts: number; seed?: number } = {
      id: entry.id,
      paws: kept ? kept.paws : 0,
      attempts,
    };
    if (kept) {
      summary.seed = kept.payload.seed;
      keptAttempts.push(kept);
    }
    encounterSummaries.push(summary);
  }

  // If no kept attempts at all, return skip baseline counts with encounter list
  if (keptAttempts.length === 0) {
    const baseline = skippedSimulationPayload(1);
    return {
      ...baseline,
      handlingScore: isSkipped ? 500 : 0,
      encounters: encounterSummaries,
    };
  }

  // Duration and weighted tension shares
  const totalDuration = keptAttempts.reduce((sum, a) => sum + a.payload.durationSeconds, 0);
  let pull = 0;
  let taut = 0;
  if (totalDuration > 0) {
    pull = Math.round(keptAttempts.reduce((sum, a) => sum + a.payload.durationSeconds * a.payload.pullPercentage, 0) / totalDuration);
    taut = Math.round(keptAttempts.reduce((sum, a) => sum + a.payload.durationSeconds * a.payload.tautPercentage, 0) / totalDuration);
  }
  const slack = Math.max(0, 100 - pull - taut);

  // Counts and markGrades summed
  let markerHits = 0;
  let markerMisses = 0;
  let reactiveMarkers = 0;
  let missedOpportunities = 0;
  let checkInHits = 0;
  let followMarks = 0;
  let posteSuccesses = 0;
  let harshStops = 0;
  let marksUsed = 0;
  let markBudget = 0;
  let sintoniaTimeSeconds = 0;
  let goSniffs = 0;
  const calmEncounters: Partial<Record<DistractorKind, number>> = {};
  const markGrades = { perfect: 0, good: 0, late: 0 };

  const accuracyValues: number[] = [];

  let peakArousalScore = 0;
  let highestTierRank = -1;
  let peakReactionTier: ReactionTier | undefined = undefined;

  for (const a of keptAttempts) {
    const p = a.payload;
    markerHits += p.markerHits;
    markerMisses += p.markerMisses;
    reactiveMarkers += p.reactiveMarkers;
    missedOpportunities += p.missedOpportunities;
    checkInHits += p.checkInHits;
    followMarks += p.followMarks;
    posteSuccesses += p.posteSuccesses;
    harshStops += p.harshStops;
    marksUsed += p.marksUsed;
    markBudget += p.markBudget;
    sintoniaTimeSeconds += p.sintoniaTimeSeconds;
    goSniffs += p.goSniffs;

    if (p.calmEncounters) {
      for (const [k, v] of Object.entries(p.calmEncounters)) {
        calmEncounters[k as DistractorKind] = (calmEncounters[k as DistractorKind] ?? 0) + (v ?? 0);
      }
    }

    if (p.markGrades) {
      markGrades.perfect += p.markGrades.perfect;
      markGrades.good += p.markGrades.good;
      markGrades.late += p.markGrades.late;
    }

    if (typeof p.markerAccuracyMs === 'number') {
      accuracyValues.push(p.markerAccuracyMs);
    }

    if (p.peakArousalScore > peakArousalScore) {
      peakArousalScore = p.peakArousalScore;
    }

    if (p.peakReactionTier) {
      const rank = TIER_ORDER[p.peakReactionTier];
      if (rank > highestTierRank) {
        highestTierRank = rank;
        peakReactionTier = p.peakReactionTier;
      }
    }
  }

  const totalPaws = encounterSummaries.reduce((sum, e) => sum + e.paws, 0);
  const score = isSkipped
    ? 500
    : seriesLength > 0
      ? Math.round((1000 * totalPaws) / (3 * seriesLength))
      : 0;

  const result: SimulationDebriefPayload = {
    durationSeconds: Math.round(totalDuration * 10) / 10,
    slackPercentage: slack,
    tautPercentage: taut,
    pullPercentage: pull,
    markerHits,
    markerMisses,
    reactiveMarkers,
    missedOpportunities,
    checkInHits,
    followMarks,
    posteSuccesses,
    harshStops,
    peakArousalScore,
    calmEncounters,
    marksUsed,
    markBudget,
    seed: keptAttempts[0].payload.seed,
    sintoniaTimeSeconds: Math.round(sintoniaTimeSeconds * 10) / 10,
    goSniffs,
    markGrades,
    handlingScore: score,
    configVersion: keptAttempts[0].payload.configVersion ?? 'bundled',
    encounters: encounterSummaries,
  };

  if (peakReactionTier) {
    result.peakReactionTier = peakReactionTier;
  }

  if (accuracyValues.length > 0) {
    result.markerAccuracyMs = Math.round(accuracyValues.reduce((sum, v) => sum + v, 0) / accuracyValues.length);
  }

  return result;
}

export function pawsFor(aim: EncounterAim, payload: SimulationDebriefPayload): PawResult {
  let aimMet = false;
  switch (aim) {
    case 'keep-slack':
      aimMet = payload.pullPercentage <= KEEP_SLACK_MAX_PULL && payload.peakReactionTier !== 'reactive';
      break;
    case 'stay-calm':
      aimMet = payload.peakReactionTier !== 'reactive';
      break;
    case 'mark-disengagement':
      aimMet = payload.markerHits >= 1;
      break;
    case 'check-in':
      aimMet = payload.checkInHits >= 1;
      break;
  }

  if (!aimMet) {
    return { paws: 1, next: 'aim' };
  }

  // Aim is met -> check clean conditions in order: reactive, pull, reactive marker, late, perfect
  if (payload.peakReactionTier === 'reactive') {
    return { paws: 2, next: 'reactive' };
  }
  if (payload.pullPercentage > CLEAN_MAX_PULL) {
    return { paws: 2, next: 'pull' };
  }
  if (payload.reactiveMarkers > 0) {
    return { paws: 2, next: 'reactive-marker' };
  }
  if ((payload.markGrades?.late ?? 0) > 0) {
    return { paws: 2, next: 'late' };
  }
  if ((aim === 'mark-disengagement' || aim === 'check-in') && (payload.markGrades?.perfect ?? 0) < 1) {
    return { paws: 2, next: 'perfect' };
  }

  return { paws: 3, next: null };
}
