import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { scatterScenery } from '../../sim/scenery';
import type { NodeDef } from '../nodes/node';

/** The guided first walk is 36 m: 18 s at the Handler's top speed, so it fits in 25 s with a stop for the Distractor. */
export const FIRST_WALK_METERS = 36;

/** Props per meter of the guided first walk: one per 2 m, denser than the default Stage. */
export const FIRST_WALK_PROPS_PER_METER = 0.5;

const firstWalkEnd = { x: FIRST_WALK_METERS, y: 0 };

/**
 * The guided first walk: a short route with the Distractor appearing around its middle. The Distractor activates once the Dog
 * is half way and is aimed to cross the Dog's path about two seconds later.
 */
export const FIRST_WALK: Partial<ScenarioConfig> = {
  waypoint: firstWalkEnd,
  scenery: scatterScenery(defaultScenario.theme, [defaultScenario.handlerStart, firstWalkEnd], 1, [], { perMeter: FIRST_WALK_PROPS_PER_METER }),
  distractor: { ...defaultScenario.distractor, activateAfterMeters: FIRST_WALK_METERS / 2 - 3, startOffset: 10 },
};

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
  simulation: { scenario: FIRST_WALK },
  exercises: [
    { metric: 'poste', key: 'node.intro.exercisePoste' },
    { metric: 'tension', key: 'node.intro.exerciseTension' },
    { metric: 'timing', key: 'node.intro.exerciseTiming' },
    { metric: 'attention', key: 'node.intro.exerciseAttention' },
  ],
  prerequisites: [],
};
