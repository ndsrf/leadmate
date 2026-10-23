import type { DogRecord } from '../dogRecord';
import { nextStep } from './flow';

export type SetupPart = 'equipment' | 'weights' | 'questions';

/** The parts in the order shown; the stepper counts them ("1 of 3") and back goes to the one before. */
export const SETUP_PARTS: readonly SetupPart[] = ['equipment', 'weights', 'questions'];

/** Where setup resumes: entered weights mean the Equipment and weights parts were passed. */
export function setupStart(record: DogRecord): SetupPart {
  return record.weights.dogKg !== null && record.weights.handlerKg !== null ? 'questions' : 'equipment';
}

/** Leaves setup for the Diagnostic. */
export function finishSetup(record: DogRecord): DogRecord {
  return { ...record, onboarding: { ...record.onboarding, step: nextStep('setup') } };
}
