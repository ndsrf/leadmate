import type { SimulationDebriefPayload } from '../sim/payload';

/** A payload with every field, defaulting to an uneventful Stage. Test helper. */
export function payloadWith(over: Partial<SimulationDebriefPayload> = {}): SimulationDebriefPayload {
  return {
    durationSeconds: 60,
    slackPercentage: 100,
    tautPercentage: 0,
    pullPercentage: 0,
    markerHits: 0,
    markerMisses: 0,
    reactiveMarkers: 0,
    missedOpportunities: 0,
    checkInHits: 0,
    followMarks: 0,
    posteSuccesses: 0,
    harshStops: 0,
    peakArousalScore: 0,
    calmEncounters: {},
    marksUsed: 0,
    markBudget: 5,
    seed: 1,
    sintoniaTimeSeconds: 0,
    goSniffs: 0,
    handlingScore: 0,
    configVersion: 'bundled',
    ...over,
  };
}
