import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { Button } from '../Overlays';
import { doorbellMetrics, DOORBELL_MAT, newDoorbell, stepDoorbell, type DoorbellOutcome, type DoorbellState } from '../nodes/doorbellMat';
import { agitatesDog, AGITATION_SECONDS, doorbellPosture, type CaninePosture } from '../ui/canine';
import { CueCaption, DoorbellScene, MinigameButton, ResultChip, RoundPips } from '../ui/MinigameProps';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const OUTCOME_KEYS = { hit: 'minigame.doorbell.hit', early: 'minigame.doorbell.early', late: 'minigame.doorbell.late' } as const;
const TICK_MS = 50;

/** Static Interactive Simulation of the Doorbell Mat: mark the moment the Dog settles on its mat. */
export function DoorbellMatView({ t, seed, coat = 'golden', onFinish }: { t: Translate; seed: number; coat?: DogCoat; onFinish: (metrics: { timing: number; tension: number }) => void }) {
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about discrete changes (phase, round, outcome)
  const state = useRef<DoorbellState>(newDoorbell(seed));
  const marked = useRef(false);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [phase, setPhase] = useState<DoorbellState['phase']>(state.current.phase);
  const [outcomes, setOutcomes] = useState<DoorbellOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<DoorbellOutcome | null>(null);
  // an early Mark keeps the Dog barking for a moment, even though the round has already reset
  const agitation = useRef(0);
  const [posture, setPosture] = useState<CaninePosture>('standing_waiting');

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const press = marked.current;
    marked.current = false;
    const prev = state.current;
    const next = stepDoorbell(prev, dt, press);
    state.current = next;
    if (next.outcomes.length > prev.outcomes.length) {
      const outcome = next.outcomes[next.outcomes.length - 1];
      setLastOutcome(outcome);
      setOutcomes(next.outcomes);
      if (agitatesDog(outcome)) agitation.current = AGITATION_SECONDS;
    }
    agitation.current = Math.max(0, agitation.current - dt);
    setPosture(doorbellPosture(next, agitation.current > 0));
    setPhase(next.phase);
    if (next.done && !finished.current) {
      finished.current = true;
      finish.current(doorbellMetrics(next));
    }
  });

  return (
    <Screen>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-sm text-inkDim">{`${t('minigame.doorbell.round')} ${Math.min(outcomes.length + 1, DOORBELL_MAT.rounds)} ${t('minigame.doorbell.of')} ${DOORBELL_MAT.rounds}`}</Text>
        <RoundPips t={t} total={DOORBELL_MAT.rounds} results={outcomes.map((o) => o === 'hit')} />
      </View>
      <Text className="mb-4 text-base text-ink">{t('minigame.doorbell.help')}</Text>
      <DoorbellScene t={t} posture={posture} ringing={phase === 'excited'} coat={coat} />
      <CueCaption t={t} posture={posture} />
      <ResultChip label={lastOutcome ? t(OUTCOME_KEYS[lastOutcome]) : null} good={lastOutcome === 'hit'} />
      {started ? (
        <MinigameButton icon="bell" label={t('minigame.doorbell.mark')} onPressIn={() => (marked.current = true)} />
      ) : (
        <Button label={t('minigame.doorbell.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
