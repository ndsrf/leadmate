import { newDogRecord, applyStage } from '../dogRecord';
import { es } from '../../i18n';
import { payloadWith } from '../testPayload';
import { diagnosticPosture, postureSpec } from '../ui/canine';
import { DIAGNOSTIC, DIAGNOSTIC_PAWS, diagnosticLatency, latencyBand, median, newDiagnostic, pawsFilled, recordDiagnostic, seedFromLatency, stepDiagnostic } from './diagnostic';

function play(seed: number, reactionOf: (n: number) => number | null) {
  let s = newDiagnostic(seed);
  const dt = 0.02;
  let n = 0;
  while (!s.done) {
    const shown = s.signalShownAt !== null;
    const wait = shown ? s.t - s.signalShownAt! : 0;
    const want = shown ? reactionOf(n) : null;
    const before = s.reactions.length;
    s = stepDiagnostic(s, dt, want !== null && wait >= want);
    if (s.reactions.length > before) n++;
  }
  return s;
}

describe('Diagnostic minigame', () => {
  it('lasts 15 seconds and records reactions', () => {
    const s = play(1, () => 0.3);
    expect(s.t).toBeGreaterThanOrEqual(DIAGNOSTIC.seconds);
    expect(s.reactions.length).toBeGreaterThan(4);
    expect(diagnosticLatency(s)).toBeCloseTo(0.3, 1);
  });

  it('counts an unanswered signal as the timeout and early taps separately', () => {
    const slow = play(2, () => null);
    expect(diagnosticLatency(slow)).toBe(DIAGNOSTIC.timeout);
    let s = newDiagnostic(3);
    s = stepDiagnostic(s, 0.01, true);
    expect(s.earlyTaps).toBe(1);
    expect(s.reactions).toEqual([]);
  });

  it('is the same for the same seed', () => {
    expect(play(5, () => 0.4)).toEqual(play(5, () => 0.4));
  });

  it('takes the median', () => {
    expect(median([0.5, 0.2, 0.9])).toBe(0.5);
    expect(median([0.2, 0.4])).toBeCloseTo(0.3);
    expect(median([])).toBe(DIAGNOSTIC.timeout);
  });

  it('labels the latency band', () => {
    expect(latencyBand(0.3)).toBe('quick');
    expect(latencyBand(0.45)).toBe('steady');
    expect(latencyBand(0.7)).toBe('slow');
  });
});

describe('seeding the Dog from the Diagnostic', () => {
  it('maps latency into the 0.1 to 0.4 band, edges included', () => {
    expect(seedFromLatency(0.25)).toBeCloseTo(0.4);
    expect(seedFromLatency(0.8)).toBeCloseTo(0.1);
    expect(seedFromLatency(0.1)).toBeCloseTo(0.4);
    expect(seedFromLatency(5)).toBeCloseTo(0.1);
    expect(seedFromLatency(0.525)).toBeCloseTo(0.25);
  });

  it('seeds once and moves to the plan', () => {
    const base = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'diagnostic' as const } };
    const first = recordDiagnostic(base, 0.3);
    expect(first.attributes.reconnectionLatency).toBeCloseTo(seedFromLatency(0.3));
    expect(first.onboarding).toMatchObject({ step: 'plan', diagnosticLatency: 0.3 });
    expect(recordDiagnostic(first, 0.7)).toBe(first);
  });

  it('leaves Learning Attributes unchanged when replayed after onboarding', () => {
    const played = applyStage(newDogRecord(), payloadWith({ posteSuccesses: 1, followMarks: 2 }), new Date());
    const done = { ...played, onboarding: { ...played.onboarding, step: 'done' as const, diagnosticLatency: 0.3 } };
    expect(recordDiagnostic(done, 0.9)).toBe(done);
    expect(recordDiagnostic(done, 0.9).attributes).toEqual(done.attributes);
  });
});

describe('the Diagnostic scene rules', () => {
  const run = (seed: number, seconds: number, tapWhenShown: boolean) => {
    let s = newDiagnostic(seed);
    for (let i = 0; i < seconds * 50 && !s.done; i++) s = stepDiagnostic(s, 0.02, tapWhenShown && s.signalShownAt !== null);
    return s;
  };

  it('records no latency for a tap before the signal', () => {
    const s = stepDiagnostic(newDiagnostic(3), 0.1, true);
    expect(s.signalShownAt).toBeNull();
    expect(s.reactions).toEqual([]);
    expect(s.earlyTaps).toBe(1);
    expect(pawsFilled(s)).toBe(0);
  });

  it('fills one paw per response and never past the row', () => {
    const s = run(5, 14, true);
    expect(s.reactions.length).toBeGreaterThan(DIAGNOSTIC_PAWS);
    expect(pawsFilled(s)).toBe(DIAGNOSTIC_PAWS);
    expect(pawsFilled({ reactions: [0.3, 0.4] })).toBe(2);
  });

  it('does not end early when the paws are full: it ends on the 15 seconds', () => {
    const early = run(5, 12, true);
    expect(pawsFilled(early)).toBe(DIAGNOSTIC_PAWS);
    expect(early.done).toBe(false);
    expect(run(5, 16, true).done).toBe(true);
  });

  it('does not count a signal that timed out as a response', () => {
    const s = run(5, 14, false);
    expect(s.reactions.every((r) => r === DIAGNOSTIC.timeout)).toBe(true);
    expect(pawsFilled(s)).toBe(0);
  });

  it('shows the Dog looking only while the signal is on', () => {
    expect(diagnosticPosture(false)).toBe('standing_waiting');
    expect(diagnosticPosture(true)).toBe('looking');
    expect(es[postureSpec('looking').cue]).toBeTruthy();
  });
});
