import { STARTING_KINDS } from '../sim/feedbackKinds';
import type { WorldDef } from './world';
import type { NodeDef } from './nodes/node';
import { introducedKinds, type IntroductionContext } from './introductions';

describe('introducedKinds table test', () => {
  const sortedStartingKinds = [...STARTING_KINDS].sort();

  const makeNode = (id: string, introduces?: string[]): NodeDef => ({
    id,
    title: 'test.node' as any,
    mode: 'stage',
    primerCards: [],
    checkpoint: [],
    simulation: {},
    exercises: [],
    prerequisites: [],
    introduces,
  });

  const nodeBasics = makeNode('basics-walk');
  const nodePoste = makeNode('poste-practice', ['poste', 'harsh-stop']);
  const nodeDistraction = makeNode('walk-distraction', ['go-sniff', 'go-sniff-cut-short']);
  const nodeUnpredictable = makeNode('park-unpredictable', ['followed-turn', 'sintonia']);
  const nodeKeepFresh = makeNode('park-keep-fresh', ['fresh-move']);
  const nodeOffTrailWithIntroduces = makeNode('custom-off-trail', ['wrong-cue']);
  const nodeOffTrailPlain = makeNode('plain-off-trail');

  const fixtureNodes: NodeDef[] = [
    nodeBasics,
    nodePoste,
    nodeDistraction,
    nodeUnpredictable,
    nodeKeepFresh,
    nodeOffTrailWithIntroduces,
    nodeOffTrailPlain,
  ];

  const makeWorld = (id: string, worldNumber: number, stretches: string[][]): WorldDef => ({
    id,
    title: 'test.world' as any,
    worldNumber,
    topics: 'test.topics' as any,
    stretches: stretches.map((stops) => stops.map((id) => ({ kind: 'node', id }))),
  });

  // Out of order array to verify worldNumber sorting
  const fixtureWorlds: WorldDef[] = [
    makeWorld('world6', 6, [['park-unpredictable', 'park-keep-fresh']]),
    makeWorld('world1', 1, [['basics-walk']]),
    makeWorld('world3', 3, [['walk-distraction']]),
    makeWorld('world2', 2, [['poste-practice']]),
  ];

  type TestCase = {
    requirement: string;
    scenario: string;
    context: IntroductionContext;
    mustContain: string[];
    mustNotContain: string[];
    exactKinds?: string[];
  };

  const tableCases: TestCase[] = [
    {
      requirement: 'Starting set of Introduced actions',
      scenario: 'First walk answers the Marker',
      context: { kind: 'first' },
      mustContain: ['marker-hit', 'check-in-hit', 'disengagement', 'rigid-pull'],
      mustNotContain: ['followed-turn', 'poste', 'go-sniff'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Starting set of Introduced actions',
      scenario: 'First walk ignores a followed turn',
      context: { kind: 'first' },
      mustContain: ['marker-hit'],
      mustNotContain: ['followed-turn', 'harsh-stop'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Taste Stage and guided first Stage use the starting set',
      scenario: 'Taste Stage after a reset',
      context: { kind: 'taste' },
      mustContain: ['marker-hit', 'check-in-hit'],
      mustNotContain: ['followed-turn', 'poste', 'go-sniff', 'fresh-move'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Nodes Introduce action kinds',
      scenario: 'Node Introduces a followed turn',
      context: { kind: 'node', nodeId: 'park-unpredictable' },
      mustContain: ['followed-turn', 'sintonia', 'go-sniff', 'go-sniff-cut-short', 'poste', 'harsh-stop', 'marker-hit'],
      mustNotContain: ['fresh-move', 'wrong-cue'],
    },
    {
      requirement: 'Introduced actions follow the trail',
      scenario: 'Earlier Node replayed (advanced player history does not alter trail set)',
      context: { kind: 'node', nodeId: 'walk-distraction' },
      mustContain: ['go-sniff', 'go-sniff-cut-short', 'poste', 'harsh-stop', 'marker-hit'],
      mustNotContain: ['followed-turn', 'sintonia', 'fresh-move'],
    },
    {
      requirement: 'Introduced actions follow the trail',
      scenario: 'Later Node inherits earlier introductions',
      context: { kind: 'node', nodeId: 'park-keep-fresh' },
      mustContain: ['fresh-move', 'followed-turn', 'sintonia', 'go-sniff', 'poste', 'rigid-pull'],
      mustNotContain: ['wrong-cue'],
    },
    {
      requirement: 'Introduced actions follow the trail',
      scenario: 'First World node only has starting set when none introduced',
      context: { kind: 'node', nodeId: 'basics-walk' },
      mustContain: ['marker-hit'],
      mustNotContain: ['poste', 'go-sniff', 'followed-turn'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Daily Stage uses completed Nodes',
      scenario: "New player's Daily Stage",
      context: { kind: 'daily', completedNodes: [] },
      mustContain: ['marker-hit', 'rigid-pull'],
      mustNotContain: ['go-sniff', 'go-sniff-cut-short', 'poste', 'followed-turn'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Daily Stage uses completed Nodes',
      scenario: "Experienced player's Daily Stage with walk-distraction completed",
      context: { kind: 'daily', completedNodes: ['walk-distraction'] },
      mustContain: ['go-sniff', 'go-sniff-cut-short', 'marker-hit'],
      mustNotContain: ['poste', 'harsh-stop', 'followed-turn'],
    },
    {
      requirement: 'Daily Stage uses completed Nodes',
      scenario: "Experienced player's Daily Stage with multiple completed Nodes",
      context: { kind: 'daily', completedNodes: ['poste-practice', 'park-unpredictable'] },
      mustContain: ['poste', 'harsh-stop', 'followed-turn', 'sintonia', 'marker-hit'],
      mustNotContain: ['go-sniff', 'fresh-move'],
    },
    {
      requirement: 'Off-trail Nodes',
      scenario: 'Node not on any trail uses starting set plus own introduces',
      context: { kind: 'node', nodeId: 'custom-off-trail' },
      mustContain: ['wrong-cue', 'marker-hit'],
      mustNotContain: ['poste', 'go-sniff', 'followed-turn'],
      exactKinds: [...new Set([...sortedStartingKinds, 'wrong-cue'])].sort(),
    },
    {
      requirement: 'Off-trail Nodes',
      scenario: 'Node not on any trail with no introduces uses starting set only',
      context: { kind: 'node', nodeId: 'plain-off-trail' },
      mustContain: ['marker-hit'],
      mustNotContain: ['wrong-cue', 'poste'],
      exactKinds: sortedStartingKinds,
    },
    {
      requirement: 'Off-trail Nodes',
      scenario: 'Unknown node id uses starting set only',
      context: { kind: 'node', nodeId: 'nonexistent-node' },
      mustContain: ['marker-hit'],
      mustNotContain: ['wrong-cue', 'poste'],
      exactKinds: sortedStartingKinds,
    },
  ];

  it.each(tableCases)(
    '$requirement -> $scenario',
    ({ context, mustContain, mustNotContain, exactKinds }) => {
      const result = introducedKinds(context, fixtureWorlds, fixtureNodes);

      // Verify sorted and unique (stable)
      expect(result).toEqual([...new Set(result)].sort());

      for (const kind of mustContain) {
        expect(result).toContain(kind);
      }
      for (const kind of mustNotContain) {
        expect(result).not.toContain(kind);
      }
      if (exactKinds) {
        expect(result).toEqual(exactKinds);
      }
    }
  );

  it('uses default WORLDS and ALL_NODES when omitted', () => {
    const tasteResult = introducedKinds({ kind: 'taste' });
    expect(tasteResult).toEqual(sortedStartingKinds);

    const firstResult = introducedKinds({ kind: 'first' });
    expect(firstResult).toEqual(sortedStartingKinds);
  });
});
