import { starsShown } from './celebrations';
import { NODES } from './nodes/content';
import { missingPrerequisites, type NodeDef } from './nodes/node';
import type { Stars } from './stars';
import { isNodeOpen, isWorldUnlocked, nodesOfWorld, WORLDS, type WorldDef } from './world';

export type NodeState = 'locked' | 'open' | 'next' | 'done';

export interface MapNode {
  node: NodeDef;
  state: NodeState;
  /** Stars of a completed Node (1 for one completed before stars existed); absent otherwise. */
  stars?: Stars;
  /** Why a locked Node cannot start: its World is closed, or these prerequisite Nodes are missing. */
  lock?: { kind: 'world' } | { kind: 'nodes'; ids: string[] };
}

export interface MapWorld {
  world: WorldDef;
  unlocked: boolean;
  done: number;
  total: number;
  nodes: MapNode[];
}

export interface MapModel {
  worlds: MapWorld[];
  /** The first open, unfinished Node in World order; null when everything is done. */
  nextUp: { worldId: string; nodeId: string } | null;
  allComplete: boolean;
}

/** The World Map as data: every Node is exactly one of locked, open, next or done. The screen only draws it. */
export function mapModel(completed: readonly string[], stars: Readonly<Record<string, Stars>>, worlds: readonly WorldDef[] = WORLDS, nodes: readonly NodeDef[] = NODES): MapModel {
  let nextUp: MapModel['nextUp'] = null;
  const mapWorlds: MapWorld[] = worlds.map((world) => {
    const unlocked = isWorldUnlocked(world, completed, worlds);
    const defs = nodesOfWorld(world, nodes);
    const mapNodes: MapNode[] = defs.map((node) => {
      if (completed.includes(node.id)) return { node, state: 'done', stars: starsShown({ completedNodes: [...completed], stars: { ...stars } }, node.id) };
      if (isNodeOpen(node, completed, worlds)) {
        if (nextUp === null) {
          nextUp = { worldId: world.id, nodeId: node.id };
          return { node, state: 'next' };
        }
        return { node, state: 'open' };
      }
      const missing = missingPrerequisites(node, completed);
      return { node, state: 'locked', lock: !unlocked ? { kind: 'world' } : { kind: 'nodes', ids: missing } };
    });
    return { world, unlocked, done: mapNodes.filter((n) => n.state === 'done').length, total: world.nodes.length, nodes: mapNodes };
  });
  return { worlds: mapWorlds, nextUp, allComplete: nextUp === null && mapWorlds.every((w) => w.done === w.total) };
}
