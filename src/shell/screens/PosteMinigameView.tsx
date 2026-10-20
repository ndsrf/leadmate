import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { HARNESS_RITUAL, newPosteMinigame, posteMinigameMetrics, POSTE_MINIGAME, stepPosteMinigame, tensionOf, type HoldMinigameConfig, type PosteMinigameState, type RoundOutcome } from '../nodes/posteMinigame';
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
  const [state, setState] = useState<PosteMinigameState>(newPosteMinigame);
  const holding = useRef(false);
  const [lastOutcome, setLastOutcome] = useState<RoundOutcome | null>(null);
  const finished = useRef(false);

  useEffect(() => {
    if (!started) return;
    let last = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      setState((prev) => {
        const next = stepPosteMinigame(prev, dt, holding.current, config);
        if (next.outcomes.length > prev.outcomes.length) setLastOutcome(next.outcomes[next.outcomes.length - 1]);
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (state.done && !finished.current) {
      finished.current = true;
      onFinish(posteMinigameMetrics(state));
    }
  }, [state, onFinish]);

  const tension = tensionOf(state, config);
  return (
    <Screen>
      <Text className="mb-1 text-sm text-slate-400">{`${t('minigame.poste.round')} ${Math.min(state.round + 1, config.rounds)} ${t('minigame.poste.of')} ${config.rounds}`}</Text>
      <Text className="mb-4 text-base text-white">{t(help)}</Text>
      <View className="h-6 overflow-hidden rounded-full bg-slate-700">
        <View className={`h-6 ${tension > 0.8 ? 'bg-red-500' : tension > 0.5 ? 'bg-yellow-400' : 'bg-green-500'}`} style={{ width: `${tension * 100}%` }} />
      </View>
      <Text className="my-3 h-6 text-center text-sm text-slate-300">{lastOutcome ? t(OUTCOME_KEYS[lastOutcome]) : ''}</Text>
      {started ? (
        <Pressable
          onPressIn={() => (holding.current = true)}
          onPressOut={() => (holding.current = false)}
          accessibilityRole="button"
          className="h-40 items-center justify-center rounded-2xl bg-green-600 active:bg-green-500"
        >
          <Text className="text-xl font-bold text-white">{t(hold)}</Text>
        </Pressable>
      ) : (
        <Button label={t('minigame.poste.start')} onPress={() => setStarted(true)} />
      )}
    </Screen>
  );
}
