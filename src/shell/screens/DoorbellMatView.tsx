import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { doorbellMetrics, DOORBELL_MAT, newDoorbell, stepDoorbell, type DoorbellOutcome, type DoorbellState } from '../nodes/doorbellMat';
import { Screen } from './Screen';

const OUTCOME_KEYS = { hit: 'minigame.doorbell.hit', early: 'minigame.doorbell.early', late: 'minigame.doorbell.late' } as const;
const PHASE_KEYS = { waiting: null, excited: 'minigame.doorbell.ringing', calm: 'minigame.doorbell.calm' } as const;
const TICK_MS = 50;

/** Static Interactive Simulation of the Doorbell Mat: mark the moment the Dog settles on its mat. */
export function DoorbellMatView({ t, seed, onFinish }: { t: Translate; seed: number; onFinish: (metrics: { timing: number; tension: number }) => void }) {
  const [started, setStarted] = useState(false);
  const [state, setState] = useState<DoorbellState>(() => newDoorbell(seed));
  const marked = useRef(false);
  const [lastOutcome, setLastOutcome] = useState<DoorbellOutcome | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!started) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const press = marked.current;
      marked.current = false;
      setState((prev) => {
        const next = stepDoorbell(prev, dt, press);
        if (next.outcomes.length > prev.outcomes.length) setLastOutcome(next.outcomes[next.outcomes.length - 1]);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (state.done && !finished.current) {
      finished.current = true;
      onFinish(doorbellMetrics(state));
    }
  }, [state, onFinish]);

  const phaseKey = PHASE_KEYS[state.phase];
  const tone = state.phase === 'calm' ? 'bg-green-500' : state.phase === 'excited' ? 'bg-red-500' : 'bg-slate-600';
  return (
    <Screen>
      <Text className="mb-1 text-sm text-slate-400">{`${t('minigame.doorbell.round')} ${Math.min(state.round + 1, DOORBELL_MAT.rounds)} ${t('minigame.doorbell.of')} ${DOORBELL_MAT.rounds}`}</Text>
      <Text className="mb-4 text-base text-white">{t('minigame.doorbell.help')}</Text>
      <View className={`h-24 items-center justify-center rounded-2xl ${tone}`}>
        <Text className="text-lg font-semibold text-white">{phaseKey ? t(phaseKey) : ''}</Text>
      </View>
      <Text className="my-3 h-6 text-center text-sm text-slate-300">{lastOutcome ? t(OUTCOME_KEYS[lastOutcome]) : ''}</Text>
      {started ? (
        <Pressable onPressIn={() => (marked.current = true)} accessibilityRole="button" className="h-40 items-center justify-center rounded-2xl bg-green-600 active:bg-green-500">
          <Text className="text-xl font-bold text-white">{t('minigame.doorbell.mark')}</Text>
        </Pressable>
      ) : (
        <Button label={t('minigame.doorbell.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
