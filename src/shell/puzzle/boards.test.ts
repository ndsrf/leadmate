import {
  BARKDOKU_BOARDS,
  getBoardById,
  getBoardsBySize,
  INTRO_BARKDOKU_BOARD,
  solveBoard,
} from './boards';
import { coordsEqual } from './types';
import { findConflicts } from './validator';

describe('Barkdoku Boards Catalog', () => {
  test('contains boards across all sizes 4x4 to 9x9', () => {
    for (let size = 4; size <= 9; size++) {
      const boards = getBoardsBySize(size);
      expect(boards.length).toBeGreaterThanOrEqual(1);
    }
  });

  test('every board has contiguous regions, valid dimensions, and a unique solution', () => {
    for (const board of BARKDOKU_BOARDS) {
      expect(board.size).toBeGreaterThanOrEqual(4);
      expect(board.size).toBeLessThanOrEqual(9);
      expect(board.regions.length).toBe(board.size);

      // Check each row length and region numbers
      const regionSet = new Set<number>();
      for (let r = 0; r < board.size; r++) {
        expect(board.regions[r].length).toBe(board.size);
        for (let c = 0; c < board.size; c++) {
          const reg = board.regions[r][c];
          expect(reg).toBeGreaterThanOrEqual(0);
          expect(reg).toBeLessThan(board.size);
          regionSet.add(reg);
        }
      }
      // Must contain all N regions
      expect(regionSet.size).toBe(board.size);

      // Contiguity check for each region
      for (let reg = 0; reg < board.size; reg++) {
        const cells: [number, number][] = [];
        for (let r = 0; r < board.size; r++) {
          for (let c = 0; c < board.size; c++) {
            if (board.regions[r][c] === reg) cells.push([r, c]);
          }
        }
        expect(cells.length).toBeGreaterThan(0);
        // BFS
        const visited = new Set<string>();
        const queue: [number, number][] = [cells[0]];
        visited.add(`${cells[0][0]},${cells[0][1]}`);
        while (queue.length > 0) {
          const [r, c] = queue.shift()!;
          const neighbors: [number, number][] = [
            [r - 1, c],
            [r + 1, c],
            [r, c - 1],
            [r, c + 1],
          ];
          for (const [nr, nc] of neighbors) {
            if (
              nr >= 0 &&
              nr < board.size &&
              nc >= 0 &&
              nc < board.size &&
              board.regions[nr][nc] === reg
            ) {
              const key = `${nr},${nc}`;
              if (!visited.has(key)) {
                visited.add(key);
                queue.push([nr, nc]);
              }
            }
          }
        }
        expect(visited.size).toBe(cells.length);
      }

      // Solution validation
      expect(board.solution.length).toBe(board.size);
      const conflicts = findConflicts(board, board.solution);
      expect(conflicts).toEqual([]);

      // Uniqueness proof via backtracking solver
      const solutions = solveBoard(board, 2);
      expect(solutions.length).toBe(1);

      // The unique solution must match board.solution
      const uniqueSol = solutions[0];
      for (let i = 0; i < board.size; i++) {
        expect(coordsEqual(uniqueSol[i], board.solution[i])).toBe(true);
      }
    }
  });

  test('getBoardById returns expected boards', () => {
    expect(getBoardById('barkdoku-4x4-1')).toBeDefined();
    expect(getBoardById('non-existent')).toBeUndefined();
  });

  test('INTRO_BARKDOKU_BOARD is defined and size 4 or 5', () => {
    expect(INTRO_BARKDOKU_BOARD).toBeDefined();
    expect(INTRO_BARKDOKU_BOARD.size).toBeLessThanOrEqual(5);
  });
});
