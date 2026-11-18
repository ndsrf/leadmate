import { DIAGNOSTIC } from '../onboarding/diagnostic';
import {
  SIGNALS,
  RtdClass,
  RtdSignal,
  READ_THE_DOG,
  timerFor,
  newRound,
  stepRound,
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

describe('readTheDog - 1.3 newRound and stepRound time/phase', () => {
  it('initialises newRound at phase showing and ends at 24s', () => {
    let state = newRound(12345);
    expect(state.t).toBe(0);
    expect(state.phase).toBe('showing');
    expect(state.signal).toBeDefined();
    expect(state.timer).toBe(2.4);

    // Step by 24 seconds without answering
    // The signal will time out at 2.4s, enter pause (1.2s), then next signal, etc.
    let totalTime = 0;
    while (state.phase !== 'done') {
      state = stepRound(state, 0.1);
      totalTime += 0.1;
      if (totalTime > 30) break; // safety guard
    }
    expect(state.phase).toBe('done');
    expect(state.t).toBeGreaterThanOrEqual(READ_THE_DOG.roundSeconds);
  });

  it('pauses for pauseSeconds after right answer and wrongPauseSeconds after wrong/missed, ignoring answers during pause', () => {
    let state = newRound(42);
    const correctClass = SIGNALS[state.signal!].cls;
    const wrongClass: RtdClass = correctClass === 'calm' ? 'alert' : 'calm';

    // Right answer
    state = stepRound(state, 0.1, correctClass);
    expect(state.phase).toBe('pause');
    expect(state.pauseLeft).toBeCloseTo(READ_THE_DOG.pauseSeconds, 2);

    // Answering during pause is ignored
    const seqBefore = state.last?.seq;
    state = stepRound(state, 0.1, wrongClass);
    expect(state.last?.seq).toBe(seqBefore);

    // Step through the rest of the pause
    state = stepRound(state, 0.3);
    expect(state.phase).toBe('showing');

    // Wrong answer
    const currentCorrect = SIGNALS[state.signal!].cls;
    const currentWrong: RtdClass = currentCorrect === 'calm' ? 'alert' : 'calm';
    state = stepRound(state, 0.1, currentWrong);
    expect(state.phase).toBe('pause');
    expect(state.pauseLeft).toBeCloseTo(READ_THE_DOG.wrongPauseSeconds, 2);

    // Step through pause
    state = stepRound(state, 1.3);
    expect(state.phase).toBe('showing');

    // Let timer run out -> missed
    const timeout = state.timer;
    state = stepRound(state, timeout + 0.01);
    expect(state.phase).toBe('pause');
    expect(state.last?.kind).toBe('missed');
    expect(state.pauseLeft).toBeCloseTo(READ_THE_DOG.wrongPauseSeconds, 2);
  });

  it('counts an unanswered signal at round end as neither right nor missed', () => {
    let state = newRound(999);
    // Fast forward to 23.5s with dt
    state = { ...state, t: 23.5 };
    // Step by 0.6s to cross 24s while signal is open
    state = stepRound(state, 0.6);
    expect(state.phase).toBe('done');
    const totalRight = (Object.values(state.right) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    const totalMissed = (Object.values(state.missed) as number[]).reduce(
      (a, b) => a + b,
      0,
    );
    expect(totalRight).toBe(0);
    expect(totalMissed).toBe(0);
  });
});

describe('readTheDog - 1.4 answering', () => {
  it('closes right answer as right, wrong as wrong with no retry, ignores second answer on closed signal, rises seq once per event', () => {
    let state = newRound(777);
    const signal1 = state.signal!;
    const correct1 = SIGNALS[signal1].cls;
    const wrong1: RtdClass = correct1 === 'calm' ? 'alert' : 'calm';

    // Right answer
    state = stepRound(state, 0.1, correct1);
    expect(state.phase).toBe('pause');
    expect(state.last?.seq).toBe(1);
    expect(state.last?.kind).toBe('correct');
    expect(state.last?.signal).toBe(signal1);
    expect(state.last?.class).toBe(correct1);
    expect(state.right[correct1]).toBe(1);

    // Second answer while closed/in pause is ignored
    state = stepRound(state, 0.05, wrong1);
    expect(state.last?.seq).toBe(1);
    expect(state.right[correct1]).toBe(1);

    // Advance to next signal
    state = stepRound(state, 0.3);
    expect(state.phase).toBe('showing');
    const signal2 = state.signal!;
    const correct2 = SIGNALS[signal2].cls;
    const wrong2: RtdClass = correct2 === 'calm' ? 'alert' : 'calm';

    // Wrong answer
    state = stepRound(state, 0.1, wrong2);
    expect(state.phase).toBe('pause');
    expect(state.last?.seq).toBe(2);
    expect(state.last?.kind).toBe('wrong');
    expect(state.last?.signal).toBe(signal2);
    expect(state.last?.class).toBe(wrong2);
    expect(state.wrong[wrong2]).toBe(1);

    // No retry allowed: another answer while paused is ignored
    state = stepRound(state, 0.1, correct2);
    expect(state.last?.seq).toBe(2);
    expect(state.right[correct2]).toBe(0);
  });
});



