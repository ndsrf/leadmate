import {
  createPuzzle,
  computeMetrics,
  resetPuzzle,
  toggleCell,
} from './engine';
import type { BarkdokuBoard } from './types';

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
    const state = createPuzzle(board, 1000);
    expect(state.board).toBe(board);
    expect(state.treats).toBe(3);
    expect(state.mistakes).toBe(0);
    expect(state.conflicts).toEqual([]);
    expect(state.status).toBe('playing');
    expect(state.startTime).toBe(1000);
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
    expect(finalStep.state.endTime).toBe(5000);

    // Subsequent taps are ignored
    const ignoredStep = toggleCell(finalStep.state, { row: 1, col: 1 });
    expect(ignoredStep.event).toBe('ignored');
  });

  test('solving the board sets solved status and calculates metrics', () => {
    let state = createPuzzle(board, 1000);

    // Place all 4 dogs from solution:
    // (0, 1), (1, 3), (2, 0), (3, 2)
    for (const coord of board.solution) {
      state = toggleCell(state, coord).state; // shield
      const res = toggleCell(state, coord, 6000); // dog
      state = res.state;
      if (coord.row === 3) {
        expect(res.event).toBe('solved');
      }
    }

    expect(state.status).toBe('solved');
    expect(state.endTime).toBe(6000);

    const metrics = computeMetrics(state, 6000);
    expect(metrics.solved).toBe(true);
    expect(metrics.mistakes).toBe(0);
    expect(metrics.treatsLeft).toBe(3);
    expect(metrics.durationSeconds).toBe(5);
    expect(metrics.stars).toBe(3);
  });

  test('computeMetrics awards stars based on mistakes', () => {
    let state = createPuzzle(board, 1000);
    state.status = 'solved';
    state.endTime = 4000;

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
    state = toggleCell(state, { row: 0, col: 0 }).state;
    const fresh = resetPuzzle(state, 2000);
    expect(fresh.grid[0][0]).toBe('empty');
    expect(fresh.treats).toBe(3);
    expect(fresh.mistakes).toBe(0);
    expect(fresh.startTime).toBe(2000);
  });
});
