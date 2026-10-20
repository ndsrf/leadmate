import type { DistractorKind } from './learning';
import type { SimState } from './sim';

/** What the simulation reports to the shell when a Stage ends. */
export interface SimulationDebriefPayload {
  durationSeconds: number;
  slackPercentage: number;
  tautPercentage: number;
  pullPercentage: number;
  /** Marker press minus Disengagement, in ms. Absent when there was no Marker hit. */
  markerAccuracyMs?: number;
  markerHits: number;
  markerMisses: number;
  reactiveMarkers: number;
  missedOpportunities: number;
  /** Marks pressed while the Dog was looking at the Handler. */
  checkInHits: number;
  /** Check-in hits on a look after the Dog followed a turn. */
  followMarks: number;
  /** Stops at the leash limit during which a Fixation ended in a Disengagement. */
  posteSuccesses: number;
  /** Abrupt stops at the leash limit with the Dog moving outward. */
  harshStops: number;
  /** Highest Arousal the Dog reached, 0 to 100, unscaled. */
  peakArousalScore: number;
  /** Disengagements followed by a Marker hit, per kind of Distractor (feeds the Trigger Profile). */
  calmEncounters: Partial<Record<DistractorKind, number>>;
  marksUsed: number;
  markBudget: number;
  seed: number;
  /** Seconds the combo "Sintonía" was active. */
  sintoniaTimeSeconds: number;
  /** Go Sniffs the Handler started. */
  goSniffs: number;
  /** Composite handling score, 0 to 1000 (see `handlingScore`). */
  handlingScore: number;
  /** 'bundled' or the version of the remote level config the Stage ran on. */
  configVersion: string;
}

/** Points each part of the handling score is worth; they add up to 1000 (ADR 0005). */
export const SCORE_WEIGHTS = { composure: 400, slack: 300, markerAccuracy: 200, sintonia: 100 } as const;
/** A Marker hit this slow scores nothing for accuracy: the Reward Window is about 1.1 s. */
export const SCORE_SLOWEST_HIT_MS = 1100;
/** Sintonía for this share of the Stage scores the full points. */
export const SCORE_SINTONIA_SHARE = 0.4;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/**
 * The normalized 0-1000 handling score: Composure (100 minus the peak Arousal), the Slack share,
 * Marker timing on Disengagements and Sintonía time. A Stage with no encounter to time scores the
 * full Marker points; one with encounters but no hit scores none.
 */
export function handlingScore(p: Omit<SimulationDebriefPayload, 'handlingScore' | 'configVersion'>): number {
  const composure = clamp01((100 - p.peakArousalScore) / 100) * SCORE_WEIGHTS.composure;
  const slack = clamp01(p.slackPercentage / 100) * SCORE_WEIGHTS.slack;
  const encounters = p.markerHits + p.markerMisses + p.missedOpportunities;
  let marker: number = SCORE_WEIGHTS.markerAccuracy;
  if (encounters > 0) {
    marker = p.markerAccuracyMs === undefined ? 0 : clamp01(1 - p.markerAccuracyMs / SCORE_SLOWEST_HIT_MS) * SCORE_WEIGHTS.markerAccuracy;
  }
  const sintonia = p.durationSeconds > 0 ? clamp01(p.sintoniaTimeSeconds / (SCORE_SINTONIA_SHARE * p.durationSeconds)) * SCORE_WEIGHTS.sintonia : 0;
  return Math.round(composure + slack + marker + sintonia);
}

export function buildPayload(state: SimState): SimulationDebriefPayload {
  const t = state.telemetry;
  const total = t.slackTime + t.tautTime + t.rigidTime;
  const share = (part: number) => (total === 0 ? 0 : Math.round((part / total) * 100));
  const pull = share(t.rigidTime);
  const taut = share(t.tautTime);
  // Slack takes the remainder so the three always sum to exactly 100.
  const slack = total === 0 ? 100 : Math.max(0, 100 - pull - taut);

  const hits = t.hitAccuraciesMs;
  const base: Omit<SimulationDebriefPayload, 'handlingScore' | 'configVersion'> = {
    durationSeconds: Math.round(state.time * 10) / 10,
    slackPercentage: slack,
    tautPercentage: taut,
    pullPercentage: pull,
    markerHits: hits.length,
    markerMisses: t.markerMisses,
    reactiveMarkers: t.reactiveMarkers,
    missedOpportunities: t.missedOpportunities,
    checkInHits: t.checkInHits,
    followMarks: t.followMarks,
    posteSuccesses: t.posteSuccesses,
    harshStops: t.harshStops,
    peakArousalScore: Math.round(t.peakArousal),
    calmEncounters: { ...t.calmEncounters },
    marksUsed: t.marksUsed,
    markBudget: state.config.markBudget,
    seed: state.seed,
    sintoniaTimeSeconds: Math.round(t.sintoniaTime * 10) / 10,
    goSniffs: t.goSniffs,
  };
  if (hits.length > 0) {
    base.markerAccuracyMs = Math.round(hits.reduce((a, b) => a + b, 0) / hits.length);
  }
  return { ...base, handlingScore: handlingScore(base), configVersion: state.config.configVersion };
}
