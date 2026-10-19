import './global.css';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import { createTranslator, es } from './src/i18n';
import type { SimulationDebriefPayload } from './src/sim/payload';
import { BUNDLE_MESSAGE_TYPES, decode, type BundleMessage, type ShellMessage } from './src/sim/messages';
import { newSeed } from './src/sim/rng';
import { ErrorOverlay, LoadingOverlay, ResultsScreen, ResumeOverlay } from './src/shell/Overlays';
import { SimView } from './src/shell/SimView';
import type { SimViewHandle } from './src/shell/simViewTypes';

type Phase = 'loading' | 'playing' | 'paused' | 'results' | 'error';

/** The shell owns the active language; Spanish is the only one shipped. */
const CATALOG = es;
const LOAD_TIMEOUT_MS = 20000;

export default function App() {
  const sim = useRef<SimViewHandle>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [payload, setPayload] = useState<SimulationDebriefPayload | null>(null);
  const [attempt, setAttempt] = useState(0); // bumping it reloads the bundle
  const t = useMemo(() => createTranslator(CATALOG), []);

  const send = useCallback((message: ShellMessage) => sim.current?.post(message), []);
  const startStage = useCallback(() => {
    setPhase('playing');
    send({ type: 'start', seed: newSeed(), catalog: CATALOG });
  }, [send]);

  const onMessage = useCallback(
    (raw: unknown) => {
      const message = decode<BundleMessage>(raw, BUNDLE_MESSAGE_TYPES);
      if (!message) return;
      if (message.type === 'ready') startStage();
      else if (message.type === 'paused') setPhase((p) => (p === 'playing' ? 'paused' : p));
      else if (message.type === 'debrief') {
        setPayload(message.payload);
        setPhase('results');
      } else if (message.type === 'error') setPhase('error');
    },
    [startStage],
  );

  // a bundle that never reports ready counts as a load failure
  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = setTimeout(() => setPhase('error'), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [phase, attempt]);

  // leaving the app pauses the Stage; no Stage time elapses until the user chooses Resume
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state !== 'active' && send({ type: 'pause' }));
    return () => sub.remove();
  }, [send]);

  const retry = () => {
    setPhase('loading');
    setAttempt((n) => n + 1);
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SimView key={attempt} ref={sim} onMessage={onMessage} onLoadError={() => setPhase('error')} />
      {phase === 'loading' && <LoadingOverlay t={t} />}
      {phase === 'paused' && (
        <ResumeOverlay
          t={t}
          onResume={() => {
            setPhase('playing');
            send({ type: 'resume' });
          }}
        />
      )}
      {phase === 'results' && payload && <ResultsScreen t={t} payload={payload} onPlayAgain={startStage} />}
      {phase === 'error' && <ErrorOverlay t={t} onRetry={retry} />}
      <StatusBar style="light" hidden />
    </View>
  );
}
