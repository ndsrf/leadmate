import { classifyTension, tensionRatio, type TensionState } from './leash';
import { defaultScenario, RATIO_EPSILON, RIGID_MIN, SLACK_MAX, type ScenarioConfig } from './config';
import { GoalDrive, type Drive } from './drives';
import { createRng, type Rng } from './rng';
import { add, distance, dot, length, normalize, scale, sub, vec, type Vec2 } from './vec';

/** Movement input for one tick: a direction plus a strength from 0 to 1, and a Marker press. */
export interface SimInput {
  direction: Vec2;
  strength: number;
  marker: boolean;
}

export const noInput: SimInput = { direction: { x: 0, y: 0 }, strength: 0, marker: false };

/**
 * 'goal': following the Drive. 'fixated': locked on the Distractor. 'holding': Disengagement
 * happened, standing still during the Reward Window. 'returning': walking back to the Handler.
 */
export type DogMode = 'goal' | 'fixated' | 'holding' | 'returning';

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
  handler: Vec2;
  handlerFacing: Vec2;
  dog: Vec2;
  dogFacing: Vec2;
  dogMode: DogMode;
  distractor: { pos: Vec2; from: Vec2; to: Vec2; active: boolean; finished: boolean; consumed: boolean };
  /** Seconds of continuous calm so far in the current Fixation. */
  calmElapsed: number;
  rewardWindow: { openedAt: number; closesAt: number } | null;
  /** The Dog is looking at the Handler until this simulation time. */
  dogLookUntil: number;
  nextCheckInAt: number;
  /** Heading the last turn was measured from. */
  headingAnchor: Vec2;
  /** The Dog heads this way instead of following its Drive, until `until`. */
  steer: { dir: Vec2; until: number } | null;
  /** The Dog did not follow a turn; the leash reaching Taut will correct it before `until`. */
  correctionPending: { dir: Vec2; until: number } | null;
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
    handler: { ...config.handlerStart },
    handlerFacing: normalize(sub(config.waypoint, config.handlerStart)),
    dog: { ...config.dogStart },
    dogFacing: normalize(sub(config.waypoint, config.dogStart)),
    dogMode: 'goal',
    distractor: {
      pos: { ...(config.distractor.path?.from ?? config.dogStart) },
      from: { ...(config.distractor.path?.from ?? config.dogStart) },
      to: { ...(config.distractor.path?.to ?? config.dogStart) },
      active: false,
      finished: false,
      consumed: false,
    },
    calmElapsed: 0,
    rewardWindow: null,
    dogLookUntil: -1,
    nextCheckInAt: config.checkInMeanInterval * (0.5 + eventRng.next()),
    headingAnchor: normalize(sub(config.waypoint, config.handlerStart)),
    steer: null,
    correctionPending: null,
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
    },
    paused: false,
    ended: false,
  };
  state.ratio = tensionRatio(state.handler, state.dog, config.leashLength);
  state.tension = classifyTension(state.ratio);
  return state;
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

/** A turn on Slack gives the Dog a seeded chance to follow it; otherwise a Taut leash corrects it. */
function detectTurn(state: SimState, dir: Vec2, events: SimEvent[]): void {
  const { config } = state;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot(dir, state.headingAnchor))));
  if (angle <= config.turnAngle) return;
  state.headingAnchor = dir;
  if (state.ratio >= SLACK_MAX) return;
  if (state.eventRng.next() < config.followChance) {
    state.steer = { dir, until: state.time + config.followSeconds };
    state.correctionPending = null;
    state.dogLookUntil = state.time + config.checkInWindow;
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
      state.steer = { dir: pending.dir, until: state.time + state.config.followSeconds };
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
  if (strength === 0 || (dir.x === 0 && dir.y === 0)) {
    // Poste: the Handler stays put. The little stretch of a leash pushed past its length springs
    // back once the push stops, so Rigid Pull ends when the Handler does.
    if (distance(state.handler, state.dog) > config.leashLength * (1 + RATIO_EPSILON)) {
      state.handler = add(state.dog, scale(normalize(sub(state.handler, state.dog)), config.leashLength));
    }
    return;
  }
  const next = add(state.handler, scale(dir, strength * config.quickSpeed * dt));
  state.handler = limitDistance(state.dog, state.handler, next, config.leashLength + config.leashTolerance);
  state.handlerFacing = dir;
  detectTurn(state, dir, events);
}

/** Puts the Distractor on a path across the route that meets a Dog walking at its Goal speed. */
function aimDistractor(state: SimState): void {
  const { config, distractor: d } = state;
  const cfg = config.distractor;
  if (cfg.path) return;
  const ahead = normalize(sub(config.waypoint, state.dog));
  const side = { x: -ahead.y, y: ahead.x };
  const crossing = add(state.dog, scale(ahead, config.dogGoalSpeed * (cfg.startOffset / cfg.speed)));
  d.from = add(crossing, scale(side, -cfg.startOffset));
  d.to = add(crossing, scale(side, cfg.startOffset));
  d.pos = { ...d.from };
}

function moveDistractor(state: SimState, dt: number): void {
  const cfg = state.config.distractor;
  const d = state.distractor;
  if (d.finished) return;
  if (!d.active) {
    if (distance(state.dog, state.config.dogStart) < cfg.activateAfterMeters) return;
    d.active = true;
    aimDistractor(state);
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
    ({ direction, speed } = state.drive.desire({ dog: state.dog, handler: state.handler, waypoint: config.waypoint, dt }));
  } else if (state.dogMode === 'fixated') {
    direction = normalize(sub(state.distractor.pos, state.dog));
    speed = config.dogFixationSpeed;
  } else if (state.dogMode === 'returning') {
    if (distance(state.dog, state.handler) <= config.dogReturnDistance) {
      state.dogMode = 'goal';
    } else {
      direction = normalize(sub(state.handler, state.dog));
      speed = config.dogReturnSpeed;
    }
  }
  if (speed === 0) return;

  let velocity = scale(direction, speed);
  const offset = sub(state.dog, state.handler);
  const dist = length(offset);
  if (dist / config.leashLength >= RIGID_MIN - RATIO_EPSILON) {
    // at the leash limit the Dog cannot advance farther away, it can only move sideways or back
    const out = normalize(offset);
    const outward = dot(velocity, out);
    if (outward > 0) velocity = sub(velocity, scale(out, outward));
  }
  const next = add(state.dog, scale(velocity, dt));
  state.dog = limitDistance(state.handler, state.dog, next, config.leashLength);
  if (length(velocity) > 0) state.dogFacing = normalize(velocity);
}

/** While the Dog follows its Drive it glances at the Handler at seeded moments. */
function updateCheckIn(state: SimState, events: SimEvent[]): void {
  const { config } = state;
  if (state.dogMode !== 'goal' || state.time < state.nextCheckInAt) return;
  state.dogLookUntil = Math.max(state.dogLookUntil, state.time + config.checkInWindow);
  state.nextCheckInAt = state.time + config.checkInMeanInterval * (0.5 + state.eventRng.next());
  events.push({ type: 'check-in-glance', time: state.time });
}

/** In Rigid Pull, a Handler who keeps moving drags the Dog toward them. */
function dragDog(state: SimState, input: SimInput, dt: number): void {
  const { config } = state;
  if (config.pullStrength === 0 || input.strength === 0) return;
  if (distance(state.handler, state.dog) / config.leashLength <= RIGID_MIN + RATIO_EPSILON) return;
  state.dog = add(state.dog, scale(normalize(sub(state.handler, state.dog)), config.pullStrength * dt));
}

function updateFixation(state: SimState, input: SimInput, dt: number, events: SimEvent[]): void {
  const { config, distractor } = state;

  if (state.dogMode === 'goal' && distractor.active && !distractor.consumed && !distractor.finished) {
    if (distance(state.dog, distractor.pos) <= config.distractor.triggerRadius) {
      state.dogMode = 'fixated';
      state.calmElapsed = 0;
      events.push({ type: 'fixation-start', time: state.time });
    }
  }
  if (state.dogMode !== 'fixated') return;

  const leftRange = distance(state.dog, distractor.pos) > config.distractor.triggerRadius || distractor.finished;
  const calm = input.strength === 0 && state.ratio <= RIGID_MIN + RATIO_EPSILON;
  state.calmElapsed = calm ? state.calmElapsed + dt : 0;

  if (state.calmElapsed >= config.calmSeconds) {
    distractor.consumed = true;
    state.dogMode = 'holding';
    state.rewardWindow = { openedAt: state.time, closesAt: state.time + config.rewardWindowSeconds };
    events.push({ type: 'disengagement', time: state.time });
  } else if (leftRange) {
    distractor.consumed = true;
    state.dogMode = 'goal';
    state.telemetry.missedOpportunities += 1;
    events.push({ type: 'missed-opportunity', time: state.time });
  }
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
    events.push({ type: 'marker-hit', time: state.time, accuracyMs });
  } else if (state.dogMode === 'fixated' || state.ratio > RIGID_MIN + RATIO_EPSILON) {
    state.telemetry.reactiveMarkers += 1;
    events.push({ type: 'marker-reactive', time: state.time });
  } else if (isDogLooking(state)) {
    state.telemetry.checkInHits += 1;
    events.push({ type: 'check-in-hit', time: state.time });
  } else {
    events.push({ type: 'marker-wasted', time: state.time });
  }
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
  moveHandler(state, input, dt, events);
  moveDistractor(state, dt);
  updateSteering(state, events);
  moveDog(state, dt);
  dragDog(state, input, dt);

  state.ratio = tensionRatio(state.handler, state.dog, state.config.leashLength);
  state.tension = classifyTension(state.ratio);

  updateCheckIn(state, events);
  updateFixation(state, input, dt, events);
  evaluateMarker(state, input, events);

  const t = state.telemetry;
  if (state.tension === 'slack') t.slackTime += dt;
  else if (state.tension === 'taut') t.tautTime += dt;
  else t.rigidTime += dt;

  checkEnd(state, events);
  return events;
}
