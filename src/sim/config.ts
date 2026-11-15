import { defaultRanges, DEFAULT_SNAPSHOT, type AttributeRanges, type DistractorKind, type LearningSnapshot } from './learning';
import type { FeedbackActionKind } from './feedbackKinds';
import type { SceneryItem, SceneryTheme, ScentStrength, Wall } from './geometry';
import { scatterScenery } from './scenery';
import type { Vec2 } from './vec';

/** Tension Ratio below this is Slack. */
export const SLACK_MAX = 0.85;
/** Tension Ratio above this is Rigid Pull. */
export const RIGID_MIN = 1.0;
/** Float noise allowed when comparing a ratio with a threshold. */
export const RATIO_EPSILON = 1e-6;

/** The Cues a Handler can call: "Let's Go" reorients a Dog on a moving Distractor, "Leave It" a Dog on food. */
export type CueType = 'lets-go' | 'leave-it';
export const CUE_TYPES: readonly CueType[] = ['lets-go', 'leave-it'];

export type EndCondition = { kind: 'reach-waypoint' } | { kind: 'time-limit'; seconds: number };

export interface DistractorConfig {
  /** Which Trigger Profile level applies to it. */
  kind: DistractorKind;
  /** Meters per second. */
  speed: number;
  /** The Distractor can affect the Dog's Arousal only within this distance (ADR 0004). */
  triggerRadius: number;
  /** The Distractor appears once the Dog has covered this distance from its start. */
  activateAfterMeters: number;
  /** And not before this simulation time, in seconds (a spawn schedule); 0 when absent. */
  spawnAtSeconds?: number;
  /**
   * Without `path`, the Distractor crosses the route at right angles, starting this far to the
   * side, aimed at where a Dog walking at its Goal speed will be when the Distractor arrives.
   */
  startOffset: number;
  /** Fixed path in meters, instead of one aimed at the Dog. */
  path?: { from: Vec2; to: Vec2 };
  /** The Cue that works on it. Defaults to "Leave It" for food and "Let's Go" for everything else. */
  cue?: CueType;
  /**
   * Speed used in the Arousal formula in place of `speed`, for a Distractor that is salient without
   * moving (food on the ground).
   */
  salience?: number;
}

/** The Cue that works on this Distractor. */
export function requiredCue(d: Pick<DistractorConfig, 'kind' | 'cue'>): CueType {
  return d.cue ?? (d.kind === 'food' ? 'leave-it' : 'lets-go');
}

/** Dog reactivity (Reaction Tiers): Alert starts at this share of the reactivity threshold. */
export interface ReactionConfig {
  alertFraction: number;
  /** Extra outward acceleration of a lunging (Reactive) Dog, in m/s^2. */
  lungeAccel: number;
  /** A lunge never makes the Dog faster than this, in m/s. */
  lungeMaxSpeed: number;
  /** A Dog in the Alert tier slows to this share of its walking speed. */
  alertSlowdown: number;
}

/** Sintonía (sync combo) tunables. */
export interface SintoniaConfig {
  /** A Node can opt out (`false`): no Sintonía is ever measured, so its turn rule never applies. Default on. */
  enabled?: boolean;
  /** Handler forward speed must exceed this, in m/s. */
  minSpeed: number;
  /** The Handler's turning rate must stay within these bounds, in rad/s. */
  minTurnRate: number;
  maxTurnRate: number;
  /** Turning rate is measured over this many seconds of heading history. */
  turnWindow: number;
  /** All conditions must hold this long before the combo starts, in seconds. */
  holdSeconds: number;
}

/** Go Sniff tunables. */
export interface GoSniffConfig {
  /** Seconds the button stays on offer after a tense Disengagement. */
  offerSeconds: number;
  /** Seconds of sniffing at most. */
  durationSeconds: number;
  speed: number;
  /** Arousal decays this many times faster while sniffing. */
  decayFactor: number;
}

/** Arousal tunables (0 to 100, per Stage). */
export interface ArousalConfig {
  /** Scale of the formula: rise per second = k * (v / d) * TriggerFactor. */
  k: number;
  /** The distance in the formula never goes below this, in meters. */
  minDistance: number;
  /** Points lost per second while nothing raises Arousal. */
  decayPerSecond: number;
  /** Points gained per second during Rigid Pull, before the Equipment multiplier. */
  rigidPullRate: number;
  /** Points lost at a Disengagement. */
  disengagementDrop: number;
  /** Extra points lost on a Marker hit. */
  markerHitDrop: number;
  /** Poste jolt of an abrupt stop at the leash limit, at the Dog's Goal speed, before Equipment. */
  posteJolt: number;
  /** Share of the jolt left when the Handler slowed beforehand. */
  smoothStopFactor: number;
  /** The Handler counts as having slowed after being at walk strength or less for this long. */
  slowedSeconds: number;
}

/** Cue tunables. */
export interface CueConfig {
  cooldownSeconds: number;
  /** Share of the response that is left once the Dog is fixated. */
  fixatedFactor: number;
  /** Share of the response that is left when the Dog is already looking at the Handler. */
  repeatFactor: number;
  /** Points of Arousal a full-strength Cue takes off. */
  arousalDrop: number;
  /** A turn this many seconds after a Cue gets the follow boost. */
  followBoostSeconds: number;
  followBoost: number;
  followCap: number;
}

/** Camera auto-zoom tunables; multipliers apply to the zoom that fits the screen size. */
export interface CameraConfig {
  /** Zoom multiplier with the Handler and the Dog together. */
  closeZoom: number;
  /** Zoom multiplier with the Dog at the leash limit. */
  farZoom: number;
  /** Screen pixels kept free around the Handler and the Dog. */
  padding: number;
  /** How fast the zoom follows its target, per second. */
  smoothing: number;
}

/** A Stage Meter: a bar that fills with Meter Points from right actions and, when declared, sets the handling score (ADR 0029). */
export interface StageMeterConfig {
  id: string;
  /** i18n key of the meter's label. */
  labelKey: string;
  /** Icon from the HUD catalog. */
  icon: string;
  /** Meter Points that fill the meter. */
  target: number;
  /** Meter Points each kind of right action adds. */
  meterPoints: Partial<Record<FeedbackActionKind, number>>;
}

export { SCENT_STRENGTHS, type ScentStrength } from './geometry';

/** What makes a place a Scent Spot; a scenery item may carry one as `scent:` (its position is the item's). */
export interface ScentSpec {
  strength: ScentStrength;
  /** Nose radius in meters: the Dog smells the spot within this distance. Defaults per strength (`ScentWalkConfig.radius`). */
  radius?: number;
  /** A marking post: the Dog stops to mark it instead of only sniffing. */
  marking?: boolean;
}

/** A Scent Spot of a scenario (see `scent-drive`). */
export interface ScentSpotConfig extends ScentSpec {
  pos: Vec2;
}

/**
 * Scent-walk tunables. Every value has a default (`DEFAULT_SCENT_WALK`) and a scenario may override
 * any of them under `scentWalk:`; they only matter in a Stage with Scent Spots.
 */
export interface ScentWalkConfig {
  /** Pull weight of each strength in `w_scent = strength x (autopilotFloor + (1 - autopilotFloor) x autopilot)`; the Goal Drive weighs 1. */
  pull: Record<ScentStrength, number>;
  /** Share of the pull that applies at Autopilot 0. */
  autopilotFloor: number;
  /** Default nose radius of each strength, in meters. */
  radius: Record<ScentStrength, number>;
  /** The Dog is at a Scent Spot within this distance, in meters. */
  reachDistance: number;
  /** The heading Goal aims this far ahead of the Handler, in meters (kept inside Slack). */
  headingLead: number;
  autopilot: {
    /** Rise per second of steady walking. */
    risePerSecond: number;
    /** Walking counts as steady while the heading stays within this angle, in radians... */
    steadyAngle: number;
    /** ...and the smoothed pace within this share of where it settled... */
    steadyPace: number;
    /** ...for at least this many seconds. */
    steadySeconds: number;
    /** Drop on a counted change, times that change's Novelty. */
    dropPerChange: number;
    /** The follow chance is multiplied by `1 - followDamping x autopilot`. */
    followDamping: number;
  };
  novelty: {
    /** Novelty lost each time a kind of change is made. */
    step: number;
    /** Novelty regained per second while that kind is not used. */
    recoveryPerSecond: number;
    /** A change is fresh at or above this Novelty... */
    fresh: number;
    /** ...and repeated below this one. */
    repeated: number;
    /** Added to the follow chance of a fresh change, before the cap. */
    freshBonus: number;
  };
  pace: {
    /** The smoothed input strength is its mean over this many seconds. */
    smoothingSeconds: number;
    /** A change of the smoothed strength by this share of where it settled is a speed-up or a slow-down. */
    threshold: number;
  };
  /** A turn wider than this, in radians, is a U-turn. */
  uTurnAngle: number;
  /** Seeded duration range of a Plant, in seconds. */
  plantSeconds: { min: number; max: number };
  /** Seeded duration range of a marking, in seconds. */
  markingSeconds: { min: number; max: number };
  /** One-off Arousal points of a Plant dragged or a marking interrupted, before the Equipment Rigid Pull multiplier. */
  dragArousal: number;
  chain: {
    /** Slack walking after the Marker that completes a Chain, in seconds. */
    walkSeconds: number;
    /** A Go Sniff this soon after the Marker completes a Chain, in seconds. */
    sniffSeconds: number;
  };
}

export const DEFAULT_SCENT_WALK: ScentWalkConfig = {
  pull: { weak: 1.5, normal: 3, hot: 5 },
  autopilotFloor: 0.3,
  radius: { weak: 3, normal: 4, hot: 5 },
  reachDistance: 0.6,
  headingLead: 1.4,
  autopilot: { risePerSecond: 0.05, steadyAngle: (15 * Math.PI) / 180, steadyPace: 0.2, steadySeconds: 1, dropPerChange: 0.6, followDamping: 0.4 },
  novelty: { step: 0.45, recoveryPerSecond: 0.025, fresh: 0.7, repeated: 0.4, freshBonus: 0.15 },
  pace: { smoothingSeconds: 0.5, threshold: 0.35 },
  uTurnAngle: (135 * Math.PI) / 180,
  plantSeconds: { min: 3, max: 6 },
  markingSeconds: { min: 2, max: 4 },
  dragArousal: 8,
  chain: { walkSeconds: 2, sniffSeconds: 3 },
};

/** Every tunable of a Stage. 1 world unit = 1 m. */
/** Dog coats the bundle can draw (visual only). */
export const DOG_COAT_NAMES = ['golden', 'black', 'chocolate', 'cream', 'white', 'grey', 'red'] as const;
export type DogCoat = (typeof DOG_COAT_NAMES)[number];

export interface ScenarioConfig {
  /** World the Stage belongs to, 1 to 5; Worlds 1 and 2 are static, and Go Sniff exists from World 3. */
  world: number;
  theme: SceneryTheme;
  fixedStep: number;
  leashLength: number;
  /** Extra distance the Handler can be pushed past the leash length (shows as Rigid Pull). */
  leashTolerance: number;
  /** Handler speed at movement strength 1. */
  quickSpeed: number;
  /** Movement strength of a walk (joystick detent, keyboard). */
  walkStrength: number;
  handlerStart: Vec2;
  dogStart: Vec2;
  /** The end of the route. */
  waypoint: Vec2;
  /** Corridor points the route passes through before `waypoint`, in order. */
  waypoints: Vec2[];
  waypointRadius: number;
  /** Solid boundaries: they block movement and sight, and the leash wraps around their corners. */
  walls: Wall[];
  /** The scenery set (see `validateScenery`). */
  scenery: SceneryItem[];
  /** How the Dog looks (visual only; the simulation ignores it): a coat and a size factor. */
  look?: { dogCoat?: DogCoat; dogScale?: number };
  /** Cues on the HUD in this Stage. */
  cues: CueType[];
  dogGoalSpeed: number;
  dogFixationSpeed: number;
  dogReturnSpeed: number;
  /** The Dog is back at the Handler's side within this distance. */
  dogReturnDistance: number;
  /** Maximum Wander deviation from the straight line to the waypoint, in radians. */
  wanderMaxAngle: number;
  /** Wander turn rate, in radians per second. */
  wanderTurnRate: number;
  distractor: DistractorConfig;
  /** Further Distractors, met in order after the first has passed (a schedule). */
  moreDistractors: DistractorConfig[];
  /** Handler stopped without Rigid Pull for this long ends a Fixation. */
  calmSeconds: number;
  rewardWindowSeconds: number;
  /** Marks available per Stage; every Marker press spends one. */
  markBudget: number;
  /** How long a Dog's look at the Handler counts as a Check-in, in seconds. */
  checkInWindow: number;
  /** What the Dog has learned, its Trigger Profile and Equipment (ADR 0003). */
  learning: LearningSnapshot;
  /** How the Learning Attributes translate into seconds, Arousal and intervals. */
  ranges: AttributeRanges;
  arousal: ArousalConfig;
  cue: CueConfig;
  reaction: ReactionConfig;
  sintonia: SintoniaConfig;
  goSniff: GoSniffConfig;
  /** A Handler heading change bigger than this, in radians, counts as a turn. */
  turnAngle: number;
  /** How long a follow or a Taut correction steers the Dog toward the Handler's heading. */
  followSeconds: number;
  /** How long a Dog that did not follow waits for the leash to reach Taut and correct it. */
  correctionWaitSeconds: number;
  /** Speed in m/s at which Rigid Pull drags the Dog toward the Handler; 0 disables it. */
  pullStrength: number;
  /** Which config this Stage ran on: 'bundled', or the version of a remote config (recorded in the Stage payload). */
  configVersion: string;
  camera: CameraConfig;
  endCondition: EndCondition;
  /** Stage Meters (at most `MAX_STAGE_METERS` of `meters.ts`); without them the handling score follows ADR 0005. */
  meters?: StageMeterConfig[];
  /** Scent Spots (see `scentSpotsOf`, which adds those carried by scenery items); a Stage with any is a scent Stage. */
  scents?: ScentSpotConfig[];
  /** Overrides of the scent-walk tunables (`DEFAULT_SCENT_WALK`); partial objects merge per group. */
  scentWalk?: DeepPartial<ScentWalkConfig>;
  /** Jackpots available in this Stage; the Jackpot button shows only when this is above 0. */
  jackpotBudget?: number;
}

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** The scent-walk tunables of a scenario: its overrides over the defaults. */
export function scentWalkOf(config: Pick<ScenarioConfig, 'scentWalk'>): ScentWalkConfig {
  const o = config.scentWalk;
  if (!o) return DEFAULT_SCENT_WALK;
  const d = DEFAULT_SCENT_WALK;
  return {
    ...d,
    ...(o as Partial<ScentWalkConfig>),
    pull: { ...d.pull, ...o.pull },
    radius: { ...d.radius, ...o.radius },
    autopilot: { ...d.autopilot, ...o.autopilot },
    novelty: { ...d.novelty, ...o.novelty },
    pace: { ...d.pace, ...o.pace },
    plantSeconds: { ...d.plantSeconds, ...o.plantSeconds },
    markingSeconds: { ...d.markingSeconds, ...o.markingSeconds },
    chain: { ...d.chain, ...o.chain },
  };
}

/** Every Scent Spot of a scenario: the `scents` list, then the scenery items that carry `scent:`, in order. */
export function scentSpotsOf(config: Pick<ScenarioConfig, 'scents' | 'scenery'>): ScentSpotConfig[] {
  const listed = config.scents ?? [];
  const carried = (config.scenery ?? []).filter((item) => item.scent).map((item) => ({ ...item.scent!, pos: item.pos }));
  return [...listed, ...carried];
}

export const defaultScenario: ScenarioConfig = {
  world: 3,
  theme: 'quiet_suburb',
  fixedStep: 1 / 60,
  leashLength: 2,
  leashTolerance: 0.1,
  quickSpeed: 2.0,
  walkStrength: 0.6,
  handlerStart: { x: 0, y: 0 },
  dogStart: { x: 1, y: 0 },
  waypoint: { x: 90, y: 0 },
  waypoints: [],
  waypointRadius: 2,
  walls: [],
  scenery: scatterScenery('quiet_suburb', [{ x: 0, y: 0 }, { x: 90, y: 0 }], 1),
  cues: ['lets-go'],
  dogGoalSpeed: 1.6,
  dogFixationSpeed: 1.0,
  dogReturnSpeed: 1.6,
  dogReturnDistance: 1,
  wanderMaxAngle: 0.5,
  wanderTurnRate: 2,
  distractor: {
    kind: 'skateboard',
    speed: 4,
    triggerRadius: 14,
    activateAfterMeters: 30,
    startOffset: 28,
  },
  moreDistractors: [],
  calmSeconds: 3,
  rewardWindowSeconds: 1.1,
  markBudget: 5,
  checkInWindow: 1.0,
  learning: DEFAULT_SNAPSHOT,
  ranges: defaultRanges,
  arousal: {
    k: 30,
    minDistance: 2,
    decayPerSecond: 3,
    rigidPullRate: 4,
    disengagementDrop: 25,
    markerHitDrop: 20,
    posteJolt: 15,
    smoothStopFactor: 0.3,
    slowedSeconds: 0.5,
  },
  cue: {
    cooldownSeconds: 3,
    fixatedFactor: 0.3,
    repeatFactor: 0.5,
    arousalDrop: 10,
    followBoostSeconds: 2,
    followBoost: 0.25,
    followCap: 0.95,
  },
  reaction: { alertFraction: 0.6, lungeAccel: 1.5, lungeMaxSpeed: 4, alertSlowdown: 0.85 },
  sintonia: { minSpeed: 0.4, minTurnRate: 0.2, maxTurnRate: 1.8, turnWindow: 0.5, holdSeconds: 2 },
  goSniff: { offerSeconds: 3, durationSeconds: 4, speed: 0.4, decayFactor: 3 },
  turnAngle: Math.PI / 4,
  followSeconds: 1.5,
  correctionWaitSeconds: 4,
  pullStrength: 0.8,
  configVersion: 'bundled',
  camera: { closeZoom: 2.2, farZoom: 1.5, padding: 90, smoothing: 3 },
  endCondition: { kind: 'reach-waypoint' },
};
