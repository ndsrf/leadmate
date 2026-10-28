import { followAppState } from './autoRefresh';
import type { AppStateLike } from '../ui/live';

function setup(initial: string) {
  const listeners = new Set<(state: string) => void>();
  const appState: AppStateLike = {
    currentState: initial,
    addEventListener: (_type, listener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
  };
  const set = (state: string) => {
    appState.currentState = state;
    for (const l of listeners) l(state);
  };
  const auth = { startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() };
  return { appState, set, auth, listeners };
}

describe('followAppState', () => {
  it('on native, stops the refresh timer in the background and starts it in the foreground', () => {
    const { appState, set, auth } = setup('active');
    followAppState(auth, 'android', appState);
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(1);
    set('background');
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    set('active');
    expect(auth.startAutoRefresh).toHaveBeenCalledTimes(2);
  });

  it('on native, starts stopped when the app opens in the background, and stops when unsubscribed', () => {
    const { appState, set, auth, listeners } = setup('background');
    const remove = followAppState(auth, 'ios', appState);
    expect(auth.startAutoRefresh).not.toHaveBeenCalled();
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(1);
    set('active');
    remove();
    expect(listeners.size).toBe(0);
    expect(auth.stopAutoRefresh).toHaveBeenCalledTimes(2);
  });

  it('swallows a failed start or stop', async () => {
    const { appState, set } = setup('active');
    const auth = { startAutoRefresh: jest.fn().mockRejectedValue(new Error('storage')), stopAutoRefresh: jest.fn(() => { throw new Error('boom'); }) };
    const remove = followAppState(auth, 'android', appState);
    expect(() => set('background')).not.toThrow();
    expect(() => remove()).not.toThrow();
    await Promise.resolve(); // the rejected start has been handled
  });

  it('on the web, calls neither', () => {
    const { appState, set, auth, listeners } = setup('active');
    followAppState(auth, 'web', appState);
    set('background');
    set('active');
    expect(auth.startAutoRefresh).not.toHaveBeenCalled();
    expect(auth.stopAutoRefresh).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });
});
