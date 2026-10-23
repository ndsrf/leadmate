import { classifyTension, tensionRatio, type TensionState } from './leash';
import { defaultScenario, RATIO_EPSILON, requiredCue, RIGID_MIN, SLACK_MAX, type CueType, type DistractorConfig, type ScenarioConfig } from './config';
import { BODY_RADIUS, buildWallIndex, closestOnSegment, hasLineOfSight, leashLength, leashPath, resolveWalls, segmentsCross, wallsNear, type LeashPath, type Wall, type WallIndex } from './geometry';
import { propWalls } from './scenery';
import { GoalDrive, type Drive } from './drives';
import { resolveDog, TRIGGER_FACTORS, type DistractorKind, type ResolvedDog } from './learning';
import { createRng, type Rng } from './rng';
import { add, distance, dot, length, normalize, rotate, scale, sub, vec, type Vec2 } from './vec';

/** Movement input for one tick: a direction plus a strength from 0 to 1, and a Marker press. */
export interface SimInput {
  direction: Vec2;
  strength: number;
  marker: boolean;
  /** A Cue button was pressed this tick. */
  cue?: boolean;
  /** Which Cue; "Let's Go" when absent. */
  cueType?: CueType;
  /** The Go Sniff button was pressed this tick. */
  sniff?: boolean;
}

export const noInput: SimInput = { direction: { x: 0, y: 0 }, strength: 0, marker: false, cue: false, sniff: false };

/** How visibly the Dog reacts: Calm, Alert (perked up) or Reactive (fixated, barking, lunging). */
export type ReactionTier = 'calm' | 'alert' | 'reactive';

/** The Reaction Tier for an Arousal level against the Dog's reactivity threshold. */
export function tierFor(arousal: number, threshold: number, alertFraction: number): ReactionTier {
  if (arousal >= threshold) return 'reactive';
  if (arousal >= alertFraction * threshold) return 'alert';
  return 'calm';
}

/**
 * 'goal': following the Drive. 'fixated': locked on the Distractor. 'holding': Disengagement
 * happened, standing still during the Reward Window. 'returning': walking back to the Handler.
 */
export type DogMode = 'goal' | 'fixated' | 'holding' | 'returning' | 'sniffing';

export type SimEvent =
  | { type: 'fixation-start'; time: number }
  | { type: 'disengagement'; time: number }
  | { type: 'marker-hit'; time: number; accuracyMs: number }
  | { type: 'marker-miss'; time: number }
  | { type: 'marker-reactive'; time: number }
  | { type: 'missed-opportunity'; time: number }
  | { type: 'check-in-glance'; time: number }
  | { type: 'check-in-hit'; time: number }
  | { type: 'marker-wasted'; time: number }
  | { type: 'dog-follow'; time: number }
  | { type: 'dog-correction'; time: number }
  /** A Cue took effect (cooldown passed); `strength` is its share of a full response. */
  | { type: 'cue'; time: number; strength: number; cueType: CueType }
  /** The Handler stopped with the leash at its limit. */
  | { type: 'poste-stop'; time: number; abrupt: boolean; outwardSpeed: number; arousalBump: number }
  /** A Cue was pressed that does not work on what the Dog is facing. */
  | { type: 'cue-mismatch'; time: number; cue: CueType }
  /** The Dog crossed a Reaction Tier threshold. */
  | { type: 'reaction-tier-change'; time: number; tier: ReactionTier }
  /** The leash changed between slack, taut and rigid. */
  | { type: 'tension-change'; time: number; tension: TensionState }
  /** A dog Distractor first came within `APPROACH_FACTOR` times its trigger radius of the Dog; once per Stage. */
  | { type: 'dog-approaching'; time: number; position: Vec2 }
  | { type: 'sintonia-start'; time: number }
  | { type: 'sintonia-end'; time: number }
  | { type: 'go-sniff-start'; time: number }
  | { type: 'go-sniff-end'; time: number; reason: 'time' | 'tension' | 'calm' }
  | { type: 'stage-end'; time: number };

export interface Telemetry {
  slackTime: number;
  tautTime: number;
  rigidTime: number;
  hitAccuraciesMs: number[];
  markerMisses: number;
  reactiveMarkers: number;
  missedOpportunities: number;
  checkInHits: number;
  /** Marks spent: every press while the budget lasts, hit or not. */
  marksUsed: number;
  /** Check-in hits on a look after the Dog followed a turn. */
  followMarks: number;
  /** Stops at the leash limit during which a Fixation ended in a Disengagement. */
  posteSuccesses: number;
  /** Abrupt stops at the leash limit with the Dog moving outward. */
  harshStops: number;
  /** Highest Arousal reached. */
  peakArousal: number;
  /** Disengagements followed by a Marker hit, per kind of Distractor. */
  calmEncounters: Partial<Record<DistractorKind, number>>;
  /** Seconds of active Sintonía. */
  sintoniaTime: number;
  /** Go Sniffs the Handler started. */
  goSniffs: number;
}

/** What the last stop at the leash limit looked like (the leash-physics abrupt stop measure). */
export interface StopMeasure {
  abrupt: boolean;
  /** The Dog's intended speed away from the Handler at the stop, in m/s. */
  outwardSpeed: number;
}

export interface SimState {
  config: ScenarioConfig;
  seed: number;
  /** Simulation time in seconds; only advances while the Stage runs. */
  time: number;
  rng: Rng;
  /** Seeded draws for glances and turn-following, apart from the Wander stream. */
  eventRng: Rng;
  drive: Drive;
  /** The learning snapshot as the Stage uses it (capacity and Equipment applied). */
  dogTraits: ResolvedDog;
  /** Arousal, 0 to 100. Starts at 0 and is not kept between Stages. */
  arousal: number;
  handler: Vec2;
  handlerFacing: Vec2;
  dog: Vec2;
  dogFacing: Vec2;
  dogMode: DogMode;
  /** What the Dog wanted to do last tick, before the leash limited it. */
  dogDesired: Vec2;
  /** The Dog waits until this time before heading back to the Handler after a Marker hit. */
  returnAt: number;
  distractor: { pos: Vec2; from: Vec2; to: Vec2; active: boolean; finished: boolean; consumed: boolean; seen: boolean };
  /** Which Distractor of the schedule is in play: 0 is `config.distractor`. */
  distractorIndex: number;
  /** The `dog-approaching` event was already sent in this Stage. */
  dogApproachSent: boolean;
  /** Index of the route point the Dog is heading for (the last one is `config.waypoint`). */
  routeIndex: number;
  /** Where the Dog's Arousal puts it between Calm, Alert and Reactive. */
  tier: ReactionTier;
  /** Extra speed toward the Distractor of a lunging Dog, in m/s. */
  lungeSpeed: number;
  /** Recent Handler headings, for the Sintonía turning rate. */
  headings: { time: number; dir: Vec2; turn: number }[];
  /** Handler position on the previous tick. */
  prevHandler: Vec2;
  sintonia: { since: number | null; active: boolean };
  /** A Disengagement happened and the Go Sniff offer opens once the Reward Window is over. */
  sniffPending: boolean;
  /** The Go Sniff button is on offer until this time. */
  sniffOfferUntil: number;
  sniff: { until: number; dir: Vec2 } | null;
  /** Seconds of continuous calm so far in the current Fixation. */
  calmElapsed: number;
  rewardWindow: { openedAt: number; closesAt: number } | null;
  /** The Dog is looking at the Handler until this simulation time. */
  dogLookUntil: number;
  /** Why the Dog is looking: its own glance, following a turn, or a Cue. */
  lookCause: 'glance' | 'follow' | 'cue';
  nextCheckInAt: number;
  /** Heading the last turn was measured from. */
  headingAnchor: Vec2;
  /** The Dog heads this way instead of following its Drive, until `until`. */
  steer: { dir: Vec2; until: number } | null;
  /** Seconds the Dog has been held up by an Obstacle while trying to walk. */
  stalledFor: number;
  /** The Dog takes a detour around an Obstacle until this time, heading `detourDir`. */
  detourUntil: number;
  detourDir: Vec2;
  /** The Dog did not follow a turn; the leash reaching Taut will correct it before `until`. */
  correctionPending: { dir: Vec2; until: number } | null;
  /** When the last Cue took effect (for the cooldown and the follow boost). */
  lastCueAt: number;
  /** Handler strength on the previous tick. */
  prevStrength: number;
  /** Since when the Handler has been at walk strength or less; null when not slowed. */
  slowSince: number | null;
  /** The Handler is standing with the leash at its limit since a stop there. */
  posteStop: boolean;
  lastStop: StopMeasure | null;
  ratio: number;
  tension: TensionState;
  telemetry: Telemetry;
  paused: boolean;
  ended: boolean;
}

/** A new Stage. Nothing is saved or restored between Stages. */
export function createState(seed: number, config: ScenarioConfig = defaultScenario): SimState {
  const rng = createRng(seed);
  const eventRng = createRng(seed ^ 0x9e3779b9);
  const state: SimState = {
    config,
    seed,
    time: 0,
    rng,
    eventRng,
    drive: new GoalDrive(config, rng),
    dogTraits: resolveDog(config.learning, config.ranges),
    arousal: 0,
    handler: { ...config.handlerStart },
    handlerFacing: normalize(sub(routeOf(config)[0], config.handlerStart)),
    dog: { ...config.dogStart },
    dogFacing: normalize(sub(routeOf(config)[0], config.dogStart)),
    dogMode: 'goal',
    dogDesired: vec(),
    returnAt: 0,
    distractor: {
      pos: { ...(config.distractor.path?.from ?? config.dogStart) },
      from: { ...(config.distractor.path?.from ?? config.dogStart) },
      to: { ...(config.distractor.path?.to ?? config.dogStart) },
      active: false,
      finished: false,
      consumed: false,
      seen: false,
    },
    distractorIndex: 0,
    dogApproachSent: false,
    routeIndex: 0,
    tier: 'calm',
    lungeSpeed: 0,
    headings: [],
    prevHandler: { ...config.handlerStart },
    sintonia: { since: null, active: false },
    sniffPending: false,
    sniffOfferUntil: -1,
    sniff: null,
    calmElapsed: 0,
    rewardWindow: null,
    dogLookUntil: -1,
    lookCause: 'glance',
    nextCheckInAt: 0,
    headingAnchor: normalize(sub(routeOf(config)[0], config.handlerStart)),
    steer: null,
    stalledFor: 0,
    detourUntil: -1,
    detourDir: vec(),
    correctionPending: null,
    lastCueAt: -1e9,
    prevStrength: 0,
    slowSince: null,
    posteStop: false,
    lastStop: null,
    ratio: 0,
    tension: 'slack',
    telemetry: {
      slackTime: 0,
      tautTime: 0,
      rigidTime: 0,
      hitAccuraciesMs: [],
      markerMisses: 0,
      reactiveMarkers: 0,
      missedOpportunities: 0,
      checkInHits: 0,
      marksUsed: 0,
      followMarks: 0,
      posteSuccesses: 0,
      harshStops: 0,
      peakArousal: 0,
      calmEncounters: {},
      sintoniaTime: 0,
      goSniffs: 0,
    },
    paused: false,
    ended: false,
  };
  state.nextCheckInAt = state.dogTraits.checkInMeanInterval * (0.5 + eventRng.next());
  state.ratio = leashRatio(state);
  state.tension = classifyTension(state.ratio);
  return state;
}

/** The route as ordered points: the corridor waypoints, then the end waypoint. */
export function routeOf(config: ScenarioConfig): Vec2[] {
  return [...config.waypoints, config.waypoint];
}

/** The point the Dog is heading for. */
export function currentTarget(state: SimState): Vec2 {
  const route = routeOf(state.config);
  return route[Math.min(state.routeIndex, route.length - 1)];
}

/** The Distractor of the schedule that is in play. */
export function activeDistractor(state: SimState): DistractorConfig {
  return state.distractorIndex === 0 ? state.config.distractor : (state.config.moreDistractors[state.distractorIndex - 1] ?? state.config.distractor);
}

interface SolidSet {
  walls: ScenarioConfig['walls'];
  scenery: ScenarioConfig['scenery'];
  index: WallIndex;
  /** The Obstacle walls among the indexed ones. */
  props: ReadonlySet<Wall>;
}

const solidCache = new WeakMap<ScenarioConfig, SolidSet>();

/** The Boundaries plus the collision walls of the Obstacles, bucketed by grid; built once per scenario. */
function solidSet(config: ScenarioConfig): SolidSet {
  const hit = solidCache.get(config);
  if (hit && hit.walls === config.walls && hit.scenery === config.scenery) return hit;
  const props = propWalls(config.scenery);
  const set: SolidSet = { walls: config.walls, scenery: config.scenery, index: buildWallIndex([...config.walls, ...props]), props: new Set(props) };
  solidCache.set(config, set);
  return set;
}

const solidIndex = (config: ScenarioConfig): WallIndex => solidSet(config).index;

/** The Boundaries and Obstacle walls near the segment `a`-`b`. */
function solidsNear(state: SimState, a: Vec2, b: Vec2): readonly Wall[] {
  return wallsNear(solidIndex(state.config), a, b);
}

/** The leash path from the Handler to the Dog around Boundaries and Obstacles, or null when it runs straight. */
export function wrappedLeash(state: SimState): LeashPath | null {
  const nearby = solidsNear(state, state.handler, state.dog);
  if (nearby.length === 0) return null;
  const path = leashPath(state.handler, state.dog, nearby);
  return path.points.length > 2 ? path : null;
}

/** Pushes a body out of the Boundaries and Obstacles around `pos`. */
function resolveSolids(state: SimState, pos: Vec2): Vec2 {
  return resolveWalls(pos, wallsNear(solidIndex(state.config), pos, pos, 0.5));
}

/** Seconds of being held up by an Obstacle after which the Dog tries a way around it. */
const STALL_SECONDS = 3;
/** How long the detour lasts, in seconds. */
const DETOUR_SECONDS = 2;
/** The Dog counts as at an Obstacle within this distance of its edge, in meters. */
const OBSTACLE_REACH = BODY_RADIUS + 0.15;

/** The nearest Obstacle wall point to `pos` within `OBSTACLE_REACH`, or null. */
function obstacleNear(state: SimState, pos: Vec2): Vec2 | null {
  const { props } = solidSet(state.config);
  if (props.size === 0) return null;
  let best: Vec2 | null = null;
  let bestD = OBSTACLE_REACH;
  for (const w of wallsNear(solidIndex(state.config), pos, pos, 0.5)) {
    if (!props.has(w)) continue;
    const c = closestOnSegment(pos, w.from, w.to);
    const d = distance(pos, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

/**
 * Where a Dog that has been held up by an Obstacle heads for a moment: toward the first point
 * where its leash is wrapped (which unwraps it), or else sideways along the Obstacle.
 */
function detourDirection(state: SimState, goal: Vec2): Vec2 {
  const wrapped = leashPath(state.handler, state.dog, solidsNear(state, state.handler, state.dog));
  if (wrapped.points.length > 2) {
    // aim just outside the corner, on the side away from what the leash wraps, so the Dog's body clears the edge
    const n = wrapped.points.length;
    const corner = wrapped.points[n - 2];
    const inside = normalize(add(normalize(sub(wrapped.points[n - 3], corner)), normalize(sub(state.dog, corner))));
    return normalize(sub(add(corner, scale(inside, -(BODY_RADIUS + 0.15))), state.dog));
  }
  const edge = obstacleNear(state, state.dog);
  if (!edge) return goal;
  const out = normalize(sub(state.dog, edge));
  const side = { x: -out.y, y: out.x };
  return dot(side, goal) >= 0 ? side : scale(side, -1);
}

/** Leash length between two bodies, around wall corners and Obstacles when they are in the way. */
function leashDist(state: SimState, a: Vec2, b: Vec2): number {
  return leashLength(a, b, solidsNear(state, a, b));
}

function leashRatio(state: SimState): number {
  return tensionRatio(state.handler, state.dog, state.config.leashLength, solidsNear(state, state.handler, state.dog));
}

/** Whether the Go Sniff button is on offer: World 2 or later, in the window, with the leash Slack. */
export function isGoSniffAvailable(state: SimState): boolean {
  return state.config.world >= 2 && state.sniff === null && state.time < state.sniffOfferUntil && state.ratio < SLACK_MAX;
}

/** True while the Dog is looking at the Handler (a glance or a look after following a turn). */
export function isDogLooking(state: SimState): boolean {
  return state.time < state.dogLookUntil;
}

export function setPaused(state: SimState, paused: boolean): void {
  state.paused = paused;
}

/** Moves `to` no farther from `anchor` than `max`, unless it already was farther before the move. */
function limitDistance(anchor: Vec2, from: Vec2, to: Vec2, max: number): Vec2 {
  const before = distance(anchor, from);
  const after = distance(anchor, to);
  const allowed = Math.max(max, before);
  if (after <= allowed) return to;
  return add(anchor, scale(normalize(sub(to, anchor)), allowed));
}

/**
 * Like `limitDistance` but measured along the leash: where a wall is in the way the move is
 * stopped at the leash limit instead of slid, since the wrapped path has no single direction.
 */
function limitLeash(state: SimState, anchor: Vec2, from: Vec2, to: Vec2, max: number): Vec2 {
  const walls = solidsNear(state, anchor, to);
  if (walls.length === 0 || !walls.some((w) => segmentsCross(anchor, to, w.from, w.to))) return limitDistance(anchor, from, to, max);
  const allowed = Math.max(max, leashLength(anchor, from, walls));
  if (leashLength(anchor, to, walls) <= allowed) return to;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2;
    const p = add(from, scale(sub(to, from), mid));
    if (leashLength(anchor, p, walls) <= allowed) lo = mid;
    else hi = mid;
  }
  return add(from, scale(sub(to, from), lo));
}

/** A turn on Slack gives the Dog a seeded chance to follow it; otherwise a Taut leash corrects it. */
function detectTurn(state: SimState, dir: Vec2, events: SimEvent[]): void {
  const { config } = state;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(dir, state.headingAnchor))));
  if (angle <= config.turnAngle) return;
  state.headingAnchor = dir;
  if (state.ratio >= SLACK_MAX) return;
  const { cue } = config;
  const base = state.dogTraits.followChance;
  const boosted = state.time - state.lastCueAt <= cue.followBoostSeconds;
  // a Cue just before the turn adds a fixed boost, capped; a chance already above the cap is left alone
  const chance = boosted ? Math.max(base, Math.min(cue.followCap, base + cue.followBoost)) : base;
  if (state.eventRng.next() < chance) {
    state.steer = { dir, until: state.time + config.followSeconds };
    state.correctionPending = null;
    state.dogLookUntil = state.time + config.checkInWindow;
    state.lookCause = 'follow';
    events.push({ type: 'dog-follow', time: state.time });
  } else {
    state.correctionPending = { dir, until: state.time + config.correctionWaitSeconds };
  }
}

/** Applies a pending Taut correction and ends a finished follow. */
function updateSteering(state: SimState, events: SimEvent[]): void {
  const pending = state.correctionPending;
  if (pending) {
    if (state.time > pending.until) {
      state.correctionPending = null;
    } else if (state.ratio >= SLACK_MAX) {
      // the leash signal reaches a Dog in a collar more clearly than one in a harness
      state.steer = { dir: pending.dir, until: state.time + state.config.followSeconds * state.dogTraits.equipment.signalResponse };
      state.correctionPending = null;
      events.push({ type: 'dog-correction', time: state.time });
    }
  }
  if (state.steer && state.time > state.steer.until) state.steer = null;
}

function moveHandler(state: SimState, input: SimInput, dt: number, events: SimEvent[]): void {
  const { config } = state;
  const strength = Math.max(0, Math.min(1, input.strength));
  const dir = normalize(input.direction);
  const standing = strength === 0 || (dir.x === 0 && dir.y === 0);
  trackStop(state, standing ? 0 : strength, events);
  if (standing) {
    // Poste: the Handler stays put. The little stretch of a leash pushed past its length springs
    // back once the push stops, so Rigid Pull ends when the Handler does.
    const wrapped = leashDist(state, state.handler, state.dog);
    if (wrapped > config.leashLength * (1 + RATIO_EPSILON)) {
      const nearby = solidsNear(state, state.handler, state.dog);
      if (nearby.length === 0) {
        state.handler = add(state.dog, scale(normalize(sub(state.handler, state.dog)), config.leashLength));
      } else {
        // along the wrapped leash, toward its first corner, and never into a solid
        const first = leashPath(state.handler, state.dog, nearby).points[1];
        const step = Math.min(wrapped - config.leashLength, distance(state.handler, first));
        state.handler = resolveSolids(state, add(state.handler, scale(normalize(sub(first, state.handler)), step)));
      }
    }
    return;
  }
  const next = add(state.handler, scale(dir, strength * config.quickSpeed * dt));
  state.handler = resolveSolids(state, limitLeash(state, state.dog, state.handler, next, config.leashLength + config.leashTolerance));
  state.handlerFacing = dir;
  detectTurn(state, dir, events);
}

/**
 * The abrupt stop measure: when the Handler's strength reaches 0 with the leash at its limit,
 * records the Dog's outward speed and whether the Handler slowed beforehand, and adds the
 * Equipment-scaled Arousal bump (the Poste jolt).
 */
function trackStop(state: SimState, strength: number, events: SimEvent[]): void {
  const { config } = state;
  if (strength > 0) {
    const slow = strength <= config.walkStrength + RATIO_EPSILON;
    state.slowSince = slow ? (state.slowSince ?? state.time) : null;
    state.posteStop = false;
  } else if (state.prevStrength > 0) {
    const atLimit = state.ratio >= RIGID_MIN - RATIO_EPSILON;
    if (atLimit) {
      const out = normalize(sub(state.dog, state.handler));
      const outwardSpeed = Math.max(0, dot(state.dogDesired, out));
      const slowed = state.slowSince !== null && state.time - state.slowSince >= config.arousal.slowedSeconds;
      state.posteStop = true;
      state.lastStop = { abrupt: !slowed, outwardSpeed };
      let bump = 0;
      if (outwardSpeed > 0) {
        const a = config.arousal;
        bump = a.posteJolt * Math.min(1.5, outwardSpeed / config.dogGoalSpeed) * state.dogTraits.equipment.posteJolt * (slowed ? a.smoothStopFactor : 1);
        raiseArousal(state, bump);
        if (!slowed) state.telemetry.harshStops += 1;
      }
      events.push({ type: 'poste-stop', time: state.time, abrupt: !slowed, outwardSpeed, arousalBump: bump });
    }
    state.slowSince = null;
  }
  state.prevStrength = strength;
}

function raiseArousal(state: SimState, points: number): void {
  state.arousal = Math.max(0, Math.min(100, state.arousal + points));
  state.telemetry.peakArousal = Math.max(state.telemetry.peakArousal, state.arousal);
}

/** Puts the Distractor on a path across the route that meets a Dog walking at its Goal speed. */
function aimDistractor(state: SimState): void {
  const { config, distractor: d } = state;
  const cfg = activeDistractor(state);
  if (cfg.path) return;
  const ahead = normalize(sub(currentTarget(state), state.dog));
  const side = { x: -ahead.y, y: ahead.x };
  const crossing = add(state.dog, scale(ahead, config.dogGoalSpeed * (cfg.startOffset / cfg.speed)));
  d.from = add(crossing, scale(side, -cfg.startOffset));
  d.to = add(crossing, scale(side, cfg.startOffset));
  d.pos = { ...d.from };
}

/** Once a Distractor has passed and the Dog is back to walking, the next one of the schedule takes its place. */
function nextDistractor(state: SimState): void {
  const d = state.distractor;
  // a Distractor that stands still (food) is done once handled; a moving one once it has passed
  const done = d.finished || (d.consumed && activeDistractor(state).speed === 0);
  if (!done || state.distractorIndex >= state.config.moreDistractors.length) return;
  if (state.dogMode !== 'goal' && state.dogMode !== 'returning') return;
  state.distractorIndex += 1;
  const cfg = activeDistractor(state);
  const from = { ...(cfg.path?.from ?? state.config.dogStart) };
  state.distractor = { pos: { ...from }, from, to: { ...(cfg.path?.to ?? state.config.dogStart) }, active: false, finished: false, consumed: false, seen: false };
}

/** A dog Distractor is "approaching" once it is this many trigger radii from the Dog. */
export const APPROACH_FACTOR = 2;

/** Tells the shell, once per Stage, that a dog is coming before it can affect the Dog's Arousal. */
function detectApproach(state: SimState, events: SimEvent[]): void {
  const d = state.distractor;
  const cfg = activeDistractor(state);
  if (state.dogApproachSent || cfg.kind !== 'dog' || !d.active || d.finished) return;
  const gap = distance(state.dog, d.pos);
  // a dog that stands still, or is already on top of the Dog, is not "approaching"
  if (cfg.speed === 0 || gap <= cfg.triggerRadius || gap > cfg.triggerRadius * APPROACH_FACTOR) return;
  state.dogApproachSent = true;
  events.push({ type: 'dog-approaching', time: state.time, position: { ...d.pos } });
}

function moveDistractor(state: SimState, dt: number): void {
  nextDistractor(state);
  const cfg = activeDistractor(state);
  const d = state.distractor;
  if (d.finished) return;
  if (!d.active) {
    if (distance(state.dog, state.config.dogStart) < cfg.activateAfterMeters || state.time < (cfg.spawnAtSeconds ?? 0)) return;
    d.active = true;
    aimDistractor(state);
  }
  if (cfg.speed === 0) {
    // it stays where it is; once the Dog has been near and left again, it is behind us
    if (distance(state.dog, d.pos) <= cfg.triggerRadius) d.seen = true;
    else if (d.seen) d.finished = true;
    return;
  }
  const remaining = distance(d.pos, d.to);
  const step = cfg.speed * dt;
  if (step >= remaining) {
    d.pos = { ...d.to };
    d.finished = true;
  } else {
    d.pos = add(d.pos, scale(normalize(sub(d.to, d.pos)), step));
  }
}

function moveDog(state: SimState, dt: number): void {
  const { config } = state;
  let direction = vec();
  let speed = 0;
  if (state.dogMode === 'goal' && state.steer) {
    direction = state.steer.dir;
    speed = config.dogGoalSpeed;
  } else if (state.dogMode === 'goal') {
    ({ direction, speed } = state.drive.desire({ dog: state.dog, handler: state.handler, waypoint: currentTarget(state), dt }));
    if (state.time < state.detourUntil) direction = state.detourDir;
    // an Alert Dog slows down a little as it watches
    if (state.tier === 'alert') speed *= config.reaction.alertSlowdown;
  } else if (state.dogMode === 'fixated') {
    direction = normalize(sub(state.distractor.pos, state.dog));
    // a Reactive Dog lunges: its drive toward the Distractor keeps accelerating
    state.lungeSpeed = state.tier === 'reactive' ? Math.min(config.reaction.lungeMaxSpeed, state.lungeSpeed + config.reaction.lungeAccel * dt) : 0;
    speed = config.dogFixationSpeed + state.lungeSpeed;
  } else if (state.dogMode === 'sniffing' && state.sniff) {
    // ambient sniffing: a slow, meandering walk
    state.sniff.dir = rotate(state.sniff.dir, (state.eventRng.next() - 0.5) * 2 * dt * 2);
    direction = state.sniff.dir;
    speed = config.goSniff.speed;
  } else if (state.dogMode === 'returning') {
    if (distance(state.dog, state.handler) <= config.dogReturnDistance) {
      state.dogMode = 'goal';
    } else if (state.time >= state.returnAt) {
      direction = normalize(sub(state.handler, state.dog));
      speed = config.dogReturnSpeed;
    }
  }
  if (state.dogMode !== 'fixated') state.lungeSpeed = 0;
  state.dogDesired = scale(direction, speed);
  if (speed === 0) return;

  let velocity = scale(direction, speed);
  const offset = sub(state.dog, state.handler);
  const dist = leashDist(state, state.handler, state.dog);
  if (dist / config.leashLength >= RIGID_MIN - RATIO_EPSILON) {
    // at the leash limit the Dog cannot advance farther away, it can only move sideways or back
    // with the leash wrapped around a corner, "away" is away from the last corner
    const nearby = solidsNear(state, state.handler, state.dog);
    const wrapped = nearby.length > 0 ? leashPath(state.handler, state.dog, nearby) : null;
    const out = wrapped && wrapped.points.length > 2 ? normalize(sub(state.dog, wrapped.points[wrapped.points.length - 2])) : normalize(offset);
    const outward = dot(velocity, out);
    if (outward > 0) velocity = sub(velocity, scale(out, outward));
  }
  const next = add(state.dog, scale(velocity, dt));
  const before = state.dog;
  state.dog = resolveSolids(state, limitLeash(state, state.handler, state.dog, next, config.leashLength));
  trackStall(state, before, length(velocity) * dt, dt);
  if (length(velocity) > 0) state.dogFacing = normalize(velocity);
}

/** A Dog walking by its Drive that barely moves beside an Obstacle for a few seconds gets a detour. */
function trackStall(state: SimState, before: Vec2, intended: number, dt: number): void {
  if (state.dogMode !== 'goal' || intended === 0 || distance(before, state.dog) > intended * 0.1 || !obstacleNear(state, state.dog)) {
    state.stalledFor = 0;
    return;
  }
  state.stalledFor += dt;
  if (state.stalledFor >= STALL_SECONDS) {
    state.stalledFor = 0;
    state.detourUntil = state.time + DETOUR_SECONDS;
    // the side is chosen once, so the Dog does not flip between the two ways around
    state.detourDir = detourDirection(state, normalize(sub(currentTarget(state), state.dog)));
  }
}

/** While the Dog follows its Drive it glances at the Handler at seeded moments. */
function updateCheckIn(state: SimState, events: SimEvent[]): void {
  const { config } = state;
  if (state.dogMode !== 'goal' || state.time < state.nextCheckInAt) return;
  state.dogLookUntil = Math.max(state.dogLookUntil, state.time + config.checkInWindow);
  state.lookCause = 'glance';
  state.nextCheckInAt = state.time + state.dogTraits.checkInMeanInterval * (0.5 + state.eventRng.next());
  events.push({ type: 'check-in-glance', time: state.time });
}

/** In Rigid Pull, a Handler who keeps moving drags the Dog toward them. */
function dragDog(state: SimState, input: SimInput, dt: number): void {
  const { config } = state;
  if (config.pullStrength === 0 || input.strength === 0) return;
  // a lunging Dog braces against the leash: it cannot be dragged, so the Rigid Pull stays
  if (state.dogMode === 'fixated' && state.tier === 'reactive') return;
  if (leashRatio(state) <= RIGID_MIN + RATIO_EPSILON) return;
  state.dog = resolveSolids(state, add(state.dog, scale(normalize(sub(state.handler, state.dog)), config.pullStrength * dt)));
}

/** A Distractor still in play that is close enough to affect the Dog's Arousal. */
function distractorInRange(state: SimState): boolean {
  const d = state.distractor;
  if (!d.active || d.consumed || d.finished || distance(state.dog, d.pos) > activeDistractor(state).triggerRadius) return false;
  // a wall or a parked car in between breaks the line of sight, and with it the Arousal
  return hasLineOfSight(state.dog, d.pos, state.config.walls, state.config.scenery);
}

/**
 * Arousal rises by k * (v / d) * TriggerFactor per second near a Distractor and by the Rigid Pull
 * rate (times the Equipment multiplier) while pulling; with neither it decays.
 */
function updateArousal(state: SimState, dt: number): void {
  const a = state.config.arousal;
  let rate = 0;
  if (distractorInRange(state)) {
    const cfg = activeDistractor(state);
    const level = state.config.learning.triggerProfile[cfg.kind];
    const d = Math.max(a.minDistance, distance(state.dog, state.distractor.pos));
    rate += a.k * ((cfg.salience ?? cfg.speed) / d) * TRIGGER_FACTORS[level];
  }
  if (state.ratio > RIGID_MIN + RATIO_EPSILON) rate += a.rigidPullRate * state.dogTraits.equipment.rigidPull;
  // sniffing the ground relieves Arousal several times faster than standing around
  const decay = a.decayPerSecond * (state.sniff ? state.config.goSniff.decayFactor : 1);
  raiseArousal(state, rate > 0 ? rate * dt : -decay * dt);
}

/** Recomputes the Reaction Tier from Arousal and reports a change. */
function refreshTier(state: SimState, events: SimEvent[]): void {
  const tier = tierFor(state.arousal, state.dogTraits.reactivityThreshold, state.config.reaction.alertFraction);
  if (tier === state.tier) return;
  state.tier = tier;
  events.push({ type: 'reaction-tier-change', time: state.time, tier });
}

/** The Dog lets go of the Distractor: it holds still while the Reward Window is open. */
function disengage(state: SimState, events: SimEvent[]): void {
  const { config } = state;
  state.distractor.consumed = true;
  state.dogMode = 'holding';
  state.rewardWindow = { openedAt: state.time, closesAt: state.time + config.rewardWindowSeconds };
  raiseArousal(state, -config.arousal.disengagementDrop);
  if (state.posteStop) state.telemetry.posteSuccesses += 1;
  // the offer of a Go Sniff opens once the Reward Window is over
  state.sniffPending = config.world >= 2;
  events.push({ type: 'disengagement', time: state.time });
}

function updateFixation(state: SimState, input: SimInput, dt: number, events: SimEvent[]): void {
  const { config, distractor } = state;
  const level = config.learning.triggerProfile[activeDistractor(state).kind];

  // Fixation comes from Arousal reaching the reactivity threshold; the radius only limits who affects Arousal
  if (state.dogMode === 'goal' && level > 0 && distractorInRange(state) && state.arousal >= state.dogTraits.reactivityThreshold) {
    state.dogMode = 'fixated';
    state.calmElapsed = 0;
    events.push({ type: 'fixation-start', time: state.time });
  }
  if (state.dogMode !== 'fixated') return;

  const leftRange = distance(state.dog, distractor.pos) > activeDistractor(state).triggerRadius || distractor.finished;
  const calm = input.strength === 0 && state.ratio <= RIGID_MIN + RATIO_EPSILON;
  state.calmElapsed = calm ? state.calmElapsed + dt : 0;

  if (state.calmElapsed >= config.calmSeconds) {
    disengage(state, events);
  } else if (leftRange) {
    distractor.consumed = true;
    state.dogMode = 'goal';
    state.telemetry.missedOpportunities += 1;
    events.push({ type: 'missed-opportunity', time: state.time });
  }
}

/**
 * A Cue reorients the Dog toward the Handler. The effect is decided here, at the press, so audio
 * latency cannot change the outcome. Its size depends on Equipment, on Fixation (about 30%) and on
 * whether the Dog already looks at the Handler (diminishing), and a cooldown spaces Cues.
 */
function applyCue(state: SimState, input: SimInput, events: SimEvent[]): void {
  const { cue, checkInWindow } = state.config;
  if (!input.cue || state.time - state.lastCueAt < cue.cooldownSeconds) return;
  const type = input.cueType ?? 'lets-go';
  if (!state.config.cues.includes(type)) return; // no such button in this Stage
  // only the Cue that matches what the Dog is facing works: "Leave It" on food, "Let's Go" on the rest
  const facing = state.dogMode === 'fixated' || distractorInRange(state);
  const needed = facing ? requiredCue(activeDistractor(state)) : 'lets-go';
  if (type !== needed) {
    events.push({ type: 'cue-mismatch', time: state.time, cue: type });
    return;
  }
  let strength = state.dogTraits.equipment.signalResponse;
  if (state.dogMode === 'fixated' && type === 'leave-it') {
    // the right Cue on food lets the Dog go cleanly
    state.lastCueAt = state.time;
    events.push({ type: 'cue', time: state.time, strength: 1, cueType: type });
    raiseArousal(state, -cue.arousalDrop);
    disengage(state, events);
    return;
  }
  if (state.dogMode === 'fixated') strength *= cue.fixatedFactor;
  if (isDogLooking(state)) strength *= cue.repeatFactor;
  state.lastCueAt = state.time;
  state.dogLookUntil = Math.max(state.dogLookUntil, state.time + checkInWindow * strength);
  state.lookCause = 'cue';
  if (state.dogMode === 'goal') {
    state.steer = { dir: normalize(sub(state.handler, state.dog)), until: state.time + state.config.followSeconds * strength * 0.5 };
  }
  raiseArousal(state, -cue.arousalDrop * strength);
  events.push({ type: 'cue', time: state.time, strength, cueType: type });
}

function evaluateMarker(state: SimState, input: SimInput, events: SimEvent[]): void {
  const window = state.rewardWindow;
  if (window && state.time > window.closesAt) {
    state.rewardWindow = null;
    state.dogMode = 'goal';
    state.telemetry.markerMisses += 1;
    events.push({ type: 'marker-miss', time: state.time });
  }
  if (!input.marker || state.telemetry.marksUsed >= state.config.markBudget) return;
  state.telemetry.marksUsed += 1;

  if (state.rewardWindow) {
    const accuracyMs = Math.round((state.time - state.rewardWindow.openedAt) * 1000);
    state.telemetry.hitAccuraciesMs.push(accuracyMs);
    state.rewardWindow = null;
    state.dogMode = 'returning';
    state.returnAt = state.time + state.dogTraits.reconnectionSeconds;
    raiseArousal(state, -state.config.arousal.markerHitDrop);
    const kind = activeDistractor(state).kind;
    state.telemetry.calmEncounters[kind] = (state.telemetry.calmEncounters[kind] ?? 0) + 1;
    events.push({ type: 'marker-hit', time: state.time, accuracyMs });
  } else if (state.dogMode === 'fixated' || state.tier === 'reactive' || state.ratio > RIGID_MIN + RATIO_EPSILON) {
    state.telemetry.reactiveMarkers += 1;
    events.push({ type: 'marker-reactive', time: state.time });
  } else if (isDogLooking(state)) {
    state.telemetry.checkInHits += 1;
    if (state.lookCause === 'follow') state.telemetry.followMarks += 1;
    events.push({ type: 'check-in-hit', time: state.time });
  } else {
    events.push({ type: 'marker-wasted', time: state.time });
  }
}

/** The Dog heads for the next corridor point once the Handler or the Dog has reached this one. */
function advanceRoute(state: SimState): void {
  const route = routeOf(state.config);
  if (state.routeIndex >= route.length - 1) return;
  const target = route[state.routeIndex];
  const r = state.config.waypointRadius;
  if (distance(state.handler, target) <= r || distance(state.dog, target) <= r) state.routeIndex += 1;
}

/**
 * Sintonía: smooth, curved handling on a Slack leash. It needs Slack, forward speed and a turning
 * rate (measured over the last half second) inside the band, for a continuous stretch.
 */
function updateSintonia(state: SimState, dt: number, events: SimEvent[]): void {
  const cfg = state.config.sintonia;
  const speed = distance(state.prevHandler, state.handler) / dt;
  let turning = false;
  if (speed > cfg.minSpeed) {
    const last = state.headings[state.headings.length - 1];
    const turn = last ? Math.acos(Math.max(-1, Math.min(1, dot(state.handlerFacing, last.dir)))) : 0;
    state.headings.push({ time: state.time, dir: state.handlerFacing, turn });
    while (state.headings.length > 1 && state.time - state.headings[1].time >= cfg.turnWindow) state.headings.shift();
    const oldest = state.headings[0];
    if (state.time - oldest.time >= cfg.turnWindow - dt / 2) {
      // the turning rate is the heading change summed over the window, so a weave counts as turning
      // all the way through; a reversal of more than 90 degrees inside the window is a sharp turn
      const travelled = state.headings.slice(1).reduce((sum, h) => sum + h.turn, 0);
      const net = Math.acos(Math.max(-1, Math.min(1, dot(state.handlerFacing, oldest.dir))));
      const rate = travelled / (state.time - oldest.time);
      turning = rate >= cfg.minTurnRate && rate <= cfg.maxTurnRate && net <= Math.PI / 2;
    }
  } else {
    state.headings = [];
  }
  const ok = state.ratio < SLACK_MAX && turning;
  const s = state.sintonia;
  if (!ok) {
    if (s.active) events.push({ type: 'sintonia-end', time: state.time });
    s.since = null;
    s.active = false;
    return;
  }
  // the turning rate is measured over the window, so the stretch of flow began a window ago
  s.since ??= state.time - cfg.turnWindow;
  if (!s.active && state.time - s.since >= cfg.holdSeconds - dt / 2) {
    s.active = true;
    events.push({ type: 'sintonia-start', time: state.time });
  }
  if (s.active) state.telemetry.sintoniaTime += dt;
}

/** Opens the Go Sniff offer after the Reward Window, starts a Go Sniff on request, and ends one. */
function updateGoSniff(state: SimState, input: SimInput, events: SimEvent[]): void {
  const cfg = state.config.goSniff;
  if (state.sniffPending && !state.rewardWindow) {
    state.sniffPending = false;
    state.sniffOfferUntil = state.time + cfg.offerSeconds;
  }
  if (input.sniff && isGoSniffAvailable(state)) {
    const angle = state.eventRng.next() * Math.PI * 2;
    state.sniff = { until: state.time + cfg.durationSeconds, dir: { x: Math.cos(angle), y: Math.sin(angle) } };
    state.sniffOfferUntil = -1;
    state.dogMode = 'sniffing';
    state.steer = null;
    state.telemetry.goSniffs += 1;
    events.push({ type: 'go-sniff-start', time: state.time });
    return;
  }
  if (!state.sniff) return;
  const reason = state.ratio >= SLACK_MAX ? 'tension' : state.arousal <= 0 ? 'calm' : state.time >= state.sniff.until ? 'time' : null;
  if (!reason) return;
  state.sniff = null;
  state.dogMode = 'goal';
  events.push({ type: 'go-sniff-end', time: state.time, reason });
}

function checkEnd(state: SimState, events: SimEvent[]): void {
  const { endCondition, waypoint, waypointRadius } = state.config;
  const done =
    endCondition.kind === 'reach-waypoint'
      ? distance(state.handler, waypoint) <= waypointRadius
      : state.time >= endCondition.seconds;
  if (done) {
    state.ended = true;
    events.push({ type: 'stage-end', time: state.time });
  }
}

/**
 * Advances the Stage by `dt` seconds of simulation time and returns what happened.
 * Does nothing while paused or after the Stage ended.
 */
export function tick(state: SimState, input: SimInput, dt: number = state.config.fixedStep): SimEvent[] {
  const events: SimEvent[] = [];
  if (state.paused || state.ended) return events;

  state.time += dt;
  state.prevHandler = state.handler;
  moveHandler(state, input, dt, events);
  moveDistractor(state, dt);
  detectApproach(state, events);
  updateSteering(state, events);
  moveDog(state, dt);
  dragDog(state, input, dt);

  advanceRoute(state);
  state.ratio = leashRatio(state);
  const previousTension = state.tension;
  state.tension = classifyTension(state.ratio);
  if (state.tension !== previousTension) events.push({ type: 'tension-change', time: state.time, tension: state.tension });

  updateArousal(state, dt);
  refreshTier(state, events);
  updateCheckIn(state, events);
  applyCue(state, input, events);
  updateFixation(state, input, dt, events);
  evaluateMarker(state, input, events);
  updateSintonia(state, dt, events);
  updateGoSniff(state, input, events);
  refreshTier(state, events);

  const t = state.telemetry;
  if (state.tension === 'slack') t.slackTime += dt;
  else if (state.tension === 'taut') t.tautTime += dt;
  else t.rigidTime += dt;

  checkEnd(state, events);
  return events;
}
