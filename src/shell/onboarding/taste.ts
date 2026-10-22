import type { TextKey } from '../../i18n';
import { defaultScenario, type ScenarioConfig } from '../../sim/config';
import { DEFAULT_ATTRIBUTES, DEFAULT_TRIGGER_PROFILE, type LearningSnapshot } from '../../sim/learning';

/** Seconds the taste Stage lasts at most; it ends sooner when the Dog goes Reactive. */
export const TASTE_SECONDS = 20;

/** How long the camera zooms in on the Handler and the Dog after the Dog goes Reactive, before the payoff shows. */
export const TASTE_LINGER_MS = 1500;

/** An untrained Dog: no Cue skill, every Trigger at the highest level, whatever the Dog record says. */
export const TASTE_SNAPSHOT: LearningSnapshot = {
  attributes: { ...DEFAULT_ATTRIBUTES, followChance: 0 },
  triggerProfile: { ...DEFAULT_TRIGGER_PROFILE, dog: 3 },
  equipment: 'collar',
  capacityMultiplier: 1,
  posture: 0,
};

/**
 * The taste Stage (ADR 0010): another Dog with its owner walks at the Dog from off-screen, closing to within sight before it triggers, built so
 * that nearly any play ends with the Dog Reactive. Its result is discarded, so nothing is learned.
 */
export const tasteScenario: ScenarioConfig = {
  ...defaultScenario,
  distractor: { ...defaultScenario.distractor, kind: 'dog', speed: 3, triggerRadius: 8, activateAfterMeters: 0, startOffset: 6, path: { from: { x: 36, y: 3 }, to: { x: -6, y: 3 } } },
  moreDistractors: [],
  learning: TASTE_SNAPSHOT,
  markBudget: 0,
  endCondition: { kind: 'time-limit', seconds: TASTE_SECONDS },
};

/** The control line shown over the Stage: not a Hint, never stored. */
export const TASTE_LINE_KEY: TextKey = 'onboarding.taste.control';
