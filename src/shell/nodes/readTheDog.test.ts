import { DIAGNOSTIC } from '../onboarding/diagnostic';
import { latencyBand } from '../onboarding/latency';
import {
  SIGNALS,
  RtdClass,
  RtdSignal,
  READ_THE_DOG,
  timerFor,
  newRound,
  stepRound,
  drawNextSignal,
  roundResult,
  roundLatency,
  carryOf,
  replaySeed,
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

describe('readTheDog - 1.5 Combo and score', () => {
  it('builds combo, preserves bestCombo on break, score grows with timer left and combo, wrong/missed never subtract', () => {
    let state = newRound(101);

    // Answer 1: fast answer with almost full timer left (timeLeft ~ 2.3s out of 2.4s)
    state = stepRound(state, 0.1);
    const cls1 = SIGNALS[state.signal!].cls;
    state = stepRound(state, 0.05, cls1);
    expect(state.combo).toBe(1);
    expect(state.bestCombo).toBe(1);
    const score1 = state.score;
    // Expected: round(100 * (0.5 + 0.5 * (2.25 / 2.4)) * (1 + 0.1 * 0))
    // 100 * (0.5 + 0.5 * 0.9375) * 1.0 = round(96.875) = 97
    expect(score1).toBeGreaterThan(90);

    // Advance through pause
    state = stepRound(state, 0.4);

    // Answer 2: slower answer (let 1.5s pass out of 2.4s timer, timeLeft ~ 0.9s)
    state = stepRound(state, 1.5);
    const cls2 = SIGNALS[state.signal!].cls;
    state = stepRound(state, 0.05, cls2);
    expect(state.combo).toBe(2);
    expect(state.bestCombo).toBe(2);
    const score2 = state.score;
    const added2 = score2 - score1;
    // For combo 2, multiplier is 1.1. But time ratio is 0.85/2.4 = 0.354.
    // round(100 * (0.5 + 0.5 * 0.354) * 1.1) = round(100 * 0.677 * 1.1) = 74

    // Advance through pause
    state = stepRound(state, 0.4);

    // Answer 3: fast answer at combo 3
    state = stepRound(state, 0.1);
    const cls3 = SIGNALS[state.signal!].cls;
    state = stepRound(state, 0.05, cls3);
    expect(state.combo).toBe(3);
    expect(state.bestCombo).toBe(3);
    const score3 = state.score;
    const added3 = score3 - score2;
    // At combo 3, fast answer gives more than added2:
    expect(added3).toBeGreaterThan(added2);

    // Advance through pause
    state = stepRound(state, 0.4);

    // Break combo with wrong answer
    const wrongCls: RtdClass = SIGNALS[state.signal!].cls === 'calm' ? 'alert' : 'calm';
    state = stepRound(state, 0.1, wrongCls);
    expect(state.combo).toBe(0);
    expect(state.bestCombo).toBe(3);
    expect(state.score).toBe(score3); // wrong never subtracts

    // Advance through pause
    state = stepRound(state, 1.3);

    // Break again with timeout (miss)
    const timeout = state.timer;
    state = stepRound(state, timeout + 0.05);
    expect(state.combo).toBe(0);
    expect(state.bestCombo).toBe(3);
    expect(state.score).toBe(score3); // miss never subtracts
  });
});

describe('readTheDog - 1.6 adaptive level', () => {
  it('raises level after 3 right in a row, resets streaks on level change (4 right from 0 is level 1)', () => {
    let state = newRound(555);
    expect(state.level).toBe(0);

    // 1st right
    state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
    state = stepRound(state, 0.4);
    expect(state.level).toBe(0);
    expect(state.rightStreak).toBe(1);

    // 2nd right
    state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
    state = stepRound(state, 0.4);
    expect(state.level).toBe(0);
    expect(state.rightStreak).toBe(2);

    // 3rd right -> triggers level up to 1! Streaks reset.
    state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
    state = stepRound(state, 0.4);
    expect(state.level).toBe(1);
    expect(state.rightStreak).toBe(0);
    expect(state.badStreak).toBe(0);

    // 4th right from level 0 -> now rightStreak is 1 at level 1
    state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
    state = stepRound(state, 0.4);
    expect(state.level).toBe(1);
    expect(state.rightStreak).toBe(1);
  });

  it('lowers level after 2 wrong or missed in a row', () => {
    // Start at level 2
    let state = newRound(555, { level: 2, weights: { ...newRound(555).weights } });
    expect(state.level).toBe(2);

    // 1st wrong
    const wrong1: RtdClass = SIGNALS[state.signal!].cls === 'calm' ? 'alert' : 'calm';
    state = stepRound(state, 0.1, wrong1);
    state = stepRound(state, 1.3);
    expect(state.level).toBe(2);
    expect(state.badStreak).toBe(1);

    // 2nd wrong (via miss)
    const timeout = state.timer;
    state = stepRound(state, timeout + 0.05);
    state = stepRound(state, 1.3);
    expect(state.level).toBe(1);
    expect(state.badStreak).toBe(0);
    expect(state.rightStreak).toBe(0);
  });

  it('clamps level to ladder bounds [0, 5]', () => {
    let state = newRound(555, { level: 5, weights: { ...newRound(555).weights } });
    // 3 right at level 5
    for (let i = 0; i < 3; i++) {
      state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
      state = stepRound(state, 0.4);
    }
    expect(state.level).toBe(5);

    state = newRound(555, { level: 0, weights: { ...newRound(555).weights } });
    // 2 wrong at level 0
    for (let i = 0; i < 2; i++) {
      const wrong: RtdClass = SIGNALS[state.signal!].cls === 'calm' ? 'alert' : 'calm';
      state = stepRound(state, 0.1, wrong);
      state = stepRound(state, 1.3);
    }
    expect(state.level).toBe(0);
  });

  it('draws subtle signals only from subtleFromLevel (level 2)', () => {
    // Check 50 draws at level 0 and 1
    for (let seed = 1; seed <= 50; seed++) {
      const r0 = newRound(seed, { level: 0, weights: { ...newRound(seed).weights } });
      expect(SIGNALS[r0.signal!].subtle).toBe(false);

      const r1 = newRound(seed, { level: 1, weights: { ...newRound(seed).weights } });
      expect(SIGNALS[r1.signal!].subtle).toBe(false);
    }

    // At level 2, subtle signals can appear
    let foundSubtle = false;
    for (let seed = 1; seed <= 50; seed++) {
      const r2 = newRound(seed, { level: 2, weights: { ...newRound(seed).weights } });
      if (SIGNALS[r2.signal!].subtle) {
        foundSubtle = true;
        break;
      }
    }
    expect(foundSubtle).toBe(true);
  });

  it('fixedLevel option pins the level', () => {
    let state = newRound(123, null, { fixedLevel: 0 });
    expect(state.level).toBe(0);
    // Answer 6 right in a row
    for (let i = 0; i < 6; i++) {
      state = stepRound(state, 0.1, SIGNALS[state.signal!].cls, { fixedLevel: 0 });
      state = stepRound(state, 0.4, null, { fixedLevel: 0 });
    }
    expect(state.level).toBe(0);
  });
});

describe('readTheDog - 1.7 seeded weighted draw', () => {
  it('never draws the same signal twice in a row', () => {
    let state = newRound(3333);
    let prev = state.signal!;
    for (let i = 0; i < 20; i++) {
      state = stepRound(state, 0.1, SIGNALS[state.signal!].cls);
      state = stepRound(state, 0.4);
      expect(state.signal).not.toBe(prev);
      prev = state.signal!;
    }
  });

  it('updates weights on wrong/miss (capped at maxWeight) and right (clamped to baseWeight)', () => {
    let state = newRound(4444);
    const sig = state.signal!;
    const wrongCls: RtdClass = SIGNALS[sig].cls === 'calm' ? 'alert' : 'calm';

    // Base weight is 1
    expect(state.weights[sig]).toBe(1);

    // 1st wrong: +2 -> 3
    state = stepRound(state, 0.1, wrongCls);
    expect(state.weights[sig]).toBe(3);
    state = stepRound(state, 1.3);

    // If sig appears again or we artificially set weights / test weight updates:
    // Let's test weight bounds:
    state.weights[sig] = 4;
    // Another wrong: 4 + 2 = 6 -> capped at 5
    state.signal = sig;
    state = stepRound(state, 0.1, wrongCls);
    expect(state.weights[sig]).toBe(5);

    // Right answer: -1 -> 4
    state = { ...state, phase: 'showing', signal: sig };
    state = stepRound(state, 0.1, SIGNALS[sig].cls);
    expect(state.weights[sig]).toBe(4);

    // Multiple right answers clamp to baseWeight = 1
    state = { ...state, phase: 'showing', signal: sig, weights: { ...state.weights, [sig]: 1 } };
    state = stepRound(state, 0.1, SIGNALS[sig].cls);
    expect(state.weights[sig]).toBe(1);
  });

  it('makes a weak signal appear more often over a long run with the same seed', () => {
    // Generate 60 draws from drawNextSignal with base weights vs high weight on whale_eye
    const baseWeights = { ...newRound(100).weights };
    const weakWeights = { ...baseWeights, whale_eye: READ_THE_DOG.maxWeight };

    let baseWhaleCount = 0;
    let weakWhaleCount = 0;
    let prevBase: RtdSignal | null = null;
    let prevWeak: RtdSignal | null = null;

    // Use level 2 so subtle signals like whale_eye are enabled
    for (let i = 0; i < 60; i++) {
      const drawnBase = drawNextSignal(1000, i, 2, baseWeights, prevBase);
      if (drawnBase === 'whale_eye') baseWhaleCount++;
      prevBase = drawnBase;

      const drawnWeak = drawNextSignal(1000, i, 2, weakWeights, prevWeak);
      if (drawnWeak === 'whale_eye') weakWhaleCount++;
      prevWeak = drawnWeak;
    }

    expect(weakWhaleCount).toBeGreaterThan(baseWhaleCount);
  });

  it('uses no Math.random in readTheDog.ts', () => {
    const fs = require('fs');
    const path = require('path');
    const source = fs.readFileSync(path.resolve(__dirname, 'readTheDog.ts'), 'utf8');
    expect(source).not.toContain('Math.random');
  });
});

describe('readTheDog - 1.8 determinism', () => {
  it('produces identical signal sequences and roundResult for identical seed, carry and answers', () => {
    const runSimulation = () => {
      const seed = 88888;
      const carry = {
        level: 1,
        weights: {
          soft_loose: 1,
          play_bow: 2,
          loose_wag: 1,
          ears_up_still: 3,
          lip_lick: 1,
          whale_eye: 2,
          freeze_stare: 1,
          hackles_up: 1,
          stiff_closed_mouth: 1,
        },
      };

      let state = newRound(seed, carry);
      const signalsSeen: RtdSignal[] = [state.signal!];

      // Step until done with a scripted set of actions
      let tick = 0;
      while (state.phase !== 'done') {
        tick++;
        // On showing phase, answer periodically
        if (state.phase === 'showing' && state.timeLeft < state.timer - 0.2) {
          // answer calm every 3rd signal, otherwise correct class
          const ans: RtdClass = tick % 3 === 0 ? 'calm' : SIGNALS[state.signal!].cls;
          state = stepRound(state, 0.1, ans);
        } else {
          state = stepRound(state, 0.1);
        }

        if (state.phase === 'showing' && state.signal && signalsSeen[signalsSeen.length - 1] !== state.signal) {
          signalsSeen.push(state.signal);
        }
      }

      return { signalsSeen, result: roundResult(state) };
    };

    const run1 = runSimulation();
    const run2 = runSimulation();

    expect(run1.signalsSeen).toEqual(run2.signalsSeen);
    expect(run1.result).toEqual(run2.result);
  });
});

describe('readTheDog - 1.9 roundLatency', () => {
  it('calculates median of adjusted right times and misses; wrong and open excluded; empty/wrong/missed give 1.5', () => {
    // Empty
    expect(roundLatency({ rightTimes: [], missed: { calm: 0, alert: 0, about_to_react: 0 } })).toBe(1.5);

    // Only wrong answers (no right answers, no misses)
    expect(roundLatency({ rightTimes: [], missed: { calm: 0, alert: 0, about_to_react: 0 } })).toBe(1.5);

    // All missed
    expect(roundLatency({ rightTimes: [], missed: { calm: 2, alert: 1, about_to_react: 0 } })).toBe(1.5);

    // Right answers: 0.65s (adj 0.20), 0.75s (adj 0.30), 0.85s (adj 0.40) -> median 0.30
    expect(
      roundLatency({
        rightTimes: [0.65, 0.75, 0.85],
        missed: { calm: 0, alert: 0, about_to_react: 0 },
      }),
    ).toBeCloseTo(0.3, 5);

    // Right answer clamping to 0: time 0.30s (< allowance 0.45s) -> adj 0
    expect(
      roundLatency({
        rightTimes: [0.3],
        missed: { calm: 0, alert: 0, about_to_react: 0 },
      }),
    ).toBe(0);

    // Right answer plus miss: [0.75 (adj 0.30), miss (1.5)] -> median 0.90
    expect(
      roundLatency({
        rightTimes: [0.75],
        missed: { calm: 1, alert: 0, about_to_react: 0 },
      }),
    ).toBeCloseTo(0.9, 5);
  });

  it('pins representative rounds to quick, steady and slow latency bands', () => {
    // Quick (< 0.35 s): fast right answers at 0.70 s -> adj 0.25 s
    const quickLat = roundLatency({
      rightTimes: [0.7, 0.7, 0.7],
      missed: { calm: 0, alert: 0, about_to_react: 0 },
    });
    expect(latencyBand(quickLat)).toBe('quick');

    // Steady (0.35 s to 0.55 s): right answers at 0.90 s -> adj 0.45 s
    const steadyLat = roundLatency({
      rightTimes: [0.9, 0.9, 0.9],
      missed: { calm: 0, alert: 0, about_to_react: 0 },
    });
    expect(latencyBand(steadyLat)).toBe('steady');

    // Slow (>= 0.55 s): right answers at 1.10 s -> adj 0.65 s, or with misses
    const slowLat = roundLatency({
      rightTimes: [1.1, 1.1, 1.1],
      missed: { calm: 0, alert: 0, about_to_react: 0 },
    });
    expect(latencyBand(slowLat)).toBe('slow');

    // Misses push into slow
    const missSlowLat = roundLatency({
      rightTimes: [0.7],
      missed: { calm: 2, alert: 0, about_to_react: 0 },
    });
    expect(latencyBand(missSlowLat)).toBe('slow');
  });
});








