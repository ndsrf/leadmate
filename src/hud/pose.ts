import { isDogLooking, type ReactionTier, type SimState } from '../sim/sim';
import { length } from '../sim/vec';

export type Gaze = 'handler' | 'away-left' | 'away-right' | 'distractor' | 'ground' | 'ahead';
export type Head = 'up' | 'level' | 'down';
export type Ears = 'forward' | 'neutral' | 'back';
export type Tail = 'high' | 'wagging' | 'neutral' | 'tucked';
export type DogAction = 'idle' | 'walk' | 'trot' | 'sniff-walk' | 'sniff' | 'planted' | 'marking' | 'lunging';
/** Walking-sprite clip names (the baked tail mood lives in the clip). */
export type WalkClip = 'idle' | 'walk' | 'walk_wag' | 'trot' | 'sniffwalk' | 'sniff' | 'planted' | 'mark' | 'lunge' | 'look_l' | 'look_r';

/** Radians between the Dog's facing and what it attends to before the gaze reads as away. */
const AWAY_ANGLE = 0.45;

/** What the Dog and Handler look like right now; derived from the simulation, drawn by the bundle. */
export interface DogPose {
  tier: ReactionTier;
  /** Head and ears raised (Alert and Reactive). */
  headUp: boolean;
  /** Head lowered to the ground (Go Sniff). */
  headDown: boolean;
  /** Barking: mouth open with sound marks (Reactive). */
  barking: boolean;
  /** The Dog leans into a lunge (Reactive and fixated). */
  lunging: boolean;
  /** Energetic, rhythmic trotting gait (Sintonía). */
  trotting: boolean;
  /** Green flow glow around the Dog and Handler (Sintonía). */
  flowGlow: boolean;
  gaze: Gaze;
  head: Head;
  ears: Ears;
  tail: Tail;
  action: DogAction;
}

/** Away left is counter-clockwise from the Dog's facing in simulation coordinates (y up the page of the sim). */
function gazeOf(state: SimState): Gaze {
  const mode = state.dogMode;
  // a Plant is sniffing in place
  if (mode === 'sniffing' || mode === 'planted') return 'ground';
  if (mode === 'fixated') return 'distractor';
  if (isDogLooking(state)) return 'handler';
  const want = state.dogDesired;
  if (length(want) > 0) {
    const f = state.dogFacing;
    const cross = f.x * want.y - f.y * want.x;
    const dot = f.x * want.x + f.y * want.y;
    const angle = Math.atan2(cross, dot);
    if (Math.abs(angle) > AWAY_ANGLE) return angle > 0 ? 'away-left' : 'away-right';
  }
  return 'ahead';
}

function actionOf(state: SimState): DogAction {
  const mode = state.dogMode;
  if (mode === 'planted') return 'planted';
  if (mode === 'marking') return 'marking';
  const moving = length(state.dogDesired) > 0;
  if (mode === 'sniffing') return moving ? 'sniff-walk' : 'sniff';
  if (state.tier === 'reactive' && mode === 'fixated') return 'lunging';
  if (!moving) return 'idle';
  return state.sintonia.active ? 'trot' : 'walk';
}

/** The walking-sprite clip for a pose; the portrait reads the same pose, so the two agree. */
export function walkClipFor(pose: Pick<DogPose, 'action' | 'gaze' | 'tail'>): WalkClip {
  switch (pose.action) {
    case 'lunging': return 'lunge';
    case 'planted': return 'planted';
    case 'marking': return 'mark';
    case 'sniff': return 'sniff';
    case 'sniff-walk': return 'sniffwalk';
    case 'trot': return 'trot';
    case 'walk':
      if (pose.gaze === 'away-left') return 'look_l';
      if (pose.gaze === 'away-right') return 'look_r';
      return pose.tail === 'wagging' ? 'walk_wag' : 'walk';
    default:
      if (pose.gaze === 'away-left') return 'look_l';
      if (pose.gaze === 'away-right') return 'look_r';
      return 'idle';
  }
}

export function dogPose(state: SimState): DogPose {
  const sniffing = state.dogMode === 'sniffing' || state.dogMode === 'planted';
  const reactive = state.tier === 'reactive';
  const gaze = gazeOf(state);
  const fixated = state.dogMode === 'fixated';
  const checkIn = isDogLooking(state) && gaze === 'handler';
  const head: Head = sniffing ? 'down' : state.tier !== 'calm' ? 'up' : 'level';
  let ears: Ears = 'neutral';
  if (state.tension === 'rigid' && !fixated) ears = 'back';
  else if (checkIn || fixated || state.tier !== 'calm') ears = 'forward';
  let tail: Tail = 'neutral';
  if (checkIn) tail = 'wagging';
  else if (sniffing) tail = 'neutral';
  else if (state.tier !== 'calm') tail = 'high';
  return {
    gaze, head, ears, tail, action: actionOf(state),
    tier: state.tier,
    headUp: !sniffing && state.tier !== 'calm',
    headDown: sniffing,
    barking: reactive,
    lunging: reactive && state.dogMode === 'fixated',
    trotting: state.sintonia.active,
    flowGlow: state.sintonia.active,
  };
}

/** Seconds per step of the Dog's gait: a brisk trot in Sintonía, a walk otherwise. */
export function gaitPeriod(pose: Pick<DogPose, 'trotting'>): number {
  return pose.trotting ? 0.28 : 0.5;
}

/** Seconds a vocalization of a tier lasts at most before the shell may repeat it. */
export const VOCALIZATION_COOLDOWN_SECONDS = 2.0;
