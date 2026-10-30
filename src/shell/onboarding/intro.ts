import type { Translate } from '../../i18n';
import type { DogRecord } from '../dogRecord';
import type { BreedId } from './breeds';
import type { DogCoat } from './look';
import { cleanDogName } from './name';
import { nextStep, type OnboardingStep } from './flow';

/** The record moved on from `from`, unchanged when it is no longer at that step (a late or repeated event). */
function leave(record: DogRecord, from: OnboardingStep, change: Partial<DogRecord> = {}): DogRecord {
  if (record.onboarding.step !== from) return record;
  return { ...record, ...change, onboarding: { ...record.onboarding, step: nextStep(from) } };
}

/** The welcome screen's button. */
export function leaveWelcome(record: DogRecord): DogRecord {
  return leave(record, 'welcome');
}

/** The name-and-look screen: stores the name, coat and breed and moves to the taste. A blank or too long name changes nothing. */
export function saveNameAndLook(record: DogRecord, rawName: string, coat: DogCoat, breed: BreedId = record.breed): DogRecord {
  const name = cleanDogName(rawName);
  return name === null ? record : leave(record, 'dog', { name, coat, breed });
}

/**
 * The payoff over the taste Stage was dismissed (the Dog went Reactive, or the time ran out). Only the step changes: the
 * Stage's payload is never applied, so nothing is learned from it (ADR 0010).
 */
export function completeTaste(record: DogRecord): DogRecord {
  return leave(record, 'taste');
}

/**
 * Replaces `{name}` in catalog text with the Dog's name, or the neutral "your Dog" text when it has none, capitalised
 * where it starts a sentence.
 */
export function withDogName(text: string, name: string, neutral: string): string {
  if (name !== '') return text.split('{name}').join(name);
  const upper = neutral.charAt(0).toUpperCase() + neutral.slice(1);
  return text
    .replace(/(^|[.!?:]\s+)([¿¡«]?)\{name\}/g, (_m, before: string, mark: string) => `${before}${mark}${upper}`)
    .split('{name}')
    .join(neutral);
}

/** A translator that fills `{name}` in every text it returns (see `withDogName`). */
export function namedTranslator(t: Translate, name: string): Translate {
  const neutral = t('dog.neutral');
  return (key) => withDogName(t(key), name, neutral);
}

/** Settings: sets or edits the name; a blank or too long name keeps the one the Dog has. */
export function renameDog(record: DogRecord, rawName: string): DogRecord {
  const name = cleanDogName(rawName);
  return name === null || name === record.name ? record : { ...record, name };
}
