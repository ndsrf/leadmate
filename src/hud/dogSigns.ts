import { isDogLooking, type SimState } from '../sim/sim';
import type { DogSign } from '../sim/messages';
import { dogPose, type DogPose } from './pose';

/** What the Stage draws over or around the Dog right now (GLOSSARY: "Dog sign"); `StageScene.draw` and the sign inventory share it. */
export interface DogSignsShown {
  /** The yellow "!" of a Fixation. */
  fixation: boolean;
  signs: ReadonlySet<DogSign>;
}

export function dogSignsShown(state: SimState, pose: DogPose = dogPose(state)): DogSignsShown {
  const fixated = state.dogMode === 'fixated';
  const signs = new Set<DogSign>();
  if (pose.flowGlow) signs.add('sintonia');
  if (!fixated && pose.tier === 'alert' && !pose.headDown) signs.add('alert');
  if (pose.barking) signs.add('bark');
  if (pose.headDown) signs.add('scent');
  if (!fixated && isDogLooking(state)) signs.add('eye');
  if (pose.autopilot) signs.add('autopilot');
  return { fixation: fixated, signs };
}

/**
 * Turns the Dog signs drawn each frame into `dog-sign` (the first time a sign is drawn) and `dog-sign-gone` (the first time
 * it stops being drawn) calls. The signal gate of the scene lets each through once per Stage; this only reports the changes.
 */
export function createDogSignTracker(emit: (signal: 'dog-sign' | 'dog-sign-gone', sign: DogSign) => void): (shown: DogSignsShown) => void {
  let before: ReadonlySet<DogSign> = new Set();
  return (shown) => {
    for (const sign of shown.signs) if (!before.has(sign)) emit('dog-sign', sign);
    for (const sign of before) if (!shown.signs.has(sign)) emit('dog-sign-gone', sign);
    before = shown.signs;
  };
}
