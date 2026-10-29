import { createRng, type Rng } from '../../sim/rng';
import { BARKDOKU_BOARDS, solveBoard } from './boards';
import type { BarkdokuBoard, CellCoord } from './types';

const MAX_ATTEMPTS = 40;
const MAX_REPAIRS = 60;

const STEPS = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
] as const;

function randomInt(rng: Rng, max: number): number {
  return Math.floor(rng.next() * max);
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(rng, i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

/** A random placement of one dog per row and column with no two dogs touching. */
function randomPlacement(size: number, rng: Rng): number[] | null {
  const cols: number[] = [];
  const used = new Set<number>();
  function place(row: number): boolean {
    if (row === size) return true;
    for (const col of shuffle(rng, Array.from({ length: size }, (_, i) => i))) {
      if (used.has(col) || (row > 0 && Math.abs(cols[row - 1] - col) <= 1)) continue;
      cols.push(col);
      used.add(col);
      if (place(row + 1)) return true;
      cols.pop();
      used.delete(col);
    }
    return false;
  }
  return place(0) ? cols : null;
}

/** Grow one contiguous region from each dog by claiming random orthogonal neighbours. */
function growRegions(size: number, cols: readonly number[], rng: Rng): number[][] {
  const regions = Array.from({ length: size }, () => Array.from({ length: size }, () => -1));
  const ids = shuffle(rng, Array.from({ length: size }, (_, i) => i));
  cols.forEach((col, row) => {
    regions[row][col] = ids[row];
  });
  let unassigned = size * size - size;
  while (unassigned > 0) {
    const frontier: [number, number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (regions[r][c] !== -1) continue;
        for (const [dr, dc] of STEPS) {
          const reg = regions[r + dr]?.[c + dc];
          if (reg !== undefined && reg !== -1) frontier.push([r, c, reg]);
        }
      }
    }
    const [r, c, reg] = frontier[randomInt(rng, frontier.length)];
    regions[r][c] = reg;
    unassigned--;
  }
  return regions;
}

/** Whether `region` stays orthogonally connected once the cell at (row, col) leaves it. */
function staysContiguous(regions: number[][], region: number, row: number, col: number): boolean {
  const size = regions.length;
  const cells: [number, number][] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (regions[r][c] === region && (r !== row || c !== col)) cells.push([r, c]);
    }
  }
  const seen = new Set([`${cells[0][0]},${cells[0][1]}`]);
  const queue = [cells[0]];
  while (queue.length > 0) {
    const [r, c] = queue.pop()!;
    for (const [dr, dc] of STEPS) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;
      if ((nr !== row || nc !== col) && regions[nr]?.[nc] === region && !seen.has(key)) {
        seen.add(key);
        queue.push([nr, nc]);
      }
    }
  }
  return seen.size === cells.length;
}

/**
 * Break a competing solution by moving one of its dog cells into a neighbouring region,
 * preferring a region that already holds another of its dogs. Returns false if no cell can move.
 */
function breakSolution(board: BarkdokuBoard, other: readonly CellCoord[], rng: Rng): boolean {
  const { regions } = board;
  const owned = new Set(board.solution.map((d) => `${d.row},${d.col}`));
  const moves: { row: number; col: number; to: number; breaks: boolean }[] = [];
  for (const { row, col } of other) {
    if (owned.has(`${row},${col}`)) continue;
    const from = regions[row][col];
    if (!staysContiguous(regions, from, row, col)) continue;
    for (const [dr, dc] of STEPS) {
      const to = regions[row + dr]?.[col + dc];
      if (to === undefined || to === from) continue;
      const breaks = other.some((d) => regions[d.row][d.col] === to);
      moves.push({ row, col, to, breaks });
    }
  }
  if (moves.length === 0) return false;
  const breaking = moves.filter((m) => m.breaks);
  const pool = breaking.length > 0 ? breaking : moves;
  const move = pool[randomInt(rng, pool.length)];
  regions[move.row][move.col] = move.to;
  return true;
}

function difficultyFor(size: number): BarkdokuBoard['difficulty'] {
  if (size <= 4) return 'tutorial';
  if (size === 5) return 'easy';
  if (size <= 7) return 'medium';
  return 'hard';
}

/**
 * Generate a fresh Barkdoku board of the given size with exactly one solution.
 * Deterministic for a given seed; falls back to a curated board of that size if no unique board turns up.
 */
export function generateBoard(size: number, seed: number): BarkdokuBoard {
  const rng = createRng(seed);
  const names = BARKDOKU_BOARDS.map((b) => b.name).filter((n): n is string => !!n);
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const cols = randomPlacement(size, rng);
    if (!cols) break;
    const regions = growRegions(size, cols, rng);
    const solution: CellCoord[] = cols.map((col, row) => ({ row, col }));
    const board: BarkdokuBoard = {
      id: `barkdoku-${size}x${size}-gen-${seed >>> 0}`,
      name: names[randomInt(rng, names.length)],
      size,
      difficulty: difficultyFor(size),
      regions,
      solution,
    };
    for (let repair = 0; repair <= MAX_REPAIRS; repair++) {
      const solutions = solveBoard(board, 2);
      if (solutions.length === 1) return board;
      const other = solutions.find((sol) => sol.some((d, row) => d.col !== cols[row]));
      if (!other || !breakSolution(board, other, rng)) break;
    }
  }
  return BARKDOKU_BOARDS.find((b) => b.size === size) ?? BARKDOKU_BOARDS[0];
}

/** A fresh random board for each play, sized between `minSize` and `maxSize`. */
export function randomBoard(minSize: number, maxSize: number, seed: number): BarkdokuBoard {
  const size = minSize + (seed % (maxSize - minSize + 1));
  return generateBoard(size, seed);
}
