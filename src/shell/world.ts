import type { TextKey } from '../i18n';
import { NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';

/** A chapter of the map: a titled list of Nodes, opened by finishing the World before it. */
export interface WorldDef {
  id: string;
  title: TextKey;
  worldNumber: number;
  /** The Nodes that have to be completed to finish the World. */
  nodes: string[];
  /** The World whose completion opens this one; absent for the first. */
  unlockedBy?: string;
}

export const WORLDS: readonly WorldDef[] = [
  { id: 'home', title: 'world.1.title', worldNumber: 1, nodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'] },
  { id: 'sidewalk', title: 'world.2.title', worldNumber: 2, nodes: ['walk-distraction', 'blind-corner', 'slack-u'], unlockedBy: 'home' },
  { id: 'urban', title: 'world.3.title', worldNumber: 3, nodes: ['leave-it-intro', 'scooter-crossing', 'urban-mix'], unlockedBy: 'sidewalk' },
  { id: 'park', title: 'world.4.title', worldNumber: 4, nodes: ['park-jogger', 'park-mix'], unlockedBy: 'urban' },
];

export function findWorld(id: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  return worlds.find((w) => w.id === id);
}

/** True when every required Node of the World is in `completed`. */
export function isWorldComplete(world: WorldDef, completed: readonly string[]): boolean {
  return world.nodes.every((id) => completed.includes(id));
}

/** A World is open when the one that unlocks it is complete; the first World is always open. */
export function isWorldUnlocked(world: WorldDef, completed: readonly string[], worlds: readonly WorldDef[] = WORLDS): boolean {
  if (!world.unlockedBy) return true;
  const before = findWorld(world.unlockedBy, worlds);
  return before !== undefined && isWorldComplete(before, completed) && isWorldUnlocked(before, completed, worlds);
}

/** The World a Node belongs to. */
export function worldOfNode(nodeId: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  return worlds.find((w) => w.nodes.includes(nodeId));
}

/** The Nodes of a World, in order. */
export function nodesOfWorld(world: WorldDef, nodes: readonly NodeDef[] = NODES): NodeDef[] {
  return world.nodes.map((id) => nodes.find((n) => n.id === id)).filter((n): n is NodeDef => n !== undefined);
}

/** A Node can be started when its World is open and its own prerequisites are done. */
export function isNodeOpen(node: NodeDef, completed: readonly string[], worlds: readonly WorldDef[] = WORLDS): boolean {
  const world = worldOfNode(node.id, worlds);
  if (world && !isWorldUnlocked(world, completed, worlds)) return false;
  return node.prerequisites.every((id) => completed.includes(id));
}

/** The World to open the map on: the first one not yet complete (the last one when all are). */
export function currentWorld(completed: readonly string[], worlds: readonly WorldDef[] = WORLDS): WorldDef {
  return worlds.find((w) => !isWorldComplete(w, completed)) ?? worlds[worlds.length - 1];
}
