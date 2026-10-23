import type { TextKey } from '../i18n';
import { NODES } from './nodes/content';
import type { NodeDef } from './nodes/node';

/** A World of the map: a titled list of Nodes, opened by finishing the World before it. */
export interface WorldDef {
  id: string;
  title: TextKey;
  worldNumber: number;
  /** The Nodes that have to be completed to finish the World. */
  nodes: string[];
  /** The World whose completion opens this one; absent for the first. */
  unlockedBy?: string;
  /** The thematic topics trained in this World. */
  topics: TextKey;
  /** Curriculum tier: free progression or LeadMate Plus. */
  tier?: 'free' | 'plus';
  /** True for roadmap preview worlds that do not yet have executable stages. */
  preview?: boolean;
  /** Planned or total node count, especially for preview worlds with empty `nodes`. */
  nodeCount?: number;
}

export const WORLDS: readonly WorldDef[] = [
  { id: 'home', title: 'world.1.title', worldNumber: 1, nodes: ['harness-ritual', 'doorbell-mat', 'poste-practice'], topics: 'world.1.topics', tier: 'free' },
  { id: 'sidewalk', title: 'world.2.title', worldNumber: 2, nodes: ['walk-distraction', 'blind-corner', 'slack-u'], unlockedBy: 'home', topics: 'world.2.topics', tier: 'free' },
  { id: 'urban', title: 'world.3.title', worldNumber: 3, nodes: ['leave-it-intro', 'scooter-crossing', 'urban-mix'], unlockedBy: 'sidewalk', topics: 'world.3.topics', tier: 'free' },
  { id: 'park', title: 'world.4.title', worldNumber: 4, nodes: ['park-jogger', 'park-mix'], unlockedBy: 'urban', topics: 'world.4.topics', tier: 'free' },
  { id: 'recall', title: 'world.5.title', worldNumber: 5, nodes: [], unlockedBy: 'park', topics: 'world.5.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'cafe', title: 'world.6.title', worldNumber: 6, nodes: [], unlockedBy: 'recall', topics: 'world.6.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'trails', title: 'world.7.title', worldNumber: 7, nodes: [], unlockedBy: 'cafe', topics: 'world.7.topics', tier: 'plus', preview: true, nodeCount: 4 },
  { id: 'crowds', title: 'world.8.title', worldNumber: 8, nodes: [], unlockedBy: 'trails', topics: 'world.8.topics', tier: 'plus', preview: true, nodeCount: 5 },
];

export function findWorld(id: string, worlds: readonly WorldDef[] = WORLDS): WorldDef | undefined {
  return worlds.find((w) => w.id === id);
}

/** True when every required Node of the World is in `completed`. */
export function isWorldComplete(world: WorldDef, completed: readonly string[]): boolean {
  if (world.preview || world.nodes.length === 0) return false;
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

/** The World to open the map on: the first playable one not yet complete (the last playable one when all are). */
export function currentWorld(completed: readonly string[], worlds: readonly WorldDef[] = WORLDS): WorldDef {
  const playable = worlds.filter((w) => !w.preview);
  return playable.find((w) => !isWorldComplete(w, completed)) ?? (playable[playable.length - 1] ?? worlds[0]);
}
