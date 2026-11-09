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
const mockBackHandlerListeners: (() => boolean | undefined | null)[] = [];
const mockStore = new Map<string, string>();

function mockStub(name: string) {
  const R = require('react');
  const Stub = (props: any) => {
    mockProps[name] = props;
    R.useEffect(() => {
      mockProps[name] = props;
      mockMounted[name] = (mockMounted[name] ?? 0) + 1;
      return () => {
        mockMounted[name] -= 1;
        if (mockMounted[name] === 0) delete mockProps[name];
      };
    }, []);
    return props?.shopPopup ?? null;
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
  Text: (p: any) => require('react').createElement('Text', p, p.children),
  Pressable: (p: any) => require('react').createElement('Pressable', p, p.children),
  ScrollView: (p: any) => require('react').createElement('ScrollView', p, p.children),
  Image: (p: any) => require('react').createElement('Image', p, p.children),
  AccessibilityInfo: {
    isScreenReaderEnabled: () => Promise.resolve(false),
    addEventListener: () => ({ remove: () => {} }),
  },
  Linking: {
    openURL: jest.fn(() => Promise.resolve()),
    canOpenURL: jest.fn(() => Promise.resolve(true)),
  },
  processColor: (c: any) => c,
  AppState: {
    currentState: 'active',
    addEventListener: (_: string, cb: (s: string) => void) => {
      mockAppStateListeners.push(cb);
      return { remove: () => mockAppStateListeners.splice(mockAppStateListeners.indexOf(cb), 1) };
    },
  },
  BackHandler: {
    addEventListener: (_: string, cb: () => boolean | undefined | null) => {
      mockBackHandlerListeners.push(cb);
      return {
        remove: () => {
          const idx = mockBackHandlerListeners.indexOf(cb);
          if (idx !== -1) mockBackHandlerListeners.splice(idx, 1);
        },
      };
    },
    exitApp: () => {},
  },
  useColorScheme: () => 'light',
}));
jest.mock('react-native-svg', () => {
  const R = require('react');
  return {
    __esModule: true,
    default: (p: any) => R.createElement('Svg', p, p.children),
    Path: (p: any) => R.createElement('Path', p, p.children),
    Svg: (p: any) => R.createElement('Svg', p, p.children),
  };
});
jest.mock('expo-splash-screen', () => ({ hideAsync: () => Promise.resolve(), preventAutoHideAsync: () => Promise.resolve() }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-font', () => ({ useFonts: () => [true] }));
jest.mock('@expo-google-fonts/fredoka', () => ({ Fredoka_600SemiBold: 1 }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: (p: any) => p.children, useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }) }));
jest.mock('./shell/ui/feedbackBackends', () => ({ installFeedback: () => {} }));
jest.mock('./shell/ui/useUiSettings', () => ({ useUiSettings: () => ({ settings: { appearance: 'light' }, change: () => {} }) }));
jest.mock('./shell/ui/components', () => ({ PaletteRoot: (p: any) => p.children }));
jest.mock('./shell/ui/theme', () => {
  const actual = jest.requireActual('./shell/ui/theme');
  return {
    ...actual,
    PaletteProvider: (p: any) => p.children,
    usePalette: () => actual.lightColor,
  };
});
jest.mock('./shell/ui/ContentUpdateBanner', () => ({ ContentUpdateBanner: () => null }));
jest.mock('./shell/audio', () => ({ playDogSound: () => {}, playResolvedCue: () => {}, prepareAudio: () => {} }));
jest.mock('./shell/billing', () => ({
  getBillingService: () => ({ initialize: () => Promise.resolve(), checkEntitlements: () => Promise.resolve(null) }),
}));
let interstitialResolver: (() => void) | null = null;
let interstitialTriggered = false;
let pendingAd = false;
jest.mock('./shell/ads', () => ({
  getAdService: () => ({
    preloadInterstitial: () => Promise.resolve(),
    showInterstitial: () => {
      interstitialTriggered = true;
      if (pendingAd) {
        return new Promise<void>((resolve) => {
          interstitialResolver = resolve;
        });
      }
      return Promise.resolve();
    },
    clearCache: () => {},
  }),
}));
jest.mock('./shell/storage', () => ({
  LANGUAGE_STORAGE_KEY: 'leadmate.language',
  loadStoredLanguage: async () => mockStore.get('leadmate.language') ?? null,
  saveStoredLanguage: async (lang: string) => void mockStore.set('leadmate.language', lang),
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
  'IntroScreens', 'SetupScreen', 'SettingsScreen', 'SplashScreen', 'AccountScreens', 'MethodOverviewScreen',
]) {
  jest.mock(`./shell/screens/${m}`, () => mockScreens());
}
jest.mock('./shell/Overlays', () => mockScreens());
jest.mock('./shell/screens/ShopScreen', () => {
  const actual = jest.requireActual('./shell/screens/ShopScreen');
  const R = require('react');
  return {
    ...actual,
    ShopScreen: (props: any) => {
      mockProps['ShopScreen'] = props;
      R.useEffect(() => {
        mockMounted['ShopScreen'] = (mockMounted['ShopScreen'] ?? 0) + 1;
        return () => {
          mockMounted['ShopScreen'] -= 1;
          if (mockMounted['ShopScreen'] === 0) delete mockProps['ShopScreen'];
        };
      }, []);
      return R.createElement(actual.ShopScreen, props);
    },
  };
});
jest.mock('./shell/screens/ShopPopup', () => {
  const actual = jest.requireActual('./shell/screens/ShopPopup');
  const R = require('react');
  return {
    ...actual,
    ShopPopup: (props: any) => {
      mockProps['ShopPopup'] = props;
      R.useEffect(() => {
        mockMounted['ShopPopup'] = (mockMounted['ShopPopup'] ?? 0) + 1;
        return () => {
          mockMounted['ShopPopup'] -= 1;
          if (mockMounted['ShopPopup'] === 0) delete mockProps['ShopPopup'];
        };
      }, []);
      return R.createElement('ShopPopup', props);
    },
  };
});

import App from '../App';
import { newDogRecord, NEW_ONBOARDING, RECORD_KEY, RECORD_VERSION } from './shell/dogRecord';
import { todayString } from './shell/daily';
import { BARKDOKU_INTRO_NODE, CALM_HANDS_NODE, CLOSE_PASS_NODE, WALK_DISTRACTION, findNode } from './shell/nodes/content';
import { getActiveContent, setActiveContent } from './shell/content/runtime';
import type { ResolvedShop } from './shell/content/resolver';
import { SHOP_STATE_STORAGE_KEY, DEFAULT_SHOP_STATE } from './shell/shop';
import { POOR_SCORE_BELOW } from './shell/stars';

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
function triggerBack(): boolean {
  for (let i = mockBackHandlerListeners.length - 1; i >= 0; i--) {
    const handled = mockBackHandlerListeners[i]();
    if (handled) return true;
  }
  return false;
}

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

const baseIntl = global.Intl;
beforeEach(() => {
  jest.useFakeTimers();
  setActiveContent(null);
  global.Intl = {
    ...baseIntl,
    DateTimeFormat: (() => ({
      resolvedOptions: () => ({ locale: 'es-ES' }),
    })) as unknown as typeof Intl.DateTimeFormat,
  };
  interstitialResolver = null;
  interstitialTriggered = false;
  pendingAd = false;
  mockStore.clear();
  for (const k of Object.keys(mockProps)) delete mockProps[k];
  for (const k of Object.keys(mockMounted)) delete mockMounted[k];
  Object.assign(mockSim, { mounts: 0, unmounts: 0, live: 0, posts: [], props: null });
  mockAppStateListeners.length = 0;
  mockBackHandlerListeners.length = 0;
});

afterEach(() => {
  act(() => renderer?.unmount());
  setActiveContent(null);
  global.Intl = baseIntl;
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

  it('opens the hand drill for a puppy with its copy, tuning and first-run Coach marks, and reaches the Debrief', async () => {
    const record = { ...newDogRecord(), ageBand: 'puppy' as const, onboarding: { ...NEW_ONBOARDING, step: 'done' as const }, version: RECORD_VERSION };
    mockStore.set(RECORD_KEY, JSON.stringify(record));
    await act(async () => {
      renderer = create(<App />);
    });
    await act(async () => {
      jest.advanceTimersByTime(2500);
    });
    openStop(CALM_HANDS_NODE.id);
    expect(latest('PrimerScreen')).toBeDefined();
    throughPrimerAndCheckpoint();
    await sendFromView({ type: 'ready' });

    const [start] = posted('start');
    expect(start.scenario).toMatchObject({ mode: 'close_exercise', controls: 'hand_drill', reward: 'toy', distractor: { kind: 'hand' } });
    expect(start.scenario.markBudget).toBe(8); // the gentle first-run tuning

    // all three close-view Coach marks are on, and a press of one removes only that mark
    expect(latest('CloseCoachMarksOverlay').show).toEqual({ gather: true, poste: true, marker: true });
    await sendFromView({ type: 'stage-signal', signal: 'control-used', time: 1, control: 'gather' });
    expect(latest('CloseCoachMarksOverlay').show).toEqual({ gather: false, poste: true, marker: true });
    // the walking Marker mark has its own overlay and does not count for the close Marker
    expect(latest('CoachMarksOverlay')).toBeUndefined();

    // paused: the marks are hidden
    await sendFromView({ type: 'paused' });
    expect(latest('CloseCoachMarksOverlay')).toBeUndefined();

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

  describe('Barkdoku multi-board and tier integration', () => {
    it('free user sees practice mode on replay and triggers paywall on upgrade', async () => {
      await openMap();
      // Open Barkdoku from WorldMapScreen
      act(() => latest('WorldMapScreen').onBarkdoku());
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').tier).toBe('free');
      expect(latest('BarkdokuView').practice).toBe(false);
      expect(latest('BarkdokuView').boardIndex).toBe(0);

      // Solve first board of the day
      act(() => {
        latest('BarkdokuView').onFinish(
          { solved: true, durationSeconds: 60, mistakes: 0, treatsLeft: 3, stars: 3, withinTarget: true },
          { size: 5, difficulty: 'easy', durationSeconds: 60, mistakes: 0, treatsLeft: 3 },
        );
      });

      // Returned to map
      expect(latest('WorldMapScreen')).toBeDefined();

      // Replay on same day
      act(() => latest('WorldMapScreen').onBarkdoku());
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').tier).toBe('free');
      expect(latest('BarkdokuView').practice).toBe(true);
      expect(latest('BarkdokuView').boardIndex).toBe(0);

      // Free user taps upgrade
      act(() => latest('BarkdokuView').onUpgrade());
      expect(latest('PaywallScreen')).toBeDefined();

      // Converts by starting trial
      await act(async () => {
        latest('PaywallScreen').onStartTrial();
      });

      // Directly transitions to fresh Barkdoku board 1
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').boardIndex).toBe(1);
      expect(latest('BarkdokuView').practice).toBe(false);
      expect(latest('BarkdokuView').tier).toBe('trial');
    });

    it('Plus subscriber advances through multiple distinct boards', async () => {
      // Setup Plus subscriber
      const record = {
        ...newDogRecord(),
        onboarding: { ...NEW_ONBOARDING, step: 'done' as const, mockSubscribed: true },
        version: RECORD_VERSION,
      };
      mockStore.set(RECORD_KEY, JSON.stringify(record));
      await act(async () => {
        renderer = create(<App />);
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      // Open Barkdoku
      act(() => latest('WorldMapScreen').onBarkdoku());
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').tier).toBe('plus');
      expect(latest('BarkdokuView').boardIndex).toBe(0);
      expect(latest('BarkdokuView').practice).toBe(false);

      // Complete board 0
      act(() => {
        latest('BarkdokuView').onFinish(
          { solved: true, durationSeconds: 50, mistakes: 0, treatsLeft: 3, stars: 3, withinTarget: true },
          { size: 5, difficulty: 'easy', durationSeconds: 50, mistakes: 0, treatsLeft: 3 },
        );
      });

      // Re-enter from map
      act(() => latest('WorldMapScreen').onBarkdoku());
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').boardIndex).toBe(1);
      expect(latest('BarkdokuView').practice).toBe(false);

      // Can also advance directly via onNewBoard(metrics, summary) and it persists the solve
      act(() => {
        latest('BarkdokuView').onNewBoard(
          { solved: true, durationSeconds: 70, mistakes: 0, treatsLeft: 3, stars: 3, withinTarget: true },
          { size: 6, difficulty: 'easy', durationSeconds: 70, mistakes: 0, treatsLeft: 3 },
        );
      });
      expect(latest('BarkdokuView')).toBeDefined();
      expect(latest('BarkdokuView').boardIndex).toBe(2);
      expect(latest('BarkdokuView').practice).toBe(false);

      // Verify the solved Plus board 1 was persisted in dogStore
      const savedRecord = JSON.parse(mockStore.get(RECORD_KEY)!);
      expect(savedRecord.dailyBarkdoku[todayString()].plusSolves).toBe(1);
      expect(savedRecord.activityLog.filter((e: any) => e.kind === 'barkdoku').length).toBe(2);
    });
  });

  describe('Onboarding: Language step', () => {
    it('shows LanguageScreen after welcome, updates language preference, and advances to dog screen', async () => {
      const record = { ...newDogRecord(), onboarding: { ...NEW_ONBOARDING, step: 'welcome' as const }, version: RECORD_VERSION };
      mockStore.set(RECORD_KEY, JSON.stringify(record));
      await act(async () => {
        renderer = create(<App />);
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      // SplashScreen on welcome
      expect(latest('SplashScreen')).toBeDefined();
      expect(latest('SplashScreen').actions).toBeDefined();

      // Start onboarding
      act(() => latest('SplashScreen').actions.onStart());

      // LanguageScreen is shown
      expect(latest('LanguageScreen')).toBeDefined();
      expect(latest('LanguageScreen').selectedLanguage).toBeDefined();

      // Change language to 'en'
      act(() => latest('LanguageScreen').onSelectLanguage('en'));
      expect(mockStore.get('leadmate.language')).toBe('en');

      // Finish language step with 'en'
      act(() => latest('LanguageScreen').onDone('en'));

      // Advances to DogLookScreen
      expect(latest('DogLookScreen')).toBeDefined();

      // Verify dog record updated
      const saved = JSON.parse(mockStore.get(RECORD_KEY)!);
      expect(saved.language).toBe('en');
      expect(saved.onboarding.step).toBe('dog');
    });

    it('navigates back from language step to welcome', async () => {
      const record = { ...newDogRecord(), onboarding: { ...NEW_ONBOARDING, step: 'language' as const }, version: RECORD_VERSION };
      mockStore.set(RECORD_KEY, JSON.stringify(record));
      await act(async () => {
        renderer = create(<App />);
      });
      await act(async () => {
        jest.advanceTimersByTime(2500);
      });

      expect(latest('LanguageScreen')).toBeDefined();
      act(() => latest('LanguageScreen').onBack());
      expect(latest('SplashScreen')).toBeDefined();
    });

    it('initializes English on cold start when device locale is English and persists it', async () => {
      const originalIntl = global.Intl;
      global.Intl = {
        ...originalIntl,
        DateTimeFormat: (() => ({
          resolvedOptions: () => ({ locale: 'en-US' }),
        })) as unknown as typeof Intl.DateTimeFormat,
      };

      try {
        await act(async () => {
          renderer = create(<App />);
        });
        await act(async () => {
          jest.advanceTimersByTime(2500);
        });

        // Cold start persists language
        expect(mockStore.get('leadmate.language')).toBe('en');

        // On welcome screen, advancing to language step
        act(() => latest('SplashScreen').actions.onStart());
        expect(latest('LanguageScreen')).toBeDefined();
        // LanguageScreen preselects English
        expect(latest('LanguageScreen').selectedLanguage).toBe('en');
      } finally {
        global.Intl = originalIntl;
      }
    });
  });

  describe('Shop flow', () => {
    it('maintains map scroll position and system back pops shop levels before returning to map', async () => {
      const baseContent = getActiveContent();
      const mockShop: ResolvedShop = {
        categories: [
          {
            id: 'collares',
            title: 'Collares y arneses',
            description: 'Collares y arneses para pasear sin tirones',
            subcategories: [
              {
                id: 'arneses',
                title: 'Arneses',
                description: 'Arneses ergonómicos en Y',
                products: [
                  {
                    id: 'arnes-ergonomico-y',
                    name: 'Arnés ergonómico en Y',
                    description: 'Arnés anti-tiro',
                    url: 'https://example.com/arnes',
                  },
                ],
              },
            ],
          },
        ],
        idToKind: {
          collares: 'category',
          arneses: 'subcategory',
          'arnes-ergonomico-y': 'product',
        },
      };
      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
        },
      });

      try {
        await openMap();

        // Simulate map scrolling to 350
        act(() => {
          latest('WorldMapScreen').onScroll(350);
        });

        // Open shop with deep link to a subcategory (e.g. 'arneses')
        act(() => {
          latest('WorldMapScreen').onShop({ level: 'subcategory', id: 'arneses' });
        });

        // ShopScreen should be mounted, and WorldMapScreen should remain mounted underneath
        expect(latest('ShopScreen')).toBeDefined();
        expect(mockMounted['ShopScreen']).toBe(1);
        expect(mockMounted['WorldMapScreen']).toBe(1);
        expect(latest('WorldMapScreen').initialScrollY).toBe(350);

        // System back 1: pops from subcategory level to category level
        let handled = false;
        act(() => {
          handled = triggerBack();
        });
        expect(handled).toBe(true);
        expect(mockMounted['ShopScreen']).toBe(1);

        // System back 2: pops from category level to shop home level
        act(() => {
          handled = triggerBack();
        });
        expect(handled).toBe(true);
        expect(mockMounted['ShopScreen']).toBe(1);

        // System back 3: at home level, pops out of shop back to map
        act(() => {
          handled = triggerBack();
        });
        expect(handled).toBe(true);
        expect(latest('ShopScreen')).toBeUndefined();
        expect(mockMounted['ShopScreen'] ?? 0).toBe(0);

        // WorldMapScreen is still mounted and scroll position is kept
        expect(mockMounted['WorldMapScreen']).toBe(1);
        expect(latest('WorldMapScreen').initialScrollY).toBe(350);
      } finally {
        setActiveContent(baseContent);
      }
    });
  });

  describe('Shop popups and trouble triggers (Tasks 6.2 & 7.2)', () => {
    const mockShop: ResolvedShop = {
      categories: [
        {
          id: 'collares',
          title: 'Collares y arneses',
          description: 'Collares y arneses para pasear sin tirones',
          subcategories: [
            {
              id: 'arneses',
              title: 'Arneses',
              description: 'Arneses ergonómicos en Y',
              products: [
                {
                  id: 'arnes-ergonomico-y',
                  name: 'Arnés ergonómico en Y',
                  description: 'Arnés anti-tiro',
                  url: 'https://example.com/arnes',
                },
              ],
            },
          ],
        },
      ],
      idToKind: {
        collares: 'category',
        arneses: 'subcategory',
        'arnes-ergonomico-y': 'product',
      },
    };

    it('suppresses general offer on day 1 (user first active day)', async () => {
      const baseContent = getActiveContent();
      setActiveContent({
        ...baseContent,
        resolved: { ...baseContent.resolved, shop: mockShop },
      });

      try {
        await openMap();
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('shows general offer popup on World Map when 3-day cadence is met, opens shop on tap and resets ignore count', async () => {
      const baseContent = getActiveContent();
      setActiveContent({
        ...baseContent,
        resolved: { ...baseContent.resolved, shop: mockShop },
      });

      mockStore.set(
        SHOP_STATE_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_SHOP_STATE,
          firstSeenDate: '2026-11-01',
          lastGeneralOfferDate: '2026-11-01',
          generalOfferIgnoredCount: 1,
        }),
      );

      try {
        await openMap();
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
        expect(latest('ShopPopup').text).toBe('¿Quieres ver productos recomendados para tu perro?');

        // Tap "Ver" on the popup
        await act(async () => {
          await latest('ShopPopup').onOpen();
        });

        // Opens Shop
        expect(latest('ShopScreen')).toBeDefined();

        // Ignored count is reset in storage
        const saved = JSON.parse(mockStore.get(SHOP_STATE_STORAGE_KEY)!);
        expect(saved.generalOfferIgnoredCount).toBe(0);
        expect(saved.lastGeneralOfferDate).toBe(todayString());
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('dismissing general offer increments ignored count and suppresses offer permanently after 3 ignores', async () => {
      const baseContent = getActiveContent();
      setActiveContent({
        ...baseContent,
        resolved: { ...baseContent.resolved, shop: mockShop },
      });

      mockStore.set(
        SHOP_STATE_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_SHOP_STATE,
          firstSeenDate: '2026-11-01',
          lastGeneralOfferDate: '2026-11-01',
          generalOfferIgnoredCount: 2,
        }),
      );

      try {
        await openMap();
        expect(latest('ShopPopup')).toBeDefined();

        // Tap "Cerrar" (ignore)
        await act(async () => {
          await latest('ShopPopup').onClose();
        });

        // Ignored count is now 3
        const saved = JSON.parse(mockStore.get(SHOP_STATE_STORAGE_KEY)!);
        expect(saved.generalOfferIgnoredCount).toBe(3);

        // Remount map on a future day: offer is suppressed permanently
        mockStore.set(
          SHOP_STATE_STORAGE_KEY,
          JSON.stringify({
            ...saved,
            lastPopupDate: '2026-11-05',
            lastGeneralOfferDate: '2026-11-05',
          }),
        );
        act(() => renderer?.unmount());
        await openMap();
        expect(latest('ShopPopup')).toBeUndefined();
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('never renders general offer popup over simulations, minigames or lessons in progress', async () => {
      const baseContent = getActiveContent();
      const nodeNoMission = {
        ...WALK_DISTRACTION,
        id: 'node-no-mission',
      };
      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
          nodes: [...baseContent.resolved.nodes, nodeNoMission],
        },
      });

      mockStore.set(
        SHOP_STATE_STORAGE_KEY,
        JSON.stringify({
          ...DEFAULT_SHOP_STATE,
          firstSeenDate: '2026-11-01',
          lastGeneralOfferDate: '2026-11-01',
          generalOfferIgnoredCount: 0,
        }),
      );

      try {
        await openMap();
        expect(latest('ShopPopup')).toBeDefined();

        // Start a Stage
        openStop('node-no-mission');
        expect(latest('PrimerScreen')).toBeDefined();
        // Popup must NOT be rendered over PrimerScreen
        expect(latest('ShopPopup')).toBeUndefined();

        throughPrimerAndCheckpoint();
        await sendFromView({ type: 'ready' });
        // Popup must NOT be rendered over active simulation
        expect(latest('ShopPopup')).toBeUndefined();

        // Finish simulation to reach debrief
        await sendFromView({ type: 'debrief', payload: { handlingScore: 800 } });
        expect(latest('DebriefScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();

        await act(async () => {
          await latest('DebriefScreen').onDone();
        });
        // Back on map, popup is available
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('queues poste-trouble popup during Stage debrief and shows it once back on World Map', async () => {
      const baseContent = getActiveContent();
      const nodeWithTrouble = {
        ...WALK_DISTRACTION,
        id: 'node-poste-trouble',
        recommendations: [
          {
            id: 'rec-poste-arnes',
            target: 'arnes-ergonomico-y',
            targetKind: 'product' as const,
            when: 'poste-trouble',
            explanation: 'El poste se te complica: prueba este arnés.',
          },
        ],
      };

      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
          nodes: [...baseContent.resolved.nodes, nodeWithTrouble],
        },
      });

      const record = {
        ...newDogRecord(),
        posteFailures: 2,
        onboarding: { ...NEW_ONBOARDING, step: 'done' as const },
        version: RECORD_VERSION,
      };
      mockStore.set(RECORD_KEY, JSON.stringify(record));

      try {
        await act(async () => {
          renderer = create(<App />);
        });
        await act(async () => {
          jest.advanceTimersByTime(2500);
        });

        openStop('node-poste-trouble');
        throughPrimerAndCheckpoint();
        await sendFromView({ type: 'ready' });
        await sendFromView({ type: 'debrief', payload: { handlingScore: 600 } });

        // On DebriefScreen: popup must NOT be visible yet
        expect(latest('DebriefScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();

        // Exit Debrief to return to map
        await act(async () => {
          await latest('DebriefScreen').onDone();
        });

        // Now on World Map: popup is displayed
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
        expect(latest('ShopPopup').text).toBe('El poste se te complica: prueba este arnés.');

        // Tap "Ver"
        await act(async () => {
          await latest('ShopPopup').onOpen();
        });

        // Opens Shop directly at the recommended product detail
        expect(latest('ShopScreen')).toBeDefined();
        expect(latest('ShopScreen').initialTarget).toEqual({ level: 'product', id: 'arnes-ergonomico-y' });
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('evaluates poor-score trigger: ignores score = 200, but queues and shows popup for score = 199', async () => {
      const baseContent = getActiveContent();
      const nodeWithScore = {
        ...WALK_DISTRACTION,
        id: 'node-poor-score',
        recommendations: [
          {
            id: 'rec-score-sub',
            target: 'arneses',
            targetKind: 'subcategory' as const,
            when: 'poor-score',
            explanation: 'Puntuación baja: te vendrá bien revisar los arneses.',
          },
        ],
      };

      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
          nodes: [...baseContent.resolved.nodes, nodeWithScore],
        },
      });

      try {
        // Run 1: handlingScore = 200 (not poor, exactly at threshold)
        await openMap();
        openStop('node-poor-score');
        throughPrimerAndCheckpoint();
        await sendFromView({ type: 'ready' });
        await sendFromView({ type: 'debrief', payload: { handlingScore: POOR_SCORE_BELOW } });
        await act(async () => {
          await latest('DebriefScreen').onDone();
        });
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();

        // Run 2: handlingScore = 199 (< POOR_SCORE_BELOW)
        openStop('node-poor-score');
        throughPrimerAndCheckpoint();
        await sendFromView({ type: 'ready' });
        await sendFromView({ type: 'debrief', payload: { handlingScore: POOR_SCORE_BELOW - 1 } });
        expect(latest('DebriefScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();

        await act(async () => {
          await latest('DebriefScreen').onDone();
        });
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
        expect(latest('ShopPopup').text).toBe('Puntuación baja: te vendrá bien revisar los arneses.');
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('queues trouble popup when mission check-in reports a struggled problem and displays it on map exit', async () => {
      const baseContent = getActiveContent();
      const fixSample = { id: 'pulls-ahead', blocks: [], easierTarget: 'target', practise: { kind: 'node' as const, id: 'test' } };
      const missionWithRec = {
        id: 'mission-problem-rec',
        title: 'Misión paseo',
        target: 'Paseo',
        reps: 3,
        successSign: 'Paseo',
        technique: 'test',
        trains: [],
        problems: [{ id: 'pulls-ahead', label: 'Tira', fix: fixSample }],
        generalFix: fixSample,
        recommendations: [
          {
            id: 'rec-problem-pulls',
            target: 'arnes-ergonomico-y',
            targetKind: 'product' as const,
            when: 'problem:pulls-ahead',
            explanation: 'Para los tirones en el paseo te recomendamos este arnés.',
          },
        ],
      };

      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
          missions: [...baseContent.resolved.missions, missionWithRec as any],
        },
      });

      const record = {
        ...newDogRecord(),
        missions: {
          'mission-problem-rec': {
            target: 'target',
            repsRemaining: 2,
            status: 'in_progress' as const,
            startedAt: '2026-11-01T00:00:00.000Z',
          },
        },
        onboarding: { ...NEW_ONBOARDING, step: 'done' as const },
        version: RECORD_VERSION,
      };
      mockStore.set(RECORD_KEY, JSON.stringify(record));

      try {
        await act(async () => {
          renderer = create(<App />);
        });
        await act(async () => {
          jest.advanceTimersByTime(2500);
        });

        // Open mission check-in
        act(() => {
          latest('WorldMapScreen').onOpenStop({ kind: 'mission', id: 'mission-problem-rec' });
        });

        expect(latest('MissionCheckInScreen')).toBeDefined();
        act(() => {
          latest('MissionCheckInScreen').onAnswer('struggled');
        });

        expect(latest('MissionProblemScreen')).toBeDefined();
        act(() => {
          latest('MissionProblemScreen').onPick('pulls-ahead');
        });

        // Now on FixScreen: popup must NOT be visible yet
        expect(latest('FixScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeUndefined();

        // Exit FixScreen to map
        act(() => {
          latest('FixScreen').onDone();
        });

        // Now on World Map: trouble popup is displayed
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
        expect(latest('ShopPopup').text).toBe('Para los tirones en el paseo te recomendamos este arnés.');
      } finally {
        setActiveContent(baseContent);
      }
    });

    it('delays trouble popup until interstitial advert closes and World Map mounts for free-tier users', async () => {
      const baseContent = getActiveContent();
      const nodeWithTrouble = {
        ...WALK_DISTRACTION,
        id: 'node-poste-ad',
        recommendations: [
          {
            id: 'rec-poste-arnes-ad',
            target: 'arnes-ergonomico-y',
            targetKind: 'product' as const,
            when: 'poste-trouble',
            explanation: 'Arnés para el poste tras el anuncio.',
          },
        ],
      };

      setActiveContent({
        ...baseContent,
        resolved: {
          ...baseContent.resolved,
          shop: mockShop,
          nodes: [...baseContent.resolved.nodes, nodeWithTrouble],
        },
      });

      const record = {
        ...newDogRecord(),
        posteFailures: 2,
        onboarding: { ...NEW_ONBOARDING, step: 'done' as const },
        version: RECORD_VERSION,
      };
      mockStore.set(RECORD_KEY, JSON.stringify(record));

      try {
        await act(async () => {
          renderer = create(<App />);
        });
        await act(async () => {
          jest.advanceTimersByTime(2500);
        });

        openStop('node-poste-ad');
        throughPrimerAndCheckpoint();
        await sendFromView({ type: 'ready' });
        await sendFromView({ type: 'debrief', payload: { handlingScore: 600 } });

        expect(latest('DebriefScreen')).toBeDefined();

        // Enable pending interstitial
        pendingAd = true;

        // Tap Done on Debrief
        act(() => {
          latest('DebriefScreen').onDone();
        });

        // Advert was triggered, but promise is not resolved yet
        expect(interstitialTriggered).toBe(true);
        // Map is not mounted yet, and popup is NOT mounted yet
        expect(latest('WorldMapScreen')).toBeUndefined();
        expect(latest('ShopPopup')).toBeUndefined();

        // Close the advert
        await act(async () => {
          interstitialResolver?.();
        });

        // Now map has mounted and popup appears
        expect(latest('WorldMapScreen')).toBeDefined();
        expect(latest('ShopPopup')).toBeDefined();
        expect(latest('ShopPopup').text).toBe('Arnés para el poste tras el anuncio.');
      } finally {
        setActiveContent(baseContent);
      }
    });
  });
});
