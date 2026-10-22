import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { Button } from '../Overlays';
import { HARNESS_RITUAL, newPosteMinigame, posteMinigameMetrics, POSTE_MINIGAME, stepPosteMinigame, tensionOf, type HoldMinigameConfig, type PosteMinigameState, type RoundOutcome } from '../nodes/posteMinigame';
import { AGITATION_SECONDS, holdPosture, quantizeTension } from '../ui/canine';
import { CueCaption, LeashScene, MinigameButton, ResultChip, RoundPips, TensionGauge } from '../ui/MinigameProps';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const OUTCOME_KEYS = { settled: 'minigame.poste.settled', released: 'minigame.poste.released', 'too-late': 'minigame.poste.tooLate' } as const;
const TICK_MS = 50;

const VARIANTS = {
  poste: { config: POSTE_MINIGAME, hold: 'minigame.poste.hold', help: 'minigame.poste.help' },
  harness: { config: HARNESS_RITUAL, hold: 'minigame.harness.hold', help: 'minigame.harness.help' },
} as const satisfies Record<string, { config: HoldMinigameConfig; hold: string; help: string }>;

/**
 * Static Interactive Simulation of a hold-to-settle exercise: the Poste practice (hold to stop while
 * the Dog strains) or the Harness Ritual (hold while the excited Dog settles for its harness).
 */
export function PosteMinigameView({ t, coat = 'golden', onFinish, variant = 'poste' }: { t: Translate; coat?: DogCoat; onFinish: (metrics: { poste: number; tension: number }) => void; variant?: keyof typeof VARIANTS }) {
  const { config, hold, help } = VARIANTS[variant];
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about round, outcome and a coarse leash tension
  const state = useRef<PosteMinigameState>(newPosteMinigame());
  const holding = useRef(false);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [outcomes, setOutcomes] = useState<RoundOutcome[]>([]);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [tension, setTension] = useState(0);
  const posture = holdPosture(tension, false);
  // a release that ended the round sends the Dog lunging forward again for a moment
  const lunge = useRef(0);

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const prev = state.current;
    const next = stepPosteMinigame(prev, dt, holding.current, config);
    state.current = next;
    if (next.outcomes.length > prev.outcomes.length) {
      const outcome = next.outcomes[next.outcomes.length - 1];
      setLastOutcome(outcome);
      setOutcomes(next.outcomes);
      if (outcome === 'released') lunge.current = AGITATION_SECONDS;
    }
    lunge.current = Math.max(0, lunge.current - dt);
    setTension(lunge.current > 0 ? 1 : quantizeTension(tensionOf(next, config)));
    if (next.done && !finished.current) {
      finished.current = true;
      finish.current(posteMinigameMetrics(next));
    }
  });

  return (
    <Screen>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-body text-inkMuted">{`${t('minigame.poste.round')} ${Math.min(outcomes.length + 1, config.rounds)} ${t('minigame.poste.of')} ${config.rounds}`}</Text>
        <RoundPips t={t} total={config.rounds} results={outcomes.map((o) => o === 'settled')} />
      </View>
      <Text className="mb-4 text-bodyL text-ink">{t(help)}</Text>
      <LeashScene t={t} posture={posture} tension={tension} coat={coat} />
      <CueCaption t={t} posture={posture} />
      <TensionGauge t={t} tension={tension} />
      <ResultChip label={lastOutcome ? t(OUTCOME_KEYS[lastOutcome]) : null} good={lastOutcome === 'settled'} />
      {started ? (
        <MinigameButton icon="hand" label={t(hold)} onPressIn={() => (holding.current = true)} onPressOut={() => (holding.current = false)} />
      ) : (
        <Button label={t('minigame.poste.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
