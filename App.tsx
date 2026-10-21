import './global.css';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LilitaOne_400Regular } from '@expo-google-fonts/lilita-one';
import { createTranslator, es } from './src/i18n';
import { installFeedback } from './src/shell/ui/feedbackBackends';
import { useUiSettings } from './src/shell/ui/useUiSettings';
import { defaultScenario, type ScenarioConfig } from './src/sim/config';
import type { SimulationDebriefPayload } from './src/sim/payload';
import { BUNDLE_MESSAGE_TYPES, decode, type BundleMessage, type ShellMessage } from './src/sim/messages';
import { newSeed } from './src/sim/rng';
import { playDogSound, playResolvedCue, prepareAudio } from './src/shell/audio';
import { createVocalizer } from './src/shell/vocalize';
import { applyDiary, applyStage, toSnapshot } from './src/shell/dogRecord';
import { lookOf } from './src/shell/onboarding/look';
import { celebrationsFor, starsShown, type Celebration } from './src/shell/celebrations';
import { completeDaily, dateSeed, generateDailyStage, todayString, warmupAfterDaily, type DailyCompletion } from './src/shell/daily';
import { ErrorOverlay, HintOverlay, LoadingOverlay, ResumeOverlay } from './src/shell/Overlays';
import { POSTE_PRACTICE } from './src/shell/nodes/content';
import { withPull } from './src/shell/nodes/scenarios';
import { advance, onDebrief, shouldShowPosteLink, startNode, type Metric, type NodeAction, type NodeDef, type NodeRun } from './src/shell/nodes/node';
import { DailyResultScreen } from './src/shell/screens/DailyResultScreen';
import { DoorbellMatView } from './src/shell/screens/DoorbellMatView';
import { WorldMapScreen } from './src/shell/screens/WorldMapScreen';
import { CheckpointScreen, DebriefScreen, PrimerScreen } from './src/shell/screens/NodeScreens';
import { PosteMinigameView } from './src/shell/screens/PosteMinigameView';
import { DiagnosticView } from './src/shell/screens/DiagnosticView';
import { PaywallScreen } from './src/shell/screens/PaywallScreen';
import { PlanScreen } from './src/shell/screens/PlanScreen';
import { SetupScreen } from './src/shell/screens/SetupScreen';
import { SettingsScreen } from './src/shell/screens/SettingsScreen';
import { isRusty, sessionCapacity, warmupScenario, type WarmupOutcome } from './src/shell/rusty';
import { SimView } from './src/shell/SimView';
import type { SimViewHandle } from './src/shell/simViewTypes';
import { dogStore } from './src/shell/storage';
import { completeFirstStage } from './src/shell/onboarding/firstStage';
import { nextStep, pageForStep } from './src/shell/onboarding/flow';
import { recordDiagnostic } from './src/shell/onboarding/diagnostic';
import { HINT_TEXT, hintFor, markHintSeen, type HintId } from './src/shell/onboarding/hints';
import { passPaywall } from './src/shell/onboarding/paywall';
import { useDog } from './src/shell/useDog';
import { migrateRecord } from './src/shell/dogRecord';
import { resolveScenario } from './src/shell/sync/configs';
import { useAccount } from './src/shell/sync/useAccount';
import { AccountBanner, AuthScreen, ChooseDogScreen, RegisterPrompt } from './src/shell/screens/AccountScreens';
import { resolveCue, type Language } from './src/shell/voice';

type DailyRun = { payload: SimulationDebriefPayload; completion: DailyCompletion; celebrations: Celebration[] };
type Page =
  | { name: 'home' }
  | { name: 'settings' }
  | { name: 'warmup' }
  | { name: 'first-stage' }
  | { name: 'register' }
  | { name: 'auth'; mode: 'signup' | 'login' }
  | { name: 'daily'; attempt: number; result: DailyRun | null }
  | { name: 'node'; run: NodeRun; attempt: number };

/** The shell owns the active language; Spanish is the only one shipped. */
const CATALOG = es;
const LANGUAGE: Language = 'es';
const LOAD_TIMEOUT_MS = 20000;
const HINT_MS = 7000;

installFeedback();

export default function App() {
  // the display font loads in the background: text shows in the system font until it is ready
  useFonts({ LilitaOne: LilitaOne_400Regular });
  const ui = useUiSettings(dogStore);
  const sim = useRef<SimViewHandle>(null);
  const { record, update, replace } = useDog(dogStore);
  const account = useAccount(dogStore, record, replace);
  const accountRef = useRef(account);
  accountRef.current = account;
  const [reminder, setReminder] = useState(false);
  const [bundle, setBundle] = useState<'loading' | 'ready' | 'error'>('loading');
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<Page>({ name: 'home' });
  const [hint, setHint] = useState<HintId | null>(null);
  const [warmup, setWarmup] = useState<WarmupOutcome>('none');
  // celebrations are diffed once when a result opens and then only displayed, so each shows once
  const [celebrations, setCelebrations] = useState<{ id: string; list: Celebration[] } | null>(null);
  const [attempt, setAttempt] = useState(0); // bumping it reloads the bundle
  const t = useMemo(() => createTranslator(CATALOG), []);

  const viewRef = useRef(view);
  viewRef.current = view;
  const recordRef = useRef(record);
  recordRef.current = record;
  const vocalizer = useRef(createVocalizer(playDogSound));
  const pendingStart = useRef<ShellMessage | null>(null);
  const bundleReady = useRef(false);

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
    (scenario: Partial<ScenarioConfig>, seed: number = newSeed()) => {
      const current = recordRef.current;
      if (!current) return;
      const message: ShellMessage = {
        type: 'start',
        seed,
        catalog: CATALOG,
        scenario: { ...withPull(scenario, current.weights), learning: toSnapshot(current, capacityRef.current), look: lookOf(current) },
      };
      setPaused(false);
      setHint(null);
      if (bundleReady.current) send(message);
      else pendingStart.current = message;
    },
    [send],
  );

  const act = useCallback((action: NodeAction) => {
    const v = viewRef.current;
    if (v.name !== 'node') return;
    setView({ ...v, run: advance(v.run, action) });
  }, []);

  // entering a walking Interactive Simulation starts the Stage
  const simulationKey = view.name === 'node' && view.run.step === 'simulation' && view.run.node.mode === 'stage' ? `${view.run.node.id}:${view.attempt}` : null;
  useEffect(() => {
    if (simulationKey === null || viewRef.current.name !== 'node') return;
    const node = viewRef.current.run.node;
    startStage(resolveScenario(node.id, node.simulation.scenario ?? {}, accountRef.current.configs).scenario);
  }, [simulationKey, startStage]);

  useEffect(() => {
    if (view.name === 'warmup') startStage(warmupScenario(defaultScenario));
  }, [view.name, startStage]);

  // the guided first Stage: it starts by itself once the paywall screen has been passed
  const step = record?.onboarding.step;
  useEffect(() => {
    if (step === 'first-stage' && viewRef.current.name === 'home') setView({ name: 'first-stage' });
  }, [step, view.name]);
  useEffect(() => {
    if (view.name === 'first-stage') startStage({});
  }, [view.name, startStage]);

  // the Daily Stage skips the Primer and the Checkpoint: it goes straight to the walk, same seed all day
  const dailyKey = view.name === 'daily' && view.result === null ? view.attempt : null;
  useEffect(() => {
    if (dailyKey === null) return;
    const date = todayString();
    startStage(generateDailyStage(date), dateSeed(date));
  }, [dailyKey, startStage]);

  // reaching the Debrief completes the Node; only a Stage changes the Dog
  const debriefId = view.name === 'node' && view.run.step === 'debrief' ? `${view.run.node.id}:${view.attempt}` : null;
  useEffect(() => {
    const v = viewRef.current;
    if (debriefId === null || v.name !== 'node') return;
    let diff: Celebration[] = [];
    update((r) => {
      const after = onDebrief(r, v.run, new Date());
      diff = celebrationsFor(r, after, { kind: 'node', nodeId: v.run.node.id });
      return after;
    });
    setCelebrations({ id: debriefId, list: diff });
  }, [debriefId, update]);

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
        const shown = recordRef.current ? hintFor(message.signal, recordRef.current.seenHints) : null;
        if (shown) {
          setHint(shown);
          update((r) => markHintSeen(r, shown));
        }
      }
      else if (message.type === 'reaction-tier-change') vocalizer.current.onTier(message.tier);
      else if (message.type === 'playCue') {
        if (recordRef.current) playResolvedCue(resolveCue(recordRef.current, LANGUAGE));
      } else if (message.type === 'debrief') {
        const payload: SimulationDebriefPayload = message.payload;
        const v = viewRef.current;
        if (v.name === 'daily' && v.result === null) {
          // the score and the Streak are kept; what the Dog has learned and the campaign are not touched
          const before = recordRef.current!;
          const completion = completeDaily(before, payload, new Date());
          update(() => completion.record);
          setWarmup((w) => warmupAfterDaily(w));
          const list = celebrationsFor(before, completion.record, { kind: 'daily', improved: completion.improved, firstOfDay: completion.firstOfDay, best: completion.best });
          setView({ ...v, result: { payload, completion, celebrations: list } });
        } else if (v.name === 'first-stage') {
          update((r) => completeFirstStage(r, payload, new Date()));
          accountRef.current.countStage();
          // registration is offered after the first Stage, and only where there is a backend to register with
          setView(accountRef.current.configured && !accountRef.current.signedIn ? { name: 'register' } : { name: 'home' });
        } else if (v.name === 'warmup') {
          // ungraded: the warm-up never changes the Dog
          setWarmup('completed');
          setView({ name: 'home' });
        } else if (v.name === 'node') {
          accountRef.current.countStage();
          act({ type: 'finish', result: { kind: 'stage', payload } });
        }
      } else if (message.type === 'error') setBundle('error');
    },
    [act, send, update],
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
    if (account.remind && view.name === 'home' && !reminder) {
      setReminder(true);
      account.markReminded();
    }
  }, [account, account.remind, view.name, reminder]);

  const goHome = () => {
    setPaused(false);
    setView({ name: 'home' });
  };

  const startNodeRun = (node: NodeDef) => setView({ name: 'node', run: startNode(node), attempt: 0 });
  const playingStage = simulationKey !== null || view.name === 'warmup' || view.name === 'first-stage' || dailyKey !== null;
  // the bundle only draws while a Stage is on screen; 'start' wakes it, leaving the Stage puts it to sleep
  const playingStageRef = useRef(playingStage);
  playingStageRef.current = playingStage;
  useEffect(() => {
    if (!playingStage) send({ type: 'suspend' });
  }, [playingStage, send]);
  const funnelStep = record ? pageForStep(record.onboarding.step) === 'funnel' ? record.onboarding.step : null : null;

  let screen: React.ReactNode = null;
  if (!record) screen = <LoadingOverlay t={t} />;
  else if (funnelStep === 'setup') screen = <SetupScreen t={t} record={record} update={update} />;
  else if (funnelStep === 'diagnostic')
    screen = <DiagnosticView key="diagnostic" t={t} seed={newSeed()} onFinish={(latency) => update((r) => recordDiagnostic(r, latency))} />;
  else if (funnelStep === 'plan')
    screen = <PlanScreen t={t} latency={record.onboarding.diagnosticLatency ?? 0.5} plan={record.onboarding.plan} onContinue={() => update((r) => ({ ...r, onboarding: { ...r.onboarding, step: nextStep('plan') } }))} />;
  else if (funnelStep === 'paywall')
    screen = <PaywallScreen t={t} onStartTrial={() => update((r) => passPaywall(r, true, new Date()))} onLater={() => update((r) => passPaywall(r, false, new Date()))} />;
  else if (account.choice && account.signedIn && view.name === 'home')
    screen = <ChooseDogScreen t={t} local={record} cloud={migrateRecord(account.choice[0].record)} onChoose={account.chooseDog} />;
  else if (view.name === 'home') {
    screen = (
      <WorldMapScreen
        t={t}
        completed={record.completedNodes}
        stars={record.stars}
        rusty={rusty.current === true && warmup !== 'completed'}
        streak={record.streak}
        today={todayString()}
        dailyBest={record.dailyBest[todayString()]}
        onDaily={() => setView({ name: 'daily', attempt: 0, result: null })}
        rustyPrompt={rusty.current === true && warmup === 'none'}
        skippedWarmup={warmup === 'skipped'}
        onWarmup={() => setView({ name: 'warmup' })}
        onSkipWarmup={() => setWarmup('skipped')}
        onStartNode={startNodeRun}
        onSettings={() => setView({ name: 'settings' })}
        banner={
          account.signedIn && account.sync.paused === 'verify' ? (
            <AccountBanner t={t} kind="verify" />
          ) : reminder && !account.signedIn ? (
            <AccountBanner
              t={t}
              kind="remind"
              onAction={() => {
                setReminder(false);
                setView({ name: 'auth', mode: 'signup' });
              }}
              onDismiss={() => setReminder(false)}
            />
          ) : null
        }
      />
    );
  } else if (view.name === 'daily') {
    if (view.result)
      screen = (
        <DailyResultScreen t={t} payload={view.result.payload} completion={view.result.completion} celebrations={view.result.celebrations} onReplay={() => setView({ name: 'daily', attempt: view.attempt + 1, result: null })} onDone={goHome} />
      );
  } else if (view.name === 'settings') {
    screen = <SettingsScreen t={t} language={LANGUAGE} record={record} update={update} onClose={goHome} account={account} onLogIn={() => setView({ name: 'auth', mode: 'login' })} ui={ui} />;
  } else if (view.name === 'register') {
    screen = <RegisterPrompt t={t} onCreate={() => setView({ name: 'auth', mode: 'signup' })} onNotNow={goHome} />;
  } else if (view.name === 'auth') {
    screen = account.auth ? <AuthScreen t={t} auth={account.auth} initial={view.mode} onDone={goHome} onBack={goHome} /> : null;
  } else if (view.name === 'node') {
    const { run } = view;
    if (run.step === 'primer') screen = <PrimerScreen t={t} run={run} onNext={() => act({ type: 'next' })} onExit={goHome} />;
    else if (run.step === 'checkpoint')
      screen = <CheckpointScreen t={t} run={run} setting={record.checkpointSeconds} onAnswer={(option) => act({ type: 'answer', option })} onTimeout={() => act({ type: 'timeout' })} />;
    else if (run.step === 'simulation' && run.node.mode === 'minigame') {
      const finish = (metrics: Partial<Record<Metric, number>>) => act({ type: 'finish', result: { kind: 'minigame', metrics } });
      screen =
        run.node.simulation.minigame === 'doorbell-mat' ? (
          <DoorbellMatView key={`minigame-${view.attempt}`} t={t} coat={record.coat} seed={view.attempt + 1 + (dateSeed(todayString()) % 1000)} onFinish={finish} />
        ) : (
          <PosteMinigameView key={`minigame-${view.attempt}`} t={t} coat={record.coat} variant={run.node.simulation.minigame === 'harness-ritual' ? 'harness' : 'poste'} onFinish={finish} />
        );
    }
    else if (run.step === 'debrief')
      screen = (
        <DebriefScreen
          t={t}
          run={run}
          showPosteLink={shouldShowPosteLink(record, run.node.id)}
          diary={record.walkDiary.find((e) => e.date === todayString() && e.nodeId === run.node.id)?.outcome ?? null}
          onDiary={(outcome) => update((r) => applyDiary(r, run.node.id, outcome, new Date()))}
          best={starsShown(record, run.node.id) ?? 1}
          celebrations={celebrations?.id === `${run.node.id}:${view.attempt}` ? celebrations.list : []}
          onPosteLink={() => startNodeRun(POSTE_PRACTICE)}
          onPlayAgain={() => setView({ name: 'node', run: { ...run, step: 'simulation', result: null }, attempt: view.attempt + 1 })}
          onDone={goHome}
        />
      );
  }

  return (
    <SafeAreaProvider>
    <View className="flex-1 bg-bg">
      <SimView key={attempt} ref={sim} onMessage={onMessage} onLoadError={() => setBundle('error')} />
      {screen}
      {playingStage && hint && !paused && <HintOverlay text={t(HINT_TEXT[hint])} />}
      {playingStage && bundle === 'loading' && <LoadingOverlay t={t} />}
      {playingStage && paused && (
        <ResumeOverlay
          t={t}
          onResume={() => {
            setPaused(false);
            send({ type: 'resume' });
          }}
          onExit={goHome}
        />
      )}
      {bundle === 'error' && <ErrorOverlay t={t} onRetry={retry} />}
      <StatusBar style="light" hidden />
    </View>
    </SafeAreaProvider>
  );
}
