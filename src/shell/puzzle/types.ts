/**
 * Barkdoku Core Types.
 * Models canine territory, personal space (reactivity threshold), and line-of-sight constraints.
 */

/** Board coordinate (0-indexed row and column). */
export interface CellCoord {
  row: number;
  col: number;
}

/** 3-state cell toggle: empty, visual shield (exclusion 'X'), or calm placed dog. */
export type CellState = 'empty' | 'shield' | 'dog';

/** Default pastel Paper Meadow palette for terrain regions (ADR 0013). */
export const PAPER_MEADOW_PALETTE: readonly string[] = [
  '#82B57B', // meadow green
  '#DE8668', // terrace terracotta
  '#8FA8B8', // shade slate
  '#EAD5A0', // sand gravel
  '#C8A27A', // wood porch
  '#B0B4B8', // sidewalk grey
  '#E5A1BA', // flower pink
  '#A594D0', // park lilac
  '#E2BA5D', // orchard gold
];

/** Definition of a curated Barkdoku board. */
export interface BarkdokuBoard {
  id: string;
  name?: string;
  /** Size N where 4 <= N <= 9. Board is N x N with N distinct regions and N dogs in solution. */
  size: number;
  /** N x N grid of region indices (0 to N - 1). */
  regions: number[][];
  /** Solution dog coordinates (length N). */
  solution: CellCoord[];
  difficulty?: 'tutorial' | 'easy' | 'medium' | 'hard';
  /** Target Time in seconds; overrides the size default. Ignored on tutorial boards, which have none. */
  targetSeconds?: number;
}

/** Canine ethological conflict categories. */
export type ConflictType = 'line-of-sight' | 'personal-space' | 'region';

/** Marker detailing a specific ethological rule violation on the board. */
export interface ConflictMarker {
  type: ConflictType;
  /** Coordinates of the placed dogs involved in this conflict. */
  coords: CellCoord[];
  /** Row or column index, or region ID involved in the conflict. */
  index?: number;
  /** For line-of-sight conflicts, whether `index` is a row or a column. */
  axis?: 'row' | 'col';
}

/** Puzzle game outcome status. */
export type PuzzleStatus = 'playing' | 'solved' | 'failed';

/** State of an active Barkdoku puzzle session. */
export interface BarkdokuState {
  board: BarkdokuBoard;
  grid: CellState[][];
  treats: number; // 3 treat lives
  conflicts: ConflictMarker[];
  status: PuzzleStatus;
  mistakes: number;
  /** Active play time banked so far, excluding time with the app in the background. */
  elapsedMs: number;
  /** When the clock last (re)started; null before the first tap, while paused and once finished. */
  runningSince: number | null;
  /** The attempt has had its first tap, so the clock may run. */
  started: boolean;
}

/** Resulting debrief metrics upon puzzle completion. */
export interface BarkdokuMetrics {
  solved: boolean;
  mistakes: number;
  treatsLeft: number;
  /** The Solve Time, in whole seconds (at least 1). */
  durationSeconds: number;
  /** Absent on boards without a Target Time (tutorials). */
  targetSeconds?: number;
  /** Solved within the Target Time; true when the board has none. */
  withinTarget: boolean;
  stars: 1 | 2 | 3;
}

/** One solved board as the Activity Log keeps it. */
export interface PuzzleSummary {
  size: number;
  difficulty?: BarkdokuBoard['difficulty'];
  durationSeconds: number;
  targetSeconds?: number;
  mistakes: number;
}

/** Check if two coordinates are the same cell. */
export function coordsEqual(a: CellCoord, b: CellCoord): boolean {
  return a.row === b.row && a.col === b.col;
}

/** Check if a coordinate is in a list of coordinates. */
export function containsCoord(list: readonly CellCoord[], target: CellCoord): boolean {
  return list.some((c) => coordsEqual(c, target));
}
