import {
  type BarkdokuBoard,
  type CellCoord,
  type CellState,
  type ConflictMarker,
  containsCoord,
  coordsEqual,
} from './types';

/** Extract all coordinates where a dog is currently placed. */
export function getDogCoords(grid: CellState[][]): CellCoord[] {
  const dogs: CellCoord[] = [];
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      if (grid[r][c] === 'dog') {
        dogs.push({ row: r, col: c });
      }
    }
  }
  return dogs;
}

/** Check if two cells touch orthogonally or diagonally (8-neighbor adjacency). */
export function areNeighbors(a: CellCoord, b: CellCoord): boolean {
  if (coordsEqual(a, b)) return false;
  return Math.abs(a.row - b.row) <= 1 && Math.abs(a.col - b.col) <= 1;
}

/**
 * Validate all placed dogs against the 3 canine ethological rules:
 * 1. Line of Sight: At most 1 dog per row and per column (breaks direct eye-lock corridor).
 * 2. Personal Space / Reactivity Bubble: No two dogs in adjacent cells (including diagonals).
 * 3. Territory Station: At most 1 dog per colored region.
 */
export function findConflicts(board: BarkdokuBoard, dogs: readonly CellCoord[]): ConflictMarker[] {
  const conflicts: ConflictMarker[] = [];
  const size = board.size;

  // 1. Line of sight (Rows)
  for (let r = 0; r < size; r++) {
    const rowDogs = dogs.filter((d) => d.row === r);
    if (rowDogs.length > 1) {
      conflicts.push({
        type: 'line-of-sight',
        coords: rowDogs,
        index: r,
        axis: 'row',
      });
    }
  }

  // 2. Line of sight (Columns)
  for (let c = 0; c < size; c++) {
    const colDogs = dogs.filter((d) => d.col === c);
    if (colDogs.length > 1) {
      conflicts.push({
        type: 'line-of-sight',
        coords: colDogs,
        index: c,
        axis: 'col',
      });
    }
  }

  // 3. Territory Station (Regions)
  for (let reg = 0; reg < size; reg++) {
    const regDogs = dogs.filter((d) => board.regions[d.row]?.[d.col] === reg);
    if (regDogs.length > 1) {
      conflicts.push({
        type: 'region',
        coords: regDogs,
        index: reg,
      });
    }
  }

  // 4. Personal space / Reactivity bubble (8-neighbor adjacency)
  for (let i = 0; i < dogs.length; i++) {
    for (let j = i + 1; j < dogs.length; j++) {
      if (areNeighbors(dogs[i], dogs[j])) {
        conflicts.push({
          type: 'personal-space',
          coords: [dogs[i], dogs[j]],
        });
      }
    }
  }

  return conflicts;
}

/** Check if placing a dog at newDog creates any immediate conflicts with existing dogs. */
export function conflictsForPlacement(
  board: BarkdokuBoard,
  existingDogs: readonly CellCoord[],
  newDog: CellCoord,
): ConflictMarker[] {
  const combined = [...existingDogs.filter((d) => !coordsEqual(d, newDog)), newDog];
  const allConflicts = findConflicts(board, combined);
  return allConflicts.filter((c) => containsCoord(c.coords, newDog));
}

/** Check if a specific dog coordinate is involved in any active conflicts. */
export function isDogConflicted(coord: CellCoord, conflicts: readonly ConflictMarker[]): boolean {
  return conflicts.some((c) => containsCoord(c.coords, coord));
}

/** Check if a colored region is satisfied: it contains exactly 1 dog. */
export function isRegionSatisfied(
  board: BarkdokuBoard,
  dogs: readonly CellCoord[],
  regionId: number,
): boolean {
  const dogsInRegion = dogs.filter((d) => board.regions[d.row]?.[d.col] === regionId);
  return dogsInRegion.length === 1;
}

/**
 * Check if the board is completely and legally solved:
 * Board has exactly N placed dogs and 0 ethological conflicts.
 */
export function isBoardSolved(board: BarkdokuBoard, grid: CellState[][]): boolean {
  const dogs = getDogCoords(grid);
  if (dogs.length !== board.size) return false;
  const conflicts = findConflicts(board, dogs);
  return conflicts.length === 0;
}
