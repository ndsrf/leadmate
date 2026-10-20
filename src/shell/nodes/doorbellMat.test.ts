import { doorbellMetrics, DOORBELL_MAT, newDoorbell, stepDoorbell, type DoorbellState } from './doorbellMat';

const advance = (state: DoorbellState, seconds: number, marked = false) => {
  let s = state;
  for (let i = 0; i < Math.round(seconds * 60); i++) s = stepDoorbell(s, 1 / 60, marked && i === 0);
  return s;
};

/** Plays a round by waiting for the Dog to be calm and marking `after` seconds into the window. */
function markWhenCalm(state: DoorbellState, after: number): DoorbellState {
  let s = state;
  const round = s.round;
  for (let i = 0; i < 60 * 20 && s.round === round; i++) {
    s = stepDoorbell(s, 1 / 60, s.phase === 'calm' && s.t - s.calmAt >= after);
  }
  return s;
}

describe('Doorbell Mat minigame', () => {
  it('waits, then the bell rings, then the Dog settles', () => {
    let s = newDoorbell(1);
    expect(s.phase).toBe('waiting');
    s = advance(s, s.bellAt + 0.1);
    expect(s.phase).toBe('excited');
    s = advance(s, s.calmAt - s.t + 0.1);
    expect(s.phase).toBe('calm');
  });

  it('gives the same rounds for the same seed and different ones for another', () => {
    expect(newDoorbell(4)).toEqual(newDoorbell(4));
    expect(newDoorbell(4).calmAt).not.toBe(newDoorbell(5).calmAt);
  });

  it('counts a mark in the calm window as a hit', () => {
    const s = markWhenCalm(newDoorbell(2), 0.3);
    expect(s.outcomes).toEqual(['hit']);
  });

  it('counts a mark while the Dog is still excited as early, and notes the rush', () => {
    let s = newDoorbell(2);
    s = advance(s, s.bellAt + 0.2);
    s = stepDoorbell(s, 1 / 60, true);
    expect(s.outcomes).toEqual(['early']);
    expect(s.earlyMarks).toBe(1);
  });

  it('counts a window that closes without a mark as late', () => {
    let s = newDoorbell(2);
    s = advance(s, s.calmAt + DOORBELL_MAT.markWindow + 0.2);
    expect(s.outcomes).toEqual(['late']);
  });

  it('moves on to a fresh round and is done after three', () => {
    let s = newDoorbell(3);
    for (let r = 0; r < DOORBELL_MAT.rounds; r++) s = markWhenCalm(s, 0.2);
    expect(s.done).toBe(true);
    expect(s.outcomes).toEqual(['hit', 'hit', 'hit']);
    expect(stepDoorbell(s, 1, true)).toBe(s);
  });

  it('turns the rounds into Debrief metrics', () => {
    let s = newDoorbell(3);
    s = markWhenCalm(s, 0.2);
    s = advance(s, s.calmAt + DOORBELL_MAT.markWindow + 0.2); // late
    s = advance(s, s.bellAt + 0.2);
    s = stepDoorbell(s, 1 / 60, true); // early
    expect(s.done).toBe(true);
    const m = doorbellMetrics(s);
    expect(m.timing).toBeCloseTo(1 / 3);
    expect(m.tension).toBeCloseTo(2 / 3);
  });
});
