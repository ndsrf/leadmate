import type { ReactionTier, SimState } from '../sim/sim';

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
}

export function dogPose(state: SimState): DogPose {
  const sniffing = state.dogMode === 'sniffing';
  const reactive = state.tier === 'reactive';
  return {
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
