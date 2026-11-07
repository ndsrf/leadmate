import type { TextKey } from '../../i18n';
import type { NodeDef, PrimerCardDef } from './node';
import { es } from '../../i18n/es';
import type { AgeBand } from '../concerns';
import { handDrillScenario } from './scenarios';
import { getActiveContent } from '../content/runtime';

export function findNode(id: string): NodeDef | undefined {
  return getActiveContent().resolved.nodes.find((n) => n.id === id);
}

function nodeProxy(id: string): NodeDef {
  const dummy = {} as NodeDef;
  return new Proxy(dummy, {
    get(_target, prop) {
      const node = findNode(id);
      if (!node) return undefined;
      const val = Reflect.get(node, prop);
      if (typeof val === 'function') return val.bind(node);
      return val;
    },
    has(_target, prop) {
      const node = findNode(id);
      return node ? Reflect.has(node, prop) : false;
    },
    ownKeys(_target) {
      const node = findNode(id);
      return node ? Reflect.ownKeys(node) : [];
    },
    getOwnPropertyDescriptor(_target, prop) {
      const node = findNode(id);
      return node ? Reflect.getOwnPropertyDescriptor(node, prop) : undefined;
    },
  });
}

function getTrailNodes(): readonly NodeDef[] {
  const trailIds = new Set(
    getActiveContent().resolved.worlds.flatMap((w) =>
      w.stretches.flatMap((s) => s.filter((st) => st.kind === 'node').map((st) => st.id)),
    ),
  );
  return getActiveContent().resolved.nodes.filter((n) => trailIds.has(n.id));
}

function getHomeNodes(): readonly NodeDef[] {
  const trailIds = new Set(
    getActiveContent().resolved.worlds.flatMap((w) =>
      w.stretches.flatMap((s) => s.filter((st) => st.kind === 'node').map((st) => st.id)),
    ),
  );
  return getActiveContent().resolved.nodes.filter((n) => !trailIds.has(n.id));
}

export const ALL_NODES: readonly NodeDef[] = new Proxy([] as unknown as readonly NodeDef[], {
  get(_target, prop) {
    const nodes = getActiveContent().resolved.nodes;
    const value = Reflect.get(nodes, prop);
    if (typeof value === 'function') {
      return value.bind(nodes);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getActiveContent().resolved.nodes, prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getActiveContent().resolved.nodes);
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getActiveContent().resolved.nodes, prop);
  },
});

export const NODES: readonly NodeDef[] = new Proxy([] as unknown as readonly NodeDef[], {
  get(_target, prop) {
    const nodes = getTrailNodes();
    const value = Reflect.get(nodes, prop);
    if (typeof value === 'function') {
      return value.bind(nodes);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getTrailNodes(), prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getTrailNodes());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getTrailNodes(), prop);
  },
});

export const HOME_NODES: readonly NodeDef[] = new Proxy([] as unknown as readonly NodeDef[], {
  get(_target, prop) {
    const nodes = getHomeNodes();
    const value = Reflect.get(nodes, prop);
    if (typeof value === 'function') {
      return value.bind(nodes);
    }
    return value;
  },
  has(_target, prop) {
    return Reflect.has(getHomeNodes(), prop);
  },
  ownKeys(_target) {
    return Reflect.ownKeys(getHomeNodes());
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Reflect.getOwnPropertyDescriptor(getHomeNodes(), prop);
  },
});

export const POSTE_PRACTICE: NodeDef = nodeProxy('poste-practice');
export const WALK_DISTRACTION: NodeDef = nodeProxy('walk-distraction');
export const CALM_HANDS_NODE: NodeDef = nodeProxy('calm-hands');
export const DOG_AS_DOG_NODE: NodeDef = nodeProxy('dog-as-dog');
export const HOME_REST_NODE: NodeDef = nodeProxy('home-rest');
export const CALM_FIRST_NODE: NodeDef = nodeProxy('calm-first');
export const HARNESS_RITUAL_NODE: NodeDef = nodeProxy('harness-ritual');
export const DOORBELL_MAT_NODE: NodeDef = nodeProxy('doorbell-mat');
export const BLIND_CORNER_NODE: NodeDef = nodeProxy('blind-corner');
export const SLACK_U_NODE: NodeDef = nodeProxy('slack-u');
export const LEAVE_IT_NODE: NodeDef = nodeProxy('leave-it-intro');
export const BARKDOKU_INTRO_NODE: NodeDef = nodeProxy('calm-zone-intro');
export const SCOOTER_NODE: NodeDef = nodeProxy('scooter-crossing');
export const CLOSE_PASS_NODE: NodeDef = nodeProxy('close-narrow-street-pass');
export const URBAN_MIX_NODE: NodeDef = nodeProxy('urban-mix');
export const PARK_JOGGER_NODE: NodeDef = nodeProxy('park-jogger');
export const PARK_MIX_NODE: NodeDef = nodeProxy('park-mix');
export const BARK_HOME_NODE: NodeDef = nodeProxy('bark-home');
export const DESTROY_NODE: NodeDef = nodeProxy('destroy');
export const EAT_OBJECTS_NODE: NodeDef = nodeProxy('eat-objects');
export const ALONE_DOOR_NODE: NodeDef = nodeProxy('alone-door');

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
