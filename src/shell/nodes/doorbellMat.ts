import { createRng } from '../../sim/rng';

/**
 * The Doorbell Mat Minigame: static, a timing exercise. The bell rings, the Dog gets excited and
 * then settles on its mat; the user presses Mark in the short window right after it settles.
 * Pressing while the Dog is still excited is too early, and the window can be missed.
 */
export const DOORBELL_MAT = {
  rounds: 3,
  /** Seconds from the start of a round to the bell, drawn between these bounds. */
  bellAfter: { min: 1.0, max: 2.2 },
  /** Seconds the Dog stays excited after the bell, drawn between these bounds. */
  excitedFor: { min: 1.6, max: 3.0 },
  /** Seconds the Dog stays calm for the user to mark; the Reward Window. */
  markWindow: 1.1,
} as const;

export type DoorbellPhase = 'waiting' | 'excited' | 'calm';
export type DoorbellOutcome = 'hit' | 'early' | 'late';

export interface DoorbellState {
  seed: number;
  round: number;
  t: number;
  phase: DoorbellPhase;
  /** Round timings, drawn when the round starts. */
  bellAt: number;
  calmAt: number;
  outcomes: DoorbellOutcome[];
  /** Marks pressed while the Dog was not calm. */
  earlyMarks: number;
  done: boolean;
}

function draw(seed: number, round: number): { bellAt: number; calmAt: number } {
  const rng = createRng(seed * 31 + round * 977);
  const { bellAfter, excitedFor } = DOORBELL_MAT;
  const bellAt = bellAfter.min + rng.next() * (bellAfter.max - bellAfter.min);
  return { bellAt, calmAt: bellAt + excitedFor.min + rng.next() * (excitedFor.max - excitedFor.min) };
}

export function newDoorbell(seed: number): DoorbellState {
  return { seed, round: 0, t: 0, phase: 'waiting', ...draw(seed, 0), outcomes: [], earlyMarks: 0, done: false };
}

function endRound(state: DoorbellState, outcome: DoorbellOutcome): DoorbellState {
  const outcomes = [...state.outcomes, outcome];
  const done = outcomes.length >= DOORBELL_MAT.rounds;
  const round = state.round + 1;
  return { ...state, outcomes, done, round, t: 0, phase: 'waiting', ...(done ? {} : draw(state.seed, round)) };
}

/** Advances by `dt` seconds; `marked` is a Mark press during this step. Pure. */
export function stepDoorbell(state: DoorbellState, dt: number, marked: boolean): DoorbellState {
  if (state.done) return state;
  const t = state.t + dt;
  const phase: DoorbellPhase = t < state.bellAt ? 'waiting' : t < state.calmAt ? 'excited' : 'calm';
  let next: DoorbellState = { ...state, t, phase };
  if (marked) {
    if (phase === 'calm') return endRound(next, 'hit');
    // a press before the Dog is calm rewards the wrong moment and ends the round
    next = { ...next, earlyMarks: next.earlyMarks + 1 };
    return endRound(next, 'early');
  }
  if (phase === 'calm' && t - state.calmAt >= DOORBELL_MAT.markWindow) return endRound(next, 'late');
  return next;
}

/** Metrics for the Debrief: the share of well-timed marks, and how little the user rushed. */
export function doorbellMetrics(state: DoorbellState): { timing: number; tension: number } {
  const total = Math.max(1, state.outcomes.length);
  return { timing: state.outcomes.filter((o) => o === 'hit').length / total, tension: 1 - Math.min(1, state.earlyMarks / total) };
}
