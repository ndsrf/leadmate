import type { TextKey } from '../../i18n';
import type { Metric, NodeDef, PrimerCardDef } from './node';
import { BLIND_CORNER, ELEVATOR_LOBBY, HALLWAY, LEAVE_IT_INTRO, PARK_JOGGER, PARK_MIX, SCOOTER_CROSSING, SLACK_U, URBAN_MIX } from './scenarios';

/** Slugs of the Nodes whose texts follow the `node.<slug>.*` pattern (see the catalog). */
type Slug = 'harness' | 'doorbell' | 'corner' | 'u' | 'leaveit' | 'scooter' | 'urban' | 'jogger' | 'park' | 'barkdoku';

/** Where the web-hosted full guides live (EXPO_PUBLIC_TUTORIAL_BASE); unset, the cards show no guide button. */
const TUTORIAL_BASE = (process.env.EXPO_PUBLIC_TUTORIAL_BASE ?? '').replace(/\/+$/, '');

type RecapSlug = Slug | 'poste' | 'walk';

/**
 * The trail Primer: one or two cards recapping the Lessons before the Node on the trail (design decision 11). The
 * first recaps the theory Lesson; a second, after a How-to-play Lesson, recaps the controls. `art` shows the theory
 * Lesson's bundled illustration on the first card; `media` attaches a still pending one instead. Either adds the link
 * to the full web guide when one is configured.
 */
function recapPrimer(slug: RecapSlug, opts: { controls?: boolean; media?: 'image' | 'video'; art?: string } = {}): PrimerCardDef[] {
  const text = (suffix: string) => `node.${slug}.${suffix}` as TextKey;
  const first: PrimerCardDef = { kind: 'real-world', text: text('recap1') };
  const caption = `media.caption.${slug}` as TextKey;
  if (opts.art) first.media = { type: 'image', url: '', art: opts.art, caption };
  else if (opts.media) first.media = { type: opts.media, url: '', caption, placeholder: true };
  if (first.media && TUTORIAL_BASE) first.tutorialUrl = `${TUTORIAL_BASE}/${slug}`;
  return opts.controls ? [first, { kind: 'virtual-dog', text: text('recap2') }] : [first];
}

/**
 * The trail Checkpoint: three questions on the theory Lesson before the Node, each with one right answer (authored
 * first; the screen shuffles them) and an explanation for the Debrief.
 */
function recapCheckpoint(slug: RecapSlug): NodeDef['checkpoint'] {
  return ([1, 2, 3] as const).map((n) => {
    const key = (suffix: string) => `node.${slug}.tq${n}.${suffix}` as TextKey;
    return {
      question: key('question'),
      options: [
        { text: key('right'), correct: true },
        { text: key('wrong1'), correct: false },
        { text: key('wrong2'), correct: false },
      ],
      explanation: key('why'),
    };
  });
}

/** A Node from the catalog's standard keys: title, a recap Primer, a Checkpoint on the theory Lesson, exercises. */
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
    primerCards: rest.primer ?? recapPrimer(slug),
    checkpoint: recapCheckpoint(slug),
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
  primerCards: recapPrimer('poste', { art: 'theory-poste-do' }),
  checkpoint: recapCheckpoint('poste'),
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
  primerCards: recapPrimer('walk', { controls: true, art: 'theory-loose-leash-2' }),
  checkpoint: recapCheckpoint('walk'),
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
  primer: recapPrimer('harness', { controls: true, art: 'theory-harness-1' }),
  simulation: { minigame: 'harness-ritual', scenario: ELEVATOR_LOBBY },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const DOORBELL_MAT_NODE = textNode('doorbell', 'doorbell-mat', {
  mode: 'minigame',
  primer: recapPrimer('doorbell', { art: 'theory-doorbell-2' }),
  simulation: { minigame: 'doorbell-mat', scenario: HALLWAY },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'attention', n: 2 }],
  prerequisites: [HARNESS_RITUAL_NODE.id],
});

// -- World 2: The Quiet Sidewalk -------------------------------------------------------------------

export const BLIND_CORNER_NODE = textNode('corner', 'blind-corner', {
  mode: 'stage',
  primer: recapPrimer('corner', { art: 'theory-blind-corner-1' }),
  simulation: { scenario: BLIND_CORNER },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }, { metric: 'timing', n: 3 }],
  prerequisites: [WALK_DISTRACTION.id],
});

export const SLACK_U_NODE = textNode('u', 'slack-u', {
  mode: 'stage',
  primer: recapPrimer('u', { art: 'theory-slack-u-1' }),
  simulation: { scenario: SLACK_U },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'attention', n: 2 }, { metric: 'poste', n: 3 }],
  prerequisites: [WALK_DISTRACTION.id],
});

// -- World 3: Urban Navigations ---------------------------------------------------------------------

/** The introductory food Node: the "Leave It" button alone on the HUD. */
export const LEAVE_IT_NODE = textNode('leaveit', 'leave-it-intro', {
  mode: 'stage',
  primer: recapPrimer('leaveit', { controls: true, art: 'theory-leave-it-2' }),
  simulation: { scenario: LEAVE_IT_INTRO },
  exercises: [{ metric: 'attention', n: 1 }, { metric: 'timing', n: 2 }],
  prerequisites: [],
});

/** Introductory Barkdoku spatial deduction node in World 3. */
export const BARKDOKU_INTRO_NODE = textNode('barkdoku', 'calm-zone-intro', {
  mode: 'minigame',
  primer: recapPrimer('barkdoku', { art: 'theory-visual-shields-1' }),
  simulation: { minigame: 'barkdoku', scenario: { theme: 'urban_street' } },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'attention', n: 2 }],
  prerequisites: [LEAVE_IT_NODE.id],
});

export const SCOOTER_NODE = textNode('scooter', 'scooter-crossing', {
  mode: 'stage',
  primer: recapPrimer('scooter', { art: 'theory-visual-shields-2' }),
  simulation: { scenario: SCOOTER_CROSSING },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'poste', n: 2 }, { metric: 'attention', n: 3 }],
  prerequisites: [LEAVE_IT_NODE.id],
});

export const URBAN_MIX_NODE = textNode('urban', 'urban-mix', {
  mode: 'stage',
  simulation: { scenario: URBAN_MIX },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'timing', n: 2 }, { metric: 'poste', n: 3 }],
  prerequisites: [SCOOTER_NODE.id],
  primer: recapPrimer('urban', { art: 'theory-choosing-cue-1' }),
});

// -- World 4: Fast Wheels & High Arousal ------------------------------------------------------------

export const PARK_JOGGER_NODE = textNode('jogger', 'park-jogger', {
  mode: 'stage',
  primer: recapPrimer('jogger', { controls: true, art: 'theory-long-leash-1' }),
  simulation: { scenario: PARK_JOGGER },
  exercises: [{ metric: 'poste', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const PARK_MIX_NODE = textNode('park', 'park-mix', {
  mode: 'stage',
  primer: recapPrimer('park', { art: 'theory-park-mix-1' }),
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
  BARKDOKU_INTRO_NODE,
  SCOOTER_NODE,
  URBAN_MIX_NODE,
  PARK_JOGGER_NODE,
  PARK_MIX_NODE,
];

export function findNode(id: string): NodeDef | undefined {
  return NODES.find((n) => n.id === id);
}
