import {
  RATIO_EPSILON,
  RIGID_MIN,
  SLACK_MAX,
  type ArousalConfig,
  type CueConfig,
  type CueType,
  type ReactionConfig,
} from './config';
import { closestOnSegment } from './geometry';
import { DEFAULT_SNAPSHOT, resolveDog, TRIGGER_FACTORS, type DistractorKind, type LearningSnapshot, type ResolvedDog } from './learning';
import { classifyTension, leashCurve, COLLAR_HEIGHT, HAND_HEIGHT, type LeashCurve, type Point3, type TensionState } from './leash';
import { buildPayload, handlingScore, type SimulationDebriefPayload } from './payload';
import { tierFor, type ReactionTier } from './sim';
import { add, distance, normalize, scale, sub, type Vec2 } from './vec';

/** Visual canine posture in the close view (ADR 0020 / spec). */
export type CaninePosture = 'neutral' | 'alert' | 'strained' | 'relaxed' | 'head_turn';

/** The reward shown after a calm mark in the hand drill. */
export type HandDrillReward = 'toy' | 'treat';

/** Hand drill: arousal decays this many times faster while the leash is gathered and the hand is out of reach. */
export const HAND_GATHER_DECAY_FACTOR = 2.5;

/** How a hand drill ended: the Dog settled, or the time ran out first (neither is a failure). */
export type HandDrillOutcome = 'calm' | 'not_calm';

/** Lateral shielding stance relative to the canine's position. */
export type ShieldSide = 'left' | 'right' | 'none';

/** Declarative control scheme (ADR 0020). */
/** Trigger level the hand drill uses for the hand, whatever the Dog's record says. */
const HAND_DRILL_TRIGGER_LEVEL = 2;

/** 'hand_drill': a stationary hand is offered, there is no shielding and the run cannot fail. */
export type CloseExerciseControls = 'leash_drill' | 'hand_drill';

export interface ApproachingDistractorConfig {
  kind: DistractorKind;
  speed: number;
  triggerRadius: number;
  startPos: Vec2;
  endPos: Vec2;
  cue?: CueType;
  salience?: number;
}

export interface CloseExerciseConfig {
  controls: CloseExerciseControls;
  fixedStep: number;
  leashMinLength: number;
  leashMaxLength: number;
  gatherRate: number;
  releaseRate: number;
  posteDamping: number;
  posteArousalDamping: number;
  shieldOcclusionDistance: number;
  shieldOffset: number;
  handlerBase: Vec2;
  dogOffset: Vec2;
  distractor: ApproachingDistractorConfig;
  learning: LearningSnapshot;
  arousal: ArousalConfig;
  reaction: ReactionConfig;
  cue: CueConfig;
  cues: CueType[];
  calmSeconds: number;
  /** Hand drill: the run stops at this time even if the Dog never settled (no failure result). */
  maxSeconds: number;
  /** Hand drill: what the Dog is rewarded with after a calm mark (a toy for a puppy). Visual only. */
  reward: HandDrillReward;
  /** Hand drill: the calm hold only starts counting from this time, so the hand is really offered. */
  settleSeconds: number;
  rewardWindowSeconds: number;
  markBudget: number;
  checkInWindow: number;
  configVersion: string;
}

export interface CloseExerciseInput {
  gather: boolean;
  shieldSide: ShieldSide;
  poste: boolean;
  marker: boolean;
  cue?: boolean;
  cueType?: CueType;
}

export const noCloseExerciseInput: CloseExerciseInput = {
  gather: false,
  shieldSide: 'none',
  poste: false,
  marker: false,
};

export type CloseExerciseEvent =
  | { type: 'gather-change'; gathering: boolean; length: number; time: number }
  | { type: 'shield-change'; side: ShieldSide; occluded: boolean; time: number }
  | { type: 'poste-change'; poste: boolean; time: number }
  | { type: 'reaction-tier-change'; tier: ReactionTier; time: number }
  | { type: 'posture-change'; posture: CaninePosture; time: number }
  | { type: 'distractor-enter'; time: number }
  | { type: 'distractor-pass'; time: number }
  | { type: 'distractor-exit'; time: number }
  | { type: 'fixation-start'; time: number }
  | { type: 'disengagement'; time: number }
  | { type: 'marker-hit'; time: number; accuracyMs: number }
  | { type: 'marker-miss'; time: number }
  | { type: 'marker-reactive'; time: number }
  | { type: 'missed-opportunity'; time: number }
  | { type: 'cue'; time: number; strength: number; cueType: CueType }
  | { type: 'exercise-complete'; time: number; success: boolean; outcome?: HandDrillOutcome };

export interface CloseExerciseTelemetry {
  slackTime: number;
  tautTime: number;
  rigidTime: number;
  shieldDuration: number;
  triggerDuration: number;
  shieldCoverageScore: number;
  peakTensionRatio: number;
  peakArousal: number;
  markerHits: number;
  markerMisses: number;
  reactiveMarkers: number;
  missedOpportunities: number;
  hitAccuraciesMs: number[];
  marksUsed: number;
  calmEncounters: Partial<Record<DistractorKind, number>>;
  lungesPrevented: number;
  /** Times the Dog went reactive toward the hand (hand drill only). */
  lunges: number;
}

export interface LeashDrillSubState {
  distractorDistTravelled: number;
  distractorTotalDist: number;
  hasPassed: boolean;
  wasInTriggerRadius: boolean;
  lungePreventedThisEncounter: boolean;
  naturalDisengaged: boolean;
  /** Hand drill: the Dog stayed calm for `calmSeconds` and the reward window was opened. */
  calmHeld: boolean;
}

export interface CloseExerciseState {
  config: CloseExerciseConfig;
  time: number;
  step: number;
  seed: number;
  handler: Vec2;
  dog: Vec2;
  dogHeading: number;
  dogPosture: CaninePosture;
  tier: ReactionTier;
  effectiveLeashLength: number;
  isGathering: boolean;
  isPoste: boolean;
  shieldSide: ShieldSide;
  isShieldingOccluded: boolean;
  tensionRatio: number;
  tension: TensionState;
  distractor: {
    pos: Vec2;
    active: boolean;
    finished: boolean;
    consumed: boolean;
  };
  arousal: number;
  dogMode: 'goal' | 'fixated' | 'holding' | 'lunging';
  calmElapsed: number;
  rewardWindow: { openedAt: number; closesAt: number } | null;
  lastCueAt: number;
  completed: boolean;
  success: boolean;
  /** Hand drill only; undefined until the run ends. */
  outcome?: HandDrillOutcome;
  telemetry: CloseExerciseTelemetry;
  dogTraits: ResolvedDog;
  subState: LeashDrillSubState;
}

export const defaultCloseExerciseConfig: CloseExerciseConfig = {
  controls: 'leash_drill',
  fixedStep: 1 / 60,
  leashMinLength: 0.5,
  leashMaxLength: 2.0,
  gatherRate: 1.5,
  releaseRate: 2.0,
  posteDamping: 0.35,
  posteArousalDamping: 0.4,
  shieldOcclusionDistance: 0.65,
  shieldOffset: 0.8,
  handlerBase: { x: 0, y: 0 },
  dogOffset: { x: 0.9, y: 0.1 },
  distractor: {
    kind: 'dog',
    speed: 1.4,
    triggerRadius: 6.0,
    startPos: { x: 1.8, y: 12.0 },
    endPos: { x: 1.8, y: -6.0 },
    cue: 'lets-go',
  },
  learning: {
    ...DEFAULT_SNAPSHOT,
    triggerProfile: { ...DEFAULT_SNAPSHOT.triggerProfile, dog: 2 },
  },
  arousal: {
    k: 28,
    minDistance: 1.5,
    decayPerSecond: 3.5,
    rigidPullRate: 5.0,
    disengagementDrop: 25,
    markerHitDrop: 20,
    posteJolt: 15,
    smoothStopFactor: 0.3,
    slowedSeconds: 0.5,
  },
  reaction: {
    alertFraction: 0.55,
    lungeAccel: 2.0,
    lungeMaxSpeed: 3.5,
    alertSlowdown: 0.8,
  },
  cue: {
    cooldownSeconds: 2.5,
    fixatedFactor: 0.35,
    repeatFactor: 0.5,
    arousalDrop: 12,
    followBoostSeconds: 2,
    followBoost: 0.25,
    followCap: 0.95,
  },
  cues: ['lets-go'],
  calmSeconds: 2.5,
  maxSeconds: 60,
  reward: 'treat',
  settleSeconds: 4,
  rewardWindowSeconds: 1.1,
  markBudget: 5,
  checkInWindow: 1.0,
  configVersion: 'close-exercise-v1',
};

/**
 * The hand-and-leash drill: a hand is held still just beyond the end of an ungathered lunge, so the
 * Dog strains toward it but never touches it. Gathering takes the Dog out of reach and lets it settle.
 */
export const handDrillConfig: Partial<CloseExerciseConfig> = {
  controls: 'hand_drill',
  distractor: {
    kind: 'hand',
    speed: 0,
    salience: 0.35,
    triggerRadius: 6.0,
    startPos: { x: 1.8, y: 1.8 },
    endPos: { x: 1.8, y: 1.8 },
  },
  learning: { ...DEFAULT_SNAPSHOT, triggerProfile: { ...DEFAULT_SNAPSHOT.triggerProfile, hand: 2 } },
  cues: [],
  calmSeconds: 2.5,
  maxSeconds: 60,
  settleSeconds: 4,
  markBudget: 5,
  configVersion: 'hand-drill-v1',
};

/**
 * Initializes state for a Close Exercise stage.
 */
export function createCloseExerciseState(
  partialConfig: Partial<CloseExerciseConfig> = {},
  seed = 42,
): CloseExerciseState {
  const config: CloseExerciseConfig = {
    ...defaultCloseExerciseConfig,
    ...partialConfig,
    distractor: {
      ...defaultCloseExerciseConfig.distractor,
      ...(partialConfig.distractor ?? {}),
    },
    arousal: {
      ...defaultCloseExerciseConfig.arousal,
      ...(partialConfig.arousal ?? {}),
    },
    reaction: {
      ...defaultCloseExerciseConfig.reaction,
      ...(partialConfig.reaction ?? {}),
    },
    cue: {
      ...defaultCloseExerciseConfig.cue,
      ...(partialConfig.cue ?? {}),
    },
  };

  const handler = { ...config.handlerBase };
  const dog = add(handler, config.dogOffset);
  // The hand drill always offers a hand the Dog cares about: the Dog's own Trigger Profile may have
  // faded 'hand' to 0 after calm runs, which would leave nothing to practise.
  if (config.controls === 'hand_drill') {
    config.learning = {
      ...config.learning,
      triggerProfile: { ...config.learning.triggerProfile, hand: HAND_DRILL_TRIGGER_LEVEL },
    };
  }
  const dogTraits = resolveDog(config.learning);
  const totalDist = distance(config.distractor.startPos, config.distractor.endPos);

  const initialEffectiveLeash = config.leashMaxLength;
  const initialDist = distance(handler, dog);
  const initialRatio = initialDist / initialEffectiveLeash;

  return {
    config,
    time: 0,
    step: 0,
    seed,
    handler,
    dog,
    dogHeading: Math.PI / 2, // Facing forward along narrow passage
    dogPosture: 'neutral',
    tier: 'calm',
    effectiveLeashLength: initialEffectiveLeash,
    isGathering: false,
    isPoste: false,
    shieldSide: 'none',
    isShieldingOccluded: false,
    tensionRatio: initialRatio,
    tension: classifyTension(initialRatio),
    distractor: {
      pos: { ...config.distractor.startPos },
      active: true,
      finished: false,
      consumed: false,
    },
    arousal: 0,
    dogMode: 'goal',
    calmElapsed: 0,
    rewardWindow: null,
    lastCueAt: -999,
    completed: false,
    success: false,
    telemetry: {
      slackTime: 0,
      tautTime: 0,
      rigidTime: 0,
      shieldDuration: 0,
      triggerDuration: 0,
      shieldCoverageScore: 1,
      peakTensionRatio: initialRatio,
      peakArousal: 0,
      markerHits: 0,
      markerMisses: 0,
      reactiveMarkers: 0,
      missedOpportunities: 0,
      hitAccuraciesMs: [],
      marksUsed: 0,
      calmEncounters: {},
      lungesPrevented: 0,
      lunges: 0,
    },
    dogTraits,
    subState: {
      distractorDistTravelled: 0,
      distractorTotalDist: totalDist,
      hasPassed: false,
      wasInTriggerRadius: false,
      lungePreventedThisEncounter: false,
      naturalDisengaged: false,
      calmHeld: false,
    },
  };
}

/**
 * Calculates close leash 3D Bézier points with sag clamping preventing ground dipping (Task 2.3).
 */
export function calculateCloseLeashCurve(
  handler: Vec2,
  dog: Vec2,
  effectiveLeashLength: number,
  minZ = 0.15,
): {
  start: Point3;
  control: Point3;
  end: Point3;
  chord: number;
  sag: number;
} {
  const start: Point3 = { x: handler.x, y: handler.y, z: HAND_HEIGHT };
  const end: Point3 = { x: dog.x, y: dog.y, z: COLLAR_HEIGHT };

  const chord = distance(handler, dog);
  const rawSag = Math.sqrt(Math.max(0, (3 * chord * (effectiveLeashLength - chord)) / 8));

  // Sag clamping: keep control point elevation strictly above ground plane (z >= minZ)
  const baseMidZ = (start.z + end.z) / 2;
  const controlZ = Math.max(minZ, baseMidZ - 2 * rawSag);

  const control: Point3 = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: controlZ,
  };

  return { start, control, end, chord, sag: rawSag };
}

/**
 * Calculates whether handler body occludes line-of-sight between dog and distractor.
 */
export function isLineOfSightOccludedByHandler(
  handlerPos: Vec2,
  dogPos: Vec2,
  distractorPos: Vec2,
  shieldRadius = 0.65,
): boolean {
  const closest = closestOnSegment(handlerPos, dogPos, distractorPos);
  return distance(closest, handlerPos) < shieldRadius;
}

/**
 * Updates handler position and line-of-sight occlusion based on shield input.
 */
export function updateShielding(
  state: CloseExerciseState,
  input: CloseExerciseInput,
  dt: number,
  events: CloseExerciseEvent[],
): void {
  const { config } = state;
  const wasShieldSide = state.shieldSide;
  const wasOccluded = state.isShieldingOccluded;

  state.shieldSide = input.shieldSide;

  // Handler position shifts laterally when taking shielding stance
  if (input.shieldSide === 'right') {
    state.handler = { x: config.handlerBase.x + config.shieldOffset, y: config.handlerBase.y };
  } else if (input.shieldSide === 'left') {
    state.handler = { x: config.handlerBase.x - config.shieldOffset, y: config.handlerBase.y };
  } else {
    state.handler = { ...config.handlerBase };
  }

  // Calculate line-of-sight occlusion
  state.isShieldingOccluded = isLineOfSightOccludedByHandler(
    state.handler,
    state.dog,
    state.distractor.pos,
    config.shieldOcclusionDistance,
  );

  if (wasShieldSide !== state.shieldSide || wasOccluded !== state.isShieldingOccluded) {
    events.push({
      type: 'shield-change',
      side: state.shieldSide,
      occluded: state.isShieldingOccluded,
      time: state.time,
    });
  }
}

/**
 * Advances approaching distractor position along its trajectory.
 */
export function updateDistractorTrajectory(
  state: CloseExerciseState,
  dt: number,
  events: CloseExerciseEvent[],
): void {
  const { config, distractor, subState } = state;
  if (!distractor.active || distractor.finished) return;

  const totalDist = subState.distractorTotalDist;
  if (totalDist <= 0.001) return;

  const distStep = config.distractor.speed * dt;
  subState.distractorDistTravelled += distStep;

  const progress = Math.min(1, subState.distractorDistTravelled / totalDist);
  const pathVec = sub(config.distractor.endPos, config.distractor.startPos);
  distractor.pos = add(config.distractor.startPos, scale(pathVec, progress));

  const distToDog = distance(state.dog, distractor.pos);
  const inTrigger = distToDog <= config.distractor.triggerRadius;

  if (inTrigger) {
    state.telemetry.triggerDuration += dt;
    if (state.isShieldingOccluded) {
      state.telemetry.shieldDuration += dt;
    }
  }

  if (state.telemetry.triggerDuration > 0) {
    state.telemetry.shieldCoverageScore = Math.min(
      1,
      state.telemetry.shieldDuration / state.telemetry.triggerDuration,
    );
  }

  // Lifecycle events for approaching distractor
  if (inTrigger && !subState.wasInTriggerRadius) {
    subState.wasInTriggerRadius = true;
    events.push({ type: 'distractor-enter', time: state.time });
  }

  // Check passing point (when distractor y passes handler y)
  const passedY =
    config.distractor.startPos.y > config.distractor.endPos.y
      ? distractor.pos.y <= state.handler.y
      : distractor.pos.y >= state.handler.y;

  if (passedY && !subState.hasPassed) {
    subState.hasPassed = true;
    events.push({ type: 'distractor-pass', time: state.time });
  }

  if (!inTrigger && subState.wasInTriggerRadius) {
    events.push({ type: 'distractor-exit', time: state.time });
  }

  if (progress >= 1) {
    distractor.finished = true;
  }
}

/**
 * Updates canine arousal, reaction tier, and visual posture.
 */
export function updateArousalAndPosture(
  state: CloseExerciseState,
  dt: number,
  events: CloseExerciseEvent[],
): void {
  const { config, distractor, dogTraits } = state;
  const a = config.arousal;

  const distToDog = distance(state.dog, distractor.pos);
  const handDrill = config.controls === 'hand_drill';
  // A gathered leash keeps the Dog out of reach of the hand, so the hand stops pulling at it.
  const handOutOfReach = handDrill && state.isGathering;
  const inTrigger =
    distractor.active && !distractor.finished && distToDog <= config.distractor.triggerRadius && !handOutOfReach;

  let arousalRate = 0;

  if (inTrigger) {
    const level = config.learning.triggerProfile[config.distractor.kind] ?? 2;
    const d = Math.max(a.minDistance, distToDog);
    const baseRise = a.k * ((config.distractor.salience ?? config.distractor.speed) / d) * TRIGGER_FACTORS[level];

    // Shielding breaks line of sight, mitigating arousal rise
    const mitigation = state.isShieldingOccluded ? 0.2 : 1.0;
    arousalRate += baseRise * mitigation;

    if (state.isShieldingOccluded) {
      if (state.dogMode === 'fixated') {
        state.dogMode = 'goal';
      }
    } else {
      if (state.dogMode !== 'fixated' && state.dogMode !== 'lunging') {
        state.dogMode = 'fixated';
        events.push({ type: 'fixation-start', time: state.time });
      }
    }
  }

  // Rigid pull adds arousal (damped if handler is in poste)
  if (state.tension === 'rigid') {
    const pullMultiplier = state.isPoste ? config.posteArousalDamping : 1.0;
    arousalRate += a.rigidPullRate * dogTraits.equipment.rigidPull * pullMultiplier;
  }

  if (handOutOfReach && state.dogMode === 'fixated') state.dogMode = 'goal';

  if (arousalRate > 0) {
    state.arousal = Math.min(100, state.arousal + arousalRate * dt);
  } else {
    // Natural decay when no triggers or fully shielded
    const decay = handOutOfReach ? a.decayPerSecond * HAND_GATHER_DECAY_FACTOR : a.decayPerSecond;
    state.arousal = Math.max(0, state.arousal - decay * dt);
  }

  if (state.arousal > state.telemetry.peakArousal) {
    state.telemetry.peakArousal = state.arousal;
  }

  // Update reaction tier
  const newTier = tierFor(state.arousal, dogTraits.reactivityThreshold, config.reaction.alertFraction);
  if (newTier !== state.tier) {
    state.tier = newTier;
    if (handDrill && newTier === 'reactive') state.telemetry.lunges += 1;
    events.push({ type: 'reaction-tier-change', tier: newTier, time: state.time });
  }

  if (handDrill) {
    // The Dog can settle again after a lunge: nothing in this drill is final.
    if (state.tier !== 'reactive' && state.dogMode === 'lunging') state.dogMode = 'goal';
    if (!state.subState.calmHeld) {
      if (state.tier !== 'calm') {
        state.calmElapsed = 0;
      } else if (state.time >= config.settleSeconds) {
        state.calmElapsed += dt;
      }
      if (state.calmElapsed >= config.calmSeconds) {
        state.subState.calmHeld = true;
        state.rewardWindow = { openedAt: state.time, closesAt: state.time + config.rewardWindowSeconds };
        events.push({ type: 'disengagement', time: state.time });
      }
    }
  }

  // Update dog mode
  if (state.tier === 'reactive') {
    if (state.dogMode !== 'lunging') {
      state.dogMode = 'lunging';
    }
  } else if (state.tier === 'alert') {
    if (state.dogMode === 'goal') state.dogMode = 'alert' as unknown as 'goal';
  }

  // Natural calm disengagement when distractor passes and dog is below reactive threshold
  if (state.subState.hasPassed && !state.subState.naturalDisengaged && state.tier !== 'reactive') {
    state.subState.naturalDisengaged = true;
    state.dogMode = 'goal';
    state.rewardWindow = {
      openedAt: state.time,
      closesAt: state.time + config.rewardWindowSeconds,
    };
    events.push({ type: 'disengagement', time: state.time });
  }

  // Update posture
  const wasPosture = state.dogPosture;
  if (state.tier === 'reactive' || state.tension === 'rigid') {
    state.dogPosture = 'strained';
  } else if (state.tier === 'alert' || state.dogMode === 'fixated') {
    state.dogPosture = 'alert';
  } else if (state.rewardWindow !== null) {
    state.dogPosture = 'head_turn';
  } else if (state.tension === 'slack' && state.arousal < 10) {
    state.dogPosture = 'relaxed';
  } else {
    state.dogPosture = 'neutral';
  }

  if (wasPosture !== state.dogPosture) {
    events.push({ type: 'posture-change', posture: state.dogPosture, time: state.time });
  }
}

/**
 * Handles marker and cue inputs during close exercises.
 */
export function updateMarkersAndCues(
  state: CloseExerciseState,
  input: CloseExerciseInput,
  events: CloseExerciseEvent[],
): void {
  const { config, telemetry } = state;

  // Process Cue input
  if (input.cue) {
    const cueType = input.cueType ?? config.cues[0] ?? 'lets-go';
    if (state.time - state.lastCueAt >= config.cue.cooldownSeconds) {
      state.lastCueAt = state.time;
      state.arousal = Math.max(0, state.arousal - config.cue.arousalDrop);

      // Cue helps orient dog and opens reward window if disengaging
      if (state.tier !== 'reactive') {
        state.rewardWindow = {
          openedAt: state.time,
          closesAt: state.time + config.rewardWindowSeconds,
        };
        events.push({ type: 'disengagement', time: state.time });
      }

      events.push({ type: 'cue', time: state.time, strength: 1.0, cueType });
    }
  }

  // Manage reward window expiration
  if (state.rewardWindow && state.time > state.rewardWindow.closesAt) {
    state.rewardWindow = null;
    telemetry.missedOpportunities += 1;
    events.push({ type: 'missed-opportunity', time: state.time });
  }

  // Process Marker input
  if (input.marker) {
    if (telemetry.marksUsed < config.markBudget) {
      telemetry.marksUsed += 1;

      if (state.rewardWindow) {
        // Successful marker hit during disengagement
        const accuracyMs = Math.max(0, Math.round((state.time - state.rewardWindow.openedAt) * 1000));
        telemetry.markerHits += 1;
        telemetry.hitAccuraciesMs.push(accuracyMs);
        telemetry.calmEncounters[config.distractor.kind] =
          (telemetry.calmEncounters[config.distractor.kind] ?? 0) + 1;

        state.arousal = Math.max(0, state.arousal - config.arousal.markerHitDrop);
        state.rewardWindow = null;
        events.push({ type: 'marker-hit', time: state.time, accuracyMs });
      } else if (state.tier === 'reactive') {
        telemetry.reactiveMarkers += 1;
        events.push({ type: 'marker-reactive', time: state.time });
      } else {
        telemetry.markerMisses += 1;
        events.push({ type: 'marker-miss', time: state.time });
      }
    }
  }
}

/**
 * Builds the debrief payload compatible with SimulationDebriefPayload.
 */
export function buildCloseExercisePayload(state: CloseExerciseState): SimulationDebriefPayload {
  const t = state.telemetry;
  const total = t.slackTime + t.tautTime + t.rigidTime;
  const share = (part: number) => (total === 0 ? 0 : Math.round((part / total) * 100));
  const pull = share(t.rigidTime);
  const taut = share(t.tautTime);
  const slack = total === 0 ? 100 : Math.max(0, 100 - pull - taut);

  const meanAccuracy =
    t.hitAccuraciesMs.length > 0
      ? Math.round(t.hitAccuraciesMs.reduce((a, b) => a + b, 0) / t.hitAccuraciesMs.length)
      : undefined;

  const base: Omit<SimulationDebriefPayload, 'handlingScore' | 'configVersion'> = {
    durationSeconds: Math.round(state.time * 10) / 10,
    slackPercentage: slack,
    tautPercentage: taut,
    pullPercentage: pull,
    markerAccuracyMs: meanAccuracy,
    markerHits: t.markerHits,
    markerMisses: t.markerMisses,
    reactiveMarkers: t.reactiveMarkers,
    missedOpportunities: t.missedOpportunities,
    checkInHits: 0,
    followMarks: 0,
    posteSuccesses: t.lungesPrevented,
    harshStops: t.rigidTime > 0.5 ? 1 : 0,
    peakArousalScore: Math.round(t.peakArousal),
    calmEncounters: { ...t.calmEncounters },
    marksUsed: t.marksUsed,
    markBudget: state.config.markBudget,
    seed: state.seed,
    sintoniaTimeSeconds: 0,
    goSniffs: 0,
    peakTensionRatio: Math.round(t.peakTensionRatio * 100) / 100,
    shieldCoverageScore: Math.round(t.shieldCoverageScore * 100) / 100,
    leashHandlingAccuracy: meanAccuracy ?? 0,
    ...(state.config.controls === 'hand_drill' ? { lunges: t.lunges, ...(state.outcome ? { handDrillOutcome: state.outcome } : {}) } : {}),
  };

  return {
    ...base,
    handlingScore: handlingScore(base),
    configVersion: state.config.configVersion,
  };
}
export function updateLeashGathering(
  state: CloseExerciseState,
  input: CloseExerciseInput,
  dt: number,
  events: CloseExerciseEvent[],
): void {
  const { config } = state;
  const wasGathering = state.isGathering;
  state.isGathering = input.gather;

  if (input.gather) {
    state.effectiveLeashLength = Math.max(
      config.leashMinLength,
      state.effectiveLeashLength - config.gatherRate * dt,
    );
  } else {
    state.effectiveLeashLength = Math.min(
      config.leashMaxLength,
      state.effectiveLeashLength + config.releaseRate * dt,
    );
  }

  if (wasGathering !== state.isGathering) {
    events.push({
      type: 'gather-change',
      gathering: state.isGathering,
      length: state.effectiveLeashLength,
      time: state.time,
    });
  }

  // If dog is reactive or lunging, it strains outward toward distractor
  // In the hand drill, gathering always wins over a lunge: the leash is how the Dog settles again.
  const gatherOverrides = config.controls === 'hand_drill' && input.gather;
  const isLunging = (state.tier === 'reactive' || state.dogMode === 'lunging') && !gatherOverrides;
  if (isLunging) {
    const toDistractor = normalize(sub(state.distractor.pos, state.dog));
    const lungeDist = state.config.reaction.lungeMaxSpeed * dt * 0.5;
    state.dog = add(state.dog, scale(toDistractor, lungeDist));
  }

  const currentDist = distance(state.handler, state.dog);
  const toDog = currentDist > 0.001 ? normalize(sub(state.dog, state.handler)) : { x: 1, y: 0 };

  if (input.gather && !isLunging) {
    // Smoothly draw dog closer to handler without inducing rigid pull
    const targetDist = Math.min(currentDist, state.effectiveLeashLength * 0.85);
    if (currentDist > targetDist) {
      const step = Math.min(currentDist - targetDist, config.gatherRate * dt);
      state.dog = sub(state.dog, scale(toDog, step));
    }
  }

  // Leash length constraints
  const distAfterGather = distance(state.handler, state.dog);
  if (distAfterGather > state.effectiveLeashLength) {
    if (state.isPoste) {
      // Poste hold absorbs strain with buffered resistance, stabilizing the dog
      state.dog = add(state.handler, scale(toDog, state.effectiveLeashLength));
      if (isLunging && !state.subState.lungePreventedThisEncounter) {
        state.telemetry.lungesPrevented += 1;
        state.subState.lungePreventedThisEncounter = true;
      }
    } else if (isLunging) {
      // Unanchored lunge: dog pulls leash taut and beyond into rigid pull jolt
      const maxExt = state.effectiveLeashLength * 1.15;
      const pullDist = Math.min(distAfterGather, maxExt);
      state.dog = add(state.handler, scale(toDog, pullDist));
    } else {
      state.dog = add(state.handler, scale(toDog, state.effectiveLeashLength));
    }
  } else if (!input.gather && distAfterGather < distance({ x: 0, y: 0 }, config.dogOffset) && !isLunging) {
    // Dog relaxes back outward towards normal resting offset as slack allows
    const targetPos = add(state.handler, config.dogOffset);
    const toTarget = sub(targetPos, state.dog);
    const targetDist = distance(state.dog, targetPos);
    if (targetDist > 0.01) {
      const step = Math.min(targetDist, config.releaseRate * 0.8 * dt);
      state.dog = add(state.dog, scale(normalize(toTarget), step));
    }
  }

  // Calculate tension ratio
  const actualDist = distance(state.handler, state.dog);
  let ratio = actualDist / Math.max(0.01, state.effectiveLeashLength);

  // If handler has braced in poste, strain is damped below rigid pull threshold
  if (state.isPoste && ratio >= SLACK_MAX) {
    ratio = Math.min(SLACK_MAX + (ratio - SLACK_MAX) * (1 - config.posteDamping), RIGID_MIN - 0.02);
  }

  state.tensionRatio = ratio;
  state.tension = classifyTension(ratio);

  if (state.tensionRatio > state.telemetry.peakTensionRatio) {
    state.telemetry.peakTensionRatio = state.tensionRatio;
  }
}

/**
 * Executes a single simulation step for a Close Exercise stage.
 */
export function tickCloseExercise(
  state: CloseExerciseState,
  input: CloseExerciseInput,
): CloseExerciseEvent[] {
  const events: CloseExerciseEvent[] = [];
  const dt = state.config.fixedStep;
  state.time += dt;
  state.step += 1;

  // Track poste state
  const wasPoste = state.isPoste;
  state.isPoste = input.poste;
  if (wasPoste !== state.isPoste) {
    events.push({
      type: 'poste-change',
      poste: state.isPoste,
      time: state.time,
    });
  }

  // Update handler shielding stance and line of sight
  updateShielding(state, input, dt, events);

  // Update approaching distractor trajectory
  updateDistractorTrajectory(state, dt, events);

  // Update leash gathering & tension
  updateLeashGathering(state, input, dt, events);

  // Update canine arousal, reaction tier, and visual posture
  updateArousalAndPosture(state, dt, events);

  // Update markers, cues, and disengagement opportunities
  updateMarkersAndCues(state, input, events);

  // Check stage completion
  if (state.config.controls === 'hand_drill') {
    // No fail state: the run ends on a rewarded calm hold or on the time limit, and both reach the Debrief.
    const rewarded = state.subState.calmHeld && state.rewardWindow === null;
    if (!state.completed && (rewarded || state.time >= state.config.maxSeconds)) {
      state.completed = true;
      state.success = true;
      state.outcome = state.subState.calmHeld ? 'calm' : 'not_calm';
      events.push({ type: 'exercise-complete', success: true, outcome: state.outcome, time: state.time });
    }
  } else if (state.distractor.finished && !state.completed) {
    state.completed = true;
    state.success = state.tier !== 'reactive';
    events.push({
      type: 'exercise-complete',
      success: state.success,
      time: state.time,
    });
  }

  // Track tension telemetry
  if (state.tension === 'slack') state.telemetry.slackTime += dt;
  else if (state.tension === 'taut') state.telemetry.tautTime += dt;
  else if (state.tension === 'rigid') state.telemetry.rigidTime += dt;

  return events;
}

