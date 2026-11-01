/**
 * App-level harness for the Stage view lifecycle (change `cut-idle-shell-gpu-load`, ADR 0019).
 *
 * The real App runs on react-test-renderer. Native modules, every screen and the SimView are stubs that record
 * their latest props, so a test drives the app the way a screen would (`latest('WorldMapScreen').onOpenStop(...)`)
 * and observes whether a Stage view exists and what it was sent.
 */
import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ---- recorders (names start with `mock` so jest.mock factories may use them) ------------------------------------
const mockProps: Record<string, any> = {};
const mockMounted: Record<string, number> = {};
const mockSim = { mounts: 0, unmounts: 0, live: 0, posts: [] as any[], props: null as any };
const mockAppStateListeners: ((state: string) => void)[] = [];
const mockStore = new Map<string, string>();

function mockStub(name: string) {
  const R = require('react');
  const Stub = (props: any) => {
    mockProps[name] = props;
    R.useEffect(() => {
      mockMounted[name] = (mockMounted[name] ?? 0) + 1;
      return () => {
        mockMounted[name] -= 1;
        if (mockMounted[name] === 0) delete mockProps[name];
      };
    }, []);
    return null;
  };
  Stub.displayName = name;
  return Stub;
}
/** A module whose capitalised exports are recording stub components and whose other exports are inert functions. */
function mockScreens() {
  const cache: Record<string, unknown> = {};
  return new Proxy({}, {
    get: (_t, key: string) => {
      if (key === '__esModule') return true;
      if (key === 'then') return undefined;
      return (cache[key] ??= /^[A-Z]/.test(key) ? mockStub(key) : () => ({ metrics: {}, handlingScore: 0 }));
    },
  });
}

jest.mock('../global.css', () => ({}), { virtual: true });
jest.mock('react-native', () => ({
  View: (p: any) => require('react').createElement('View', p, p.children),
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, cb: (s: string) => void) => {
      mockAppStateListeners.push(cb);
      return { remove: () => mockAppStateListeners.splice(mockAppStateListeners.indexOf(cb), 1) };
    },
  },
  BackHandler: { addEventListener: () => ({ remove: () => {} }) },
  useColorScheme: () => 'light',
}));
jest.mock('expo-splash-screen', () => ({ hideAsync: () => Promise.resolve(), preventAutoHideAsync: () => Promise.resolve() }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('@expo-google-fonts/fredoka', () => ({ Fredoka_600SemiBold: 1 }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: (p: any) => p.children, useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }) }));
jest.mock('./shell/ui/feedbackBackends', () => ({ installFeedback: () => {} }));
jest.mock('./shell/ui/useUiSettings', () => ({ useUiSettings: () => ({ settings: { appearance: 'light' }, change: () => {} }) }));
jest.mock('./shell/ui/components', () => ({ PaletteRoot: (p: any) => p.children }));
jest.mock('./shell/ui/theme', () => ({ PaletteProvider: (p: any) => p.children }));
jest.mock('./shell/audio', () => ({ playDogSound: () => {}, playResolvedCue: () => {}, prepareAudio: () => {} }));
jest.mock('./shell/billing', () => ({
  getBillingService: () => ({ initialize: () => Promise.resolve(), checkEntitlements: () => Promise.resolve(null) }),
}));
jest.mock('./shell/ads', () => ({ getAdService: () => ({ preloadInterstitial: () => Promise.resolve(), showInterstitial: () => Promise.resolve() }) }));
jest.mock('./shell/storage', () => ({
  dogStore: {
    getItem: async (k: string) => mockStore.get(k) ?? null,
    setItem: async (k: string, v: string) => void mockStore.set(k, v),
    removeItem: async (k: string) => void mockStore.delete(k),
  },
}));
jest.mock('./shell/sync/useAccount', () => {
  const account = {
    configured: false,
    signedIn: false,
    auth: null,
    sync: { paused: null },
    choice: null,
    backup: null,
    configs: {},
    remind: false,
    chooseDog: async () => {},
    restoreBackup: () => {},
    markReminded: () => {},
    countStage: () => {},
    forgetAccount: () => {},
    resetSync: () => {},
  };
  return { useAccount: () => account };
});
// the same seed every time, so "the next Stage starts with the same seed" can be asserted
jest.mock('./sim/rng', () => ({ ...jest.requireActual('./sim/rng'), newSeed: () => 4242 }));
// the Debrief's record update needs a real Stage payload; the lifecycle under test does not
jest.mock('./shell/nodes/node', () => ({ ...jest.requireActual('./shell/nodes/node'), onDebrief: (r: unknown) => r }));
jest.mock('./shell/SimView', () => {
  const R = require('react');
  const SimView = R.forwardRef((props: any, ref: any) => {
    mockSim.props = props;
    R.useImperativeHandle(ref, () => ({ post: (m: unknown) => void mockSim.posts.push(m) }));
    R.useEffect(() => {
      mockSim.mounts += 1;
      mockSim.live += 1;
      return () => {
        mockSim.unmounts += 1;
        mockSim.live -= 1;
      };
    }, []);
    return null;
  });
  return { SimView };
});
for (const m of [
  'DailyResultScreen', 'DiaryScreen', 'DoorbellMatView', 'BarkdokuView', 'MissionScreens', 'LessonScreens', 'WorldMapScreen',
  'NodeScreens', 'PosteMinigameView', 'ReadDogView', 'DiagnosticView', 'PaywallScreen', 'ValueRecapScreen', 'PlanScreen',
  'IntroScreens', 'SetupScreen', 'SettingsScreen', 'SplashScreen', 'AccountScreens',
]) {
  jest.mock(`./shell/screens/${m}`, () => mockScreens());
}
jest.mock('./shell/Overlays', () => mockScreens());

import App from '../App';
import { newDogRecord, NEW_ONBOARDING, RECORD_KEY, RECORD_VERSION } from './shell/dogRecord';
import { BARKDOKU_INTRO_NODE, CLOSE_PASS_NODE, WALK_DISTRACTION } from './shell/nodes/content';

const LOAD_TIMEOUT_MS = 20000;
const latest = (name: string) => mockProps[name];
const posted = (type: string) => mockSim.posts.filter((m) => m.type === type);

let renderer: ReactTestRenderer;

/** Renders the app with a finished-onboarding Dog and lets the splash end, so the World Map is showing. */
async function openMap() {
  const record = { ...newDogRecord(), onboarding: { ...NEW_ONBOARDING, step: 'done' as const }, version: RECORD_VERSION };
  mockStore.set(RECORD_KEY, JSON.stringify(record));
  await act(async () => {
    renderer = create(<App />);
  });
  await act(async () => {
    jest.advanceTimersByTime(2500);
  });
  expect(latest('WorldMapScreen')).toBeDefined();
}

const openStop = (id: string) => act(() => latest('WorldMapScreen').onOpenStop({ kind: 'node', id }));
const sendFromView = (message: unknown) => act(() => mockSim.props.onMessage(message));

/** Reads every Primer card and answers the Checkpoint, ending on the Node's simulation step. */
function throughPrimerAndCheckpoint() {
  for (let i = 0; i < 20 && latest('PrimerScreen'); i++) act(() => latest('PrimerScreen').onNext());
  for (let i = 0; i < 20 && latest('CheckpointScreen'); i++) act(() => latest('CheckpointScreen').onAnswer(0));
}

// react-test-renderer is the only renderer that can drive App without a DOM; its deprecation notice is noise here
const realConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    realConsoleError(...args);
  });
});

beforeEach(() => {
  jest.useFakeTimers();
  mockStore.clear();
  for (const k of Object.keys(mockProps)) delete mockProps[k];
  for (const k of Object.keys(mockMounted)) delete mockMounted[k];
  Object.assign(mockSim, { mounts: 0, unmounts: 0, live: 0, posts: [], props: null });
  mockAppStateListeners.length = 0;
});

afterEach(() => {
  act(() => renderer?.unmount());
  jest.useRealTimers();
});

describe('App - Stage view lifecycle', () => {
  it('has no Stage view on the World Map, and time spent there cannot fail a later load', async () => {
    await openMap();
    expect(mockSim.mounts).toBe(0);
    // far past the load timeout, with no view: nothing may mark a load as failed
    await act(async () => {
      jest.advanceTimersByTime(LOAD_TIMEOUT_MS * 2);
    });
    expect(mockSim.mounts).toBe(0);
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    expect(latest('ErrorOverlay')).toBeUndefined();
    expect(latest('LoadingOverlay')).toBeDefined();
  });

  it('creates the view at the Primer of a Stage Node and starts the Stage when it is ready', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    expect(latest('PrimerScreen')).toBeDefined();
    expect(mockSim.live).toBe(1);
    throughPrimerAndCheckpoint();
    expect(latest('PrimerScreen')).toBeUndefined();
    expect(posted('start')).toHaveLength(0); // still loading: the start is queued
    await sendFromView({ type: 'ready' });
    const [start] = posted('start');
    expect(start.seed).toBe(4242);
    expect(mockSim.live).toBe(1);
  });

  it('never creates the view for a Minigame Node, even one that carries a scenario', async () => {
    await openMap();
    openStop(BARKDOKU_INTRO_NODE.id);
    expect(latest('PrimerScreen')).toBeDefined();
    throughPrimerAndCheckpoint();
    expect(latest('BarkdokuView')).toBeDefined();
    expect(mockSim.mounts).toBe(0);
  });

  it('releases the view and drops the queued start when the player backs out of the Primer', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    expect(mockSim.live).toBe(1);
    act(() => latest('PrimerScreen').onExit());
    expect(mockSim.live).toBe(0);
    expect(latest('WorldMapScreen')).toBeDefined();
    // a later Stage must not replay anything left over
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    await sendFromView({ type: 'ready' });
    expect(posted('start')).toHaveLength(1);
  });

  it('releases the view when a Stage ends, and the next Stage starts from a fresh view with the same seed and scenario', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    await sendFromView({ type: 'ready' });
    const first = posted('start')[0];
    await sendFromView({ type: 'debrief', payload: {} });
    expect(latest('DebriefScreen')).toBeDefined();
    expect(mockSim.live).toBe(0);

    act(() => latest('DebriefScreen').onPlayAgain());
    expect(mockSim.live).toBe(1);
    expect(mockSim.mounts).toBe(2);
    expect(posted('start')).toHaveLength(1); // the new view is not ready yet
    await sendFromView({ type: 'ready' });
    const second = posted('start')[1];
    expect(second.seed).toBe(first.seed);
    expect(second.scenario).toEqual(first.scenario);
  });

  it('remounts once silently when the view fails while the player reads, then errors when the Stage needs it', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    expect(mockSim.mounts).toBe(1);

    await act(async () => mockSim.props.onLoadError()); // first failure on the Primer: silent remount
    expect(mockSim.mounts).toBe(2);
    expect(latest('ErrorOverlay')).toBeUndefined();

    await act(async () => mockSim.props.onLoadError()); // second failure: remembered, not shown yet
    expect(mockSim.mounts).toBe(2);
    expect(latest('ErrorOverlay')).toBeUndefined();

    throughPrimerAndCheckpoint(); // the Stage now needs the view
    expect(latest('ErrorOverlay')).toBeDefined();
  });

  it('shows the load error and retries when a view never reports ready', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    await act(async () => {
      jest.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
    });
    expect(latest('ErrorOverlay')).toBeDefined();
    const mountsBefore = mockSim.mounts;
    act(() => latest('ErrorOverlay').onRetry());
    expect(latest('ErrorOverlay')).toBeUndefined();
    expect(mockSim.mounts).toBe(mountsBefore + 1);
  });

  it('mounts CLOSE_PASS_NODE on demand and releases it when debrief is reached', async () => {
    await openMap();
    expect(mockSim.mounts).toBe(0);
    openStop(CLOSE_PASS_NODE.id);
    expect(latest('PrimerScreen')).toBeDefined();
    expect(mockSim.live).toBe(1);

    throughPrimerAndCheckpoint();
    await sendFromView({ type: 'ready' });
    expect(posted('start')).toHaveLength(1);
    expect(posted('start')[0].scenario.mode).toBe('close_exercise');

    await sendFromView({ type: 'debrief', payload: {} });
    expect(latest('DebriefScreen')).toBeDefined();
    expect(mockSim.live).toBe(0);
  });

  it('sends nothing on app state changes while there is no view', async () => {
    await openMap();
    act(() => mockAppStateListeners.forEach((cb) => cb('background')));
    act(() => mockAppStateListeners.forEach((cb) => cb('active')));
    expect(mockSim.posts).toHaveLength(0);
  });

  it('renders SimulatorBackButton when a Stage is ready, and pressing it pauses the simulation', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    expect(latest('SimulatorBackButton')).toBeUndefined();
    await sendFromView({ type: 'ready' });
    expect(latest('SimulatorBackButton')).toBeDefined();

    act(() => latest('SimulatorBackButton').onPress());
    expect(posted('pause')).toHaveLength(1);

    await sendFromView({ type: 'paused' });
    expect(latest('ResumeOverlay')).toBeDefined();
    expect(latest('SimulatorBackButton')).toBeUndefined();
  });

  it('skips a Node Stage on Pause Menu Exit and advances to DebriefScreen with 1 star', async () => {
    await openMap();
    openStop(WALK_DISTRACTION.id);
    throughPrimerAndCheckpoint();
    await sendFromView({ type: 'ready' });

    act(() => latest('SimulatorBackButton').onPress());
    await sendFromView({ type: 'paused' });
    expect(latest('ResumeOverlay')).toBeDefined();

    act(() => latest('ResumeOverlay').onExit());
    expect(latest('ResumeOverlay')).toBeUndefined();
    expect(latest('DebriefScreen')).toBeDefined();
    expect(latest('DebriefScreen').best).toBe(1);
    expect(mockSim.live).toBe(0);
  });

  it('skips a Daily Stage on Pause Menu Exit and advances to DailyResultScreen', async () => {
    await openMap();
    act(() => latest('WorldMapScreen').onDaily());
    expect(mockSim.live).toBe(1);
    await sendFromView({ type: 'ready' });
    expect(latest('SimulatorBackButton')).toBeDefined();

    act(() => latest('SimulatorBackButton').onPress());
    await sendFromView({ type: 'paused' });
    expect(latest('ResumeOverlay')).toBeDefined();

    act(() => latest('ResumeOverlay').onExit());
    expect(latest('ResumeOverlay')).toBeUndefined();
    expect(latest('DailyResultScreen')).toBeDefined();
    expect(mockSim.live).toBe(0);
  });
});
