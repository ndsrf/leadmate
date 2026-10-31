import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { Migas } from '../ui/art';
import { Badge, Panel, Raised } from '../ui/components';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';
import { Screen } from './Screen';
import { PlanTierCards } from './PaywallScreen';

export interface ValueRecapScreenProps {
  t: Translate;
  dogName?: string;
  streakDays: number;
  videosWatched: number;
  skipsUsed: number;
  onSubscribeAnnual: () => void;
  onSubscribeMonthly: () => void;
  onContinueFree: () => void;
}

export function ValueRecapScreen({
  t,
  dogName,
  streakDays,
  videosWatched,
  skipsUsed,
  onSubscribeAnnual,
  onSubscribeMonthly,
  onContinueFree,
}: ValueRecapScreenProps) {
  const color = usePalette();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const title = dogName && dogName.trim().length > 0
    ? t('recap.title').replace('{name}', dogName)
    : t('recap.titleDefault');

  return (
    <Screen>
      <Raised
        fill={color.sky}
        radius={theme.radius.lg}
        offset={theme.depth.sm.x}
        className="mb-4"
        faceStyle={{ alignItems: 'center', paddingVertical: theme.space[3] }}
      >
        <Migas width={160} />
        <View className="mt-2 flex-row justify-center">
          <Badge label={t('plus.brand')} tone="accent" />
        </View>
      </Raised>

      <Text className="mb-2 font-display text-displayM text-ink" accessibilityRole="header">
        {title}
      </Text>
      <Text className="mb-4 text-body text-inkMuted">
        {t('recap.subtitle')}
      </Text>

      {/* Trial Achievements */}
      <Panel className="mb-4 gap-3">
        <View className="flex-row items-center gap-3">
          <Text className="text-displayM">🔥</Text>
          <View className="flex-1">
            <Text className="font-display text-body text-ink">
              {t('recap.streak').replace('{days}', String(streakDays))}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-displayM">🎬</Text>
          <View className="flex-1">
            <Text className="font-display text-body text-ink">
              {t('recap.videos').replace('{count}', String(videosWatched))}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Text className="text-displayM">⚡</Text>
          <View className="flex-1">
            <Text className="font-display text-body text-ink">
              {t('recap.skips').replace('{count}', String(skipsUsed))}
            </Text>
          </View>
        </View>
      </Panel>

      <PlanTierCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} t={t} />

      <Button
        label={t('paywall.plan.subscribe')}
        onPress={selectedPlan === 'annual' ? onSubscribeAnnual : onSubscribeMonthly}
      />
      <Button
        label={t('recap.bypass')}
        tone="quiet"
        onPress={onContinueFree}
      />
    </Screen>
  );
}
