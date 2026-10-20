import type { ScenarioConfig } from '../../sim/config';
import type { SimulationDebriefPayload } from '../../sim/payload';
import type { TextKey } from '../../i18n';
import { applyActivity, applyStage, type CheckpointSeconds, type DogRecord } from '../dogRecord';

/** What a Debrief can say the user is weakest at; every exercise targets one of these. */
export type Metric = 'tension' | 'timing' | 'poste' | 'attention';

export interface CheckpointQuestion {
  question: TextKey;
  options: { text: TextKey; correct: boolean }[];
}

export interface NodeExercise {
  metric: Metric;
  key: TextKey;
}

export type MinigameKind = 'poste-hold' | 'harness-ritual' | 'doorbell-mat';

/** A Node as plain data (design decision 11); all text comes from the catalog. */
export interface NodeDef {
  id: string;
  title: TextKey;
  /** 'stage' is a walking Stage that updates the Dog; 'minigame' is static and never does. */
  mode: 'stage' | 'minigame';
  /** 3 to 5 short cards. */
  primerCards: TextKey[];
  checkpoint: CheckpointQuestion;
  /** For a Stage: scenario overrides. For a Minigame: which one to run. */
  simulation: { scenario?: Partial<ScenarioConfig>; minigame?: MinigameKind };
  exercises: NodeExercise[];
  prerequisites: string[];
}

export function missingPrerequisites(node: NodeDef, completed: readonly string[]): string[] {
  return node.prerequisites.filter((id) => !completed.includes(id));
}

export function isAvailable(node: NodeDef, completed: readonly string[]): boolean {
  return missingPrerequisites(node, completed).length === 0;
}

// -- results and the Debrief -------------------------------------------------------------------

export type NodeResult =
  | { kind: 'stage'; payload: SimulationDebriefPayload }
  | { kind: 'minigame'; metrics: Partial<Record<Metric, number>> };

/** How well the user did on each metric, 0 (worst) to 1; a metric the run gave no evidence for is absent. */
export function metricScores(result: NodeResult): Partial<Record<Metric, number>> {
  if (result.kind === 'minigame') return result.metrics;
  const p = result.payload;
  const encounters = p.markerHits + p.markerMisses + p.missedOpportunities;
  const scores: Partial<Record<Metric, number>> = {
    tension: 1 - p.pullPercentage / 100,
    attention: Math.min(1, p.checkInHits / 2),
  };
  if (encounters > 0) {
    scores.timing = p.markerHits / encounters;
    scores.poste = Math.min(1, p.posteSuccesses / encounters);
  }
  return scores;
}

/** The one exercise for the user's weakest metric among those the Node offers; ties go to the first listed. */
export function pickExercise(node: NodeDef, result: NodeResult): NodeExercise {
  const scores = metricScores(result);
  let best = node.exercises[0];
  let bestScore = Infinity;
  for (const exercise of node.exercises) {
    const score = scores[exercise.metric];
    if (score !== undefined && score < bestScore) {
      best = exercise;
      bestScore = score;
    }
  }
  return best;
}

// -- the four steps ---------------------------------------------------------------------------

export type NodeStep = 'primer' | 'checkpoint' | 'simulation' | 'debrief';
export const NODE_STEPS: readonly NodeStep[] = ['primer', 'checkpoint', 'simulation', 'debrief'];

export type CheckpointAnswer = 'correct' | 'wrong' | 'missed';

export interface NodeRun {
  node: NodeDef;
  step: NodeStep;
  /** Card shown in the Theory Primer. */
  card: number;
  /** Feedback for the Debrief only; it never blocks the simulation or touches the Dog. */
  checkpoint: CheckpointAnswer | null;
  result: NodeResult | null;
}

export type NodeAction =
  | { type: 'next' } // next Primer card
  | { type: 'answer'; option: number }
  | { type: 'timeout' }
  | { type: 'finish'; result: NodeResult };

export function startNode(node: NodeDef): NodeRun {
  return { node, step: 'primer', card: 0, checkpoint: null, result: null };
}

/**
 * The Node state machine: Primer, Checkpoint, Interactive Simulation, Debrief, in that order with
 * no skipping. An action that does not belong to the current step is ignored.
 */
export function advance(run: NodeRun, action: NodeAction): NodeRun {
  switch (run.step) {
    case 'primer':
      if (action.type !== 'next') return run;
      return run.card + 1 < run.node.primerCards.length
        ? { ...run, card: run.card + 1 }
        : { ...run, step: 'checkpoint' };
    case 'checkpoint':
      if (action.type === 'answer') {
        const option = run.node.checkpoint.options[action.option];
        if (!option) return run;
        return { ...run, step: 'simulation', checkpoint: option.correct ? 'correct' : 'wrong' };
      }
      if (action.type === 'timeout') return { ...run, step: 'simulation', checkpoint: 'missed' };
      return run;
    case 'simulation':
      if (action.type !== 'finish') return run;
      if (!resultMatchesMode(run.node, action.result)) return run;
      return { ...run, step: 'debrief', result: action.result };
    default:
      return run;
  }
}

function resultMatchesMode(node: NodeDef, result: NodeResult): boolean {
  return (node.mode === 'stage') === (result.kind === 'stage');
}

/** Seconds on the Checkpoint timer, or null when the timer is off. */
export function checkpointLimit(setting: CheckpointSeconds): number | null {
  return setting === 0 ? null : setting;
}

/**
 * The Dog record when a Node's Debrief is reached: the Node counts as completed even if the
 * technique failed, and only a Stage updates the Dog (a Minigame leaves it untouched).
 */
export function onDebrief(record: DogRecord, run: NodeRun, now: Date): DogRecord {
  if (run.step !== 'debrief' || !run.result) return record;
  const graded = run.node.mode === 'stage' && run.result.kind === 'stage' ? applyStage(record, run.result.payload, now) : record;
  const completedNodes = graded.completedNodes.includes(run.node.id) ? graded.completedNodes : [...graded.completedNodes, run.node.id];
  // reaching a Debrief makes today an active day for the Streak
  return applyActivity({ ...graded, completedNodes }, now);
}
