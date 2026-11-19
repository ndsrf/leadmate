import { FeedbackDecider } from '../../src/hud/feedback';
import type { SimEvent } from '../../src/sim/sim';
import { isIntroduced, resolveIntroducedKinds } from './introducedKinds';

const follow: SimEvent = { type: 'dog-follow', time: 0 };
const checkIn: SimEvent = { type: 'check-in-hit', time: 0, grade: 'good' };

describe('Introduced kinds of a started Stage', () => {
  it('prefers the Stage options, then the last start message, else leaves the set absent', () => {
    expect(resolveIntroducedKinds(['a'], ['b'])).toEqual(['a']);
    expect(resolveIntroducedKinds(undefined, ['b'])).toEqual(['b']);
    expect(resolveIntroducedKinds(undefined, undefined)).toBeUndefined();
  });

  it('answers every kind without the field and only the given kinds with it', () => {
    const run = (set: readonly string[] | undefined) => new FeedbackDecider({ introducedKinds: set }).step({ time: 0, events: [follow, checkIn] });
    expect(new FeedbackDecider({ introducedKinds: undefined }).step({ time: 0, events: [follow] })?.kind).toBe('followed-turn');
    expect(run(['check-in-hit'])?.kind).toBe('check-in-hit');
    expect(new FeedbackDecider({ introducedKinds: ['check-in-hit'] }).step({ time: 0, events: [follow] })).toBeNull();
  });

  it('hides Go Sniff unless go-sniff is Introduced or the field is absent', () => {
    expect(isIntroduced(undefined, 'go-sniff')).toBe(true);
    expect(isIntroduced(['check-in-hit'], 'go-sniff')).toBe(false);
    expect(isIntroduced(['check-in-hit', 'go-sniff'], 'go-sniff')).toBe(true);
  });
});
