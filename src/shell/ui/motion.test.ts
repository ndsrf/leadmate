import { MAX_TRANSITION_MS, motionValues } from './motion';

describe('motionValues', () => {
  it('uses a slide of at most 350 ms normally', () => {
    const m = motionValues(false);
    expect(m.transition.kind).toBe('slide');
    expect(m.transition.durationMs).toBeLessThanOrEqual(MAX_TRANSITION_MS);
    expect(m.pulse).toBe(true);
    expect(m.pressSpring).not.toBeNull();
  });

  it('yields fade-only, no pulse and no spring under reduced motion', () => {
    const m = motionValues(true);
    expect(m.transition.kind).toBe('fade');
    expect(m.pulse).toBe(false);
    expect(m.pressSpring).toBeNull();
  });

  it('never blocks input during a transition', () => {
    expect(motionValues(false).transition.blocksInput).toBe(false);
    expect(motionValues(true).transition.blocksInput).toBe(false);
  });
});
