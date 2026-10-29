import { solveBoard } from './boards';
import { generateBoard, randomBoard } from './generator';
import { findConflicts } from './validator';

describe('Barkdoku board generator', () => {
  test.each([4, 5, 6, 7, 8])('generates %ix%i boards with exactly one solution', (size) => {
    for (let seed = 1; seed <= 10; seed++) {
      const board = generateBoard(size, seed * 7919);
      expect(board.id).toContain('-gen-');
      expect(board.size).toBe(size);
      expect(new Set(board.regions.flat()).size).toBe(size);
      expect(findConflicts(board, board.solution)).toEqual([]);
      const solutions = solveBoard(board, 2);
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(board.solution);
    }
  });

  test('is deterministic per seed and varies across seeds', () => {
    expect(generateBoard(6, 42)).toEqual(generateBoard(6, 42));
    const layouts = new Set(Array.from({ length: 10 }, (_, i) => JSON.stringify(generateBoard(6, i + 1).regions)));
    expect(layouts.size).toBeGreaterThan(5);
  });

  test('randomBoard stays within the requested sizes', () => {
    for (let seed = 0; seed < 20; seed++) {
      const { size } = randomBoard(5, 8, seed);
      expect(size).toBeGreaterThanOrEqual(5);
      expect(size).toBeLessThanOrEqual(8);
    }
  });
});
