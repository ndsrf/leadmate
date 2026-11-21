import { STARTING_KINDS } from '../sim/feedbackKinds';
import { WORLDS, type WorldDef } from './world';
import { ALL_NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';

export type IntroductionContext =
  | { kind: 'node'; nodeId: string }
  | { kind: 'taste' }
  | { kind: 'first' }
  | { kind: 'daily'; completedNodes?: readonly string[] };

/**
 * Decides which kinds of handled action a walking Stage answers.
 * Returns a sorted, stable list of unique action kinds.
 */
export function introducedKinds(
  context: IntroductionContext,
  worlds: readonly WorldDef[] = WORLDS,
  nodes: readonly NodeDef[] = ALL_NODES,
): string[] {
  if (context.kind === 'taste' || context.kind === 'first') {
    return [...new Set<string>(STARTING_KINDS)].sort();
  }

  if (context.kind === 'daily') {
    const kinds = new Set<string>(STARTING_KINDS);
    for (const completedId of context.completedNodes ?? []) {
      const node = nodes.find((n) => n.id === completedId);
      if (node?.introduces) {
        for (const kind of node.introduces) {
          kinds.add(kind);
        }
      }
    }
    return [...kinds].sort();
  }

  // context.kind === 'node'
  // Cumulative in worldNumber, Stretch, Stop order
  const kinds = new Set<string>(STARTING_KINDS);
  const sortedWorlds = [...worlds].sort((a, b) => a.worldNumber - b.worldNumber);

  for (const world of sortedWorlds) {
    for (const stretch of world.stretches) {
      for (const stop of stretch) {
        if (stop.kind === 'node') {
          const node = nodes.find((n) => n.id === stop.id);
          if (node?.introduces) {
            for (const kind of node.introduces) {
              kinds.add(kind);
            }
          }
          if (stop.id === context.nodeId) {
            return [...kinds].sort();
          }
        }
      }
    }
  }

  // A Node not on any trail (a library or home item) uses the starting set plus its own `introduces`.
  const offTrailKinds = new Set<string>(STARTING_KINDS);
  const node = nodes.find((n) => n.id === context.nodeId);
  if (node?.introduces) {
    for (const kind of node.introduces) {
      offTrailKinds.add(kind);
    }
  }
  return [...offTrailKinds].sort();
}
