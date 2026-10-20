import {
  ATTRIBUTE_KEYS,
  averageProgress,
  DISTRACTOR_KINDS,
  type LearningAttributes,
  type TriggerProfile,
} from '../sim/learning';
import type { SimulationDebriefPayload } from '../sim/payload';

/** Tunables of the learning update; all are starting values for playtests. */
export const LEARNING = {
  /** Progress at which an attribute locks a floor it cannot fall below. */
  milestones: [0.33, 0.66],
  /** A poor run takes away at most this share of the distance from an attribute down to its floor. */
  setbackShare: 0.1,
  /** Progress a clean Stage can add to `reactivityThreshold` and `reconnectionLatency`. */
  mainGain: 0.03,
  /** Progress per marked follow and per Check-in hit, and how many count per Stage. */
  markGain: 0.015,
  markCap: 4,
  /** Rigid Pull share (percent) from which a run counts as poor; at 50 or more the setback is full. */
  poorPullFrom: 20,
  fullSetbackPull: 50,
  /** Reward Window length in ms: Marker timing is scored against it. */
  rewardWindowMs: 1100,
  /** Calm encounters with one kind of Distractor needed to lower its level by one. */
  calmEncountersPerLevel: 3,
} as const;

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** The highest milestone an attribute has reached; it cannot fall below it. */
export function floorOf(value: number): number {
  let floor = 0;
  for (const m of LEARNING.milestones) if (value >= m) floor = m;
  return floor;
}

/** A Stage with a Distractor encounter; with none, there is nothing to score. */
function hadEncounter(p: SimulationDebriefPayload): boolean {
  return p.markerHits + p.markerMisses + p.missedOpportunities + p.reactiveMarkers > 0 || p.peakArousalScore > 0;
}

/**
 * The Learning Attributes after a Stage (ADR 0003): a pure function of the old attributes and the
 * debrief payload. Good handling adds progress; a poor run takes away at most a share of the
 * distance to the milestone floor, so progress is never erased and absence changes nothing.
 */
export function updateLearning(attributes: LearningAttributes, payload: SimulationDebriefPayload): LearningAttributes {
  const p = payload;
  const pull = p.pullPercentage / 100;
  const calm = 1 - pull;
  const encounter = hadEncounter(p);

  const timing =
    p.markerAccuracyMs === undefined ? 0 : clamp01(1 - p.markerAccuracyMs / LEARNING.rewardWindowMs);
  const poste = p.posteSuccesses > 0 ? 1 : 0;
  // a lower peak Arousal at the same difficulty earns a larger gain
  const composure = 1 - clamp01(p.peakArousalScore / 100);

  const gain: LearningAttributes = {
    reactivityThreshold: encounter ? LEARNING.mainGain * (0.6 * poste + 0.4 * composure) * calm : 0,
    reconnectionLatency: p.markerHits > 0 ? LEARNING.mainGain * timing * calm : 0,
    followChance: LEARNING.markGain * Math.min(p.followMarks, LEARNING.markCap),
    checkInFrequency: LEARNING.markGain * Math.min(p.checkInHits, LEARNING.markCap),
  };

  const poor = clamp01((p.pullPercentage - LEARNING.poorPullFrom) / (LEARNING.fullSetbackPull - LEARNING.poorPullFrom));
  const next = { ...attributes };
  for (const key of ATTRIBUTE_KEYS) {
    const old = attributes[key];
    const floor = floorOf(old);
    const setback = key === 'followChance' || key === 'checkInFrequency' ? 0 : (old - floor) * LEARNING.setbackShare * poor;
    next[key] = clamp01(Math.max(floor, old + gain[key] - setback));
  }
  return next;
}

/**
 * The Trigger Profile after a Stage: calm encounters (a Disengagement then a Marker hit) add up per
 * kind, and enough of them lower that kind's level by one. A level is never raised.
 */
export function updateTriggerProfile(
  profile: TriggerProfile,
  counts: Partial<Record<keyof TriggerProfile, number>>,
  payload: Pick<SimulationDebriefPayload, 'calmEncounters'>,
): { profile: TriggerProfile; counts: Partial<Record<keyof TriggerProfile, number>> } {
  const nextProfile = { ...profile };
  const nextCounts = { ...counts };
  for (const kind of DISTRACTOR_KINDS) {
    const total = (counts[kind] ?? 0) + (payload.calmEncounters[kind] ?? 0);
    if (total >= LEARNING.calmEncountersPerLevel && profile[kind] > 0) {
      nextProfile[kind] = (profile[kind] - 1) as TriggerProfile[typeof kind];
      nextCounts[kind] = total - LEARNING.calmEncountersPerLevel;
    } else {
      nextCounts[kind] = total;
    }
  }
  return { profile: nextProfile, counts: nextCounts };
}

/** Posture 0 below 33% average progress, 1 from 33%, 2 from 66%; it never goes back down. */
export function nextPosture(attributes: LearningAttributes, current: 0 | 1 | 2): 0 | 1 | 2 {
  const avg = averageProgress(attributes);
  const reached = avg >= LEARNING.milestones[1] ? 2 : avg >= LEARNING.milestones[0] ? 1 : 0;
  return Math.max(current, reached) as 0 | 1 | 2;
}
