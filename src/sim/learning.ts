/**
 * The learning state a Stage receives, read-only (ADR 0003). The simulation never reads or writes
 * storage: the shell builds a snapshot from the Dog record and the Stage config carries it.
 */

/** Kinds of Distractor the Trigger Profile has a level for. */
export const DISTRACTOR_KINDS = ['child', 'bicycle', 'dog', 'skateboard', 'food', 'other'] as const;
export type DistractorKind = (typeof DISTRACTOR_KINDS)[number];

/** Reactivity of the Dog to one kind of Distractor: 0 none, 1 mild, 2 usual, 3 strong. */
export type TriggerLevel = 0 | 1 | 2 | 3;
export type TriggerProfile = Record<DistractorKind, TriggerLevel>;

/** TriggerFactor in the Arousal formula for each level. */
export const TRIGGER_FACTORS: Record<TriggerLevel, number> = { 0: 0, 1: 0.5, 2: 1.0, 3: 1.5 };

export type Equipment = 'collar' | 'harness';

export interface EquipmentProfile {
  /** Multiplier on the Arousal rate during Rigid Pull. */
  rigidPull: number;
  /** Multiplier on how strongly the Dog answers leash signals (Taut corrections, Cues, reconnection). */
  signalResponse: number;
  /** Multiplier on the one-time Arousal bump of an abrupt stop at the leash limit. */
  posteJolt: number;
}

export const EQUIPMENT_PROFILES: Record<Equipment, EquipmentProfile> = {
  collar: { rigidPull: 1.5, signalResponse: 1.2, posteJolt: 1.0 },
  harness: { rigidPull: 1.0, signalResponse: 0.8, posteJolt: 0.4 },
};

/** Persistent values in progress terms: 0 is where a new Dog starts the range, 1 is fully trained. */
export interface LearningAttributes {
  reconnectionLatency: number;
  reactivityThreshold: number;
  followChance: number;
  checkInFrequency: number;
}

export const ATTRIBUTE_KEYS = ['reconnectionLatency', 'reactivityThreshold', 'followChance', 'checkInFrequency'] as const;

export interface LearningSnapshot {
  attributes: LearningAttributes;
  triggerProfile: TriggerProfile;
  equipment: Equipment;
  /** Session-only multiplier on the attributes (Rusty Dog); 1 is full capacity. */
  capacityMultiplier: number;
  /** Visual posture of the Dog: 0 hunched, 1 neutral, 2 relaxed. The simulation ignores it. */
  posture: 0 | 1 | 2;
}

/** A new Dog: below the first milestone (hunched posture), every Distractor at the usual level. */
export const DEFAULT_ATTRIBUTES: LearningAttributes = {
  reconnectionLatency: 0.2,
  reactivityThreshold: 0.2,
  followChance: 0.5,
  checkInFrequency: 0.2,
};

export const DEFAULT_TRIGGER_PROFILE: TriggerProfile = { child: 2, bicycle: 2, dog: 2, skateboard: 2, food: 2, other: 2 };

export const DEFAULT_SNAPSHOT: LearningSnapshot = {
  attributes: DEFAULT_ATTRIBUTES,
  triggerProfile: DEFAULT_TRIGGER_PROFILE,
  equipment: 'collar',
  capacityMultiplier: 1,
  posture: 0,
};

/** How progress 0..1 maps to simulation values; `worst` is progress 0, `best` is progress 1. */
export interface AttributeRanges {
  /** Seconds before a returning Dog or a Taut correction starts to answer the Handler. */
  reconnectionSeconds: { worst: number; best: number };
  /** Arousal at which Fixation starts. */
  reactivityThreshold: { worst: number; best: number };
  /** Mean seconds between the Dog's Check-in glances. */
  checkInMeanInterval: { worst: number; best: number };
}

export const defaultRanges: AttributeRanges = {
  reconnectionSeconds: { worst: 1.5, best: 0.3 },
  reactivityThreshold: { worst: 15, best: 60 },
  checkInMeanInterval: { worst: 14, best: 5 },
};

/** What the snapshot means inside a Stage, after capacity and Equipment. */
export interface ResolvedDog {
  reconnectionSeconds: number;
  reactivityThreshold: number;
  followChance: number;
  checkInMeanInterval: number;
  equipment: EquipmentProfile;
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const lerp = (range: { worst: number; best: number }, p: number) => range.worst + (range.best - range.worst) * clamp01(p);

export function resolveDog(snapshot: LearningSnapshot, ranges: AttributeRanges = defaultRanges): ResolvedDog {
  const cap = clamp01(snapshot.capacityMultiplier);
  const a = snapshot.attributes;
  const equipment = EQUIPMENT_PROFILES[snapshot.equipment];
  return {
    // Equipment changes how the Dog answers leash signals at Stage start; stored attributes stay as they are
    reconnectionSeconds: lerp(ranges.reconnectionSeconds, a.reconnectionLatency * cap) / equipment.signalResponse,
    reactivityThreshold: lerp(ranges.reactivityThreshold, a.reactivityThreshold * cap),
    followChance: clamp01(a.followChance * cap),
    checkInMeanInterval: lerp(ranges.checkInMeanInterval, a.checkInFrequency * cap),
    equipment,
  };
}

/** Average of the four attributes, 0..1. */
export function averageProgress(a: LearningAttributes): number {
  return ATTRIBUTE_KEYS.reduce((sum, k) => sum + a[k], 0) / ATTRIBUTE_KEYS.length;
}
