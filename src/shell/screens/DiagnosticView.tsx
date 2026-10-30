import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { DIAGNOSTIC, DIAGNOSTIC_PAWS, diagnosticLatency, newDiagnostic, pawsFilled, stepDiagnostic, type DiagnosticState } from '../onboarding/diagnostic';
import { diagnosticPosture } from '../ui/canine';
import { DiagnosticScene, MinigameButton, PawRow } from '../ui/MinigameProps';
import { theme, usePalette } from '../ui/theme';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const TICK_MS = 20;

/**
 * The 15-second reaction test, played on a scene of the Dog: it stands calm, then looks at the user, and the user taps Marcar
 * as fast as they can. Reports the median latency in seconds.
 */
export function DiagnosticView({ t, record, seed, onFinish }: { t: Translate; record: Pick<DogRecord, 'breed' | 'coat'>; seed: number; onFinish: (latency: number) => void }) {
  const color = usePalette();
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about what the screen shows (signal on/off, whole seconds left, paws)
  const state = useRef<DiagnosticState>(newDiagnostic(seed));
  const tapped = useRef(false);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [showing, setShowing] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number>(DIAGNOSTIC.seconds);
  const [paws, setPaws] = useState(0);

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const press = tapped.current;
    tapped.current = false;
    state.current = stepDiagnostic(state.current, dt, press);
    setShowing(state.current.signalShownAt !== null);
    setSecondsLeft(Math.max(0, Math.ceil(DIAGNOSTIC.seconds - state.current.t)));
    setPaws(pawsFilled(state.current));
    if (state.current.done && !finished.current) {
      finished.current = true;
      finish.current(diagnosticLatency(state.current));
    }
  });

  const posture = diagnosticPosture(showing);
  return (
    <Screen>
      <Text className="mb-1 font-display text-displayM text-ink" accessibilityRole="header">
        {t('diagnostic.title')}
      </Text>
      <Text className="mb-4 text-bodyL text-inkMuted">{t('diagnostic.help')}</Text>
      <DiagnosticScene t={t} breed={record.breed} coat={record.coat} looking={posture === 'looking'} />
      {started ? (
        <>
          <View className="mt-3 items-center justify-center rounded-game-md bg-surface px-4 py-2 self-center" style={{ borderWidth: theme.border.ink, borderColor: color.outline }} accessibilityLiveRegion="polite">
            <Text className="font-display text-body text-ink">{t(showing ? 'diagnostic.coach.go' : 'diagnostic.coach.wait')}</Text>
          </View>
          <View className="mb-4 mt-3 flex-row items-center justify-between">
            <PawRow t={t} filled={paws} total={DIAGNOSTIC_PAWS} />
            <Text className="font-display text-body text-inkMuted">{`${t('diagnostic.timeLeft')}: ${secondsLeft}`}</Text>
          </View>
          <MinigameButton label={t('hud.marker')} icon="marker" onPressIn={() => (tapped.current = true)} />
        </>
      ) : (
        <Button label={t('diagnostic.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
