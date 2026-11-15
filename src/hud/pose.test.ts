import { defaultScenario } from '../sim/config';
import { runScripted, routeDirection } from '../sim/harness';
import { createState, noInput, tick, type SimInput } from '../sim/sim';
import { dogPose, gaitPeriod, walkClipFor } from './pose';

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

  describe('Canine Posture', () => {
    it('calm walking: level head, neutral ears and tail', () => {
      const s = createState(1, free);
      s.dogDesired = { x: 1, y: 0 };
      s.dogFacing = { x: 1, y: 0 };
      expect(dogPose(s)).toMatchObject({ head: 'level', ears: 'neutral', tail: 'neutral', gaze: 'ahead', action: 'walk' });
    });

    it('Check-in: gaze at the Handler, ears forward, wagging tail', () => {
      const s = createState(1, free);
      s.dogLookUntil = s.time + 1;
      expect(dogPose(s)).toMatchObject({ gaze: 'handler', ears: 'forward', tail: 'wagging' });
      s.dogLookUntil = s.time - 1;
      expect(dogPose(s)).toMatchObject({ tail: 'neutral' });
    });

    it('Alert: head up, ears forward, tail high', () => {
      const s = createState(1, free);
      s.arousal = 0.8 * s.dogTraits.reactivityThreshold;
      tick(s, noInput);
      expect(dogPose(s)).toMatchObject({ head: 'up', ears: 'forward', tail: 'high' });
    });

    it('Reactive and fixated: gaze at the Distractor, high tail, lunging', () => {
      const s = createState(1, free);
      s.arousal = 90;
      s.dogMode = 'fixated';
      tick(s, noInput);
      expect(dogPose(s)).toMatchObject({ gaze: 'distractor', tail: 'high', action: 'lunging' });
    });

    it('Rigid Pull without fixation: ears back; fixated keeps them forward', () => {
      const s = createState(1, free);
      s.tension = 'rigid';
      expect(dogPose(s).ears).toBe('back');
      s.dogMode = 'fixated';
      expect(dogPose(s).ears).not.toBe('back');
    });

    it('sniffing: head down, gaze on the ground, neutral tail', () => {
      const s = createState(1, free);
      s.dogMode = 'sniffing';
      expect(dogPose(s)).toMatchObject({ head: 'down', gaze: 'ground', tail: 'neutral', action: 'sniff' });
      s.dogDesired = { x: 0.3, y: 0 };
      expect(dogPose(s).action).toBe('sniff-walk');
    });

    it('looking away: gaze left or right of where the Dog faces', () => {
      const s = createState(1, free);
      s.dogFacing = { x: 1, y: 0 };
      s.dogDesired = { x: 0, y: 1 };
      expect(dogPose(s).gaze).toBe('away-left');
      s.dogDesired = { x: 0, y: -1 };
      expect(dogPose(s).gaze).toBe('away-right');
    });

    it('shows planted and marking only when the simulation has those modes', () => {
      const s = createState(1, free);
      expect(['planted', 'marking']).not.toContain(dogPose(s).action);
    });

    /** Walks a scent Stage until the Dog Plants at a hot Scent Spot (or marks a post) just ahead. */
    function stayAt(marking: boolean) {
      const s = createState(3, { ...defaultScenario, distractor: free.distractor, world: 6, scenery: [], scents: [{ pos: { x: 5, y: 0.5 }, strength: marking ? 'normal' : 'hot', marking }] });
      for (let i = 0; i < 600 && s.dogMode !== (marking ? 'marking' : 'planted'); i++) tick(s, { direction: { x: 1, y: 0 }, strength: 0.6, marker: false });
      return s;
    }

    it('shows a Plant: planted, nose down at the spot', () => {
      const s = stayAt(false);
      expect(s.dogMode).toBe('planted');
      expect(dogPose(s)).toMatchObject({ action: 'planted', gaze: 'ground', head: 'down', headDown: true });
      expect(walkClipFor(dogPose(s))).toBe('planted');
    });

    it('shows a marking: marking, not sniffing', () => {
      const s = stayAt(true);
      expect(s.dogMode).toBe('marking');
      expect(dogPose(s)).toMatchObject({ action: 'marking', headDown: false });
      expect(walkClipFor(dogPose(s))).toBe('mark');
    });

    it('maps a pose to one walking clip', () => {
      expect(walkClipFor({ action: 'lunging', gaze: 'distractor', tail: 'high' })).toBe('lunge');
      expect(walkClipFor({ action: 'walk', gaze: 'handler', tail: 'wagging' })).toBe('walk_wag');
      expect(walkClipFor({ action: 'walk', gaze: 'away-left', tail: 'neutral' })).toBe('look_l');
      expect(walkClipFor({ action: 'idle', gaze: 'ahead', tail: 'neutral' })).toBe('idle');
      expect(walkClipFor({ action: 'marking', gaze: 'ahead', tail: 'neutral' })).toBe('mark');
    });

    it('deriving poses does not change the debrief payload', () => {
      const run = (derive: boolean) =>
        JSON.stringify(
          runScripted(7, (st) => {
            if (derive) dogPose(st);
            return { direction: routeDirection(st.config, st.handler), strength: 0.5, marker: false };
          }, defaultScenario, 60).payload,
        );
      expect(run(true)).toBe(run(false));
    });
  });
});
