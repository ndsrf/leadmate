import { newDogRecord } from '../dogRecord';
import { finishSetup, setupStart, SETUP_PARTS } from './setup';

describe('setup', () => {
  it('starts at the Equipment part for a new Dog', () => {
    expect(setupStart(newDogRecord())).toBe('equipment');
  });

  it('resumes at the age and sex part once weights were entered', () => {
    expect(setupStart({ ...newDogRecord(), weights: { dogKg: 20, handlerKg: 70 } })).toBe('about');
  });

  it('moves on to the Diagnostic when finished and keeps the answers', () => {
    const r = finishSetup({ ...newDogRecord(), equipment: 'harness' });
    expect(r.onboarding.step).toBe('diagnostic');
    expect(r.equipment).toBe('harness');
  });
});

describe('setup parts', () => {
  it('counts five parts in order, so the stepper reads 1 of 5 to 5 of 5', () => {
    expect(SETUP_PARTS).toEqual(['equipment', 'weights', 'about', 'home', 'questions']);
  });

  it('keeps back inside setup: it changes no persisted step', () => {
    const r = newDogRecord();
    expect(setupStart(r)).toBe(SETUP_PARTS[0]);
    expect(r.onboarding.step).toBe('welcome');
  });
});
