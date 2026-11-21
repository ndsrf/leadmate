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
  return { fixation: fixated, signs };
}
