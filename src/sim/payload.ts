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
  marksUsed: number;
  markBudget: number;
  seed: number;
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
  const payload: SimulationDebriefPayload = {
    durationSeconds: Math.round(state.time * 10) / 10,
    slackPercentage: slack,
    tautPercentage: taut,
    pullPercentage: pull,
    markerHits: hits.length,
    markerMisses: t.markerMisses,
    reactiveMarkers: t.reactiveMarkers,
    missedOpportunities: t.missedOpportunities,
    checkInHits: t.checkInHits,
    marksUsed: t.marksUsed,
    markBudget: state.config.markBudget,
    seed: state.seed,
  };
  if (hits.length > 0) {
    payload.markerAccuracyMs = Math.round(hits.reduce((a, b) => a + b, 0) / hits.length);
  }
  return payload;
}
