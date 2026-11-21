import { FEEDBACK_ACTION_KINDS, STARTING_KINDS } from './feedbackKinds';

describe('STARTING_KINDS', () => {
  it('contains the starting set of Introduced actions and every starting kind is a key of FEEDBACK_ACTION_KINDS', () => {
    expect(STARTING_KINDS).toEqual([
      'marker-hit',
      'check-in-hit',
      'disengagement',
      'missed-reward-window',
      'late-marker-press',
      'reactive-marker',
      'wasted-marker',
      'missed-opportunity',
      'rigid-pull',
    ]);
    for (const kind of STARTING_KINDS) {
      expect(Object.prototype.hasOwnProperty.call(FEEDBACK_ACTION_KINDS, kind)).toBe(true);
    }
  });
});
