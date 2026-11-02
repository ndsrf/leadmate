import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { DEFAULT_ATTRIBUTES, DEFAULT_TRIGGER_PROFILE, type DistractorKind, type LearningSnapshot } from '../../sim/learning';
import { isHomeConcern, KIND_OF_OUTDOOR, type Concern } from '../concerns';

/** Seconds the taste Stage lasts at most; it ends sooner when the Dog goes Reactive. */
export const TASTE_SECONDS = 20;

/** How long the camera zooms in on the Handler and the Dog after the Dog goes Reactive, before the payoff shows. */
export const TASTE_LINGER_MS = 1500;

/** Food on the ground does not walk at the Dog, so it is dropped within reach after this many seconds and a Handler who stands still still meets it. */
const FOOD_APPEARS_SECONDS = 3;

/** The Distractor kind the taste Stage shows: that of the first outdoor Main Concern, the approaching dog otherwise. */
export function tasteKind(mainConcerns: readonly Concern[]): DistractorKind {
  const outdoor = mainConcerns.find((c) => !isHomeConcern(c));
  return outdoor === undefined || isHomeConcern(outdoor) ? 'dog' : KIND_OF_OUTDOOR[outdoor];
}

/** An untrained Dog: no Cue skill, the Distractor's kind at the highest level, whatever the Dog record says. */
export function tasteSnapshot(kind: DistractorKind = 'dog'): LearningSnapshot {
  return {
    attributes: { ...DEFAULT_ATTRIBUTES, followChance: 0 },
    triggerProfile: { ...DEFAULT_TRIGGER_PROFILE, [kind]: 3 },
    equipment: 'collar',
    capacityMultiplier: 1,
    posture: 0,
  };
}

export const TASTE_SNAPSHOT: LearningSnapshot = tasteSnapshot('dog');

/** Speed and trigger radius of each kind of Distractor in the taste Stage; it closes on the Dog from off-screen on the same path. */
const TASTE_DISTRACTOR: Partial<Record<DistractorKind, { speed: number; triggerRadius: number }>> = {
  dog: { speed: 3, triggerRadius: 8 },
  child: { speed: 2.5, triggerRadius: 8 },
  bicycle: { speed: 4.5, triggerRadius: 12 },
  skateboard: { speed: 4, triggerRadius: 10 },
};

/**
 * The taste Stage (ADR 0010, ADR 0019): a Distractor of the Main Concern's kind (another Dog when it is a Home Behaviour or
 * none) walks at the Dog from off-screen, closing to within sight before it triggers, built so that nearly any play ends
 * with the Dog Reactive. It stays a leash Stage for everyone. Its result is discarded, so nothing is learned.
 */
export function tasteScenarioFor(mainConcerns: readonly Concern[]): ScenarioConfig {
  const kind = tasteKind(mainConcerns);
  const base = TASTE_DISTRACTOR[kind];
  const path = { from: { x: 36, y: 3 }, to: { x: -6, y: 3 } };
  const distractor =
    kind === 'food'
      ? { ...defaultScenario.distractor, kind, speed: 0, salience: 6, triggerRadius: 8, activateAfterMeters: 0, spawnAtSeconds: FOOD_APPEARS_SECONDS, startOffset: 6, path: { from: { x: 8, y: 1 }, to: { x: 8, y: 1 } } }
      : { ...defaultScenario.distractor, kind, ...base!, activateAfterMeters: 0, startOffset: 6, path };
  return {
    ...defaultScenario,
    distractor,
    moreDistractors: [],
    learning: tasteSnapshot(kind),
    markBudget: 0,
    endCondition: { kind: 'time-limit', seconds: TASTE_SECONDS },
  };
}

/** The approaching-dog taste Stage, which a Home Behaviour or no Main Concern gets. */
export const tasteScenario: ScenarioConfig = tasteScenarioFor([]);
