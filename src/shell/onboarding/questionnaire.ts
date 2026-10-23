import { DISTRACTOR_KINDS, type DistractorKind, type TriggerLevel } from '../../sim/learning';
import { setTriggerLevel, type DogRecord } from '../dogRecord';

/** The kinds the questionnaire asks about: every kind the simulation supports, and not `other`. */
export const QUESTION_KINDS: readonly DistractorKind[] = DISTRACTOR_KINDS.filter((k) => k !== 'other');

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
