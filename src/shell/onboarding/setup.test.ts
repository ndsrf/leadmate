import { newDogRecord } from '../dogRecord';
import { finishSetup, setupStart } from './setup';

describe('setup', () => {
  it('starts at the Equipment part for a new Dog', () => {
    expect(setupStart(newDogRecord())).toBe('equipment');
  });

  it('resumes at the questionnaire once weights were entered', () => {
    expect(setupStart({ ...newDogRecord(), weights: { dogKg: 20, handlerKg: 70 } })).toBe('questions');
  });

  it('moves on to the Diagnostic when finished and keeps the answers', () => {
    const r = finishSetup({ ...newDogRecord(), equipment: 'harness' });
    expect(r.onboarding.step).toBe('diagnostic');
    expect(r.equipment).toBe('harness');
  });
});
