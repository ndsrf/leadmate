import type { FeedbackActionKind } from './feedbackKinds';
import type { SimulationDebriefPayload } from './payload';

/** What the Node Debrief shows as "done well" and "try next". The UI only renders it. */
export interface DebriefSummary {
  doneWell: FeedbackActionKind[];
  tryNext: FeedbackActionKind[];
}

/** Fixed priority, most valuable first. Each kind lists the `scentWalk` count that triggers it. */
export const RIGHT_PRIORITY = [
  ['chain', 'chains'],
  ['waited-plant', 'plantsWaited'],
  ['waited-marking', 'markingsWaited'],
  ['smart-jackpot', 'jackpotsSmart'],
  ['leave-it-food', 'foodLeft'],
  ['fresh-move', 'freshMoves'],
  ['granted-sniff', 'sniffsGranted'],
] as const;

export const WRONG_PRIORITY = [
  ['food-eaten', 'foodEaten'],
  ['dragged-plant', 'plantsDragged'],
  ['scent-dragged-past', 'scentsDraggedPast'],
  ['interrupted-marking', 'markingsInterrupted'],
  ['wasted-jackpot', 'jackpotsWasted'],
  ['repeated-move-ignored', 'repeatedMovesIgnored'],
  ['empty-sniff', 'sniffsEmpty'],
] as const;

/** Up to two right kinds and one wrong kind, by the fixed priority tables. Empty outside scent Stages. */
export function summarizeScentWalk(payload: Pick<SimulationDebriefPayload, 'scentWalk'>): DebriefSummary {
  const sw = payload.scentWalk as Record<string, number> | undefined;
  if (!sw) return { doneWell: [], tryNext: [] };
  const hit = (table: readonly (readonly [FeedbackActionKind, string])[]) => table.filter(([, k]) => (sw[k] ?? 0) > 0).map(([kind]) => kind);
  return { doneWell: hit(RIGHT_PRIORITY).slice(0, 2), tryNext: hit(WRONG_PRIORITY).slice(0, 1) };
}
