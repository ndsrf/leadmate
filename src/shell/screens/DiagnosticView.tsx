import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { DIAGNOSTIC, diagnosticLatency, newDiagnostic, stepDiagnostic, type DiagnosticState } from '../onboarding/diagnostic';
import { Pad } from '../ui/components';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const TICK_MS = 20;

/** The 15-second reaction test: tap as soon as the button turns green. Reports the median latency in seconds. */
export function DiagnosticView({ t, seed, onFinish }: { t: Translate; seed: number; onFinish: (latency: number) => void }) {
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about what the screen shows (signal on/off, whole seconds left)
  const state = useRef<DiagnosticState>(newDiagnostic(seed));
  const tapped = useRef(false);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [showing, setShowing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(DIAGNOSTIC.seconds);

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const press = tapped.current;
    tapped.current = false;
    state.current = stepDiagnostic(state.current, dt, press);
    setShowing(state.current.signalShownAt !== null);
    setSecondsLeft(Math.max(0, Math.ceil(DIAGNOSTIC.seconds - state.current.t)));
    if (state.current.done && !finished.current) {
      finished.current = true;
      finish.current(diagnosticLatency(state.current));
    }
  });

  return (
    <Screen>
      <Text className="mb-1 font-display text-2xl text-ink">{t('diagnostic.title')}</Text>
      <Text className="mb-4 text-base text-inkMuted">{t('diagnostic.help')}</Text>
      {started ? (
        <>
          <Text className="mb-2 text-sm text-inkDim">{`${t('diagnostic.timeLeft')}: ${secondsLeft}`}</Text>
          <Pad fill={showing ? 'brand' : 'quiet'} label={showing ? t('diagnostic.go') : t('diagnostic.wait')} onPressIn={() => (tapped.current = true)} />
        </>
      ) : (
        <Button label={t('diagnostic.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
