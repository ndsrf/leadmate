import { mapModel, type MapModel, type NodeState } from './mapModel';

const stateOf = (m: MapModel, id: string): NodeState => m.worlds.flatMap((w) => w.nodes).find((n) => n.node.id === id)!.state;

describe('mapModel', () => {
  it('opens the first Node as next-up on a fresh Dog and locks the rest', () => {
    const m = mapModel([], {});
    expect(m.nextUp).toEqual({ worldId: 'home', nodeId: 'harness-ritual' });
    expect(stateOf(m, 'harness-ritual')).toBe('next');
    expect(stateOf(m, 'doorbell-mat')).toBe('locked');
    expect(m.allComplete).toBe(false);
  });

  it('marks a locked World and gives the reason', () => {
    const m = mapModel([], {});
    const sidewalk = m.worlds.find((w) => w.world.id === 'sidewalk')!;
    expect(sidewalk.unlocked).toBe(false);
    expect(sidewalk.nodes.every((n) => n.state === 'locked' && n.lock?.kind === 'world')).toBe(true);
  });

  it('lists the missing prerequisite Nodes of a locked Node in an open World', () => {
    const m = mapModel([], {});
    const doorbell = m.worlds[0].nodes.find((n) => n.node.id === 'doorbell-mat')!;
    expect(doorbell.lock).toEqual({ kind: 'nodes', ids: ['harness-ritual'] });
  });

  it('shows a completed Node with its stars, and 1 star when none were stored', () => {
    const m = mapModel(['harness-ritual', 'poste-practice'], { 'harness-ritual': 3 });
    const nodes = m.worlds[0].nodes;
    expect(nodes.find((n) => n.node.id === 'harness-ritual')).toMatchObject({ state: 'done', stars: 3 });
    expect(nodes.find((n) => n.node.id === 'poste-practice')).toMatchObject({ state: 'done', stars: 1 });
    expect(m.worlds[0].done).toBe(2);
    expect(m.worlds[0].total).toBe(3);
  });

  it('has exactly one next-up Node, the first open unfinished one in World order', () => {
    const m = mapModel(['harness-ritual'], {});
    const all = m.worlds.flatMap((w) => w.nodes);
    expect(all.filter((n) => n.state === 'next')).toHaveLength(1);
    expect(m.nextUp?.nodeId).toBe('doorbell-mat');
    expect(stateOf(m, 'poste-practice')).toBe('open');
  });

  it('moves next-up forward after a completion', () => {
    expect(mapModel([], {}).nextUp?.nodeId).toBe('harness-ritual');
    expect(mapModel(['harness-ritual'], {}).nextUp?.nodeId).toBe('doorbell-mat');
  });

  it('unlocks the next World and its Nodes after completing a World', () => {
    const m = mapModel(['harness-ritual', 'doorbell-mat', 'poste-practice'], {});
    expect(m.worlds[1].unlocked).toBe(true);
    expect(m.nextUp?.worldId).toBe('sidewalk');
  });

  it('reports all-complete with no next-up', () => {
    const all = mapModel([], {}).worlds.flatMap((w) => w.nodes.map((n) => n.node.id));
    const m = mapModel(all, {});
    expect(m.allComplete).toBe(true);
    expect(m.nextUp).toBeNull();
    expect(m.worlds.every((w) => w.nodes.every((n) => n.state === 'done'))).toBe(true);
  });

  it('gives every Node exactly one state', () => {
    const states = new Set(['locked', 'open', 'next', 'done']);
    for (const done of [[], ['harness-ritual'], ['harness-ritual', 'doorbell-mat', 'poste-practice', 'walk-distraction']]) {
      for (const n of mapModel(done, {}).worlds.flatMap((w) => w.nodes)) expect(states.has(n.state)).toBe(true);
    }
  });
});
