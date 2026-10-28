import { DISTRACTOR_KINDS, type DistractorKind, type TriggerProfile } from '../../sim/learning';
import { findNode } from '../nodes/content';
import { latencyBand } from './latency';

/** The default order of the opening Nodes: World 1, then the first walking Node. */
const DEFAULT_PLAN = ['harness-ritual', 'doorbell-mat', 'poste-practice', 'walk-distraction'] as const;

/** The Node that practices each kind of Distractor; skateboards are already in the base walking Node. */
const NODE_FOR_KIND: Partial<Record<DistractorKind, string>> = {
  bicycle: 'blind-corner',
  child: 'slack-u',
  dog: 'slack-u',
  food: 'leave-it-intro',
};

export const POSTE_NODE_ID = 'poste-practice';

/**
 * An ordered list of 3 to 5 existing Node ids. The default order, with the Poste practice first when the latency is slow,
 * and the Node for the Dog's strongest reaction added when it is above the usual level.
 */
export function buildWalkPlan(latency: number, profile: TriggerProfile): string[] {
  let plan: string[] = [...DEFAULT_PLAN];
  if (latencyBand(latency) === 'slow') plan = [POSTE_NODE_ID, ...plan.filter((id) => id !== POSTE_NODE_ID)];
  const strongest = DISTRACTOR_KINDS.filter((k) => profile[k] === 3 && NODE_FOR_KIND[k]).map((k) => NODE_FOR_KIND[k]!)[0];
  if (strongest && !plan.includes(strongest)) plan.push(strongest);
  return plan.filter((id) => findNode(id) !== undefined).slice(0, 5);
}

/** The first Node of the plan not yet completed. */
export function nextPlanned(plan: readonly string[], completed: readonly string[]): string | null {
  return plan.find((id) => !completed.includes(id)) ?? null;
}
