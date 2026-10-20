import { defaultScenario } from '../sim/config';
import { createState, noInput, tick, type SimInput } from '../sim/sim';
import { dogPose, gaitPeriod } from './pose';

const free = { ...defaultScenario, leashLength: 100, dogGoalSpeed: 0, distractor: { ...defaultScenario.distractor, activateAfterMeters: 1e9 } };

describe('Dog pose', () => {
  it('is relaxed when Calm', () => {
    const p = dogPose(createState(1, free));
    expect(p).toMatchObject({ tier: 'calm', headUp: false, headDown: false, barking: false, lunging: false, trotting: false, flowGlow: false });
  });

  it('perks up when Alert, without barking', () => {
    const s = createState(1, free);
    s.arousal = 0.8 * s.dogTraits.reactivityThreshold;
    tick(s, noInput);
    expect(dogPose(s)).toMatchObject({ tier: 'alert', headUp: true, barking: false, lunging: false });
  });

  it('barks and lunges when Reactive and fixated', () => {
    const s = createState(1, free);
    s.arousal = 90;
    s.dogMode = 'fixated';
    tick(s, noInput);
    expect(dogPose(s)).toMatchObject({ tier: 'reactive', headUp: true, barking: true, lunging: true });
  });

  it('lowers its head while sniffing', () => {
    const s = createState(1, free);
    s.dogMode = 'sniffing';
    expect(dogPose(s)).toMatchObject({ headDown: true, headUp: false });
  });

  it('trots with a green glow exactly while Sintonía is active', () => {
    const s = createState(1, free);
    const arc = (): SimInput => ({ direction: { x: Math.cos(s.time), y: Math.sin(s.time) }, strength: 0.6, marker: false });
    for (let i = 0; i < 3 * 60; i++) tick(s, arc());
    expect(dogPose(s)).toMatchObject({ trotting: true, flowGlow: true });
    expect(gaitPeriod(dogPose(s))).toBeLessThan(gaitPeriod({ trotting: false }));
    for (let i = 0; i < 10; i++) tick(s, noInput);
    expect(dogPose(s)).toMatchObject({ trotting: false, flowGlow: false });
  });
});
