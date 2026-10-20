import { revealAt, ROWS_MS, SCORE_MS, startReveal, STAR_LEAD_MS, STAR_MS, stepReveal, type RevealState } from './reveal';

const run = (state: RevealState, ms: number, step = 50) => {
  const events: number[] = [];
  const phases: string[] = [state.phase];
  for (let t = 0; t < ms; t += step) {
    const out = stepReveal(state, { type: 'tick', dtMs: step });
    state = out.state;
    events.push(...out.events.map((e) => e.n));
    if (phases[phases.length - 1] !== state.phase) phases.push(state.phase);
  }
  return { state, events, phases };
};

describe('reveal', () => {
  const target = { score: 870, stars: 3 as const };

  it('goes score, stars, rows, done in order', () => {
    const { phases, state } = run(startReveal(target, false), SCORE_MS + STAR_LEAD_MS + 3 * STAR_MS + ROWS_MS + 100);
    expect(phases).toEqual(['score', 'stars', 'rows', 'done']);
    expect(state.scoreShown).toBe(870);
    expect(state.starsShown).toBe(3);
  });

  it('counts the score up to the target and then shows stars one by one', () => {
    expect(revealAt(0, target).scoreShown).toBe(0);
    expect(revealAt(SCORE_MS / 2, target)).toMatchObject({ phase: 'score', scoreShown: 435, starsShown: 0 });
    expect(revealAt(SCORE_MS, target)).toMatchObject({ phase: 'stars', scoreShown: 870, starsShown: 0 });
    const first = SCORE_MS + STAR_LEAD_MS;
    expect(revealAt(first, target).starsShown).toBe(1);
    expect(revealAt(first + STAR_MS, target).starsShown).toBe(2);
    expect(revealAt(first + 2 * STAR_MS, target).starsShown).toBe(3);
  });

  it('reports each star exactly once, in order, for its sound and haptic', () => {
    const { events } = run(startReveal(target, false), 4000);
    expect(events).toEqual([1, 2, 3]);
  });

  it('shows only the stars earned', () => {
    const { events, state } = run(startReveal({ score: 400, stars: 1 }, false), 4000);
    expect(events).toEqual([1]);
    expect(state.starsShown).toBe(1);
  });

  it('skips on one press: final score, stars and rows at once, with no star sounds', () => {
    const mid = run(startReveal(target, false), 300).state;
    const out = stepReveal(mid, { type: 'skip' });
    expect(out.state).toMatchObject({ phase: 'done', scoreShown: 870, starsShown: 3 });
    expect(out.events).toEqual([]);
  });

  it('starts at done under reduced motion', () => {
    const s = startReveal(target, true);
    expect(s).toMatchObject({ phase: 'done', scoreShown: 870, starsShown: 3 });
    expect(stepReveal(s, { type: 'tick', dtMs: 100 }).events).toEqual([]);
  });

  it('skips the count-up for a Node without a score', () => {
    const s = startReveal({ score: undefined, stars: 1 }, false);
    expect(s.phase).toBe('stars');
    expect(s.starsShown).toBe(0);
    expect(s.scoreShown).toBeUndefined();
    expect(run(s, 3000).events).toEqual([1]);
  });

  it('ignores a negative tick', () => {
    const s = startReveal(target, false);
    expect(stepReveal(s, { type: 'tick', dtMs: -500 }).state.elapsed).toBe(0);
  });

  it('goes straight from the score to the rows when there are no stars (Daily Stage)', () => {
    const { phases, events } = run(startReveal({ score: 700, stars: 0 }, false), 4000);
    expect(phases).toEqual(['score', 'rows', 'done']);
    expect(events).toEqual([]);
  });
});
