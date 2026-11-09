import type { ScenarioConfig } from '../../sim/config';
import type { CloseExerciseConfig } from '../../sim/closeExercise';
import type { SimulationDebriefPayload } from '../../sim/payload';
import type { TextKey } from '../../i18n';
import { activityAt, addActivity, stageSummary } from '../activity';
import { bestStars, starsFor } from '../stars';
import { applyActivity, applyStage, updateMission, type CheckpointSeconds, type DogRecord } from '../dogRecord';
import { missionOfStop } from '../world';
import type { PuzzleSummary } from '../puzzle/types';

/** What a Debrief can say the user is weakest at; every exercise targets one of these. */
export type Metric = 'tension' | 'timing' | 'poste' | 'attention';

export interface CheckpointQuestion {
  question: TextKey;
  options: { text: TextKey; correct: boolean }[];
  /** One sentence the Debrief shows with the right answer when the question was missed. */
  explanation: TextKey;
}

export interface NodeExercise {
  metric: Metric;
  key: TextKey;
}

/**
 * A media attachment of a Primer card: bundled Lesson art by name (`art`), or an external `url`; an unknown name, an
 * empty `url` or `placeholder` shows the themed placeholder.
 */
export interface NodeMedia {
  type: 'image' | 'video';
  url: string;
  art?: string;
  caption: TextKey;
  placeholder?: boolean;
}

/** Whether a Primer card teaches the real dog or the virtual one. */
export type PrimerKind = 'real-world' | 'virtual-dog';

export interface PrimerCardDef {
  kind: PrimerKind;
  text: TextKey;
  media?: NodeMedia;
  /** A web-hosted full guide, opened in the in-app browser. */
  tutorialUrl?: string;
}

/** A Primer card: a plain text key (legacy, real-world) or a structured card. */
export type PrimerCard = TextKey | PrimerCardDef;

export function primerCardOf(card: PrimerCard): PrimerCardDef {
  return typeof card === 'string' ? { kind: 'real-world', text: card } : card;
}

export type MinigameKind = 'poste-hold' | 'harness-ritual' | 'doorbell-mat' | 'barkdoku' | 'dog-as-dog' | 'home-rest' | 'calm-first' | 'bark-home' | 'destroy' | 'eat-objects' | 'alone';

/** A Node as plain data (design decision 11); all text comes from the catalog. */
export interface NodeDef {
  id: string;
  title: TextKey;
  /** 'stage' is a walking Stage; 'close_exercise' is a close 2D isometric stage; 'minigame' is static. */
  mode: 'stage' | 'minigame' | 'close_exercise';
  /** 3 to 5 short cards; real-world dog theory first, then the virtual dog's mechanics. */
  primerCards: PrimerCard[];
  /** Asked one at a time; three on a trail Node, one on the introductory Node. */
  checkpoint: CheckpointQuestion[];
  /** For a Stage: scenario overrides. For a close exercise: closeScenario. For a Minigame: which one to run. */
  simulation: {
    scenario?: Partial<ScenarioConfig>;
    closeScenario?: Partial<CloseExerciseConfig>;
    minigame?: MinigameKind;
  };
  exercises: NodeExercise[];
  prerequisites: string[];
  /** A close-view Node that needs only this Lesson of its Stretch read (the how-to-play Lesson), not every Lesson before it. */
  opensAfterLesson?: string;
  /** What the Debrief says about a hand drill: the Dog settled, or the time ran out first (never a failure). */
  debrief?: { calm: TextKey; notCalm: TextKey };
  recommendations?: Array<{
    id: string;
    target: string;
    targetKind: 'category' | 'subcategory' | 'product';
    when: string;
    explanation: TextKey;
  }>;
}

export function missingPrerequisites(node: NodeDef, completed: readonly string[]): string[] {
  return node.prerequisites.filter((id) => !completed.includes(id));
}

export function isAvailable(node: NodeDef, completed: readonly string[]): boolean {
  return missingPrerequisites(node, completed).length === 0;
}

// -- results and the Debrief -------------------------------------------------------------------

export type NodeResult =
  | { kind: 'stage'; payload: SimulationDebriefPayload; skipped?: boolean }
  | { kind: 'close_exercise'; payload: SimulationDebriefPayload; skipped?: boolean }
  /** `handlingScore` (0-1000) is set by an action Minigame, which earns 1 to 3 stars from it; the Poste practice has none. A Barkdoku adds its solved board. */
  | { kind: 'minigame'; metrics: Partial<Record<Metric, number>>; handlingScore?: number; puzzle?: PuzzleSummary };

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
  /** Checkpoint question shown. */
  question: number;
  /** One answer per question asked so far; feedback for the Debrief only, it never blocks the simulation or touches the Dog. */
  checkpoint: CheckpointAnswer[];
  result: NodeResult | null;
}

export type NodeAction =
  | { type: 'next' } // next Primer card
  | { type: 'answer'; option: number }
  | { type: 'timeout' }
  | { type: 'finish'; result: NodeResult };

export function startNode(node: NodeDef): NodeRun {
  return { node, step: 'primer', card: 0, question: 0, checkpoint: [], result: null };
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
      // `option` is the authored index: the screen maps its shuffled display order back before answering
      if (action.type === 'answer') {
        const option = run.node.checkpoint[run.question]?.options[action.option];
        if (!option) return run;
        return answered(run, option.correct ? 'correct' : 'wrong');
      }
      if (action.type === 'timeout') return answered(run, 'missed');
      return run;
    case 'simulation':
      if (action.type !== 'finish') return run;
      if (!resultMatchesMode(run.node, action.result)) return run;
      return { ...run, step: 'debrief', result: action.result };
    default:
      return run;
  }
}

/** Records the current question's answer and shows the next question, or starts the simulation after the last. */
function answered(run: NodeRun, answer: CheckpointAnswer): NodeRun {
  const checkpoint = [...run.checkpoint, answer];
  return run.question + 1 < run.node.checkpoint.length
    ? { ...run, question: run.question + 1, checkpoint }
    : { ...run, step: 'simulation', checkpoint };
}

function resultMatchesMode(node: NodeDef, result: NodeResult): boolean {
  if (node.mode === 'close_exercise') return result.kind === 'close_exercise' || result.kind === 'stage';
  if (node.mode === 'stage') return result.kind === 'stage';
  return result.kind === 'minigame';
}

/**
 * A random display order of `n` options (Fisher-Yates): `order[slot]` is the authored index shown in that slot, so
 * the right answer's position carries no signal. `random` returns [0, 1), like Math.random.
 */
export function shuffledOrder(n: number, random: () => number = Math.random): number[] {
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/** Seconds on the Checkpoint timer, or null when the timer is off. */
export function checkpointLimit(setting: CheckpointSeconds): number | null {
  return setting === 0 ? null : setting;
}

/**
 * The Dog record when a Node's Debrief is reached: the Node counts as completed even if the
 * technique failed, and only a Stage updates the Dog (a Minigame leaves it untouched). The Debrief's
 * exercise becomes "Tu foco" of the Mission that ends the Node's Stretch.
 */
export function onDebrief(record: DogRecord, run: NodeRun, now: Date): DogRecord {
  if (run.step !== 'debrief' || !run.result) return record;
  const result = run.result;

  const isStageLike = result.kind === 'stage' || result.kind === 'close_exercise';
  const isSkipped = isStageLike && result.skipped === true;
  const base = isStageLike && !isSkipped ? applyStage(record, result.payload, now) : record;
  const score = isStageLike ? result.payload.handlingScore : result.handlingScore;
  const earned = starsFor(score);

  const completedNodes = base.completedNodes.includes(run.node.id) ? base.completedNodes : [...base.completedNodes, run.node.id];
  const stars = { ...base.stars, [run.node.id]: bestStars(base.stars[run.node.id], earned)! };
  const entry = activityAt(now, {
    kind: 'node',
    id: run.node.id,
    stars: earned,
    ...(isStageLike
      ? { stage: stageSummary(result.payload) }
      : { metrics: { ...result.metrics }, ...(result.puzzle ? { puzzle: result.puzzle } : {}) }),
    ...(run.node.exercises.length > 0 ? { exercise: pickExercise(run.node, result).key } : {}),
  });
  const logged = { ...base, completedNodes, stars, activityLog: addActivity(base.activityLog, entry) };
  const missionId = missionOfStop({ kind: 'node', id: run.node.id });
  const focus = pickExercise(run.node, result).key;
  const focused = missionId ? updateMission(logged, missionId, (m) => (m.focus === focus ? m : { ...m, focus })) : logged;
  return applyActivity(focused, now);
}

/**
 * Whether to show the practice link back to the Poste practice Node after two consecutive
 * Poste failures in a scenario (it is never shown on the Poste practice Node itself).
 */
export function shouldShowPosteLink(record: DogRecord, nodeId: string): boolean {
  return record.posteFailures >= 2 && nodeId !== 'poste-practice';
}

