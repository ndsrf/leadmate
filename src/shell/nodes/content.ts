import type { TextKey } from '../../i18n';
import type { Metric, NodeDef, PrimerCardDef } from './node';
import { BLIND_CORNER, ELEVATOR_LOBBY, HALLWAY, LEAVE_IT_INTRO, PARK_JOGGER, PARK_MIX, SCOOTER_CROSSING, SLACK_U, URBAN_MIX } from './scenarios';

/** Slugs of the Nodes whose texts follow the `node.<slug>.*` pattern (see the catalog). */
type Slug = 'harness' | 'doorbell' | 'corner' | 'u' | 'leaveit' | 'scooter' | 'urban' | 'jogger' | 'park';

/** Where the web-hosted full guides live (EXPO_PUBLIC_TUTORIAL_BASE); unset, the cards show no guide button. */
const TUTORIAL_BASE = (process.env.EXPO_PUBLIC_TUTORIAL_BASE ?? '').replace(/\/+$/, '');

/**
 * The dual-aspect Primer: three real-world cards, then two on the virtual dog. The first card carries
 * a (still pending) illustration and the second the link to the full web guide.
 */
function dualPrimer(slug: 'harness' | 'doorbell' | 'poste', media: 'image' | 'video'): PrimerCardDef[] {
  const text = (suffix: string) => `node.${slug}.${suffix}` as TextKey;
  return [
    { kind: 'real-world', text: text('card1'), media: { type: media, url: '', caption: `media.caption.${slug}` as TextKey, placeholder: true } },
    { kind: 'real-world', text: text('card2'), ...(TUTORIAL_BASE ? { tutorialUrl: `${TUTORIAL_BASE}/${slug}` } : {}) },
    { kind: 'real-world', text: text('card3') },
    { kind: 'virtual-dog', text: text('vcard1') },
    { kind: 'virtual-dog', text: text('vcard2') },
  ];
}

/** A Node from the catalog's standard keys: title, four Primer cards, a question with one right answer, exercises. */
function textNode<S extends Slug>(
  slug: S,
  id: string,
  rest: Pick<NodeDef, 'mode' | 'simulation' | 'prerequisites'> & { exercises: { metric: Metric; n: 1 | 2 | 3 }[]; primer?: PrimerCardDef[] },
): NodeDef {
  const key = (suffix: string) => `node.${slug}.${suffix}` as TextKey;
  return {
    id,
    title: key('title'),
    mode: rest.mode,
    primerCards: rest.primer ?? [key('card1'), key('card2'), key('card3'), key('card4')],
    checkpoint: {
      question: key('question'),
      options: [
        { text: key('optionRight'), correct: true },
        { text: key('optionWrong1'), correct: false },
        { text: key('optionWrong2'), correct: false },
      ],
    },
    simulation: rest.simulation,
    exercises: rest.exercises.map((e) => ({ metric: e.metric, key: key(`exercise${e.n}`) })),
    prerequisites: rest.prerequisites,
  };
}

/** The Poste practice: a static Minigame that every Poste scenario lists as a prerequisite. */
export const POSTE_PRACTICE: NodeDef = {
  id: 'poste-practice',
  title: 'node.poste.title',
  mode: 'minigame',
  primerCards: dualPrimer('poste', 'image'),
  checkpoint: {
    question: 'node.poste.question',
    options: [
      { text: 'node.poste.optionStop', correct: true },
      { text: 'node.poste.optionPull', correct: false },
      { text: 'node.poste.optionRun', correct: false },
    ],
  },
  simulation: { minigame: 'poste-hold' },
  exercises: [
    { metric: 'poste', key: 'node.poste.exercisePoste' },
    { metric: 'tension', key: 'node.poste.exerciseTension' },
  ],
  prerequisites: [],
};

/** The first walking Node: the base Stage with a skateboarder. */
export const WALK_DISTRACTION: NodeDef = {
  id: 'walk-distraction',
  title: 'node.walk.title',
  mode: 'stage',
  primerCards: ['node.walk.card1', 'node.walk.card2', 'node.walk.card3', 'node.walk.card4'],
  checkpoint: {
    question: 'node.walk.question',
    options: [
      { text: 'node.walk.optionBreak', correct: true },
      { text: 'node.walk.optionFixed', correct: false },
      { text: 'node.walk.optionNever', correct: false },
    ],
  },
  simulation: {},
  exercises: [
    { metric: 'tension', key: 'node.walk.exerciseTension' },
    { metric: 'timing', key: 'node.walk.exerciseTiming' },
    { metric: 'poste', key: 'node.walk.exercisePoste' },
    { metric: 'attention', key: 'node.walk.exerciseAttention' },
  ],
  prerequisites: ['poste-practice'],
};

// -- World 1: Home & Thresholds ------------------------------------------------------------------

export const HARNESS_RITUAL_NODE = textNode('harness', 'harness-ritual', {
  mode: 'minigame',
  primer: dualPrimer('harness', 'image'),
  simulation: { minigame: 'harness-ritual', scenario: ELEVATOR_LOBBY },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const DOORBELL_MAT_NODE = textNode('doorbell', 'doorbell-mat', {
  mode: 'minigame',
  primer: dualPrimer('doorbell', 'video'),
  simulation: { minigame: 'doorbell-mat', scenario: HALLWAY },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'attention', n: 2 }],
  prerequisites: [HARNESS_RITUAL_NODE.id],
});

// -- World 2: The Quiet Sidewalk -------------------------------------------------------------------

export const BLIND_CORNER_NODE = textNode('corner', 'blind-corner', {
  mode: 'stage',
  simulation: { scenario: BLIND_CORNER },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }, { metric: 'timing', n: 3 }],
  prerequisites: [WALK_DISTRACTION.id],
});

export const SLACK_U_NODE = textNode('u', 'slack-u', {
  mode: 'stage',
  simulation: { scenario: SLACK_U },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'attention', n: 2 }, { metric: 'poste', n: 3 }],
  prerequisites: [WALK_DISTRACTION.id],
});

// -- World 3: Urban Navigations ---------------------------------------------------------------------

/** The introductory food Node: the "Leave It" button alone on the HUD. */
export const LEAVE_IT_NODE = textNode('leaveit', 'leave-it-intro', {
  mode: 'stage',
  simulation: { scenario: LEAVE_IT_INTRO },
  exercises: [{ metric: 'attention', n: 1 }, { metric: 'timing', n: 2 }],
  prerequisites: [],
});

export const SCOOTER_NODE = textNode('scooter', 'scooter-crossing', {
  mode: 'stage',
  simulation: { scenario: SCOOTER_CROSSING },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'poste', n: 2 }, { metric: 'attention', n: 3 }],
  prerequisites: [LEAVE_IT_NODE.id],
});

export const URBAN_MIX_NODE = textNode('urban', 'urban-mix', {
  mode: 'stage',
  simulation: { scenario: URBAN_MIX },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'timing', n: 2 }, { metric: 'poste', n: 3 }],
  prerequisites: [SCOOTER_NODE.id],
});

// -- World 4: Fast Wheels & High Arousal ------------------------------------------------------------

export const PARK_JOGGER_NODE = textNode('jogger', 'park-jogger', {
  mode: 'stage',
  simulation: { scenario: PARK_JOGGER },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const PARK_MIX_NODE = textNode('park', 'park-mix', {
  mode: 'stage',
  simulation: { scenario: PARK_MIX },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'timing', n: 2 }, { metric: 'attention', n: 3 }],
  prerequisites: [PARK_JOGGER_NODE.id],
});

export const NODES: readonly NodeDef[] = [
  HARNESS_RITUAL_NODE,
  DOORBELL_MAT_NODE,
  POSTE_PRACTICE,
  WALK_DISTRACTION,
  BLIND_CORNER_NODE,
  SLACK_U_NODE,
  LEAVE_IT_NODE,
  SCOOTER_NODE,
  URBAN_MIX_NODE,
  PARK_JOGGER_NODE,
  PARK_MIX_NODE,
];

export function findNode(id: string): NodeDef | undefined {
  return NODES.find((n) => n.id === id);
}
