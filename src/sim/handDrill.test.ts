import {
  buildCloseExercisePayload,
  createCloseExerciseState,
  handDrillConfig,
  noCloseExerciseInput,
  tickCloseExercise,
  type CloseExerciseEvent,
  type CloseExerciseInput,
  type CloseExerciseState,
} from './closeExercise';
import { distance } from './vec';
import { STAR_THRESHOLDS } from './payload';
import { DEFAULT_SNAPSHOT } from './learning';

const make = () => createCloseExerciseState(handDrillConfig, 7);
const run = (s: CloseExerciseState, seconds: number, input: Partial<CloseExerciseInput> = {}): CloseExerciseEvent[] => {
  const out: CloseExerciseEvent[] = [];
  const steps = Math.round(seconds / s.config.fixedStep);
  for (let i = 0; i < steps && !s.completed; i += 1) out.push(...tickCloseExercise(s, { ...noCloseExerciseInput, ...input }));
  return out;
};

describe('hand drill: stationary hand (task 1.2)', () => {
  it('uses the hand_drill scheme with a stationary hand kind', () => {
    const s = make();
    expect(s.config.controls).toBe('hand_drill');
    expect(s.config.distractor.kind).toBe('hand');
    expect(s.config.distractor.startPos).toEqual(s.config.distractor.endPos);
    run(s, 2);
    expect(s.distractor.pos).toEqual(s.config.distractor.startPos);
    expect(s.distractor.active).toBe(true);
  });

  it('keeps the Dog out of reach while the leash is gathered', () => {
    const s = make();
    run(s, 3, { gather: true });
    expect(distance(s.dog, s.distractor.pos)).toBeGreaterThan(1.5);
    expect(s.tension).not.toBe('rigid');
  });

  it('stops an ungathered lunge at the leash end, never touching the hand', () => {
    const s = make();
    let closest = Infinity;
    for (let i = 0; i < 60 * 12; i += 1) {
      tickCloseExercise(s, noCloseExerciseInput);
      closest = Math.min(closest, distance(s.dog, s.distractor.pos));
      if (s.completed) break;
    }
    expect(s.telemetry.lunges).toBeGreaterThan(0);
    expect(distance(s.handler, s.dog)).toBeLessThanOrEqual(s.config.leashMaxLength * 1.15 + 1e-6);
    expect(closest).toBeGreaterThan(0.1);
    expect(s.completed).toBe(false);
  });
});

describe('hand drill: no-fail result (task 1.3)', () => {
  it('completes on a calm hold followed by the reward window', () => {
    const s = make();
    run(s, 6.6, { gather: true });
    expect(s.subState.calmHeld).toBe(true);
    expect(s.rewardWindow).not.toBeNull();
    const events = run(s, 2, { gather: true });
    expect(s.completed).toBe(true);
    expect(s.success).toBe(true);
    expect(s.outcome).toBe('calm');
    expect(events.some((e) => e.type === 'exercise-complete' && e.success)).toBe(true);
  });

  it('does not end on lunges, and still reaches calm afterwards', () => {
    const s = make();
    run(s, 8); // ungathered: the Dog lunges
    expect(s.telemetry.lunges).toBeGreaterThan(0);
    expect(s.tier).toBe('reactive');
    expect(s.completed).toBe(false);
    run(s, 20, { gather: true });
    expect(s.subState.calmHeld).toBe(true);
    expect(s.outcome).toBe('calm');
    expect(buildCloseExercisePayload(s).lunges).toBe(s.telemetry.lunges);
  });

  it('times out at 60 s with a payload and no failure', () => {
    const s = make();
    run(s, 70);
    expect(s.completed).toBe(true);
    expect(s.time).toBeLessThan(60.1);
    expect(s.success).toBe(true);
    expect(s.outcome).toBe('not_calm');
    const payload = buildCloseExercisePayload(s);
    expect(payload.durationSeconds).toBeCloseTo(60, 0);
    expect(payload.handlingScore).toBeGreaterThanOrEqual(0);
    // completing earns the first star whatever the score is: the thresholds only gate stars 2 and 3
    expect(STAR_THRESHOLDS.two).toBeGreaterThan(0);
  });

  it('lunges lower the handling score', () => {
    const calm = make();
    run(calm, 14, { gather: true });
    const rough = make();
    run(rough, 8);
    run(rough, 20, { gather: true });
    expect(buildCloseExercisePayload(rough).handlingScore).toBeLessThan(buildCloseExercisePayload(calm).handlingScore);
  });
});

describe('hand drill: reward step (task 1.4)', () => {
  it('a calm mark lowers arousal and counts a hit', () => {
    const s = make();
    run(s, 6.6, { gather: true, marker: false });
    expect(s.rewardWindow).not.toBeNull();
    s.arousal = 8;
    const before = s.arousal;
    run(s, 0.05, { gather: true, marker: true });
    expect(s.telemetry.markerHits).toBe(1);
    expect(s.arousal).toBeLessThan(before);
  });

  it('a mistimed mark does not end the run', () => {
    const s = make();
    const events = run(s, 0.1, { gather: true, marker: true });
    expect(events.some((e) => e.type === 'marker-miss')).toBe(true);
    expect(s.completed).toBe(false);
  });
});

describe('hand drill trigger level', () => {
  it('ignores a Trigger Profile that has faded the hand to 0', () => {
    const faded = { ...DEFAULT_SNAPSHOT, triggerProfile: { ...DEFAULT_SNAPSHOT.triggerProfile, hand: 0 as const } };
    const s = createCloseExerciseState({ ...handDrillConfig, learning: faded }, 1);
    for (let i = 0; i < 400; i++) tickCloseExercise(s, noCloseExerciseInput);
    expect(s.arousal).toBeGreaterThan(5);
  });
});
