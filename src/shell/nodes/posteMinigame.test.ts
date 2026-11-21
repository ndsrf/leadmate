import {
  newPosteMinigame,
  POSTE_MINIGAME,
  posteRingProgress,
  stepPosteMinigame,
  type PosteMinigameState,
} from './posteMinigame';

describe('posteRingProgress (task 7.1)', () => {
  it('maps held / holdToSettle to progress', () => {
    const state: PosteMinigameState = {
      ...newPosteMinigame(),
      held: 1.0, // 1.0 / 2.0 = 0.5
    };
    const ring = posteRingProgress(state);
    expect(ring.progress).toBeCloseTo(0.5);
    expect(ring.phase).toBe('closing');
    expect(ring.snap).toBe(false);
  });

  it('clamps progress to 1 and shows landed when held reaches holdToSettle', () => {
    const state: PosteMinigameState = {
      ...newPosteMinigame(),
      held: 2.5,
    };
    const ring = posteRingProgress(state);
    expect(ring.progress).toBe(1);
    expect(ring.phase).toBe('landed');
    expect(ring.snap).toBe(false);
  });

  it('shows open ring with zero progress at start of round', () => {
    const state = newPosteMinigame();
    const ring = posteRingProgress(state);
    expect(ring.progress).toBe(0);
    expect(ring.phase).toBe('open');
    expect(ring.snap).toBe(false);
  });

  it('shows landed on settled outcome', () => {
    let state = newPosteMinigame();
    // Step with holding until settled (2s)
    state = stepPosteMinigame(state, 2.0, true);
    expect(state.outcomes).toEqual(['settled']);

    const ring = posteRingProgress(state);
    expect(ring.progress).toBe(1);
    expect(ring.phase).toBe('landed');
    expect(ring.snap).toBe(false);
  });

  it('shows snap on released outcome', () => {
    let state = newPosteMinigame();
    // Hold partially for 1s then release
    state = stepPosteMinigame(state, 1.0, true);
    state = stepPosteMinigame(state, 0.1, false);
    expect(state.outcomes).toEqual(['released']);

    const ring = posteRingProgress(state);
    expect(ring.progress).toBe(0);
    expect(ring.phase).toBe('open');
    expect(ring.snap).toBe(true);
  });
});
