import type { BarkdokuBoard, CellState } from './types';
import {
  areNeighbors,
  conflictsForPlacement,
  findConflicts,
  getDogCoords,
  isBoardSolved,
  isDogConflicted,
  isRegionSatisfied,
} from './validator';

describe('Barkdoku Ethological Validator', () => {
  // Simple 4x4 test board
  // Regions:
  // 0 0 1 1
  // 0 0 1 1
  // 2 2 3 3
  // 2 2 3 3
  // Valid solution for Queens on 4x4 requires no touching:
  // (0, 1), (1, 3), (2, 0), (3, 2)
  // Let's check:
  // row 0: (0, 1) - reg 0
  // row 1: (1, 3) - reg 1
  // row 2: (2, 0) - reg 2
  // row 3: (3, 2) - reg 3
  // cols: 1, 3, 0, 2 (all distinct)
  // touching: (0,1) vs (1,3): dr=1, dc=2 (no)
  // (1,3) vs (2,0): dr=1, dc=3 (no)
  // (2,0) vs (3,2): dr=1, dc=2 (no)
  // (0,1) vs (2,0): dr=2 (no)
  // (0,1) vs (3,2): dr=3 (no)
  // (1,3) vs (3,2): dr=2 (no)
  // Perfect 4x4 Star Battle / Barkdoku solution!
  const testBoard: BarkdokuBoard = {
    id: 'test-4x4',
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

  const emptyGrid = (): CellState[][] =>
    Array.from({ length: 4 }, () => Array.from({ length: 4 }, () => 'empty' as CellState));

  test('detects 8-neighbor adjacency correctly', () => {
    expect(areNeighbors({ row: 1, col: 1 }, { row: 1, col: 1 })).toBe(false); // same cell
    expect(areNeighbors({ row: 1, col: 1 }, { row: 1, col: 2 })).toBe(true); // orthogonal
    expect(areNeighbors({ row: 1, col: 1 }, { row: 0, col: 1 })).toBe(true); // orthogonal
    expect(areNeighbors({ row: 1, col: 1 }, { row: 0, col: 0 })).toBe(true); // diagonal
    expect(areNeighbors({ row: 1, col: 1 }, { row: 2, col: 2 })).toBe(true); // diagonal
    expect(areNeighbors({ row: 1, col: 1 }, { row: 1, col: 3 })).toBe(false); // distance 2
    expect(areNeighbors({ row: 1, col: 1 }, { row: 3, col: 1 })).toBe(false); // distance 2
  });

  test('empty board has no conflicts and is not solved', () => {
    const grid = emptyGrid();
    expect(getDogCoords(grid)).toEqual([]);
    expect(findConflicts(testBoard, [])).toEqual([]);
    expect(isBoardSolved(testBoard, grid)).toBe(false);
  });

  test('single dog has no conflicts and is not solved', () => {
    const grid = emptyGrid();
    grid[0][1] = 'dog';
    const dogs = getDogCoords(grid);
    expect(dogs).toEqual([{ row: 0, col: 1 }]);
    expect(findConflicts(testBoard, dogs)).toEqual([]);
    expect(isBoardSolved(testBoard, grid)).toBe(false);
  });

  test('detects line of sight row conflict', () => {
    const dogs = [
      { row: 0, col: 0 },
      { row: 0, col: 3 },
    ];
    const conflicts = findConflicts(testBoard, dogs);
    expect(conflicts.some((c) => c.type === 'line-of-sight' && c.axis === 'row' && c.index === 0)).toBe(true);
  });

  test('detects line of sight column conflict', () => {
    const dogs = [
      { row: 0, col: 1 },
      { row: 3, col: 1 },
    ];
    const conflicts = findConflicts(testBoard, dogs);
    expect(conflicts.some((c) => c.type === 'line-of-sight' && c.axis === 'col' && c.index === 1)).toBe(true);
  });

  test('detects territory region conflict', () => {
    // Both in region 0
    const dogs = [
      { row: 0, col: 0 },
      { row: 1, col: 1 },
    ];
    const conflicts = findConflicts(testBoard, dogs);
    expect(conflicts.some((c) => c.type === 'region' && c.index === 0)).toBe(true);
    // Also diagonal adjacency conflict
    expect(conflicts.some((c) => c.type === 'personal-space')).toBe(true);
  });

  test('detects personal space adjacency conflict (diagonal and orthogonal)', () => {
    // Diagonal across different regions:
    // (0, 1) is in region 0, (1, 2) is in region 1
    const dogs = [
      { row: 0, col: 1 },
      { row: 1, col: 2 },
    ];
    const conflicts = findConflicts(testBoard, dogs);
    expect(conflicts.some((c) => c.type === 'personal-space')).toBe(true);
    // Not line-of-sight and not region
    expect(conflicts.some((c) => c.type === 'line-of-sight')).toBe(false);
    expect(conflicts.some((c) => c.type === 'region')).toBe(false);
  });

  test('conflictsForPlacement checks conflicts against new dog', () => {
    const existing = [{ row: 0, col: 1 }];
    const conflicts = conflictsForPlacement(testBoard, existing, { row: 0, col: 3 });
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].type).toBe('line-of-sight');

    const safePlacement = conflictsForPlacement(testBoard, existing, { row: 1, col: 3 });
    expect(safePlacement).toEqual([]);
  });

  test('isDogConflicted identifies dogs in conflict', () => {
    const dogs = [
      { row: 0, col: 0 },
      { row: 0, col: 3 },
    ];
    const conflicts = findConflicts(testBoard, dogs);
    expect(isDogConflicted({ row: 0, col: 0 }, conflicts)).toBe(true);
    expect(isDogConflicted({ row: 0, col: 3 }, conflicts)).toBe(true);
    expect(isDogConflicted({ row: 2, col: 2 }, conflicts)).toBe(false);
  });

  test('isRegionSatisfied checks region fulfillment', () => {
    expect(isRegionSatisfied(testBoard, [], 0)).toBe(false);
    expect(isRegionSatisfied(testBoard, [{ row: 0, col: 1 }], 0)).toBe(true);
    expect(isRegionSatisfied(testBoard, [{ row: 0, col: 0 }, { row: 0, col: 1 }], 0)).toBe(false);
  });

  test('isBoardSolved returns true for valid solution', () => {
    const grid = emptyGrid();
    for (const coord of testBoard.solution) {
      grid[coord.row][coord.col] = 'dog';
    }
    expect(isBoardSolved(testBoard, grid)).toBe(true);
  });

  test('isBoardSolved returns false if fewer than N dogs placed', () => {
    const grid = emptyGrid();
    grid[0][1] = 'dog';
    grid[1][3] = 'dog';
    grid[2][0] = 'dog';
    // 3 dogs instead of 4
    expect(isBoardSolved(testBoard, grid)).toBe(false);
  });
});
