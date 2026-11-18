import { createRng } from '../../sim/rng';
import { DIAGNOSTIC, median } from '../onboarding/diagnostic';

/**
 * Read the Dog - pure engine
 *
 * Implements the reflex minigame according to ADR 0032 and OpenSpec change `add-read-the-dog-game`.
 */

export type RtdClass = 'calm' | 'alert' | 'about_to_react';

export type RtdSignal =
  | 'soft_loose'
  | 'play_bow'
  | 'loose_wag'
  | 'ears_up_still'
  | 'lip_lick'
  | 'whale_eye'
  | 'freeze_stare'
  | 'hackles_up'
  | 'stiff_closed_mouth';

export interface RtdSignalInfo {
  cls: RtdClass;
  subtle: boolean;
}

export const SIGNALS: Record<RtdSignal, RtdSignalInfo> = {
  soft_loose: { cls: 'calm', subtle: false },
  play_bow: { cls: 'calm', subtle: false },
  loose_wag: { cls: 'calm', subtle: true },
  ears_up_still: { cls: 'alert', subtle: false },
  lip_lick: { cls: 'alert', subtle: true },
  whale_eye: { cls: 'alert', subtle: true },
  freeze_stare: { cls: 'about_to_react', subtle: false },
  hackles_up: { cls: 'about_to_react', subtle: false },
  stiff_closed_mouth: { cls: 'about_to_react', subtle: true },
};

export const READ_THE_DOG = {
  roundSeconds: 24,
  pauseSeconds: 0.35,
  wrongPauseSeconds: 1.2,
  timers: [2.4, 2.0, 1.7, 1.4, 1.2, 1.0],
  subtleFromLevel: 2,
  upAfter: 3,
  downAfter: 2,
  missWeight: 2,
  rightWeight: -1,
  maxWeight: 5,
  baseWeight: 1,
  decisionAllowance: 0.45,
  missSeconds: DIAGNOSTIC.timeout,
  screenReaderTimer: 6,
  bigEvery: 5,
  basePoints: 100,
} as const;

export interface TimerOptions {
  screenReader?: boolean;
  timerSeconds?: number;
}

export interface RoundOptions extends TimerOptions {
  fixedLevel?: number;
}

export interface RtdEvent {
  seq: number;
  kind: 'correct' | 'wrong' | 'missed';
  signal: RtdSignal;
  class: RtdClass | null;
  time: number;
}

export interface RtdCarry {
  level: number;
  weights: Record<RtdSignal, number>;
}

export interface RoundState {
  seed: number;
  t: number;
  phase: 'showing' | 'pause' | 'done';
  signal: RtdSignal | null;
  timer: number;
  timeLeft: number;
  pauseLeft: number;
  level: number;
  weights: Record<RtdSignal, number>;
  combo: number;
  bestCombo: number;
  score: number;
  rightStreak: number;
  badStreak: number;
  drawIndex: number;
  rightTimes: number[];
  right: Record<RtdClass, number>;
  wrong: Record<RtdClass, number>;
  missed: Record<RtdClass, number>;
  last: RtdEvent | null;
}

export function timerFor(level: number, opts?: TimerOptions): number {
  if (opts?.screenReader) {
    return READ_THE_DOG.screenReaderTimer;
  }
  if (opts?.timerSeconds !== undefined) {
    return opts.timerSeconds;
  }
  const maxIdx = READ_THE_DOG.timers.length - 1;
  const clamped = Math.max(0, Math.min(maxIdx, Math.floor(level)));
  return READ_THE_DOG.timers[clamped];
}

export function drawNextSignal(
  seed: number,
  drawIndex: number,
  level: number,
  weights: Record<RtdSignal, number>,
  previousSignal: RtdSignal | null,
): RtdSignal {
  const allSignals = Object.keys(SIGNALS) as RtdSignal[];
  const candidates = allSignals.filter((s) => {
    if (level < READ_THE_DOG.subtleFromLevel && SIGNALS[s].subtle) {
      return false;
    }
    if (previousSignal && s === previousSignal) {
      return false;
    }
    return true;
  });

  const totalWeight = candidates.reduce(
    (sum, s) => sum + (weights[s] ?? READ_THE_DOG.baseWeight),
    0,
  );
  const rng = createRng(seed * 7919 + drawIndex);
  let r = rng.next() * totalWeight;
  for (const s of candidates) {
    const w = weights[s] ?? READ_THE_DOG.baseWeight;
    if (r < w) {
      return s;
    }
    r -= w;
  }
  return candidates[candidates.length - 1];
}

function defaultWeights(): Record<RtdSignal, number> {
  const w = {} as Record<RtdSignal, number>;
  for (const k of Object.keys(SIGNALS) as RtdSignal[]) {
    w[k] = READ_THE_DOG.baseWeight;
  }
  return w;
}

function emptyCounts(): Record<RtdClass, number> {
  return { calm: 0, alert: 0, about_to_react: 0 };
}

export function newRound(
  seed: number,
  carry?: RtdCarry | null,
  opts?: RoundOptions,
): RoundState {
  const level =
    opts?.fixedLevel !== undefined ? opts.fixedLevel : carry?.level ?? 0;
  const weights = carry?.weights ? { ...carry.weights } : defaultWeights();
  const drawIndex = 0;
  const signal = drawNextSignal(seed, drawIndex, level, weights, null);
  const timer = timerFor(level, opts);

  return {
    seed,
    t: 0,
    phase: 'showing',
    signal,
    timer,
    timeLeft: timer,
    pauseLeft: 0,
    level,
    weights,
    combo: 0,
    bestCombo: 0,
    score: 0,
    rightStreak: 0,
    badStreak: 0,
    drawIndex,
    rightTimes: [],
    right: emptyCounts(),
    wrong: emptyCounts(),
    missed: emptyCounts(),
    last: null,
  };
}

export function stepRound(
  state: RoundState,
  dt: number,
  answer: RtdClass | null = null,
  opts?: RoundOptions,
): RoundState {
  if (state.phase === 'done') {
    return state;
  }

  const fixedLevel = opts?.fixedLevel;
  const currentLevel = fixedLevel !== undefined ? fixedLevel : state.level;

  if (state.phase === 'pause') {
    const newT = state.t + dt;
    if (newT >= READ_THE_DOG.roundSeconds) {
      return {
        ...state,
        t: READ_THE_DOG.roundSeconds,
        phase: 'done',
        signal: null,
      };
    }
    const newPauseLeft = state.pauseLeft - dt;
    if (newPauseLeft <= 0) {
      const drawIndex = state.drawIndex + 1;
      const nextSignal = drawNextSignal(
        state.seed,
        drawIndex,
        currentLevel,
        state.weights,
        state.signal,
      );
      const timer = timerFor(currentLevel, opts);
      return {
        ...state,
        t: newT,
        phase: 'showing',
        signal: nextSignal,
        timer,
        timeLeft: timer,
        pauseLeft: 0,
        drawIndex,
        level: currentLevel,
      };
    }
    return {
      ...state,
      t: newT,
      pauseLeft: newPauseLeft,
      level: currentLevel,
    };
  }

  // phase === 'showing'
  if (answer !== null && state.signal !== null) {
    const signal = state.signal;
    const isRight = answer === SIGNALS[signal].cls;
    const timeToAnswer = Math.max(0, state.timer - state.timeLeft);
    const seq = (state.last?.seq ?? 0) + 1;
    const weights = { ...state.weights };

    let combo = state.combo;
    let bestCombo = state.bestCombo;
    let score = state.score;
    let rightStreak = state.rightStreak;
    let badStreak = state.badStreak;
    let level = currentLevel;
    const right = { ...state.right };
    const wrong = { ...state.wrong };
    const rightTimes = [...state.rightTimes];

    if (isRight) {
      combo += 1;
      bestCombo = Math.max(bestCombo, combo);
      rightStreak += 1;
      badStreak = 0;
      right[answer] += 1;
      rightTimes.push(timeToAnswer);

      const timeRatio = Math.max(0, Math.min(1, state.timeLeft / state.timer));
      const comboMult = 1 + 0.1 * Math.min(combo - 1, 9);
      const points = Math.round(
        READ_THE_DOG.basePoints * (0.5 + 0.5 * timeRatio) * comboMult,
      );
      score += points;

      weights[signal] = Math.max(
        READ_THE_DOG.baseWeight,
        (weights[signal] ?? READ_THE_DOG.baseWeight) + READ_THE_DOG.rightWeight,
      );

      if (rightStreak >= READ_THE_DOG.upAfter) {
        if (fixedLevel === undefined) {
          level = Math.min(READ_THE_DOG.timers.length - 1, level + 1);
        }
        rightStreak = 0;
        badStreak = 0;
      }
    } else {
      combo = 0;
      badStreak += 1;
      rightStreak = 0;
      wrong[answer] += 1;

      weights[signal] = Math.min(
        READ_THE_DOG.maxWeight,
        (weights[signal] ?? READ_THE_DOG.baseWeight) + READ_THE_DOG.missWeight,
      );

      if (badStreak >= READ_THE_DOG.downAfter) {
        if (fixedLevel === undefined) {
          level = Math.max(0, level - 1);
        }
        rightStreak = 0;
        badStreak = 0;
      }
    }

    const last: RtdEvent = {
      seq,
      kind: isRight ? 'correct' : 'wrong',
      signal,
      class: answer,
      time: timeToAnswer,
    };

    const newT = state.t + dt;
    if (newT >= READ_THE_DOG.roundSeconds) {
      return {
        ...state,
        t: READ_THE_DOG.roundSeconds,
        phase: 'done',
        signal: null,
        level,
        weights,
        combo,
        bestCombo,
        score,
        rightStreak,
        badStreak,
        rightTimes,
        right,
        wrong,
        last,
      };
    }

    const pauseLeft = isRight
      ? READ_THE_DOG.pauseSeconds
      : READ_THE_DOG.wrongPauseSeconds;

    return {
      ...state,
      t: newT,
      phase: 'pause',
      pauseLeft,
      level,
      weights,
      combo,
      bestCombo,
      score,
      rightStreak,
      badStreak,
      rightTimes,
      right,
      wrong,
      last,
    };
  }

  // answer === null
  const newT = state.t + dt;
  const newTimeLeft = state.timeLeft - dt;

  if (newTimeLeft <= 0 && state.signal !== null) {
    const signal = state.signal;
    const signalClass = SIGNALS[signal].cls;
    const seq = (state.last?.seq ?? 0) + 1;
    const weights = { ...state.weights };

    const combo = 0;
    const badStreak = state.badStreak + 1;
    const rightStreak = 0;
    let level = currentLevel;
    const missed = { ...state.missed };
    missed[signalClass] += 1;

    weights[signal] = Math.min(
      READ_THE_DOG.maxWeight,
      (weights[signal] ?? READ_THE_DOG.baseWeight) + READ_THE_DOG.missWeight,
    );

    if (badStreak >= READ_THE_DOG.downAfter) {
      if (fixedLevel === undefined) {
        level = Math.max(0, level - 1);
      }
    }

    const last: RtdEvent = {
      seq,
      kind: 'missed',
      signal,
      class: null,
      time: state.timer,
    };

    if (newT >= READ_THE_DOG.roundSeconds) {
      return {
        ...state,
        t: READ_THE_DOG.roundSeconds,
        phase: 'done',
        signal: null,
        level,
        weights,
        combo,
        rightStreak: badStreak >= READ_THE_DOG.downAfter ? 0 : rightStreak,
        badStreak: badStreak >= READ_THE_DOG.downAfter ? 0 : badStreak,
        missed,
        last,
      };
    }

    return {
      ...state,
      t: newT,
      phase: 'pause',
      pauseLeft: READ_THE_DOG.wrongPauseSeconds,
      level,
      weights,
      combo,
      rightStreak: badStreak >= READ_THE_DOG.downAfter ? 0 : rightStreak,
      badStreak: badStreak >= READ_THE_DOG.downAfter ? 0 : badStreak,
      missed,
      last,
    };
  }

  if (newT >= READ_THE_DOG.roundSeconds) {
    return {
      ...state,
      t: READ_THE_DOG.roundSeconds,
      phase: 'done',
      signal: null,
      level: currentLevel,
    };
  }

  return {
    ...state,
    t: newT,
    timeLeft: newTimeLeft,
    level: currentLevel,
  };
}

export interface RoundResult {
  score: number;
  bestCombo: number;
  right: Record<RtdClass, number>;
  wrong: Record<RtdClass, number>;
  missed: Record<RtdClass, number>;
  endLevel: number;
  latency: number;
  seconds: number;
}

export function roundLatency(
  state: Pick<RoundState, 'rightTimes' | 'missed'>,
): number {
  const missCount = (Object.values(state.missed) as number[]).reduce(
    (a, b) => a + b,
    0,
  );
  const adjustedRight = state.rightTimes.map((t) =>
    Math.max(0, Math.min(1.5, t - READ_THE_DOG.decisionAllowance)),
  );
  const misses = Array(missCount).fill(READ_THE_DOG.missSeconds);
  const allValues = [...adjustedRight, ...misses];
  return median(allValues);
}

export function roundResult(state: RoundState): RoundResult {
  return {
    score: state.score,
    bestCombo: state.bestCombo,
    right: { ...state.right },
    wrong: { ...state.wrong },
    missed: { ...state.missed },
    endLevel: state.level,
    latency: roundLatency(state),
    seconds: Math.min(READ_THE_DOG.roundSeconds, state.t),
  };
}

export function carryOf(state: RoundState): RtdCarry {
  return {
    level: state.level,
    weights: { ...state.weights },
  };
}

export function replaySeed(seed: number, n: number): number {
  let h = (seed ^ Math.imul(n + 1, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export type FeedbackTier = 'small' | 'medium' | 'big' | 'wrong';
export type FeedbackPolarity = 'right' | 'wrong';

export interface RtdFeedback {
  tier: FeedbackTier;
  polarity: FeedbackPolarity;
  combo: number;
  textKey: string;
}

export function rtdFeedback(
  event: 'correct' | 'wrong' | 'missed' | RtdEvent,
  combo: number,
  signal: RtdSignal,
): RtdFeedback {
  const kind = typeof event === 'string' ? event : event.kind;
  const isRight = kind === 'correct';
  const textKey = `readTheDog.signal.${signal}`;

  if (!isRight) {
    return {
      tier: 'wrong',
      polarity: 'wrong',
      combo: 0,
      textKey,
    };
  }

  const isBig = combo > 0 && combo % READ_THE_DOG.bigEvery === 0;
  const isMedium = !isBig && (SIGNALS[signal].subtle || combo >= 3);
  const tier: FeedbackTier = isBig ? 'big' : isMedium ? 'medium' : 'small';

  return {
    tier,
    polarity: 'right',
    combo,
    textKey,
  };
}

export function swipeClass(dx: number, dy: number): RtdClass | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < 40 && absY < 40) {
    return null;
  }

  if (absX >= absY) {
    if (absX < 40) return null;
    return dx < 0 ? 'calm' : 'about_to_react';
  } else {
    if (absY < 40) return null;
    return dy < 0 ? 'alert' : null;
  }
}




