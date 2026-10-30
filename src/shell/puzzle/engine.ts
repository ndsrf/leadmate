import type { Stars } from '../stars';
import {
  type BarkdokuBoard,
  type BarkdokuMetrics,
  type BarkdokuState,
  type CellCoord,
  type CellState,
  type ConflictMarker,
  type PuzzleSummary,
} from './types';
import {
  conflictsForPlacement,
  findConflicts,
  getDogCoords,
  isBoardSolved,
} from './validator';

export const INITIAL_TREATS = 3;

export type PuzzleEvent =
  | 'shield_placed'
  | 'dog_placed'
  | 'dog_conflict'
  | 'cell_cleared'
  | 'solved'
  | 'failed'
  | 'ignored';

export interface StepResult {
  state: BarkdokuState;
  event: PuzzleEvent;
  newMistake: boolean;
  conflicts: ConflictMarker[];
}

/** Default Target Time by board size, in seconds. */
const TARGET_SECONDS_BY_SIZE: Readonly<Record<number, number>> = { 4: 60, 5: 120, 6: 180, 7: 240, 8: 360, 9: 480 };

/** The board's Target Time in seconds: none for a tutorial, else its own, else the size default. */
export function targetSecondsFor(board: BarkdokuBoard): number | undefined {
  if (board.difficulty === 'tutorial') return undefined;
  return board.targetSeconds ?? TARGET_SECONDS_BY_SIZE[board.size];
}

/** Seconds as `m:ss`. */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** A Solve Time against its Target Time, `m:ss / m:ss` with a ✓ when met; just `m:ss` without a target. */
export function solveTimeText(seconds: number, targetSeconds?: number): string {
  if (targetSeconds === undefined) return formatClock(seconds);
  return `${formatClock(seconds)} / ${formatClock(targetSeconds)}${seconds <= targetSeconds ? ' ✓' : ''}`;
}

/** Stars for a solve: 3 needs no mistakes within the Target Time, 1 mistake earns 2 and more 1. */
export function ratePuzzle(mistakes: number, withinTarget: boolean): Stars {
  if (mistakes === 0) return withinTarget ? 3 : 2;
  return mistakes === 1 ? 2 : 1;
}

/** Active play time of the attempt at `now`, in milliseconds. */
export function elapsedMs(state: BarkdokuState, now: number): number {
  return state.elapsedMs + (state.runningSince === null ? 0 : Math.max(0, now - state.runningSince));
}

/** Stops the clock (the app left the foreground), banking the time so far. */
export function pausePuzzle(state: BarkdokuState, now: number): BarkdokuState {
  if (state.runningSince === null) return state;
  return { ...state, elapsedMs: elapsedMs(state, now), runningSince: null };
}

/** Restarts a paused clock; before the first tap or once finished it stays stopped. */
export function resumePuzzle(state: BarkdokuState, now: number): BarkdokuState {
  if (!state.started || state.status !== 'playing' || state.runningSince !== null) return state;
  return { ...state, runningSince: now };
}

/** Initialize a fresh Barkdoku puzzle state; the clock waits for the first tap. */
export function createPuzzle(board: BarkdokuBoard): BarkdokuState {
  const grid: CellState[][] = Array.from({ length: board.size }, () =>
    Array.from({ length: board.size }, () => 'empty' as CellState),
  );

  return {
    board,
    grid,
    treats: INITIAL_TREATS,
    conflicts: [],
    status: 'playing',
    mistakes: 0,
    elapsedMs: 0,
    runningSince: null,
    started: false,
  };
}

/** Reset the active puzzle to an empty board while preserving the board definition; a new attempt. */
export function resetPuzzle(state: BarkdokuState): BarkdokuState {
  return createPuzzle(state.board);
}

/**
 * Handle a user tap on a grid cell following the 3-state cycle:
 * empty -> shield -> dog -> empty.
 *
 * Placing a dog in violation of an ethological rule deducts 1 treat life and marks a mistake.
 * Reaching 0 treats transitions to 'failed'.
 * Placing all N dogs without conflicts transitions to 'solved'.
 * The first accepted tap starts the clock; solving or failing stops it.
 */
export function toggleCell(prev: BarkdokuState, coord: CellCoord, now?: number): StepResult {
  const currentTime = now ?? Date.now();

  // If the game is already resolved or out of bounds, ignore input
  if (
    prev.status !== 'playing' ||
    coord.row < 0 ||
    coord.row >= prev.board.size ||
    coord.col < 0 ||
    coord.col >= prev.board.size
  ) {
    return { state: prev, event: 'ignored', newMistake: false, conflicts: prev.conflicts };
  }

  const state: BarkdokuState = prev.started ? prev : { ...prev, started: true, runningSince: currentTime };
  const stopClock = { elapsedMs: elapsedMs(state, currentTime), runningSince: null };

  const current = state.grid[coord.row][coord.col];
  const newGrid: CellState[][] = state.grid.map((row) => [...row]);

  if (current === 'empty') {
    // 1. Transition: empty -> shield (Visual Shield)
    newGrid[coord.row][coord.col] = 'shield';
    return {
      state: {
        ...state,
        grid: newGrid,
      },
      event: 'shield_placed',
      newMistake: false,
      conflicts: state.conflicts,
    };
  }

  if (current === 'shield') {
    // 2. Transition: shield -> dog
    newGrid[coord.row][coord.col] = 'dog';
    const existingDogs = getDogCoords(state.grid);
    const placementViolations = conflictsForPlacement(state.board, existingDogs, coord);
    const allDogs = getDogCoords(newGrid);
    const allConflicts = findConflicts(state.board, allDogs);

    if (placementViolations.length > 0) {
      const mistakes = state.mistakes + 1;
      const treats = Math.max(0, state.treats - 1);
      const isFailed = treats === 0;

      const nextState: BarkdokuState = {
        ...state,
        grid: newGrid,
        treats,
        mistakes,
        conflicts: allConflicts,
        status: isFailed ? 'failed' : 'playing',
        ...(isFailed ? stopClock : {}),
      };

      return {
        state: nextState,
        event: isFailed ? 'failed' : 'dog_conflict',
        newMistake: true,
        conflicts: allConflicts,
      };
    }

    // No conflict on placement: check if board is solved
    const solved = isBoardSolved(state.board, newGrid);
    const nextState: BarkdokuState = {
      ...state,
      grid: newGrid,
      conflicts: allConflicts,
      status: solved ? 'solved' : 'playing',
      ...(solved ? stopClock : {}),
    };

    return {
      state: nextState,
      event: solved ? 'solved' : 'dog_placed',
      newMistake: false,
      conflicts: allConflicts,
    };
  }

  // 3. Transition: dog -> empty
  newGrid[coord.row][coord.col] = 'empty';
  const remainingDogs = getDogCoords(newGrid);
  const recomputedConflicts = findConflicts(state.board, remainingDogs);

  return {
    state: {
      ...state,
      grid: newGrid,
      conflicts: recomputedConflicts,
    },
    event: 'cell_cleared',
    newMistake: false,
    conflicts: recomputedConflicts,
  };
}

/** Compute completion metrics and star ratings for debrief. */
export function computeMetrics(state: BarkdokuState, now?: number): BarkdokuMetrics {
  const solved = state.status === 'solved';
  const durationSeconds = Math.max(1, Math.round(elapsedMs(state, now ?? Date.now()) / 1000));
  const targetSeconds = targetSecondsFor(state.board);
  const withinTarget = targetSeconds === undefined || durationSeconds <= targetSeconds;

  return {
    solved,
    mistakes: state.mistakes,
    treatsLeft: state.treats,
    durationSeconds,
    ...(targetSeconds !== undefined ? { targetSeconds } : {}),
    withinTarget,
    stars: solved ? ratePuzzle(state.mistakes, withinTarget) : 1,
  };
}

/** A solved board as the Activity Log keeps it. */
export function puzzleSummary(board: BarkdokuBoard, metrics: BarkdokuMetrics): PuzzleSummary {
  return {
    size: board.size,
    ...(board.difficulty ? { difficulty: board.difficulty } : {}),
    durationSeconds: metrics.durationSeconds,
    ...(metrics.targetSeconds !== undefined ? { targetSeconds: metrics.targetSeconds } : {}),
    mistakes: metrics.mistakes,
  };
}
