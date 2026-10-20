import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { findNode } from '../nodes/content';
import { latencyBand } from '../onboarding/diagnostic';
import { Screen } from './Screen';

const BAND_KEYS = { quick: 'plan.band.quick', steady: 'plan.band.steady', slow: 'plan.band.slow' } as const;
const NOTE_KEYS = { quick: 'plan.note.quick', steady: 'plan.note.steady', slow: 'plan.note.slow' } as const;

/** The diagnostic card (latency and band) and the Walk Plan, shown before the paywall. */
export function PlanScreen({ t, latency, plan, onContinue }: { t: Translate; latency: number; plan: readonly string[]; onContinue: () => void }) {
  const band = latencyBand(latency);
  return (
    <Screen>
      <Text className="mb-4 text-2xl font-bold text-white">{t('plan.title')}</Text>
      <View className="mb-5 rounded-xl bg-slate-800 p-4">
        <Text className="text-sm text-slate-300">{t('plan.latency')}</Text>
        <Text className="text-3xl font-bold text-white">{`${latency.toFixed(2)} ${t('plan.seconds')}`}</Text>
        <Text className="mt-1 text-base font-semibold text-green-400">{t(BAND_KEYS[band])}</Text>
        <Text className="mt-2 text-sm text-slate-300">{t(NOTE_KEYS[band])}</Text>
      </View>
      <View className="mb-5 rounded-xl bg-slate-800 p-4">
        <Text className="mb-2 text-base font-bold text-white">{t('plan.walkPlan')}</Text>
        {plan.map((id, i) => {
          const node = findNode(id);
          return node ? (
            <Text key={id} className="py-0.5 text-sm text-white">{`${i + 1}. ${t(node.title)}`}</Text>
          ) : null;
        })}
      </View>
      <Button label={t('plan.continue')} onPress={onContinue} />
    </Screen>
  );
}
