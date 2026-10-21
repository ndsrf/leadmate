import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { HARNESS_RITUAL, newPosteMinigame, posteMinigameMetrics, POSTE_MINIGAME, stepPosteMinigame, tensionOf, type HoldMinigameConfig, type PosteMinigameState, type RoundOutcome } from '../nodes/posteMinigame';
import { AGITATION_SECONDS, holdPosture, quantizeTension } from '../ui/canine';
import { CanineMinigameAvatar } from '../ui/CanineMinigameAvatar';
import { Pad } from '../ui/components';
import { LeashProp } from '../ui/MinigameProps';
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
export function PosteMinigameView({ t, onFinish, variant = 'poste' }: { t: Translate; onFinish: (metrics: { poste: number; tension: number }) => void; variant?: keyof typeof VARIANTS }) {
  const { config, hold, help } = VARIANTS[variant];
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about round, outcome and a coarse leash tension
  const state = useRef<PosteMinigameState>(newPosteMinigame());
  const holding = useRef(false);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [round, setRound] = useState(state.current.round);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const [tension, setTension] = useState(0);
  // a release that ended the round sends the Dog lunging forward again for a moment
  const lunge = useRef(0);

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const prev = state.current;
    const next = stepPosteMinigame(prev, dt, holding.current, config);
    state.current = next;
    if (next.outcomes.length > prev.outcomes.length) {
      const outcome = next.outcomes[next.outcomes.length - 1];
      setLastOutcome(outcome);
      if (outcome === 'released') lunge.current = AGITATION_SECONDS;
    }
    lunge.current = Math.max(0, lunge.current - dt);
    setTension(lunge.current > 0 ? 1 : quantizeTension(tensionOf(next, config)));
    setRound(next.round);
    if (next.done && !finished.current) {
      finished.current = true;
      finish.current(posteMinigameMetrics(next));
    }
  });

  return (
    <Screen>
      <Text className="mb-1 text-sm text-inkDim">{`${t('minigame.poste.round')} ${Math.min(round + 1, config.rounds)} ${t('minigame.poste.of')} ${config.rounds}`}</Text>
      <Text className="mb-4 text-base text-ink">{t(help)}</Text>
      <View className="rounded-game-lg bg-surface p-4">
        <View className="flex-row items-end justify-between">
          <LeashProp t={t} tension={tension} />
          <CanineMinigameAvatar t={t} posture={holdPosture(tension, false)} />
        </View>
      </View>
      <Text className="my-3 h-6 text-center text-sm text-inkMuted">{lastOutcome ? t(OUTCOME_KEYS[lastOutcome]) : ''}</Text>
      {started ? (
        <Pad label={t(hold)} onPressIn={() => (holding.current = true)} onPressOut={() => (holding.current = false)} />
      ) : (
        <Button label={t('minigame.poste.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
