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
