import './global.css';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';
import { createTranslator, es } from './src/i18n';
import { installFeedback } from './src/shell/ui/feedbackBackends';
import { useUiSettings } from './src/shell/ui/useUiSettings';
import { defaultScenario, type ScenarioConfig } from './src/sim/config';
import type { LearningSnapshot } from './src/sim/learning';
import type { SimulationDebriefPayload } from './src/sim/payload';
import { BUNDLE_MESSAGE_TYPES, decode, type BundleMessage, type ShellMessage } from './src/sim/messages';
import { newSeed } from './src/sim/rng';
import { playDogSound, playResolvedCue, prepareAudio } from './src/shell/audio';
import { createVocalizer } from './src/shell/vocalize';
import { applyDiary, applyStage, toSnapshot } from './src/shell/dogRecord';
import { starsFor } from './src/shell/stars';
import { lookOf } from './src/shell/onboarding/look';
import { INTRO_NODE } from './src/shell/onboarding/introNode';
import { celebrationsFor, starsShown, type Celebration } from './src/shell/celebrations';
import { completeDaily, dateSeed, generateDailyStage, todayString, warmupAfterDaily, type DailyCompletion } from './src/shell/daily';
import { ErrorOverlay, HintOverlay, LoadingOverlay, ResumeOverlay } from './src/shell/Overlays';
import { POSTE_PRACTICE } from './src/shell/nodes/content';
import { withPull } from './src/shell/nodes/scenarios';
import { advance, onDebrief, shouldShowPosteLink, startNode, type Metric, type NodeAction, type NodeDef, type NodeRun } from './src/shell/nodes/node';
import { DailyResultScreen } from './src/shell/screens/DailyResultScreen';
import { DoorbellMatView } from './src/shell/screens/DoorbellMatView';
import { LESSONS } from './src/shell/lessons/content';
import { lessonDay, markLessonRead, todaysLesson } from './src/shell/lessons/lesson';
import { LessonScreen, LibraryScreen } from './src/shell/screens/LessonScreens';
import { WorldMapScreen } from './src/shell/screens/WorldMapScreen';
import { CheckpointScreen, DebriefScreen, PrimerScreen } from './src/shell/screens/NodeScreens';
import { PosteMinigameView } from './src/shell/screens/PosteMinigameView';
import { DiagnosticView } from './src/shell/screens/DiagnosticView';
import { PaywallScreen } from './src/shell/screens/PaywallScreen';
import { PlanScreen } from './src/shell/screens/PlanScreen';
import { DogLookScreen, PayoffOverlay } from './src/shell/screens/IntroScreens';
import { SetupScreen } from './src/shell/screens/SetupScreen';
import { SettingsScreen } from './src/shell/screens/SettingsScreen';
import { SplashScreen } from './src/shell/screens/SplashScreen';
import { isRusty, sessionCapacity, warmupScenario, type WarmupOutcome } from './src/shell/rusty';
import { SimView } from './src/shell/SimView';
import type { SimViewHandle } from './src/shell/simViewTypes';
import { dogStore } from './src/shell/storage';
import { completeFirstStage } from './src/shell/onboarding/firstStage';
import { nextStep } from './src/shell/onboarding/flow';
import { recordDiagnostic } from './src/shell/onboarding/diagnostic';
import { HINT_TEXT, hintFor, markHintSeen, type HintId } from './src/shell/onboarding/hints';
import { completeTaste, leaveWelcome, saveNameAndLook } from './src/shell/onboarding/intro';
import { passPaywall } from './src/shell/onboarding/paywall';
import { TASTE_LINE_KEY, TASTE_LINGER_MS, TASTE_SNAPSHOT, tasteScenario } from './src/shell/onboarding/taste';
import { useDog } from './src/shell/useDog';
import { migrateRecord } from './src/shell/dogRecord';
import { resolveScenario } from './src/shell/sync/configs';
import { useAccount } from './src/shell/sync/useAccount';
import { AccountBanner, AuthScreen, ChooseDogScreen, RegisterPrompt } from './src/shell/screens/AccountScreens';
import { resolveCue, type Language } from './src/shell/voice';
import { isReadyToLeaveSplash, routeFor } from './src/shell/navigation';
import { resetProgress } from './src/shell/reset';

// Hold native splash on cold start until ready
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

type DailyRun = { payload: SimulationDebriefPayload; completion: DailyCompletion; celebrations: Celebration[] };
type Flow =
  | { name: 'warmup' }
  | { name: 'register' }
  | { name: 'auth'; mode: 'signup' | 'login'; returnTo?: 'settings' | 'map' }
  | { name: 'daily'; attempt: number; result: DailyRun | null }
  | { name: 'node'; run: NodeRun; attempt: number }
  | { name: 'library' }
  | { name: 'lesson'; id: string }
  | { name: 'paywall' };

/** The shell owns the active language; Spanish is the only one shipped. */
const CATALOG = es;
const LANGUAGE: Language = 'es';
const LOAD_TIMEOUT_MS = 20000;
const HINT_MS = 7000;
const MIN_SPLASH_MS = 2200;
const FONT_TIMEOUT_MS = 2000;

installFeedback();

export default function App() {
  const [fontsLoaded] = useFonts({ Fredoka_600SemiBold });
  const [fontTimedOut, setFontTimedOut] = useState(false);
  const [minSplashElapsed, setMinSplashElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFontTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  // Hide the native splash once the in-app splash has been laid out
  const hideNativeSplash = useCallback(() => {
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  const ui = useUiSettings(dogStore);
  const sim = useRef<SimViewHandle>(null);
  const { record, update, replace } = useDog(dogStore);
  const account = useAccount(dogStore, record, replace);
  const accountRef = useRef(account);
  accountRef.current = account;
  const [reminder, setReminder] = useState(false);
  const [bundle, setBundle] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paused, setPaused] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [hint, setHint] = useState<HintId | null>(null);
  const [warmup, setWarmup] = useState<WarmupOutcome>('none');
  // celebrations are diffed once when a result opens and then only displayed, so each shows once
  const [celebrations, setCelebrations] = useState<{ id: string; list: Celebration[] } | null>(null);
  const [attempt, setAttempt] = useState(0); // bumping it reloads the bundle
  const t = useMemo(() => createTranslator(CATALOG), []);

  const flowRef = useRef(flow);
  flowRef.current = flow;
  const recordRef = useRef(record);
  recordRef.current = record;
  const vocalizer = useRef(createVocalizer(playDogSound));
  const pendingStart = useRef<ShellMessage | null>(null);
  const bundleReady = useRef(false);

  // Ready to leave splash: record loaded, font loaded or timed out (2 s cap), and min splash time elapsed (~2.2 s)
  const [splashReady, setSplashReady] = useState(false);
  useEffect(() => {
    if (splashReady) return;
    if (
      isReadyToLeaveSplash({
        recordLoaded: record !== null,
        fontLoaded: Boolean(fontsLoaded),
        fontTimedOut,
        minElapsed: minSplashElapsed,
      })
    ) {
      setSplashReady(true);
    }
  }, [splashReady, record, fontsLoaded, fontTimedOut, minSplashElapsed]);

  const route = routeFor({
    ready: splashReady,
    onboardingStep: record?.onboarding.step,
    flow,
    accountFlow: flow?.name === 'auth' || flow?.name === 'register',
    settingsOpen,
  });
  const routeRef = useRef(route);
  routeRef.current = route;

  // the Dog is Rusty if the gap was there when the app opened; decided once, per session
  const rusty = useRef<boolean | null>(null);
  if (record && rusty.current === null) rusty.current = isRusty(record.lastStageDate, new Date());
  const capacity = sessionCapacity(rusty.current === true, warmup);
  const capacityRef = useRef(capacity);
  capacityRef.current = capacity;

  // a hint stays a few seconds and never blocks the Stage
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), HINT_MS);
    return () => clearTimeout(timer);
  }, [hint]);

  const send = useCallback((message: ShellMessage) => sim.current?.post(message), []);

  /** Starts a Stage with the Dog's snapshot; waits for the bundle if it is still loading. */
  const startStage = useCallback(
    (scenario: Partial<ScenarioConfig>, seed: number = newSeed(), snapshot?: LearningSnapshot) => {
      const current = recordRef.current;
      if (!current) return;
      const message: ShellMessage = {
        type: 'start',
        seed,
        catalog: CATALOG,
        scenario: { ...withPull(scenario, current.weights), learning: snapshot ?? toSnapshot(current, capacityRef.current), look: lookOf(current) },
      };
      setPaused(false);
      setHint(null);
      if (bundleReady.current) send(message);
      else pendingStart.current = message;
    },
    [send],
  );

  const act = useCallback((action: NodeAction) => {
    const f = flowRef.current;
    if (f?.name !== 'node') return;
    setFlow({ ...f, run: advance(f.run, action) });
  }, []);

  // entering a walking Interactive Simulation starts the Stage
  const simulationKey =
    route.name === 'flow' && route.flow.name === 'node' && route.flow.run.step === 'simulation' && route.flow.run.node.mode === 'stage'
      ? `${route.flow.run.node.id}:${route.flow.attempt}`
      : null;
  useEffect(() => {
    if (simulationKey === null || flowRef.current?.name !== 'node') return;
    const node = flowRef.current.run.node;
    startStage(resolveScenario(node.id, node.simulation.scenario ?? {}, accountRef.current.configs).scenario);
  }, [simulationKey, startStage]);

  const warmupActive = route.name === 'flow' && route.flow.name === 'warmup';
  useEffect(() => {
    if (warmupActive) startStage(warmupScenario(defaultScenario));
  }, [warmupActive, startStage]);

  // a flow left over while the funnel, a guided Stage or the paywall is showing is dead state: drop it
  const onboardingStep = record?.onboarding.step;
  useEffect(() => {
    if (route.name === 'funnel' || route.name === 'taste' || route.name === 'first-stage' || route.name === 'paywall') setFlow(null);
  }, [route.name, onboardingStep]);

  // the taste Stage: an untrained Dog on a scenario built to fail; the control line stays until the first input
  const [tasteLine, setTasteLine] = useState(false);
  const [tastePayoff, setTastePayoff] = useState(false);
  const tastePayoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTastePayoff = useCallback(() => {
    if (tastePayoffTimer.current) return;
    send({ type: 'focus' });
    tastePayoffTimer.current = setTimeout(() => setTastePayoff(true), TASTE_LINGER_MS);
  }, [send]);
  useEffect(() => {
    if (route.name !== 'taste') return;
    setTasteLine(true);
    setTastePayoff(false);
    if (tastePayoffTimer.current) clearTimeout(tastePayoffTimer.current);
    tastePayoffTimer.current = null;
    startStage(tasteScenario, newSeed(), TASTE_SNAPSHOT);
  }, [route.name, startStage]);

  // the guided first Stage: runs the introductory "Node 0" loop (Primer, Checkpoint, Simulation, Debrief)
  const [introRun, setIntroRun] = useState<NodeRun | null>(null);
  useEffect(() => {
    if (route.name === 'first-stage') {
      setIntroRun((current) => current ?? startNode(INTRO_NODE));
    } else {
      setIntroRun(null);
    }
  }, [route.name]);

  useEffect(() => {
    if (route.name === 'first-stage' && introRun?.step === 'simulation' && introRun.result === null) {
      startStage({});
    }
  }, [route.name, introRun?.step, introRun?.result, startStage]);

  // the Daily Stage skips the Primer and the Checkpoint: it goes straight to the walk, same seed all day
  const dailyKey = route.name === 'flow' && route.flow.name === 'daily' && route.flow.result === null ? route.flow.attempt : null;
  useEffect(() => {
    if (dailyKey === null) return;
    const date = todayString();
    startStage(generateDailyStage(date), dateSeed(date));
  }, [dailyKey, startStage]);

  // reaching the Debrief completes the Node; only a Stage changes the Dog
  const debriefId =
    route.name === 'flow' && route.flow.name === 'node' && route.flow.run.step === 'debrief'
      ? `${route.flow.run.node.id}:${route.flow.attempt}`
      : null;
  useEffect(() => {
    const f = flowRef.current;
    if (debriefId === null || f?.name !== 'node') return;
    let diff: Celebration[] = [];
    update((r) => {
      const after = onDebrief(r, f.run, new Date());
      diff = celebrationsFor(r, after, { kind: 'node', nodeId: f.run.node.id });
      return after;
    });
    setCelebrations({ id: debriefId, list: diff });
  }, [debriefId, update]);

  const goHome = useCallback(() => {
    setPaused(false);
    setFlow(null);
    setSettingsOpen(false);
  }, []);

  const onAuthDone = useCallback(() => {
    const f = flowRef.current;
    const returnTo = f?.name === 'auth' ? f.returnTo : undefined;
    setFlow(null);
    if (returnTo === 'settings') {
      setSettingsOpen(true);
    } else {
      setSettingsOpen(false);
    }
  }, []);

  const onMessage = useCallback(
    (raw: unknown) => {
      const message = decode<BundleMessage>(raw, BUNDLE_MESSAGE_TYPES);
      if (!message) return;
      if (message.type === 'ready') {
        bundleReady.current = true;
        setBundle('ready');
        if (pendingStart.current) {
          send(pendingStart.current);
          pendingStart.current = null;
        }
      } else if (message.type === 'paused') setPaused(true);
      else if (message.type === 'stage-signal') {
        if (message.signal === 'first-input') setTasteLine(false);
        // the taste shows no Hints and records none
        const shown = recordRef.current && routeRef.current.name !== 'taste' ? hintFor(message.signal, recordRef.current.seenHints) : null;
        if (shown) {
          setHint(shown);
          update((r) => markHintSeen(r, shown));
        }
      } else if (message.type === 'reaction-tier-change') {
        vocalizer.current.onTier(message.tier);
        // the taste zooms in on the Handler and the Dog, then the payoff shows over it
        if (message.tier === 'reactive' && routeRef.current.name === 'taste') showTastePayoff();
      }
      else if (message.type === 'playCue') {
        if (recordRef.current) playResolvedCue(resolveCue(recordRef.current, LANGUAGE));
      } else if (message.type === 'debrief') {
        const payload: SimulationDebriefPayload = message.payload;
        const f = flowRef.current;
        if (f?.name === 'daily' && f.result === null) {
          // the score and the Streak are kept; what the Dog has learned and the campaign are not touched
          const before = recordRef.current!;
          const completion = completeDaily(before, payload, new Date());
          update(() => completion.record);
          setWarmup((w) => warmupAfterDaily(w));
          const list = celebrationsFor(before, completion.record, { kind: 'daily', improved: completion.improved, firstOfDay: completion.firstOfDay, best: completion.best });
          setFlow({ ...f, result: { payload, completion, celebrations: list } });
        } else if (routeRef.current.name === 'taste') {
          // the time limit: the payload is dropped, nothing is learned from the taste
          showTastePayoff();
        } else if (routeRef.current.name === 'first-stage') {
          setIntroRun((r) => (r ? advance(r, { type: 'finish', result: { kind: 'stage', payload } }) : null));
        } else if (f?.name === 'warmup') {
          // ungraded: the warm-up never changes the Dog
          setWarmup('completed');
          goHome();
        } else if (f?.name === 'node') {
          accountRef.current.countStage();
          act({ type: 'finish', result: { kind: 'stage', payload } });
        }
      } else if (message.type === 'error') setBundle('error');
    },
    [act, goHome, send, showTastePayoff, update],
  );

  useEffect(() => {
    prepareAudio(false);
  }, []);

  // a bundle that never reports ready counts as a load failure
  useEffect(() => {
    if (bundle !== 'loading') return;
    const timer = setTimeout(() => setBundle('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [bundle, attempt]);

  // leaving the app pauses the Stage; no Stage time elapses until the user chooses Resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (playingStageRef.current) send({ type: 'wake' });
      } else {
        send({ type: 'pause' });
        send({ type: 'suspend' });
      }
    });
    return () => sub.remove();
  }, [send]);

  const retry = () => {
    bundleReady.current = false;
    setBundle('loading');
    setAttempt((n) => n + 1);
  };

  // the registration reminder counts as given once shown, and stays up until the user answers it
  useEffect(() => {
    if (account.remind && route.name === 'map' && !reminder) {
      setReminder(true);
      account.markReminded();
    }
  }, [account, account.remind, route.name, reminder]);

  const startNodeRun = (node: NodeDef) => {
    setSettingsOpen(false);
    setFlow({ name: 'node', run: startNode(node), attempt: 0 });
  };

  const playingStage =
    simulationKey !== null ||
    (route.name === 'flow' && route.flow.name === 'warmup') ||
    route.name === 'taste' ||
    (route.name === 'first-stage' && introRun?.step === 'simulation') ||
    dailyKey !== null;

  // the bundle only draws while a Stage is on screen; 'start' wakes it, leaving the Stage puts it to sleep
  const playingStageRef = useRef(playingStage);
  playingStageRef.current = playingStage;
  useEffect(() => {
    if (!playingStage) send({ type: 'suspend' });
  }, [playingStage, send]);

  const resetting = useRef(false);
  const handleReset = async () => {
    const current = recordRef.current;
    if (!current || resetting.current) return;
    resetting.current = true;
    try {
      const fresh = await resetProgress(dogStore, current);
      account.resetSync();
      rusty.current = null;
      setWarmup('none');
      setCelebrations(null);
      setReminder(false);
      setHint(null);
      setPaused(false);
      setFlow(null);
      setSettingsOpen(false);
      replace(fresh);
    } catch {
      // nothing was cleared (recordings are deleted last), so the Dog is untouched; the user can retry
    } finally {
      resetting.current = false;
    }
  };

  // the map with an optional overlay over it; Settings, the Library and Lessons keep the map mounted underneath, so it is where it was on return
  const mapWith = (overlay: 'settings' | React.ReactNode) => {
    if (!record) return null;
    return (
      <View className="absolute inset-0">
        <WorldMapScreen
          t={t}
          completed={record.completedNodes}
          stars={record.stars}
          rusty={rusty.current === true && warmup !== 'completed'}
          streak={record.streak}
          today={todayString()}
          libraryToday={todaysLesson(LESSONS, record.readLessons, lessonDay(record, new Date())) !== null}
          onLibrary={() => setFlow({ name: 'library' })}
          dailyBest={record.dailyBest[todayString()]}
          onDaily={() => setFlow({ name: 'daily', attempt: 0, result: null })}
          rustyPrompt={rusty.current === true && warmup === 'none'}
          skippedWarmup={warmup === 'skipped'}
          onWarmup={() => setFlow({ name: 'warmup' })}
          onSkipWarmup={() => setWarmup('skipped')}
          onStartNode={startNodeRun}
          onSettings={() => setSettingsOpen(true)}
          breed={record.breed}
          coat={record.coat}
          onPaywall={() => setFlow({ name: 'paywall' })}
          banner={
            account.signedIn && account.sync.paused === 'verify' ? (
              <AccountBanner t={t} kind="verify" />
            ) : reminder && !account.signedIn ? (
              <AccountBanner
                t={t}
                kind="remind"
                onAction={() => {
                  setReminder(false);
                  setFlow({ name: 'auth', mode: 'signup', returnTo: 'map' });
                }}
                onDismiss={() => setReminder(false)}
              />
            ) : null
          }
        />
        {overlay === 'settings' ? (
          <SettingsScreen
            t={t}
            language={LANGUAGE}
            record={record}
            update={update}
            onClose={() => setSettingsOpen(false)}
            account={account}
            onLogIn={() => setFlow({ name: 'auth', mode: 'login', returnTo: 'settings' })}
            ui={ui}
            onReset={handleReset}
          />
        ) : (
          overlay
        )}
      </View>
    );
  };

  let screen: React.ReactNode = null;
  if (route.name === 'splash') {
    screen = <SplashScreen t={t} onShown={hideNativeSplash} />;
  } else if (route.name === 'funnel') {
    if (record) {
      if (route.step === 'welcome')
        screen = (
          <SplashScreen
            t={t}
            onShown={hideNativeSplash}
            actions={{ onStart: () => update(leaveWelcome), onLogIn: account.configured ? () => setFlow({ name: 'auth', mode: 'login', returnTo: 'map' }) : undefined }}
          />
        );
      else if (route.step === 'dog') screen = <DogLookScreen t={t} record={record} onDone={(name, coat, breed) => update((r) => saveNameAndLook(r, name, coat, breed))} />;
      else if (route.step === 'setup') screen = <SetupScreen t={t} record={record} update={update} />;
      else if (route.step === 'diagnostic')
        screen = <DiagnosticView key="diagnostic" t={t} record={record} seed={newSeed()} onFinish={(latency) => update((r) => recordDiagnostic(r, latency))} />;
      else if (route.step === 'plan')
        screen = <PlanScreen t={t} dog={record} latency={record.onboarding.diagnosticLatency ?? 0.5} plan={record.onboarding.plan} onContinue={() => update((r) => ({ ...r, onboarding: { ...r.onboarding, step: nextStep('plan') } }))} />;
    }
  } else if (route.name === 'taste') {
    screen = null;
  } else if (route.name === 'first-stage') {
    if (introRun?.step === 'primer') {
      screen = (
        <PrimerScreen
          t={t}
          run={introRun}
          onNext={() => setIntroRun((r) => (r ? advance(r, { type: 'next' }) : null))}
          onExit={() => update((r) => ({ ...r, onboarding: { ...r.onboarding, step: 'plan' } }))}
        />
      );
    } else if (introRun?.step === 'checkpoint') {
      screen = (
        <CheckpointScreen
          t={t}
          run={introRun}
          setting={record?.checkpointSeconds ?? 0}
          onAnswer={(option) => setIntroRun((r) => (r ? advance(r, { type: 'answer', option }) : null))}
          onTimeout={() => setIntroRun((r) => (r ? advance(r, { type: 'timeout' }) : null))}
        />
      );
    } else if (introRun?.step === 'debrief' && introRun.result?.kind === 'stage') {
      const payload = introRun.result.payload;
      screen = (
        <DebriefScreen
          t={t}
          run={introRun}
          showPosteLink={false}
          diary={null}
          onDiary={() => {}}
          onPosteLink={() => {}}
          best={starsFor(payload.handlingScore)}
          celebrations={[]}
          onPlayAgain={() => {
            setIntroRun((r) => (r ? { ...r, step: 'simulation', result: null } : null));
          }}
          onDone={() => {
            update((r) => completeFirstStage(r, payload, new Date()));
            accountRef.current.countStage();
            if (accountRef.current.configured && !accountRef.current.signedIn) {
              setFlow({ name: 'register' });
            } else {
              goHome();
            }
          }}
        />
      );
    } else {
      screen = null;
    }
  } else if (route.name === 'paywall') {
    if (account.choice && account.signedIn && record) {
      screen = <ChooseDogScreen t={t} local={record} cloud={migrateRecord(account.choice[0].record)} onChoose={account.chooseDog} />;
    } else if (record) {
      screen = <PaywallScreen t={t} onStartTrial={() => update((r) => passPaywall(r, true, new Date()))} onLater={() => update((r) => passPaywall(r, false, new Date()))} />;
    }
  } else if (route.name === 'map' || route.name === 'settings') {
    if (account.choice && account.signedIn && record) {
      screen = <ChooseDogScreen t={t} local={record} cloud={migrateRecord(account.choice[0].record)} onChoose={account.chooseDog} />;
    } else if (record) {
      screen = mapWith(route.name === 'settings' ? 'settings' : null);
    }
  } else if (route.name === 'flow') {
    const f = route.flow;
    if (f.name === 'library' && record) {
      screen = mapWith(
        <LibraryScreen t={t} lessons={LESSONS} readIds={record.readLessons} day={lessonDay(record, new Date())} onOpen={(lesson) => setFlow({ name: 'lesson', id: lesson.id })} onBack={goHome} />,
      );
    } else if (f.name === 'lesson' && record) {
      const lesson = LESSONS.find((l) => l.id === f.id);
      screen = mapWith(
        lesson ? (
          <LessonScreen
            t={t}
            lesson={lesson}
            onDone={() => {
              update((r) => markLessonRead(r, lesson.id));
              setFlow({ name: 'library' });
            }}
            onBack={() => setFlow({ name: 'library' })}
          />
        ) : null,
      );
    } else if (f.name === 'daily') {
      if (f.result) {
        screen = (
          <DailyResultScreen
            t={t}
            payload={f.result.payload}
            completion={f.result.completion}
            celebrations={f.result.celebrations}
            onReplay={() => setFlow({ ...f, attempt: f.attempt + 1, result: null })}
            onDone={goHome}
          />
        );
      }
    } else if (f.name === 'paywall') {
      screen = (
        <PaywallScreen
          t={t}
          onStartTrial={() => {
            update((r) => passPaywall(r, true, new Date()));
            goHome();
          }}
          onLater={goHome}
        />
      );
    } else if (f.name === 'register') {
      screen = <RegisterPrompt t={t} onCreate={() => setFlow({ name: 'auth', mode: 'signup', returnTo: 'map' })} onNotNow={goHome} />;
    } else if (f.name === 'auth') {
      screen = account.auth ? <AuthScreen t={t} auth={account.auth} initial={f.mode} onDone={onAuthDone} onBack={onAuthDone} /> : null;
    } else if (f.name === 'node' && record) {
      const { run } = f;
      if (run.step === 'primer') screen = <PrimerScreen t={t} run={run} onNext={() => act({ type: 'next' })} onExit={goHome} />;
      else if (run.step === 'checkpoint')
        screen = <CheckpointScreen t={t} run={run} setting={record.checkpointSeconds} onAnswer={(option) => act({ type: 'answer', option })} onTimeout={() => act({ type: 'timeout' })} />;
      else if (run.step === 'simulation' && run.node.mode === 'minigame') {
        const finish = (metrics: Partial<Record<Metric, number>>) => act({ type: 'finish', result: { kind: 'minigame', metrics } });
        screen =
          run.node.simulation.minigame === 'doorbell-mat' ? (
            <DoorbellMatView key={`minigame-${f.attempt}`} t={t} coat={record.coat} seed={f.attempt + 1 + (dateSeed(todayString()) % 1000)} onFinish={finish} />
          ) : (
            <PosteMinigameView key={`minigame-${f.attempt}`} t={t} coat={record.coat} variant={run.node.simulation.minigame === 'harness-ritual' ? 'harness' : 'poste'} onFinish={finish} />
          );
      } else if (run.step === 'debrief') {
        screen = (
          <DebriefScreen
            t={t}
            run={run}
            showPosteLink={shouldShowPosteLink(record, run.node.id)}
            diary={record.walkDiary.find((e) => e.date === todayString() && e.nodeId === run.node.id)?.outcome ?? null}
            onDiary={(outcome) => update((r) => applyDiary(r, run.node.id, outcome, new Date()))}
            best={starsShown(record, run.node.id) ?? 1}
            celebrations={celebrations?.id === `${run.node.id}:${f.attempt}` ? celebrations.list : []}
            onPosteLink={() => startNodeRun(POSTE_PRACTICE)}
            onPlayAgain={() => setFlow({ ...f, run: { ...run, step: 'simulation', result: null }, attempt: f.attempt + 1 })}
            onDone={goHome}
          />
        );
      }
    }
  }

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-bg">
        <SimView key={attempt} ref={sim} onMessage={onMessage} onLoadError={() => setBundle('error')} />
        {screen}
        {playingStage && hint && !paused && <HintOverlay text={t(HINT_TEXT[hint])} />}
        {route.name === 'taste' && tasteLine && !tastePayoff && !paused && bundle === 'ready' && <HintOverlay text={t(TASTE_LINE_KEY)} />}
        {route.name === 'taste' && tastePayoff && record && <PayoffOverlay t={t} name={record.name} onContinue={() => update(completeTaste)} />}
        {playingStage && bundle === 'loading' && <LoadingOverlay t={t} />}
        {playingStage && paused && (
          <ResumeOverlay
            t={t}
            onResume={() => {
              setPaused(false);
              send({ type: 'resume' });
            }}
            onExit={() => {
              if (route.name === 'taste' || route.name === 'first-stage') {
                // the funnel cannot be left from a Stage; Exit just carries on
                setPaused(false);
                send({ type: 'resume' });
              } else goHome();
            }}
          />
        )}
        {bundle === 'error' && <ErrorOverlay t={t} onRetry={retry} />}
        <StatusBar style="dark" hidden />
      </View>
    </SafeAreaProvider>
  );
}
