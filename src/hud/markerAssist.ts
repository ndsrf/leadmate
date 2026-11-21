/**
 * Timing assist model (GLOSSARY "Timing assist"):
 * How much help the Handler gets to time the Marker during a Stage:
 * Full, Ring only, Late ring or Off.
 *
 * Steps down after a run of Marker hits (ASSIST_STEP_DOWN_RUN = 3)
 * and back up after a run of misses or errors (ASSIST_STEP_UP_RUN = 2).
 * Runs reset on level change, including when clamped.
 */

import type { SimEvent } from '../sim/sim';

export type AssistLevel = 'full' | 'ring' | 'late' | 'off';

export interface AssistState {
  level: AssistLevel;
  successRun: number;
  failRun: number;
}

export const DEFAULT_ASSIST: AssistState = {
  level: 'full',
  successRun: 0,
  failRun: 0,
};

export const ASSIST_STEP_DOWN_RUN = 3;
export const ASSIST_STEP_UP_RUN = 2;

export type AssistOutcome = 'success' | 'failure' | 'neutral';

const STEP_DOWN_MAP: Record<AssistLevel, AssistLevel> = {
  full: 'ring',
  ring: 'late',
  late: 'off',
  off: 'off',
};

const STEP_UP_MAP: Record<AssistLevel, AssistLevel> = {
  off: 'late',
  late: 'ring',
  ring: 'full',
  full: 'full',
};

export function applyOutcome(state: AssistState, outcome: AssistOutcome): AssistState {
  if (outcome === 'neutral') {
    return { ...state };
  }

  if (outcome === 'success') {
    const nextRun = state.successRun + 1;
    if (nextRun >= ASSIST_STEP_DOWN_RUN) {
      return {
        level: STEP_DOWN_MAP[state.level],
        successRun: 0,
        failRun: 0,
      };
    }
    return {
      level: state.level,
      successRun: nextRun,
      failRun: 0,
    };
  }

  // outcome === 'failure'
  const nextRun = state.failRun + 1;
  if (nextRun >= ASSIST_STEP_UP_RUN) {
    return {
      level: STEP_UP_MAP[state.level],
      successRun: 0,
      failRun: 0,
    };
  }
  return {
    level: state.level,
    successRun: 0,
    failRun: nextRun,
  };
}

export interface EffectiveLevelOptions {
  alwaysFull?: boolean;
  guidedFirstStage?: boolean;
}

export function effectiveLevel(state: AssistState, options?: EffectiveLevelOptions): AssistLevel {
  if (options?.alwaysFull || options?.guidedFirstStage) {
    return 'full';
  }
  return state.level;
}

export interface AssistEventContext {
  markBudgetSpent?: boolean;
  marksUsed?: number;
  markBudget?: number;
  dogMode?: string;
  calmElapsed?: number;
}

export function assistOutcomeOf(
  event: SimEvent,
  ctx?: AssistEventContext
): AssistOutcome {
  switch (event.type) {
    case 'marker-hit':
    case 'check-in-hit':
      return 'success';
    // always paired with check-in-hit on one press: counting both would double the success
    case 'change-check-in':
      return 'neutral';
    case 'marker-miss': {
      const budgetSpent =
        Boolean(ctx?.markBudgetSpent) ||
        (ctx?.marksUsed !== undefined &&
          ctx?.markBudget !== undefined &&
          ctx.marksUsed >= ctx.markBudget);
      return budgetSpent ? 'neutral' : 'failure';
    }
    case 'marker-late':
      return 'failure';
    case 'marker-reactive': {
      const calmActive =
        ctx?.dogMode === 'fixated' && (ctx?.calmElapsed ?? 0) > 0;
      return calmActive ? 'failure' : 'neutral';
    }
    case 'missed-opportunity':
    case 'marker-wasted':
    default:
      return 'neutral';
  }
}


