import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import type { DogRecord } from '../dogRecord';
import { Panel } from '../ui/components';
import { homeStretchesInWorldTwo } from '../homeBehaviours';
import { CONCERN_KEYS } from '../concernText';
import { Screen } from './Screen';

export function MethodOverviewScreen({
  t,
  dog,
  onContinue,
  onBack,
}: {
  t: Translate;
  dog: Pick<DogRecord, 'name' | 'homeConcerns' | 'worldHome'>;
  onContinue: () => void;
  onBack?: () => void;
}) {
  const dogName = dog.name.trim();
  // only the Concerns that really have a Home Stretch in World 2 for this Dog are promised there
  const homeConcernKeys = homeStretchesInWorldTwo(dog.homeConcerns, dog.worldHome, () => false).map((h) => h.concern);
  const hasHomeConcerns = homeConcernKeys.length > 0;
  const concernsList = homeConcernKeys.map((c) => t(CONCERN_KEYS[c])).join(t('method.list.separator'));

  return (
    <Screen>
      <Text className="mb-2 font-display text-displayM text-ink">{t('method.title')}</Text>
      <Text className="mb-5 text-body text-inkMuted">{t('method.subtitle')}</Text>

      <Panel className="mb-4">
        <Text className="mb-1 font-display text-title text-ink">{t('method.pillar.loop.title')}</Text>
        <Text className="text-body text-inkMuted leading-relaxed">{t('method.pillar.loop.desc')}</Text>
      </Panel>

      <Panel className="mb-4">
        <Text className="mb-1 font-display text-title text-ink">{t('method.pillar.walk.title')}</Text>
        <Text className="text-body text-inkMuted leading-relaxed">{t('method.pillar.walk.desc')}</Text>
      </Panel>

      <Panel className="mb-4">
        <Text className="mb-1 font-display text-title text-ink">{t('method.pillar.barkdoku.title')}</Text>
        <Text className="text-body text-inkMuted leading-relaxed">{t('method.pillar.barkdoku.desc')}</Text>
      </Panel>

      <Panel tone="info" className="mb-6">
        <Text className="mb-1 font-display text-title text-ink">
          {hasHomeConcerns
            ? dogName
              ? t('method.reassurance.concerns.title').split('{name}').join(dogName)
              : t('method.reassurance.concerns.titleNoName')
            : t('method.reassurance.default.title')}
        </Text>
        <Text className="text-body text-ink leading-relaxed">
          {hasHomeConcerns
            ? t('method.reassurance.concerns.desc').split('{concerns}').join(concernsList)
            : t('method.reassurance.default.desc')}
        </Text>
      </Panel>

      <Button label={t('method.continue')} onPress={onContinue} />
      {onBack && (
        <View className="mt-2">
          <Button label={t('method.back')} tone="quiet" onPress={onBack} />
        </View>
      )}
    </Screen>
  );
}
