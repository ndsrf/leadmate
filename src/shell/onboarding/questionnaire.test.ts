import { DISTRACTOR_KINDS } from '../../sim/learning';
import { newDogRecord } from '../dogRecord';
import { ANSWERS, answerOf, applyAnswer, levelOf, QUESTION_KINDS } from './questionnaire';

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
