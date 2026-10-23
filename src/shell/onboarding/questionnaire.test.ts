import { DISTRACTOR_KINDS } from '../../sim/learning';
import { newDogRecord } from '../dogRecord';
import { ANSWERS, answerOf, applyAnswer, chipsOf, INTENSITIES, levelOf, QUESTION_KINDS, selectKind, setIntensity } from './questionnaire';

describe('Trigger Profile questionnaire', () => {
  it('asks about every supported kind and not about other', () => {
    expect(QUESTION_KINDS).toEqual(DISTRACTOR_KINDS.filter((k) => k !== 'other'));
    expect(QUESTION_KINDS).not.toContain('other');
  });

  it('maps never, a little, often and a lot to levels 0 to 3', () => {
    expect(ANSWERS.map((a) => levelOf(a.id))).toEqual([0, 1, 2, 3]);
    expect(([0, 1, 2, 3] as const).map(answerOf)).toEqual(['never', 'little', 'often', 'alot']);
  });

  it('turns answers into the Trigger Profile', () => {
    let r = newDogRecord();
    r = applyAnswer(r, 'bicycle', 'alot');
    r = applyAnswer(r, 'child', 'never');
    expect(r.triggerProfile.bicycle).toBe(3);
    expect(r.triggerProfile.child).toBe(0);
    expect(r.triggerProfile.other).toBe(2);
  });

  it('resets the calm counts of the answered kind like the settings editor', () => {
    const r = applyAnswer({ ...newDogRecord(), calmCounts: { dog: 4 } }, 'dog', 'little');
    expect(r.calmCounts.dog).toBe(0);
  });
});

describe('trigger chips', () => {
  it('lists the selected kinds with their saved intensity', () => {
    let r = newDogRecord();
    r = selectKind(selectKind(r, 'bicycle', true), 'child', false);
    r = setIntensity(r, 'bicycle', 'alot');
    expect(chipsOf(r.triggerProfile)).toContainEqual({ kind: 'bicycle', intensity: 'alot' });
    expect(chipsOf(r.triggerProfile).map((c) => c.kind)).not.toContain('child');
  });

  it('shows an existing profile as selected at its saved intensity', () => {
    const r = { ...newDogRecord(), triggerProfile: { ...newDogRecord().triggerProfile, dog: 1 as const, skateboard: 3 as const, food: 0 as const } };
    const chips = chipsOf(r.triggerProfile);
    expect(chips).toContainEqual({ kind: 'dog', intensity: 'little' });
    expect(chips).toContainEqual({ kind: 'skateboard', intensity: 'alot' });
    expect(chips.map((c) => c.kind)).not.toContain('food');
  });

  it('defaults a newly selected chip to level 2', () => {
    const start = { ...newDogRecord(), triggerProfile: { ...newDogRecord().triggerProfile, bicycle: 0 as const } };
    expect(selectKind(start, 'bicycle', true).triggerProfile.bicycle).toBe(2);
  });

  it('keeps the saved intensity when an already selected chip is selected again', () => {
    const start = setIntensity(newDogRecord(), 'bicycle', 'little');
    expect(selectKind(start, 'bicycle', true)).toBe(start);
  });

  it('maps the three steps to levels 1 to 3 and a deselect to level 0', () => {
    let r = newDogRecord();
    r = setIntensity(r, 'bicycle', 'little');
    expect(r.triggerProfile.bicycle).toBe(1);
    r = setIntensity(r, 'bicycle', 'alot');
    expect(r.triggerProfile.bicycle).toBe(3);
    r = selectKind(r, 'bicycle', false);
    expect(r.triggerProfile.bicycle).toBe(0);
    expect(INTENSITIES.map((i) => i.level)).toEqual([1, 2, 3]);
  });

  it('leaves the other kinds alone and never asks about unsupported ones', () => {
    const before = newDogRecord();
    const after = setIntensity(before, 'bicycle', 'alot');
    expect(after.triggerProfile.child).toBe(before.triggerProfile.child);
    expect(chipsOf(after.triggerProfile).map((c) => c.kind)).not.toContain('other');
  });
});
