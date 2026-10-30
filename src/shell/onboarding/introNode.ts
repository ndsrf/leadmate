import type { NodeDef } from '../nodes/node';

/**
 * The introductory "Node 0" played during the onboarding funnel:
 * Primer cards (theory & mechanics) ➔ Checkpoint quiz ➔ Guided walk simulation ➔ Debrief.
 */
export const INTRO_NODE: NodeDef = {
  id: 'intro-node',
  title: 'node.intro.title',
  mode: 'stage',
  primerCards: [
    { kind: 'real-world', text: 'node.intro.card1' },
    { kind: 'virtual-dog', text: 'node.intro.card2' },
    { kind: 'virtual-dog', text: 'node.intro.card3' },
    { kind: 'virtual-dog', text: 'node.intro.card4' },
  ],
  // one question only, to keep the funnel short
  checkpoint: [
    {
      question: 'node.intro.question',
      options: [
        { text: 'node.intro.optionAnchor', correct: true },
        { text: 'node.intro.optionPull', correct: false },
        { text: 'node.intro.optionRun', correct: false },
      ],
      explanation: 'node.intro.why',
    },
  ],
  simulation: {},
  exercises: [
    { metric: 'poste', key: 'node.intro.exercisePoste' },
    { metric: 'tension', key: 'node.intro.exerciseTension' },
    { metric: 'timing', key: 'node.intro.exerciseTiming' },
    { metric: 'attention', key: 'node.intro.exerciseAttention' },
  ],
  prerequisites: [],
};
