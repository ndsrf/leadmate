import { DIAGNOSTIC } from '../onboarding/diagnostic';
import {
  SIGNALS,
  RtdClass,
  RtdSignal,
  READ_THE_DOG,
  timerFor,
} from './readTheDog';

describe('readTheDog - 1.1 signal table', () => {
  it('defines exactly nine signals matching design Decision 2', () => {
    const keys = Object.keys(SIGNALS) as RtdSignal[];
    expect(keys).toHaveLength(9);
    expect(SIGNALS).toEqual({
      soft_loose: { cls: 'calm', subtle: false },
      play_bow: { cls: 'calm', subtle: false },
      loose_wag: { cls: 'calm', subtle: true },
      ears_up_still: { cls: 'alert', subtle: false },
      lip_lick: { cls: 'alert', subtle: true },
      whale_eye: { cls: 'alert', subtle: true },
      freeze_stare: { cls: 'about_to_react', subtle: false },
      hackles_up: { cls: 'about_to_react', subtle: false },
      stiff_closed_mouth: { cls: 'about_to_react', subtle: true },
    });
  });

  it('ensures every class has at least one obvious signal', () => {
    const classes: RtdClass[] = ['calm', 'alert', 'about_to_react'];
    for (const cls of classes) {
      const obvious = Object.values(SIGNALS).filter(
        (s) => s.cls === cls && !s.subtle,
      );
      expect(obvious.length).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('readTheDog - 1.2 constants and timerFor', () => {
  it('defines READ_THE_DOG constants with missSeconds from DIAGNOSTIC.timeout', () => {
    expect(READ_THE_DOG.roundSeconds).toBe(24);
    expect(READ_THE_DOG.pauseSeconds).toBe(0.35);
    expect(READ_THE_DOG.wrongPauseSeconds).toBe(1.2);
    expect(READ_THE_DOG.subtleFromLevel).toBe(2);
    expect(READ_THE_DOG.upAfter).toBe(3);
    expect(READ_THE_DOG.downAfter).toBe(2);
    expect(READ_THE_DOG.missWeight).toBe(2);
    expect(READ_THE_DOG.rightWeight).toBe(-1);
    expect(READ_THE_DOG.maxWeight).toBe(5);
    expect(READ_THE_DOG.baseWeight).toBe(1);
    expect(READ_THE_DOG.decisionAllowance).toBe(0.45);
    expect(READ_THE_DOG.missSeconds).toBe(DIAGNOSTIC.timeout);
    expect(READ_THE_DOG.screenReaderTimer).toBe(6);
    expect(READ_THE_DOG.bigEvery).toBe(5);
    expect(READ_THE_DOG.basePoints).toBe(100);
  });

  it('timerFor(level, opts) follows the ladder and options', () => {
    expect(timerFor(0)).toBe(2.4);
    for (let l = 1; l < READ_THE_DOG.timers.length; l++) {
      expect(timerFor(l)).toBeLessThan(timerFor(l - 1));
      expect(timerFor(l)).toBeGreaterThanOrEqual(1.0);
    }
    // Clamping to ladder bound (never under 1.0 s)
    expect(timerFor(10)).toBeGreaterThanOrEqual(1.0);
    expect(timerFor(10)).toBe(1.0);

    // Screen reader option gives screenReaderTimer (6 s) at every level
    expect(timerFor(0, { screenReader: true })).toBe(READ_THE_DOG.screenReaderTimer);
    expect(timerFor(3, { screenReader: true })).toBe(6);
    expect(timerFor(5, { screenReader: true })).toBe(6);
  });
});

