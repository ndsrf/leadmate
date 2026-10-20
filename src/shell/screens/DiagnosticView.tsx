import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { DIAGNOSTIC, diagnosticLatency, newDiagnostic, stepDiagnostic, type DiagnosticState } from '../onboarding/diagnostic';
import { Screen } from './Screen';

const TICK_MS = 20;

/** The 15-second reaction test: tap as soon as the button turns green. Reports the median latency in seconds. */
export function DiagnosticView({ t, seed, onFinish }: { t: Translate; seed: number; onFinish: (latency: number) => void }) {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<DiagnosticState>(() => newDiagnostic(seed));
  const tapped = useRef(false);
  const finished = useRef(false);

  useEffect(() => {
    if (!started) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const press = tapped.current;
      tapped.current = false;
      setState((prev) => stepDiagnostic(prev, dt, press));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (state.done && !finished.current) {
      finished.current = true;
      onFinish(diagnosticLatency(state));
    }
  }, [state, onFinish]);

  const showing = state.signalShownAt !== null;
  return (
    <Screen>
      <Text className="mb-1 text-2xl font-bold text-white">{t('diagnostic.title')}</Text>
      <Text className="mb-4 text-base text-slate-200">{t('diagnostic.help')}</Text>
      {started ? (
        <>
          <Text className="mb-2 text-sm text-slate-400">{`${t('diagnostic.timeLeft')}: ${Math.max(0, Math.ceil(DIAGNOSTIC.seconds - state.t))}`}</Text>
          <Pressable onPressIn={() => (tapped.current = true)} accessibilityRole="button" className={`h-48 items-center justify-center rounded-2xl ${showing ? 'bg-green-500' : 'bg-slate-600'}`}>
            <Text className="text-xl font-bold text-white">{showing ? t('diagnostic.go') : t('diagnostic.wait')}</Text>
          </Pressable>
        </>
      ) : (
        <Button label={t('diagnostic.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
