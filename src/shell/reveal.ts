import type { Stars } from './stars';

/** `score -> stars -> rows -> done`: the Node result is revealed step by step. */
export type RevealPhase = 'score' | 'stars' | 'rows' | 'done';

export const SCORE_MS = 900;
export const STAR_MS = 450;
export const ROWS_MS = 300;
/** Pause between the score settling and the first star, so every star (also with no score step) is announced by a tick. */
export const STAR_LEAD_MS = 200;

export interface RevealTarget {
  /** Handling score to count up to; absent for a Node without one (the count-up step is skipped). */
  score: number | undefined;
  /** Stars to show; 0 for a result with none (the Daily Stage), which skips the stars step. */
  stars: Stars | 0;
}

export interface RevealState {
  phase: RevealPhase;
  /** Milliseconds since the reveal started. */
  elapsed: number;
  scoreShown: number | undefined;
  starsShown: number;
  target: RevealTarget;
}

export type RevealEvent = { type: 'star'; n: number };

export type RevealAction = { type: 'tick'; dtMs: number } | { type: 'skip' };

const scoreMs = (target: RevealTarget) => (target.score === undefined ? 0 : SCORE_MS);
const starsMs = (target: RevealTarget) => (target.stars === 0 ? 0 : STAR_LEAD_MS + STAR_MS * target.stars);
const totalMs = (target: RevealTarget) => scoreMs(target) + starsMs(target) + ROWS_MS;

/** What is on screen `elapsed` ms into the reveal. */
export function revealAt(elapsed: number, target: RevealTarget): Omit<RevealState, 'elapsed' | 'target'> {
  const sMs = scoreMs(target);
  const firstStar = sMs + STAR_LEAD_MS;
  const starsEnd = sMs + starsMs(target);
  if (elapsed >= totalMs(target)) return { phase: 'done', scoreShown: target.score, starsShown: target.stars };
  if (elapsed < sMs) return { phase: 'score', scoreShown: Math.round((target.score ?? 0) * (elapsed / sMs)), starsShown: 0 };
  if (elapsed < starsEnd) return { phase: 'stars', scoreShown: target.score, starsShown: elapsed < firstStar ? 0 : Math.min(target.stars, Math.floor((elapsed - firstStar) / STAR_MS) + 1) };
  return { phase: 'rows', scoreShown: target.score, starsShown: target.stars };
}

/** Starts a reveal; under reduced motion it starts at `done` (the same information, shown at once). */
export function startReveal(target: RevealTarget, reduced: boolean): RevealState {
  return { elapsed: reduced ? totalMs(target) : 0, target, ...revealAt(reduced ? totalMs(target) : 0, target) };
}

/**
 * Advances the reveal. A tick moves time forward and reports each star as it appears (for its sound
 * and haptic); a skip, or any press, jumps to `done` without replaying them.
 */
export function stepReveal(state: RevealState, action: RevealAction): { state: RevealState; events: RevealEvent[] } {
  if (state.phase === 'done') return { state, events: [] };
  if (action.type === 'skip') {
    const elapsed = totalMs(state.target);
    return { state: { ...state, elapsed, ...revealAt(elapsed, state.target) }, events: [] };
  }
  const elapsed = state.elapsed + Math.max(0, action.dtMs);
  const next = { ...state, elapsed, ...revealAt(elapsed, state.target) };
  const events: RevealEvent[] = [];
  for (let n = state.starsShown + 1; n <= next.starsShown; n++) events.push({ type: 'star', n });
  return { state: next, events };
}
