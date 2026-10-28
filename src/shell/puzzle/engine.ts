import type { Stars } from '../stars';
import {
  type BarkdokuBoard,
  type BarkdokuMetrics,
  type BarkdokuState,
  type CellCoord,
  type CellState,
  type ConflictMarker,
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

/** Initialize a fresh Barkdoku puzzle state. */
export function createPuzzle(board: BarkdokuBoard, startTime?: number): BarkdokuState {
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
    startTime: startTime ?? Date.now(),
  };
}

/** Reset the active puzzle to an empty board while preserving the board definition. */
export function resetPuzzle(state: BarkdokuState, now?: number): BarkdokuState {
  return createPuzzle(state.board, now);
}

/**
 * Handle a user tap on a grid cell following the 3-state cycle:
 * empty -> shield -> dog -> empty.
 *
 * Placing a dog in violation of an ethological rule deducts 1 treat life and marks a mistake.
 * Reaching 0 treats transitions to 'failed'.
 * Placing all N dogs without conflicts transitions to 'solved'.
 */
export function toggleCell(state: BarkdokuState, coord: CellCoord, now?: number): StepResult {
  const currentTime = now ?? Date.now();

  // If the game is already resolved or out of bounds, ignore input
  if (
    state.status !== 'playing' ||
    coord.row < 0 ||
    coord.row >= state.board.size ||
    coord.col < 0 ||
    coord.col >= state.board.size
  ) {
    return { state, event: 'ignored', newMistake: false, conflicts: state.conflicts };
  }

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
        endTime: isFailed ? currentTime : undefined,
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
      endTime: solved ? currentTime : undefined,
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
  const durationSeconds = Math.max(
    1,
    Math.round(((state.endTime ?? now ?? Date.now()) - state.startTime) / 1000),
  );

  let stars: Stars = 1;
  if (solved) {
    if (state.mistakes === 0) {
      stars = 3;
    } else if (state.mistakes === 1) {
      stars = 2;
    } else {
      stars = 1;
    }
  }

  return {
    solved,
    mistakes: state.mistakes,
    treatsLeft: state.treats,
    durationSeconds,
    stars,
  };
}
