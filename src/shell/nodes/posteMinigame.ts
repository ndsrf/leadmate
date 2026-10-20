/**
 * The Poste practice Minigame: static, no walking. The Dog strains at the leash and the user holds
 * the Stop button until the Dog settles; letting go early, or never holding, fails the round.
 */
export const POSTE_MINIGAME = {
  rounds: 3,
  /** Seconds for the leash to go from slack to rigid if nobody holds. */
  strainSeconds: 3,
  /** Seconds of holding that settle the Dog. */
  holdToSettle: 2,
  /** A round the user never settles ends after this long. */
  roundSeconds: 6,
} as const;

export interface HoldMinigameConfig {
  rounds: number;
  strainSeconds: number;
  holdToSettle: number;
  roundSeconds: number;
}

/** The Harness Ritual: the same hold-to-settle exercise, slower, with the Dog excited at the door. */
export const HARNESS_RITUAL: HoldMinigameConfig = { rounds: 3, strainSeconds: 2.5, holdToSettle: 2.5, roundSeconds: 7 };

export type RoundOutcome = 'settled' | 'released' | 'too-late';

export interface PosteMinigameState {
  round: number;
  /** Seconds into the current round. */
  t: number;
  held: number;
  outcomes: RoundOutcome[];
  /** Seconds the leash was rigid with the user not holding. */
  rigidSeconds: number;
  totalSeconds: number;
  done: boolean;
}

export function newPosteMinigame(): PosteMinigameState {
  return { round: 0, t: 0, held: 0, outcomes: [], rigidSeconds: 0, totalSeconds: 0, done: false };
}

/** Leash tension, 0 to 1, as shown to the user. Holding relaxes it. */
export function tensionOf(state: PosteMinigameState, cfg: HoldMinigameConfig = POSTE_MINIGAME): number {
  const strain = Math.min(1, state.t / cfg.strainSeconds);
  return Math.max(0, strain * (1 - Math.min(1, state.held / cfg.holdToSettle)));
}

function endRound(state: PosteMinigameState, outcome: RoundOutcome, cfg: HoldMinigameConfig): PosteMinigameState {
  const outcomes = [...state.outcomes, outcome];
  const done = outcomes.length >= cfg.rounds;
  return { ...state, outcomes, round: state.round + 1, t: 0, held: 0, done };
}

/** Advances by `dt` seconds with the Stop button `holding` or not. Pure. */
export function stepPosteMinigame(state: PosteMinigameState, dt: number, holding: boolean, cfg: HoldMinigameConfig = POSTE_MINIGAME): PosteMinigameState {
  if (state.done) return state;
  const strain = Math.min(1, (state.t + dt) / cfg.strainSeconds);
  let next: PosteMinigameState = {
    ...state,
    t: state.t + dt,
    totalSeconds: state.totalSeconds + dt,
    rigidSeconds: state.rigidSeconds + (!holding && strain >= 1 ? dt : 0),
  };
  if (holding) {
    next = { ...next, held: next.held + dt };
    if (next.held >= cfg.holdToSettle) return endRound(next, 'settled', cfg);
  } else if (state.held > 0) {
    return endRound(next, 'released', cfg);
  } else if (next.t >= cfg.roundSeconds) {
    return endRound(next, 'too-late', cfg);
  }
  return next;
}

/** Metrics for the Debrief: how often the Poste settled the Dog, and how little the leash stayed rigid. */
export function posteMinigameMetrics(state: PosteMinigameState): { poste: number; tension: number } {
  const settled = state.outcomes.filter((o) => o === 'settled').length;
  const total = Math.max(1, state.totalSeconds);
  return { poste: settled / Math.max(1, state.outcomes.length), tension: 1 - Math.min(1, state.rigidSeconds / total) };
}
