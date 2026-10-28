import { isLive, watchAppActive, type AppStateLike } from './live';

function fakeAppState(initial: string) {
  const listeners = new Set<(state: string) => void>();
  const appState: AppStateLike & { set(state: string): void; listeners: number } = {
    currentState: initial,
    addEventListener(_type, listener) {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    },
    set(state) {
      this.currentState = state;
      for (const l of listeners) l(state);
    },
    get listeners() {
      return listeners.size;
    },
  };
  return appState;
}

describe('watchAppActive', () => {
  it('reports the current state, then each change, until removed', () => {
    const appState = fakeAppState('active');
    const seen: boolean[] = [];
    const remove = watchAppActive(appState, (a) => seen.push(a));
    appState.set('background');
    appState.set('inactive');
    appState.set('active');
    remove();
    appState.set('background');
    expect(seen).toEqual([true, false, false, true]);
    expect(appState.listeners).toBe(0);
  });
});

describe('isLive', () => {
  it('runs only in the foreground and while not covered', () => {
    const appState = fakeAppState('active');
    let active = false;
    watchAppActive(appState, (a) => (active = a));
    expect(isLive(active)).toBe(true);
    expect(isLive(active, true)).toBe(false); // Settings over the World Map
    appState.set('background');
    expect(isLive(active)).toBe(false);
    expect(isLive(active, false)).toBe(false);
    appState.set('active');
    expect(isLive(active, false)).toBe(true); // back in front: restarts
  });
});
