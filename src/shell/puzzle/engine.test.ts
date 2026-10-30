import {
  createPuzzle,
  computeMetrics,
  elapsedMs,
  formatClock,
  pausePuzzle,
  puzzleSummary,
  ratePuzzle,
  resetPuzzle,
  resumePuzzle,
  solveTimeText,
  targetSecondsFor,
  toggleCell,
} from './engine';
import type { BarkdokuBoard, BarkdokuState } from './types';

describe('Barkdoku Puzzle Engine', () => {
  const board: BarkdokuBoard = {
    id: 'test-board',
    size: 4,
    regions: [
      [0, 0, 1, 1],
      [0, 0, 1, 1],
      [2, 2, 3, 3],
      [2, 2, 3, 3],
    ],
    solution: [
      { row: 0, col: 1 },
      { row: 1, col: 3 },
      { row: 2, col: 0 },
      { row: 3, col: 2 },
    ],
  };

  test('createPuzzle initializes clean state', () => {
    const state = createPuzzle(board);
    expect(state.board).toBe(board);
    expect(state.treats).toBe(3);
    expect(state.mistakes).toBe(0);
    expect(state.conflicts).toEqual([]);
    expect(state.status).toBe('playing');
    expect(state.elapsedMs).toBe(0);
    expect(state.runningSince).toBeNull();
    expect(state.started).toBe(false);
    expect(state.grid.length).toBe(4);
    expect(state.grid[0][0]).toBe('empty');
  });

  test('3-state tap cycle: empty -> shield -> dog -> empty', () => {
    let state = createPuzzle(board);
    const coord = { row: 0, col: 0 };

    // 1. empty -> shield
    const res1 = toggleCell(state, coord);
    expect(res1.event).toBe('shield_placed');
    expect(res1.state.grid[0][0]).toBe('shield');
    expect(res1.newMistake).toBe(false);
    state = res1.state;

    // 2. shield -> dog
    const res2 = toggleCell(state, coord);
    expect(res2.event).toBe('dog_placed');
    expect(res2.state.grid[0][0]).toBe('dog');
    expect(res2.newMistake).toBe(false);
    state = res2.state;

    // 3. dog -> empty
    const res3 = toggleCell(state, coord);
    expect(res3.event).toBe('cell_cleared');
    expect(res3.state.grid[0][0]).toBe('empty');
    expect(res3.newMistake).toBe(false);
  });

  test('placing a conflicting dog deducts treat and registers mistake', () => {
    let state = createPuzzle(board);

    // Place first dog at (0, 0)
    state = toggleCell(state, { row: 0, col: 0 }).state; // shield
    state = toggleCell(state, { row: 0, col: 0 }).state; // dog
    expect(state.treats).toBe(3);
    expect(state.mistakes).toBe(0);

    // Place second dog in same row at (0, 2)
    state = toggleCell(state, { row: 0, col: 2 }).state; // shield
    const conflictRes = toggleCell(state, { row: 0, col: 2 }); // dog (conflict!)
    expect(conflictRes.event).toBe('dog_conflict');
    expect(conflictRes.newMistake).toBe(true);
    expect(conflictRes.state.treats).toBe(2);
    expect(conflictRes.state.mistakes).toBe(1);
    expect(conflictRes.state.conflicts.length).toBeGreaterThan(0);
    expect(conflictRes.state.status).toBe('playing');

    // Removing one of the dogs clears the conflict
    const clearRes = toggleCell(conflictRes.state, { row: 0, col: 2 });
    expect(clearRes.event).toBe('cell_cleared');
    expect(clearRes.state.conflicts.length).toBe(0);
  });

  test('3 mistakes leads to game over (failed)', () => {
    let state = createPuzzle(board);

    // Place dog at (0, 0)
    state = toggleCell(state, { row: 0, col: 0 }).state;
    state = toggleCell(state, { row: 0, col: 0 }).state;

    // Mistake 1 at (0, 1) - row & region conflict
    state = toggleCell(state, { row: 0, col: 1 }).state;
    state = toggleCell(state, { row: 0, col: 1 }).state;
    expect(state.treats).toBe(2);
    expect(state.mistakes).toBe(1);

    // Mistake 2 at (0, 2) - row conflict
    state = toggleCell(state, { row: 0, col: 2 }).state;
    state = toggleCell(state, { row: 0, col: 2 }).state;
    expect(state.treats).toBe(1);
    expect(state.mistakes).toBe(2);

    // Mistake 3 at (0, 3) - row conflict -> failure!
    state = toggleCell(state, { row: 0, col: 3 }).state;
    const finalStep = toggleCell(state, { row: 0, col: 3 }, 5000);
    expect(finalStep.event).toBe('failed');
    expect(finalStep.state.treats).toBe(0);
    expect(finalStep.state.mistakes).toBe(3);
    expect(finalStep.state.status).toBe('failed');
    expect(finalStep.state.runningSince).toBeNull();

    // Subsequent taps are ignored
    const ignoredStep = toggleCell(finalStep.state, { row: 1, col: 1 });
    expect(ignoredStep.event).toBe('ignored');
  });

  test('solving the board sets solved status and calculates metrics', () => {
    let state = createPuzzle(board);

    // Place all 4 dogs from solution:
    // (0, 1), (1, 3), (2, 0), (3, 2); the first tap at 1000 starts the clock
    for (const coord of board.solution) {
      state = toggleCell(state, coord, 1000).state; // shield
      const res = toggleCell(state, coord, 6000); // dog
      state = res.state;
      if (coord.row === 3) {
        expect(res.event).toBe('solved');
      }
    }

    expect(state.status).toBe('solved');
    expect(state.runningSince).toBeNull();

    const metrics = computeMetrics(state, 60000);
    expect(metrics.solved).toBe(true);
    expect(metrics.mistakes).toBe(0);
    expect(metrics.treatsLeft).toBe(3);
    expect(metrics.durationSeconds).toBe(5);
    expect(metrics.targetSeconds).toBe(60);
    expect(metrics.withinTarget).toBe(true);
    expect(metrics.stars).toBe(3);
  });

  test('computeMetrics awards stars based on mistakes', () => {
    let state: BarkdokuState = { ...createPuzzle(board), status: 'solved', elapsedMs: 3000 };

    state.mistakes = 0;
    expect(computeMetrics(state).stars).toBe(3);

    state.mistakes = 1;
    expect(computeMetrics(state).stars).toBe(2);

    state.mistakes = 2;
    expect(computeMetrics(state).stars).toBe(1);

    state.status = 'failed';
    expect(computeMetrics(state).stars).toBe(1);
  });

  test('resetPuzzle restores original board to fresh state', () => {
    let state = createPuzzle(board);
    state = toggleCell(state, { row: 0, col: 0 }, 1000).state;
    const fresh = resetPuzzle(state);
    expect(fresh.grid[0][0]).toBe('empty');
    expect(fresh.treats).toBe(3);
    expect(fresh.mistakes).toBe(0);
    expect(elapsedMs(fresh, 9000)).toBe(0);
    expect(fresh.started).toBe(false);
  });

  describe('Solve Time', () => {
    test('the clock waits for the first tap', () => {
      const state = createPuzzle(board);
      expect(elapsedMs(state, 30000)).toBe(0);
      // a return to the foreground before any tap does not start it
      expect(elapsedMs(resumePuzzle(state, 1000), 30000)).toBe(0);
    });

    test('counts from the first tap', () => {
      const state = toggleCell(createPuzzle(board), { row: 0, col: 0 }, 1000).state;
      expect(elapsedMs(state, 76000)).toBe(75000);
      expect(formatClock(elapsedMs(state, 76000) / 1000)).toBe('1:15');
    });

    test('time in the background is not counted', () => {
      let state = toggleCell(createPuzzle(board), { row: 0, col: 0 }, 0).state;
      state = pausePuzzle(state, 10000);
      expect(elapsedMs(state, 310000)).toBe(10000);
      state = resumePuzzle(state, 310000);
      expect(elapsedMs(state, 315000)).toBe(15000);
    });

    test('later taps do not restart the clock', () => {
      let state = toggleCell(createPuzzle(board), { row: 0, col: 0 }, 1000).state;
      state = toggleCell(state, { row: 0, col: 0 }, 5000).state;
      expect(elapsedMs(state, 11000)).toBe(10000);
    });

    test('a finished board stops the clock and stays stopped', () => {
      let state = createPuzzle(board);
      for (const coord of board.solution) {
        state = toggleCell(state, coord, 0).state;
        state = toggleCell(state, coord, 20000).state;
      }
      expect(state.status).toBe('solved');
      expect(elapsedMs(state, 99000)).toBe(20000);
      expect(resumePuzzle(state, 99000)).toBe(state);
    });
  });

  describe('Target Time', () => {
    const sized = (size: number, extra: Partial<BarkdokuBoard> = {}): BarkdokuBoard => ({ ...board, size, ...extra });

    test('defaults by size', () => {
      expect([4, 5, 6, 7, 8, 9].map((n) => targetSecondsFor(sized(n)))).toEqual([60, 120, 180, 240, 360, 480]);
    });

    test("a board's own target wins", () => {
      expect(targetSecondsFor(sized(6, { targetSeconds: 150 }))).toBe(150);
    });

    test('tutorial boards have none', () => {
      expect(targetSecondsFor(sized(4, { difficulty: 'tutorial', targetSeconds: 30 }))).toBeUndefined();
    });

    test('solveTimeText', () => {
      expect(solveTimeText(102, 120)).toBe('1:42 / 2:00 ✓');
      expect(solveTimeText(150, 120)).toBe('2:30 / 2:00');
      expect(solveTimeText(150)).toBe('2:30');
    });

    test('formatClock', () => {
      expect(formatClock(0)).toBe('0:00');
      expect(formatClock(75)).toBe('1:15');
      expect(formatClock(480)).toBe('8:00');
    });
  });

  describe('rating', () => {
    const solvedIn = (b: BarkdokuBoard, seconds: number, mistakes: number): BarkdokuState => ({
      ...createPuzzle(b),
      status: 'solved',
      elapsedMs: seconds * 1000,
      mistakes,
    });
    const five: BarkdokuBoard = { ...board, size: 5, difficulty: 'easy' };

    test('clean and fast earns 3', () => {
      expect(computeMetrics(solvedIn(five, 100, 0))).toMatchObject({ withinTarget: true, targetSeconds: 120, stars: 3 });
    });

    test('clean but slow earns 2', () => {
      expect(computeMetrics(solvedIn(five, 150, 0))).toMatchObject({ withinTarget: false, stars: 2 });
    });

    test('mistakes outweigh time', () => {
      expect(computeMetrics(solvedIn(five, 60, 2)).stars).toBe(1);
      expect(computeMetrics(solvedIn(five, 150, 1)).stars).toBe(2);
    });

    test('a tutorial board is rated by mistakes only', () => {
      const m = computeMetrics(solvedIn({ ...board, difficulty: 'tutorial' }, 600, 0));
      expect(m.targetSeconds).toBeUndefined();
      expect(m).toMatchObject({ withinTarget: true, stars: 3 });
    });

    test('ratePuzzle', () => {
      expect([ratePuzzle(0, true), ratePuzzle(0, false), ratePuzzle(1, true), ratePuzzle(1, false), ratePuzzle(2, true)]).toEqual([3, 2, 2, 2, 1]);
    });
  });

  test('puzzleSummary keeps size, difficulty, times and mistakes', () => {
    const five: BarkdokuBoard = { ...board, size: 5, difficulty: 'easy' };
    const state: BarkdokuState = { ...createPuzzle(five), status: 'solved', elapsedMs: 102000, mistakes: 1 };
    expect(puzzleSummary(five, computeMetrics(state))).toEqual({ size: 5, difficulty: 'easy', durationSeconds: 102, targetSeconds: 120, mistakes: 1 });
    expect(puzzleSummary(board, computeMetrics({ ...createPuzzle(board), status: 'solved', elapsedMs: 9000 }))).toEqual({ size: 4, durationSeconds: 9, targetSeconds: 60, mistakes: 0 });
  });
});
