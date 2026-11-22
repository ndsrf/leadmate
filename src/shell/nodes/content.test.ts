import type { TextKey } from '../../i18n';
import { ALL_NODES, isImageDuelQuestion, nodeForDog, type ImageDuelQuestion } from './content';
import type { NodeDef } from './node';

const duel: ImageDuelQuestion = {
  kind: 'duel',
  question: 'node.x.tq1.question' as TextKey,
  options: [
    { text: 'node.x.tq1.alt1' as TextKey, correct: false },
    { text: 'node.x.tq1.alt2' as TextKey, correct: true },
  ],
  explanation: 'node.x.tq1.why' as TextKey,
  images: [
    { art: 'a.png', itemPath: 'nodes/x', path: 'nodes/x/media/a.png', alt: 'node.x.tq1.alt1' as TextKey },
    { art: 'b.png', itemPath: 'nodes/x', path: 'nodes/x/media/b.png', alt: 'node.x.tq1.alt2' as TextKey },
  ],
  correct: 1,
};

describe('isImageDuelQuestion', () => {
  it('tells a duel from the text questions of every shipped Node', () => {
    expect(isImageDuelQuestion(duel)).toBe(true);
    // the duel is detected exactly where one ships (World 6 Stretch 1 and the World 7 Terrace Nodes) and nowhere else
    const withDuel = ALL_NODES.filter((n) => n.checkpoint.some(isImageDuelQuestion)).map((n) => n.id);
    expect(withDuel).toEqual(['park-unpredictable', 'cafe-arrive', 'cafe-settle', 'cafe-passing-dog']);
    for (const id of withDuel) expect({ id, duels: ALL_NODES.find((n) => n.id === id)!.checkpoint.filter(isImageDuelQuestion).length }).toEqual({ id, duels: 1 });
    expect(ALL_NODES.flatMap((n) => n.checkpoint).filter((q) => !isImageDuelQuestion(q)).length).toBeGreaterThan(0);
  });

  it('nodeForDog keeps a duel as it is', () => {
    const node = { ...ALL_NODES[0], checkpoint: [duel] } as NodeDef;
    const played = nodeForDog(node, { ageBand: null, completedNodes: [] });
    expect(played.checkpoint[0]).toEqual(duel);
  });
});
