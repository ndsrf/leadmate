/**
 * Development-only activity counters for the shell: which endless animations and repeating timers are live, which
 * screen is in front and the app state. Looping code reports into it; the dev overlay (`DevPerfOverlay`) and the
 * scripted checks read it. In a production build `__DEV__` is false, so every call is a no-op and nothing is kept.
 * Nothing here is stored or sent anywhere.
 */
export interface DevPerfSnapshot {
  /** Ids of the endless animations running now. */
  loops: string[];
  /** Ids of the repeating timers running now. */
  timers: string[];
  screen: string;
  appState: string;
}

const productionFlag = (): boolean => typeof __DEV__ === 'undefined' || !__DEV__;

let forcedEnabled: boolean | null = null;
const loops = new Map<string, number>();
const timers = new Map<string, number>();
let screen = '-';
let appState = '-';
const listeners = new Set<() => void>();

/** Whether counters are collected: true in development, false in a production build (tests may override). */
export function devPerfEnabled(): boolean {
  return forcedEnabled ?? !productionFlag();
}

/** Test hook: force the flag on or off; `null` restores the build's own value. */
export function setDevPerfEnabled(value: boolean | null): void {
  forcedEnabled = value;
}

export function resetDevPerf(): void {
  loops.clear();
  timers.clear();
  screen = '-';
  appState = '-';
  notify();
}

function notify(): void {
  listeners.forEach((l) => l());
}

function add(map: Map<string, number>, id: string): () => void {
  if (!devPerfEnabled()) return () => {};
  map.set(id, (map.get(id) ?? 0) + 1);
  notify();
  let done = false;
  return () => {
    if (done) return;
    done = true;
    const n = (map.get(id) ?? 1) - 1;
    if (n <= 0) map.delete(id);
    else map.set(id, n);
    notify();
  };
}

/** Report an endless animation started; call the returned function when it is cancelled. */
export function trackLoop(id: string): () => void {
  return add(loops, id);
}

/** Report a repeating timer started; call the returned function when it is cleared. */
export function trackTimer(id: string): () => void {
  return add(timers, id);
}

export function setDevScreen(name: string): void {
  if (!devPerfEnabled() || screen === name) return;
  screen = name;
  notify();
}

export function setDevAppState(state: string): void {
  if (!devPerfEnabled() || appState === state) return;
  appState = state;
  notify();
}

export function devPerfSnapshot(): DevPerfSnapshot {
  return { loops: [...loops.keys()].sort(), timers: [...timers.keys()].sort(), screen, appState };
}

export function subscribeDevPerf(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// scripted checks on the web build read the counters from here (development only)
if (typeof window !== 'undefined' && devPerfEnabled()) {
  (window as unknown as { __leadmateDevPerf?: { snapshot: typeof devPerfSnapshot } }).__leadmateDevPerf = { snapshot: devPerfSnapshot };
}
