import { defaultScenario } from '../sim/config';
import { createState, noInput, setPaused, tick, type SimState } from '../sim/sim';
import { tasteScenarioFor } from '../shell/onboarding/taste';
import { WARMUP_SECONDS, warmupScenario } from '../shell/rusty';
import { countdownSeconds } from './countdown';

const walk = () => createState(1, warmupScenario(defaultScenario));
const left = (s: SimState) => countdownSeconds(s.config, s.time);
function run(s: SimState, seconds: number): void {
  for (let i = 0; i < Math.round(seconds / s.config.fixedStep); i++) tick(s, noInput);
}

describe('warm-up countdown', () => {
  it('starts at 40', () => {
    expect(WARMUP_SECONDS).toBe(40);
    expect(left(walk())).toBe(40);
  });

  it('counts down as the walk runs, in whole seconds', () => {
    const s = walk();
    run(s, 0.5);
    expect(left(s)).toBe(40);
    run(s, 0.5);
    expect(left(s)).toBe(39);
    run(s, 9);
    expect(left(s)).toBe(30);
    run(s, 29);
    expect(left(s)).toBe(1);
  });

  it('shows every second once, in order', () => {
    const s = walk();
    const shown = [left(s)];
    while (!s.ended) {
      tick(s, noInput);
      if (left(s) !== shown[shown.length - 1]) shown.push(left(s));
    }
    expect(shown).toEqual(Array.from({ length: 41 }, (_, i) => 40 - i));
  });

  it('stands still while the walk is paused', () => {
    const s = walk();
    run(s, 5);
    setPaused(s, true);
    run(s, 20);
    expect(left(s)).toBe(35);
    setPaused(s, false);
    run(s, 1);
    expect(left(s)).toBe(34);
  });

  it('reaches 0 exactly when the walk ends', () => {
    const s = walk();
    while (!s.ended) {
      expect(left(s)).toBeGreaterThan(0);
      tick(s, noInput);
    }
    expect(left(s)).toBe(0);
    expect(s.time).toBeCloseTo(WARMUP_SECONDS, 1);
  });

  it('is absent from every other Stage, timed or not', () => {
    expect(countdownSeconds(defaultScenario, 0)).toBeNull();
    const taste = { ...defaultScenario, ...tasteScenarioFor([]) };
    expect(taste.endCondition.kind).toBe('time-limit');
    expect(countdownSeconds(taste, 0)).toBeNull();
  });
});
