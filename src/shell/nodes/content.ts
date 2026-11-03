import type { TextKey } from '../../i18n';
import type { Metric, NodeDef, PrimerCardDef } from './node';
import { es } from '../../i18n/es';
import type { AgeBand } from '../concerns';
import { BLIND_CORNER, ELEVATOR_LOBBY, HALLWAY, handDrillScenario, LEAVE_IT_INTRO, NARROW_STREET_PASS, PARK_JOGGER, PARK_MIX, SCOOTER_CROSSING, SLACK_U, URBAN_MIX } from './scenarios';

/** Slugs of the Nodes whose texts follow the `node.<slug>.*` pattern (see the catalog). */
type Slug = 'dogasdog' | 'homerest' | 'calmfirst' | 'harness' | 'doorbell' | 'corner' | 'u' | 'leaveit' | 'scooter' | 'urban' | 'jogger' | 'park' | 'barkdoku' | 'closepass' | 'barkhome' | 'destroy' | 'eatobjects' | 'calmhands';

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
  rest: Pick<NodeDef, 'mode' | 'simulation' | 'prerequisites'> & Partial<Pick<NodeDef, 'opensAfterLesson' | 'debrief'>> & { exercises: { metric: Metric; n: 1 | 2 | 3 }[]; primer?: PrimerCardDef[] },
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
    ...(rest.opensAfterLesson ? { opensAfterLesson: rest.opensAfterLesson } : {}),
    ...(rest.debrief ? { debrief: rest.debrief } : {}),
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

// -- Basics World: a dog is a dog ------------------------------------------------------------------

/**
 * The first playable Node of World 1: keep the Dog calm around an offered hand with the leash (the close view's
 * `hand_drill`). It opens once the how-to-play Lesson is read. Its text and tuning follow the Dog's age band (`nodeForDog`).
 */
export const CALM_HANDS_NODE = textNode('calmhands', 'calm-hands', {
  mode: 'close_exercise',
  primer: recapPrimer('calmhands', { controls: true, art: 'theory-dog-as-dog-1' }),
  simulation: { closeScenario: handDrillScenario(null) },
  exercises: [{ metric: 'tension', n: 1 }, { metric: 'timing', n: 2 }],
  prerequisites: [],
  opensAfterLesson: 'howto-choose-action',
  debrief: { calm: 'node.calmhands.debrief.calm', notCalm: 'node.calmhands.debrief.notcalm' },
});

/** The text keys of the "calm hands and leash" Node that have a variant per age band (`<key>.<band>`). */
export const CALM_HANDS_VARIANT_KEYS: readonly TextKey[] = [
  'node.calmhands.recap1',
  'node.calmhands.recap2',
  'node.calmhands.tq1.question',
  'node.calmhands.tq1.why',
  'node.calmhands.exercise1',
  'node.calmhands.debrief.calm',
  'node.calmhands.debrief.notcalm',
];

/**
 * The Node as this Dog plays it. The "calm hands and leash" Node takes its copy keys and its tuning from the age band
 * (`null`: neutral copy and middle-of-the-road numbers), and a gentler first-run tuning until it has been completed;
 * every other Node is returned as it is.
 */
export function nodeForDog(node: NodeDef, dog: { ageBand: AgeBand | null; completedNodes: readonly string[] }): NodeDef {
  if (node.id !== CALM_HANDS_NODE.id) return node;
  const { ageBand } = dog;
  const variant = (key: TextKey): TextKey => {
    const keyed = `${key}.${ageBand}` as TextKey;
    return ageBand && CALM_HANDS_VARIANT_KEYS.includes(key) && keyed in es ? keyed : key;
  };
  return {
    ...node,
    primerCards: node.primerCards.map((c) => {
      // (a legacy text key is a real-world card; `primerCardOf` lives in node.ts, which this file must not import at runtime)
      const card: PrimerCardDef = typeof c === 'string' ? { kind: 'real-world', text: c } : c;
      return { ...card, text: variant(card.text) };
    }),
    checkpoint: node.checkpoint.map((q) => ({ ...q, question: variant(q.question), explanation: variant(q.explanation) })),
    exercises: node.exercises.map((e) => ({ ...e, key: variant(e.key) })),
    debrief: node.debrief && { calm: variant(node.debrief.calm), notCalm: variant(node.debrief.notCalm) },
    simulation: { ...node.simulation, closeScenario: handDrillScenario(ageBand, !dog.completedNodes.includes(node.id)) },
  };
}

export const DOG_AS_DOG_NODE = textNode('dogasdog', 'dog-as-dog', {
  mode: 'minigame',
  primer: recapPrimer('dogasdog', { controls: true, art: 'theory-dog-as-dog-1' }),
  simulation: { minigame: 'dog-as-dog' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const HOME_REST_NODE = textNode('homerest', 'home-rest', {
  mode: 'minigame',
  primer: recapPrimer('homerest', { art: 'theory-home-rest-2' }),
  simulation: { minigame: 'home-rest' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [DOG_AS_DOG_NODE.id],
});

export const CALM_FIRST_NODE = textNode('calmfirst', 'calm-first', {
  mode: 'minigame',
  primer: recapPrimer('calmfirst', { art: 'theory-calm-first-1' }),
  simulation: { minigame: 'calm-first' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [HOME_REST_NODE.id],
});

// -- Home & Thresholds ------------------------------------------------------------------

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

export const CLOSE_PASS_NODE = textNode('closepass', 'close-narrow-street-pass', {
  mode: 'close_exercise',
  primer: recapPrimer('closepass', { art: 'theory-visual-shields-2' }),
  simulation: { scenario: { theme: 'urban_street' }, closeScenario: NARROW_STREET_PASS },
  exercises: [
    { metric: 'tension', n: 1 },
    { metric: 'timing', n: 2 },
    { metric: 'attention', n: 3 },
  ],
  prerequisites: [SCOOTER_NODE.id],
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

// -- Home Behaviours: exercises, outside every World -------------------------------------------------

export const BARK_HOME_NODE = textNode('barkhome', 'bark-home', {
  mode: 'minigame',
  primer: recapPrimer('barkhome', { art: 'theory-calm-first-1' }),
  simulation: { minigame: 'bark-home' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const DESTROY_NODE = textNode('destroy', 'destroy', {
  mode: 'minigame',
  primer: recapPrimer('destroy', { art: 'theory-home-rest-2' }),
  simulation: { minigame: 'destroy' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const EAT_OBJECTS_NODE = textNode('eatobjects', 'eat-objects', {
  mode: 'minigame',
  primer: recapPrimer('eatobjects', { art: 'theory-leave-it-1' }),
  simulation: { minigame: 'eat-objects' },
  exercises: [{ metric: 'timing', n: 1 }, { metric: 'tension', n: 2 }],
  prerequisites: [],
});

export const NODES: readonly NodeDef[] = [
  CALM_HANDS_NODE,
  DOG_AS_DOG_NODE,
  HOME_REST_NODE,
  CALM_FIRST_NODE,
  HARNESS_RITUAL_NODE,
  DOORBELL_MAT_NODE,
  POSTE_PRACTICE,
  WALK_DISTRACTION,
  BLIND_CORNER_NODE,
  SLACK_U_NODE,
  LEAVE_IT_NODE,
  BARKDOKU_INTRO_NODE,
  SCOOTER_NODE,
  CLOSE_PASS_NODE,
  URBAN_MIX_NODE,
  PARK_JOGGER_NODE,
  PARK_MIX_NODE,
];

/** The exercises of the Home Behaviours: on no World's trail, so they gate and complete nothing. */
export const HOME_NODES: readonly NodeDef[] = [BARK_HOME_NODE, DESTROY_NODE, EAT_OBJECTS_NODE];

/** Every Node a Stop can name: the trail's Nodes and the Home Behaviour Nodes. */
export const ALL_NODES: readonly NodeDef[] = [...NODES, ...HOME_NODES];

export function findNode(id: string): NodeDef | undefined {
  return NODES.find((n) => n.id === id) ?? HOME_NODES.find((n) => n.id === id);
}
