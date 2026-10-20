import { newDogRecord, applyStage } from '../dogRecord';
import { payloadWith } from '../testPayload';
import { DIAGNOSTIC, diagnosticLatency, latencyBand, median, newDiagnostic, recordDiagnostic, seedFromLatency, stepDiagnostic } from './diagnostic';

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
