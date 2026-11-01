import type { TextKey } from '../i18n';
import type { AgeBand, Concern, PlanItem, Sex } from './concerns';
import { isHomeConcern } from './concerns';
import { tasteKind } from './onboarding/taste';
import { findLesson } from './lessons/content';
import { findMission } from './missions/content';
import { findNode } from './nodes/content';
import { findStretch } from './world';

export const CONCERN_KEYS: Record<Concern, TextKey> = {
  'bite-owner': 'concern.bite-owner',
  'bite-others': 'concern.bite-others',
  'bark-home': 'concern.bark-home',
  destroy: 'concern.destroy',
  'eat-objects': 'concern.eat-objects',
  'react-dog': 'concern.react-dog',
  'react-child': 'concern.react-child',
  'react-bicycle': 'concern.react-bicycle',
  'react-skateboard': 'concern.react-skateboard',
  'react-food': 'concern.react-food',
};

export const AGE_KEYS: Record<AgeBand, TextKey> = {
  puppy: 'age.puppy',
  adolescent: 'age.adolescent',
  adult: 'age.adult',
  senior: 'age.senior',
};

export const SEX_KEYS: Record<Sex, TextKey> = { male: 'sex.male', female: 'sex.female' };

/** The Payoff Screen lines for a Main Concern: what the Dog reacted to, and the body (a Home Behaviour says the plan will be tuned). */
export function payoffKeys(mainConcerns: readonly Concern[]): { reacted: TextKey; body: TextKey } {
  const kind = tasteKind(mainConcerns);
  // the Stage showed an outdoor reaction unless every pick is a Home Behaviour, which the plan will tune
  const body: TextKey = mainConcerns.length > 0 && mainConcerns.every(isHomeConcern) ? 'payoff.body.home' : 'payoff.body';
  switch (kind) {
    case 'child':
      return { reacted: 'payoff.reacted.child', body };
    case 'bicycle':
      return { reacted: 'payoff.reacted.bicycle', body };
    case 'skateboard':
      return { reacted: 'payoff.reacted.skateboard', body };
    case 'food':
      return { reacted: 'payoff.reacted.food', body };
    default:
      return { reacted: 'payoff.reacted', body };
  }
}

/** The text key of why a plan item is there: its Concern, else age or reaction time, else the default order. */
export function planReasonKey(item: PlanItem): TextKey {
  if (item.concern) return `plan.reason.${item.concern}`;
  if (item.because) return `plan.reason.${item.because}`;
  return 'plan.reason.default';
}

/** Who the Dog is in plan text: "él", "ella", or "tu perro" when sex is unset. */
export function whoKey(sex: Sex | null): TextKey {
  return sex === 'male' ? 'plan.who.male' : sex === 'female' ? 'plan.who.female' : 'plan.who.none';
}

/** The text key naming a Stretch: the title of its first Stop (a Lesson, normally); undefined for an unknown Stretch. */
export function stretchTitleKey(stretchId: string): TextKey | undefined {
  const found = findStretch(stretchId);
  const first = found?.stops[0];
  if (!first) return undefined;
  const title = first.kind === 'lesson' ? findLesson(first.id)?.title : first.kind === 'node' ? findNode(first.id)?.title : findMission(first.id)?.title;
  return title;
}
