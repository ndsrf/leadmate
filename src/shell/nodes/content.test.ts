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
    const textQuestions = ALL_NODES.flatMap((n) => n.checkpoint);
    expect(textQuestions.length).toBeGreaterThan(0);
    expect(textQuestions.some(isImageDuelQuestion)).toBe(false);
  });

  it('nodeForDog keeps a duel as it is', () => {
    const node = { ...ALL_NODES[0], checkpoint: [duel] } as NodeDef;
    const played = nodeForDog(node, { ageBand: null, completedNodes: [] });
    expect(played.checkpoint[0]).toEqual(duel);
  });
});
