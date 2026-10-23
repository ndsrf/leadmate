import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import type { DogRecord } from '../dogRecord';
import { BreedArt } from '../ui/BreedArt';
import { Panel } from '../ui/components';
import { findNode } from '../nodes/content';
import { latencyBand } from '../onboarding/diagnostic';
import { Screen } from './Screen';

const BAND_KEYS = { quick: 'plan.band.quick', steady: 'plan.band.steady', slow: 'plan.band.slow' } as const;
const NOTE_KEYS = { quick: 'plan.note.quick', steady: 'plan.note.steady', slow: 'plan.note.slow' } as const;

/** The diagnostic card (latency and band) and the Walk Plan, shown before the paywall. */
export function PlanScreen({ t, dog, latency, plan, onContinue }: { t: Translate; dog: Pick<DogRecord, 'name' | 'breed' | 'coat'>; latency: number; plan: readonly string[]; onContinue: () => void }) {
  const band = latencyBand(latency);
  return (
    <Screen>
      <Text className="mb-4 font-display text-displayM text-ink">{t('plan.title')}</Text>
      <Panel className="mb-5">
        <View className="mb-2 flex-row items-center">
          <BreedArt breed={dog.breed} coat={dog.coat} width={96} />
          <View className="flex-1">
            {dog.name !== '' && <Text className="font-display text-title text-ink">{dog.name}</Text>}
            <Text className="text-body text-inkMuted">{t(`breed.${dog.breed}`)}</Text>
          </View>
        </View>
        <Text className="text-body text-inkMuted">{t('plan.latency')}</Text>
        <Text className="font-display text-displayL text-ink">{`${latency.toFixed(2)} ${t('plan.seconds')}`}</Text>
        <Text className="mt-1 font-display text-bodyL text-brandText">{t(BAND_KEYS[band])}</Text>
        <Text className="mt-2 text-body text-inkMuted">{t(NOTE_KEYS[band])}</Text>
      </Panel>
      <Panel className="mb-5">
        <Text className="mb-2 font-display text-title text-ink">{t('plan.walkPlan')}</Text>
        {plan.map((id, i) => {
          const node = findNode(id);
          return node ? (
            <Text key={id} className="py-0.5 text-body text-ink">{`${i + 1}. ${t(node.title)}`}</Text>
          ) : null;
        })}
      </Panel>
      <Button label={t('plan.continue')} onPress={onContinue} />
    </Screen>
  );
}
