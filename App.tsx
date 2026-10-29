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
import { applyActivity, applyDaySkip, applyMissionCheckIn, toSnapshot, updateMission } from './src/shell/dogRecord';
import { starsFor } from './src/shell/stars';
import { lookOf } from './src/shell/onboarding/look';
import { INTRO_NODE } from './src/shell/onboarding/introNode';
import { celebrationsFor, starsShown, type Celebration } from './src/shell/celebrations';
import { completeDaily, dateSeed, generateDailyStage, todayString, warmupAfterDaily, type DailyCompletion } from './src/shell/daily';
import { CoachMarksOverlay, DogWarningOverlay, ErrorOverlay, HintOverlay, LoadingOverlay, ResumeOverlay } from './src/shell/Overlays';
import { findNode, POSTE_PRACTICE } from './src/shell/nodes/content';
import { withPull } from './src/shell/nodes/scenarios';
import { advance, onDebrief, shouldShowPosteLink, startNode, type Metric, type NodeAction, type NodeDef, type NodeRun } from './src/shell/nodes/node';
import { DailyResultScreen } from './src/shell/screens/DailyResultScreen';
import { DiaryScreen } from './src/shell/screens/DiaryScreen';
import { DoorbellMatView } from './src/shell/screens/DoorbellMatView';
import { barkdokuResult, BarkdokuView } from './src/shell/screens/BarkdokuView';
import { getDailyBoard } from './src/shell/puzzle/boards';
import { findLesson, LESSONS } from './src/shell/lessons/content';
import { findFix, findMission } from './src/shell/missions/content';
import { acceptEasier, canMoveOn, fixFor, moveOn, startMission } from './src/shell/missions/mission';
import type { DiaryOutcome } from './src/shell/streak';
import { canSkipDay, missionAfterDebrief, missionEntryOf, missionForDebrief } from './src/shell/missions/missionView';
import { canStartTrial, isPlus, progressAt, startTrialThen, type PendingPlusAction } from './src/shell/plus';
import { FixScreen, MissionBriefScreen, MissionCheckInScreen, MissionPassedScreen, MissionProblemScreen, MissionWaitingScreen } from './src/shell/screens/MissionScreens';
import type { Stop } from './src/shell/world';
import { lessonDay, markLessonRead, todaysLesson } from './src/shell/lessons/lesson';
import { LessonScreen, LibraryScreen } from './src/shell/screens/LessonScreens';
import { WorldMapScreen } from './src/shell/screens/WorldMapScreen';
import { CheckpointScreen, DebriefScreen, PrimerScreen } from './src/shell/screens/NodeScreens';
import { PosteMinigameView } from './src/shell/screens/PosteMinigameView';
import { ReadDogView } from './src/shell/screens/ReadDogView';
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
import { COACH_ID, HINT_TEXT, hintFor, markHintSeen, type HintId } from './src/shell/onboarding/hints';
import { completeTaste, leaveWelcome, saveNameAndLook, withDogName } from './src/shell/onboarding/intro';
import { passPaywall } from './src/shell/onboarding/paywall';
import { TASTE_LINGER_MS, TASTE_SNAPSHOT, tasteScenario } from './src/shell/onboarding/taste';
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
  | { name: 'diary' }
  /** A Lesson from the Library, or from its Stop on the map; Done and Back return there. */
  | { name: 'lesson'; id: string; returnTo: 'map' | 'library' }
  /** A Mission Stop's screens; a Fix opened from "Tus ajustes" returns to the Library. */
  | { name: 'mission'; id: string; view: MissionView; fixId?: string; returnTo?: 'map' | 'library' }
  /** The paywall from the map, or from a Plus-only action (`then`) that "Empezar prueba" completes. */
  | { name: 'paywall'; then?: PendingPlusAction }
  | { name: 'puzzle'; date: string };
type MissionView = 'brief' | 'waiting' | 'checkin' | 'problem' | 'fix' | 'passed';

/** The shell owns the active language; Spanish is the only one shipped. */
const CATALOG = es;
const LANGUAGE: Language = 'es';
const LOAD_TIMEOUT_MS = 20000;
const HINT_MS = 7000;
/** The Marker Coach mark gives up after this long without a press. */
const COACH_MARK_MS = 20000;
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
  // the approaching-dog warning: where the dog comes from on screen, while it is shown
  const [dogWarning, setDogWarning] = useState<{ bearing: number | null } | null>(null);
  // Coach marks: which controls were used in this Stage, and the Stage's run number (restarts the Marker timeout)
  const [controlsUsed, setControlsUsed] = useState({ move: false, mark: false });
  const [markExpired, setMarkExpired] = useState(false);
  const [stageRun, setStageRun] = useState(0);
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

  useEffect(() => {
    if (!dogWarning) return;
    const timer = setTimeout(() => setDogWarning(null), HINT_MS);
    return () => clearTimeout(timer);
  }, [dogWarning]);

  // the Marker mark stays until the first press or this timeout, whichever comes first
  useEffect(() => {
    setMarkExpired(false);
    const timer = setTimeout(() => setMarkExpired(true), COACH_MARK_MS);
    return () => clearTimeout(timer);
  }, [stageRun]);

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
      setDogWarning(null);
      setControlsUsed({ move: false, mark: false });
      setStageRun((n) => n + 1);
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

  // the taste Stage: an untrained Dog on a scenario built to fail; the Coach marks show as in any Stage
  const [tastePayoff, setTastePayoff] = useState(false);
  const tastePayoffTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTastePayoff = useCallback(() => {
    if (tastePayoffTimer.current) return;
    send({ type: 'focus' });
    tastePayoffTimer.current = setTimeout(() => setTastePayoff(true), TASTE_LINGER_MS);
  }, [send]);
  useEffect(() => {
    if (route.name !== 'taste') return;
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
      const now = new Date();
      const after = onDebrief(r, f.run, now);
      diff = celebrationsFor(progressAt(r, now), progressAt(after, now), { kind: 'node', nodeId: f.run.node.id });
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
        const inTaste = routeRef.current.name === 'taste';
        if (message.signal === 'control-used' && message.control) {
          // a Coach mark is gone once its control is used; the taste records this too, so the first guided Stage skips it
          const control = message.control;
          setControlsUsed((used) => ({ ...used, [control]: true }));
          update((r) => markHintSeen(r, COACH_ID[control]));
        } else if (message.signal === 'dog-approaching') {
          // the warning shows in the taste but is recorded only in recorded Stages
          const seen = recordRef.current?.seenHints ?? [];
          if (inTaste || hintFor('dog-approaching', seen)) {
            setHint(null); // one panel at a time
            setDogWarning({ bearing: message.bearing ?? null });
            if (!inTaste) update((r) => markHintSeen(r, 'dog-approaching'));
          }
        } else {
          // the taste shows no Hints and records none
          const shown = recordRef.current && !inTaste ? hintFor(message.signal, recordRef.current.seenHints) : null;
          if (shown) {
            setHint(shown);
            update((r) => markHintSeen(r, shown));
          }
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
          const now = new Date();
          const completion = completeDaily(before, payload, now);
          update(() => completion.record);
          setWarmup((w) => warmupAfterDaily(w));
          const list = celebrationsFor(progressAt(before, now), progressAt(completion.record, now), { kind: 'daily', improved: completion.improved, firstOfDay: completion.firstOfDay, best: completion.best });
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

  // where the map was scrolled, so a Stop's flow returns to the same place
  const mapScroll = useRef<number | undefined>(undefined);

  /** The screen a Mission opens on now. */
  const missionEntry = (id: string) => {
    const now = new Date();
    return recordRef.current ? missionEntryOf(id, progressAt(recordRef.current, now), now) : 'brief';
  };

  /** Opens a Stop by kind: a Lesson Stop returns to the map, a Node starts, a Mission opens on its brief, wait or check-in. */
  const openStop = (stop: Stop) => {
    setSettingsOpen(false);
    if (stop.kind === 'lesson') setFlow({ name: 'lesson', id: stop.id, returnTo: 'map' });
    else if (stop.kind === 'node') {
      const node = findNode(stop.id);
      if (node) startNodeRun(node);
    } else setFlow({ name: 'mission', id: stop.id, view: missionEntry(stop.id) });
  };

  /** A Mission check-in answer: "Costó un poco" first asks what went wrong; a pass celebrates. */
  const answerMission = (id: string, outcome: DiaryOutcome, problemId?: string) => {
    const mission = findMission(id);
    if (!mission) return;
    if (outcome === 'struggled' && problemId === undefined) {
      setFlow({ name: 'mission', id, view: 'problem' });
      return;
    }
    const now = new Date();
    let diff: Celebration[] = [];
    update((r) => {
      const after = applyMissionCheckIn(r, mission, outcome, problemId, now);
      diff = celebrationsFor(progressAt(r, now), progressAt(after, now), { kind: 'mission', missionId: id });
      return after;
    });
    if (outcome === 'completed') {
      setCelebrations({ id: `mission:${id}`, list: diff });
      setFlow({ name: 'mission', id, view: 'passed' });
    } else if (outcome === 'struggled') setFlow({ name: 'mission', id, view: 'fix', fixId: fixFor(mission, problemId).id });
    else goHome();
  };

  /** "Saltar el día": a Plus member's skip applies and the map opens on the new next-up; a free user meets the paywall. */
  const skipMission = (id: string) => {
    const r = recordRef.current;
    if (!r) return;
    const now = new Date();
    if (!isPlus(r, now)) {
      setFlow({ name: 'paywall', then: { skipMission: id } });
      return;
    }
    update((rec) => applyDaySkip(rec, id, now));
    mapScroll.current = undefined;
    goHome();
  };

  const moveOnMission = (id: string) => {
    let diff: Celebration[] = [];
    const now = new Date();
    update((r) => {
      const after = updateMission(r, id, (m) => moveOn(m, now));
      diff = celebrationsFor(progressAt(r, now), progressAt(after, now), { kind: 'mission', missionId: id });
      return after;
    });
    setCelebrations({ id: `mission:${id}`, list: diff });
    setFlow({ name: 'mission', id, view: 'passed' });
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
      setDogWarning(null);
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
          progress={record}
          membership={record}
          stars={record.stars}
          rusty={rusty.current === true && warmup !== 'completed'}
          streak={record.streak}
          today={todayString()}
          libraryToday={todaysLesson(LESSONS, record.readLessons, lessonDay(record, new Date())) !== null}
          onLibrary={() => setFlow({ name: 'library' })}
          onDiary={() => setFlow({ name: 'diary' })}
          dailyBest={record.dailyBest[todayString()]}
          onDaily={() => setFlow({ name: 'daily', attempt: 0, result: null })}
          onBarkdoku={() => setFlow({ name: 'puzzle', date: todayString() })}
          rustyPrompt={rusty.current === true && warmup === 'none'}
          skippedWarmup={warmup === 'skipped'}
          onWarmup={() => setFlow({ name: 'warmup' })}
          onSkipWarmup={() => setWarmup('skipped')}
          onOpenStop={openStop}
          initialScrollY={mapScroll.current}
          onScroll={(y) => (mapScroll.current = y)}
          onSettings={() => setSettingsOpen(true)}
          breed={record.breed}
          coat={record.coat}
          onPaywall={() => setFlow({ name: 'paywall' })}
          covered={overlay !== null}
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
        <LibraryScreen
          t={t}
          lessons={LESSONS}
          readIds={record.readLessons}
          day={lessonDay(record, new Date())}
          seenFixes={record.seenFixes}
          onOpen={(lesson) => setFlow({ name: 'lesson', id: lesson.id, returnTo: 'library' })}
          onOpenFix={(entry) => setFlow({ name: 'mission', id: entry.mission.id, view: 'fix', fixId: entry.fix.id, returnTo: 'library' })}
          onBack={goHome}
        />,
      );
    } else if (f.name === 'diary' && record) {
      screen = mapWith(<DiaryScreen t={t} record={record} today={todayString()} onBack={goHome} />);
    } else if (f.name === 'lesson' && record) {
      const lesson = findLesson(f.id);
      const back = () => (f.returnTo === 'map' ? goHome() : setFlow({ name: 'library' }));
      screen = mapWith(
        lesson ? (
          <LessonScreen
            t={t}
            lesson={lesson}
            backLabel={t(f.returnTo === 'map' ? 'lesson.backToMap' : 'lesson.back')}
            onDone={() => {
              update((r) => markLessonRead(r, lesson.id, new Date()));
              back();
            }}
            onBack={back}
          />
        ) : null,
      );
    } else if (f.name === 'mission' && record) {
      const mission = findMission(f.id);
      const state = record.missions[f.id];
      const close = () => (f.returnTo === 'library' ? setFlow({ name: 'library' }) : goHome());
      if (!mission) screen = null;
      else if (f.view === 'brief')
        screen = (
          <MissionBriefScreen
            t={t}
            mission={mission}
            state={state}
            onStart={() => {
              update((r) => updateMission(r, mission.id, (m) => startMission(m, new Date())));
              goHome();
            }}
            onClose={goHome}
          />
        );
      else if ((f.view === 'waiting' || f.view === 'checkin') && state) {
        const accept = () => update((r) => updateMission(r, mission.id, acceptEasier));
        screen =
          f.view === 'checkin' ? (
            <MissionCheckInScreen t={t} mission={mission} state={state} onAnswer={(outcome) => answerMission(mission.id, outcome)} onAcceptEasier={accept} onClose={goHome} />
          ) : (
            <MissionWaitingScreen
              t={t}
              mission={mission}
              state={state}
              now={new Date()}
              onAcceptEasier={accept}
              onSkip={canSkipDay(mission.id, progressAt(record, new Date()), new Date()) ? () => skipMission(mission.id) : undefined}
              onClose={goHome}
            />
          );
      } else if (f.view === 'problem')
        screen = <MissionProblemScreen t={t} mission={mission} onPick={(problemId) => answerMission(mission.id, 'struggled', problemId)} onBack={() => setFlow({ ...f, view: 'checkin' })} />;
      else if (f.view === 'fix' && f.fixId) {
        const found = findFix(f.fixId);
        screen = found ? (
          <FixScreen
            t={t}
            mission={mission}
            fix={found.fix}
            problem={found.problem}
            canMoveOn={!!state && f.returnTo !== 'library' && canMoveOn(state)}
            onPractise={() => openStop(found.fix.practise)}
            onMoveOn={() => moveOnMission(mission.id)}
            onDone={close}
          />
        ) : null;
      } else if (f.view === 'passed')
        screen = <MissionPassedScreen t={t} mission={mission} celebrations={celebrations?.id === `mission:${mission.id}` ? celebrations.list : []} onDone={goHome} />;
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
            const now = new Date();
            // a trial that already ended does not restart, so the held skip is not done: back to its Mission
            const done = !!f.then && !!recordRef.current && canStartTrial(recordRef.current, now);
            update((r) => startTrialThen(r, f.then, now));
            if (done) mapScroll.current = undefined;
            if (f.then && !done) setFlow({ name: 'mission', id: f.then.skipMission, view: missionEntry(f.then.skipMission) });
            else goHome();
          }}
          onLater={() => (f.then ? setFlow({ name: 'mission', id: f.then.skipMission, view: missionEntry(f.then.skipMission) }) : goHome())}
        />
      );
    } else if (f.name === 'register') {
      screen = <RegisterPrompt t={t} onCreate={() => setFlow({ name: 'auth', mode: 'signup', returnTo: 'map' })} onNotNow={goHome} />;
    } else if (f.name === 'puzzle' && record) {
      // The board is pinned to the date the puzzle was opened, so playing past midnight keeps it.
      screen = (
        <BarkdokuView
          key={f.date}
          t={t}
          board={getDailyBoard(f.date)}
          breed={record.breed}
          coat={record.coat}
          onFinish={(metrics) => {
            if (metrics.solved) {
              update((r) => applyActivity(r, new Date()));
            }
            goHome();
          }}
          onExit={goHome}
        />
      );
    } else if (f.name === 'auth') {
      screen = account.auth ? <AuthScreen t={t} auth={account.auth} initial={f.mode} onDone={onAuthDone} onBack={onAuthDone} /> : null;
    } else if (f.name === 'node' && record) {
      const { run } = f;
      if (run.step === 'primer') screen = <PrimerScreen t={t} run={run} onNext={() => act({ type: 'next' })} onExit={goHome} />;
      else if (run.step === 'checkpoint')
        screen = <CheckpointScreen t={t} run={run} setting={record.checkpointSeconds} onAnswer={(option) => act({ type: 'answer', option })} onTimeout={() => act({ type: 'timeout' })} />;
      else if (run.step === 'simulation' && run.node.mode === 'minigame') {
        const finish = (metrics: Partial<Record<Metric, number>>, handlingScore?: number) => act({ type: 'finish', result: { kind: 'minigame', metrics, handlingScore } });
        const minigame = run.node.simulation.minigame;
        const seed = f.attempt + 1 + (dateSeed(todayString()) % 1000);
        const playCue = () => playResolvedCue(resolveCue(record, LANGUAGE));
        screen =
          minigame === 'doorbell-mat' ? (
            <DoorbellMatView key={`minigame-${f.attempt}`} t={t} coat={record.coat} seed={seed} onCue={playCue} onFinish={(r) => finish(r.metrics, r.handlingScore)} />
          ) : minigame === 'harness-ritual' ? (
            <ReadDogView key={`minigame-${f.attempt}`} t={t} scene="harness" coat={record.coat} seed={seed} onCue={playCue} onFinish={(r) => finish(r.metrics, r.handlingScore)} />
          ) : minigame === 'barkdoku' ? (
            <BarkdokuView
              key={`minigame-${f.attempt}`}
              t={t}
              breed={record.breed}
              coat={record.coat}
              onFinish={(metrics) => {
                const r = barkdokuResult(metrics);
                finish(r.metrics, r.handlingScore);
              }}
              onExit={goHome}
            />
          ) : (
            <PosteMinigameView key={`minigame-${f.attempt}`} t={t} coat={record.coat} onFinish={(metrics) => finish(metrics)} />
          );
      } else if (run.step === 'debrief') {
        screen = (
          <DebriefScreen
            t={t}
            run={run}
            showPosteLink={shouldShowPosteLink(record, run.node.id)}
            mission={findMission(missionForDebrief(run.node.id) ?? '')?.title}
            best={starsShown(record, run.node.id) ?? 1}
            celebrations={celebrations?.id === `${run.node.id}:${f.attempt}` ? celebrations.list : []}
            onPosteLink={() => startNodeRun(POSTE_PRACTICE)}
            onPlayAgain={() => setFlow({ ...f, run: { ...run, step: 'simulation', result: null }, attempt: f.attempt + 1 })}
            onDone={() => {
              // the Debrief of a Stretch's last Node opens its Mission brief
              const next = missionAfterDebrief(run.node.id, progressAt(record, new Date()), new Date());
              if (next) setFlow({ name: 'mission', id: next, view: 'brief' });
              else goHome();
            }}
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
        {playingStage && hint && !dogWarning && !paused && <HintOverlay text={t(HINT_TEXT[hint])} />}
        {playingStage && record && !tastePayoff && !paused && bundle === 'ready' && (
          <CoachMarksOverlay
            moveText={t('coach.controls.move')}
            markText={t('coach.controls.mark')}
            showMove={!controlsUsed.move && !record.seenHints.includes(COACH_ID.move)}
            showMark={!controlsUsed.mark && !markExpired && !record.seenHints.includes(COACH_ID.mark)}
          />
        )}
        {playingStage && record && dogWarning && !paused && (
          <DogWarningOverlay text={withDogName(t('coach.dog.warning'), record.name, t('dog.neutral'))} bearing={dogWarning.bearing} />
        )}
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
