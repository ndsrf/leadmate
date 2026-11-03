import { DISTRACTOR_KINDS, type DistractorKind, type TriggerLevel } from '../../sim/learning';
import { HOME_CONCERNS, isHomeConcern, KIND_OF_OUTDOOR, MAX_MAIN_CONCERNS, type Concern, type ConcernLevel, type HomeConcern } from '../concerns';
import { setHomeConcern, setMainConcerns, setTriggerLevel, type DogRecord } from '../dogRecord';

/** The kinds the questionnaire asks about: every kind the simulation supports, and not `other`. */
export const QUESTION_KINDS: readonly DistractorKind[] = DISTRACTOR_KINDS.filter((k) => k !== 'other' && k !== 'hand');

/** The four answers, in the order shown; each is the Trigger Profile level it maps to. */
export const ANSWERS = [
  { id: 'never', level: 0 },
  { id: 'little', level: 1 },
  { id: 'often', level: 2 },
  { id: 'alot', level: 3 },
] as const satisfies readonly { id: string; level: TriggerLevel }[];
export type AnswerId = (typeof ANSWERS)[number]['id'];

export const levelOf = (answer: AnswerId): TriggerLevel => ANSWERS.find((a) => a.id === answer)!.level;
export const answerOf = (level: TriggerLevel): AnswerId => ANSWERS.find((a) => a.level === level)!.id;

/** Saves one answer to the Trigger Profile through the same path as the settings editor. */
export function applyAnswer(record: DogRecord, kind: DistractorKind, answer: AnswerId): DogRecord {
  return setTriggerLevel(record, kind, levelOf(answer));
}

/** The three intensities a selected trigger chip offers, in the order shown: Trigger Profile levels 1 to 3. */
export type IntensityId = Exclude<AnswerId, 'never'>;
export const INTENSITIES = ANSWERS.filter((a): a is Extract<(typeof ANSWERS)[number], { id: IntensityId }> => a.level > 0);

/** The intensity a chip gets when it is first selected ("often"). */
export const DEFAULT_INTENSITY: IntensityId = 'often';

/** The kinds the Dog reacts to (level above 0) with the intensity saved for each, in questionnaire order. */
export function chipsOf(profile: DogRecord['triggerProfile']): { kind: DistractorKind; intensity: IntensityId }[] {
  return QUESTION_KINDS.filter((k) => profile[k] > 0).map((kind) => ({ kind, intensity: answerOf(profile[kind]) as IntensityId }));
}

/** Selecting a chip keeps the intensity the kind already has, or uses "often"; deselecting returns the kind to level 0. */
export function selectKind(record: DogRecord, kind: DistractorKind, selected: boolean): DogRecord {
  if (!selected) return applyAnswer(record, kind, 'never');
  return record.triggerProfile[kind] > 0 ? record : applyAnswer(record, kind, DEFAULT_INTENSITY);
}

/** Sets how strongly a selected kind reacts; this also selects the kind. */
export function setIntensity(record: DogRecord, kind: DistractorKind, intensity: IntensityId): DogRecord {
  return applyAnswer(record, kind, intensity);
}

/** The home-behaviour concerns the Dog has (level above 0) with the intensity saved for each, in questionnaire order. */
export function homeChipsOf(homeConcerns: DogRecord['homeConcerns']): { concern: HomeConcern; intensity: IntensityId }[] {
  return HOME_CONCERNS.filter((c) => homeConcerns[c] !== undefined).map((concern) => ({ concern, intensity: answerOf(homeConcerns[concern] as TriggerLevel) as IntensityId }));
}

/** Selecting a home chip keeps its level or uses "often"; deselecting removes the concern. */
export function selectHomeConcern(record: DogRecord, concern: HomeConcern, selected: boolean): DogRecord {
  if (!selected) return setHomeConcern(record, concern, 0);
  return record.homeConcerns[concern] ? record : setHomeConcern(record, concern, levelOf(DEFAULT_INTENSITY) as ConcernLevel);
}

/** Sets how strongly a home concern shows; this also selects it. */
export function setHomeIntensity(record: DogRecord, concern: HomeConcern, intensity: IntensityId): DogRecord {
  return setHomeConcern(record, concern, levelOf(intensity) as ConcernLevel);
}

/** Selects a Concern in the questionnaire, at "often" unless it already has a level. */
function selectConcern(record: DogRecord, concern: Concern): DogRecord {
  return isHomeConcern(concern) ? selectHomeConcern(record, concern, true) : selectKind(record, KIND_OF_OUTDOOR[concern], true);
}

/**
 * Sets the Main Concerns (at most three, in the order given). Each one is also selected in the questionnaire, so it never
 * shows as a Main Concern the Dog does not have.
 */
export function chooseMainConcerns(record: DogRecord, concerns: readonly Concern[]): DogRecord {
  const next = setMainConcerns(record, concerns);
  return next.mainConcerns.reduce(selectConcern, next);
}

/** Picks or unpicks one Main Concern; picking a fourth changes nothing. */
export function toggleMainConcern(record: DogRecord, concern: Concern): DogRecord {
  if (record.mainConcerns.includes(concern)) return setMainConcerns(record, record.mainConcerns.filter((c) => c !== concern));
  if (record.mainConcerns.length >= MAX_MAIN_CONCERNS) return record;
  return chooseMainConcerns(record, [...record.mainConcerns, concern]);
}
