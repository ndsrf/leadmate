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
export function tensionOf(state: PosteMinigameState): number {
  const strain = Math.min(1, state.t / POSTE_MINIGAME.strainSeconds);
  return Math.max(0, strain * (1 - Math.min(1, state.held / POSTE_MINIGAME.holdToSettle)));
}

function endRound(state: PosteMinigameState, outcome: RoundOutcome): PosteMinigameState {
  const outcomes = [...state.outcomes, outcome];
  const done = outcomes.length >= POSTE_MINIGAME.rounds;
  return { ...state, outcomes, round: state.round + 1, t: 0, held: 0, done };
}

/** Advances by `dt` seconds with the Stop button `holding` or not. Pure. */
export function stepPosteMinigame(state: PosteMinigameState, dt: number, holding: boolean): PosteMinigameState {
  if (state.done) return state;
  const strain = Math.min(1, (state.t + dt) / POSTE_MINIGAME.strainSeconds);
  let next: PosteMinigameState = {
    ...state,
    t: state.t + dt,
    totalSeconds: state.totalSeconds + dt,
    rigidSeconds: state.rigidSeconds + (!holding && strain >= 1 ? dt : 0),
  };
  if (holding) {
    next = { ...next, held: next.held + dt };
    if (next.held >= POSTE_MINIGAME.holdToSettle) return endRound(next, 'settled');
  } else if (state.held > 0) {
    return endRound(next, 'released');
  } else if (next.t >= POSTE_MINIGAME.roundSeconds) {
    return endRound(next, 'too-late');
  }
  return next;
}

/** Metrics for the Debrief: how often the Poste settled the Dog, and how little the leash stayed rigid. */
export function posteMinigameMetrics(state: PosteMinigameState): { poste: number; tension: number } {
  const settled = state.outcomes.filter((o) => o === 'settled').length;
  const total = Math.max(1, state.totalSeconds);
  return { poste: settled / Math.max(1, state.outcomes.length), tension: 1 - Math.min(1, state.rigidSeconds / total) };
}
