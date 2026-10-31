import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { Translate, TextKey } from '../../i18n';
import { Button } from '../Overlays';
import { Migas } from '../ui/art';
import { Badge, Panel, Raised } from '../ui/components';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';
import { Screen } from './Screen';

type Benefit = 'worlds' | 'guides' | 'more';
const BENEFITS: readonly { id: Benefit; text: TextKey }[] = [
  { id: 'worlds', text: 'paywall.benefit.worlds' },
  { id: 'guides', text: 'paywall.benefit.guides' },
  { id: 'more', text: 'paywall.benefit.more' },
];

function BenefitIcon({ id }: { id: Benefit }) {
  const color = usePalette();
  const ink = { stroke: color.outline, strokeWidth: 2.4, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" aria-hidden>
      {id === 'worlds' && (
        <>
          <Path d="M3 7l7-3 8 3 7-3v17l-7 3-8-3-7 3z" fill={color.brand} {...ink} />
          <Path d="M10 4v17M18 7v17" fill="none" {...ink} />
        </>
      )}
      {id === 'guides' && (
        <>
          <Rect x={4} y={4} width={20} height={20} rx={4} fill={color.infoSoft} {...ink} />
          <Path d="M11.5 9.5v9l7-4.5z" fill={color.info} {...ink} />
        </>
      )}
      {id === 'more' && (
        <>
          <Circle cx={14} cy={14} r={10} fill={color.accent} {...ink} />
          <Path d="M14 8v12M8 14h12" fill="none" {...ink} />
        </>
      )}
    </Svg>
  );
}

/** The close control; it does what "Maybe later" does. */
function CloseButton({ label, onPress }: { label: string; onPress: () => void }) {
  const color = usePalette();
  return (
    <Pressable onPress={() => handlePress(onPress)} accessibilityRole="button" accessibilityLabel={label} style={{ alignSelf: 'flex-end', width: theme.size.touchMin, height: theme.size.touchMin, alignItems: 'center', justifyContent: 'center' }}>
      <Raised fill={color.surface} radius={theme.radius.pill} offset={2} faceStyle={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
          <Path d="M3 3l10 10M13 3L3 13" stroke={color.ink} strokeWidth={2.6} strokeLinecap="round" />
        </Svg>
      </Raised>
    </Pressable>
  );
}

export interface PaywallScreenProps {
  t: Translate;
  mode?: 'trial' | 'subscription';
  onStartTrial?: () => void;
  onSubscribeAnnual?: () => void;
  onSubscribeMonthly?: () => void;
  onLater: () => void;
}

/**
 * Shared subscription tier selection cards (Annual vs Monthly).
 */
export function PlanTierCards({
  selectedPlan,
  onSelectPlan,
  t,
}: {
  selectedPlan: 'annual' | 'monthly';
  onSelectPlan: (plan: 'annual' | 'monthly') => void;
  t: Translate;
}) {
  const color = usePalette();
  return (
    <View className="my-3 gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('paywall.plan.annual')} - ${t('paywall.plan.annualPrice')}`}
        onPress={() => onSelectPlan('annual')}
      >
        <Raised
          fill={selectedPlan === 'annual' ? color.accentSoft : color.surface}
          radius={theme.radius.lg}
          offset={theme.depth.sm.x}
          faceStyle={{
            padding: theme.space[3],
            borderWidth: selectedPlan === 'annual' ? 2 : 1,
            borderColor: selectedPlan === 'annual' ? color.accent : color.edge,
          }}
        >
          <View className="flex-row items-center justify-between">
            <View className="gap-1">
              <Text className="font-display text-title text-ink">{t('paywall.plan.annual')}</Text>
              <Badge label={t('paywall.plan.annualBadge')} tone="accent" />
            </View>
            <Text className="font-display text-title text-ink">{t('paywall.plan.annualPrice')}</Text>
          </View>
        </Raised>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${t('paywall.plan.monthly')} - ${t('paywall.plan.monthlyPrice')}`}
        onPress={() => onSelectPlan('monthly')}
      >
        <Raised
          fill={selectedPlan === 'monthly' ? color.accentSoft : color.surface}
          radius={theme.radius.lg}
          offset={theme.depth.sm.x}
          faceStyle={{
            padding: theme.space[3],
            borderWidth: selectedPlan === 'monthly' ? 2 : 1,
            borderColor: selectedPlan === 'monthly' ? color.accent : color.edge,
          }}
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-display text-title text-ink">{t('paywall.plan.monthly')}</Text>
            <Text className="font-display text-title text-ink">{t('paywall.plan.monthlyPrice')}</Text>
          </View>
        </Raised>
      </Pressable>
    </View>
  );
}

/**
 * Paywall screen supporting both trial start mode (during onboarding or Trial eligibility)
 * and subscription conversion mode (after trial expiration).
 */
export function PaywallScreen({
  t,
  mode = 'trial',
  onStartTrial,
  onSubscribeAnnual,
  onSubscribeMonthly,
  onLater,
}: PaywallScreenProps) {
  const color = usePalette();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  if (mode === 'subscription') {
    return (
      <Screen header={<CloseButton label={t('paywall.close')} onPress={onLater} />}>
        <Raised fill={color.sky} radius={theme.radius.lg} offset={theme.depth.sm.x} className="mb-4" faceStyle={{ alignItems: 'center', paddingVertical: theme.space[3] }}>
          <Migas width={170} />
          <View className="flex-row justify-center">
            <Badge label={t('plus.brand')} tone="accent" />
          </View>
        </Raised>

        <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
          {t('paywall.subscription.title')}
        </Text>

        {BENEFITS.map((b) => (
          <View key={b.id} className="mb-3 flex-row items-center" style={{ gap: theme.space[3] }}>
            <BenefitIcon id={b.id} />
            <Text className="flex-1 text-bodyL text-ink">{t(b.text)}</Text>
          </View>
        ))}

        <PlanTierCards selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} t={t} />

        <Button
          label={t('paywall.plan.subscribe')}
          onPress={() => {
            if (selectedPlan === 'annual') onSubscribeAnnual?.();
            else onSubscribeMonthly?.();
          }}
        />
        <Button label={t('paywall.later')} tone="quiet" onPress={onLater} />
      </Screen>
    );
  }

  return (
    <Screen header={<CloseButton label={t('paywall.close')} onPress={onLater} />}>
      <Raised fill={color.sky} radius={theme.radius.lg} offset={theme.depth.sm.x} className="mb-4" faceStyle={{ alignItems: 'center', paddingVertical: theme.space[3] }}>
        <Migas width={170} />
        <View className="flex-row justify-center">
          <Badge label={t('paywall.badge')} tone="accent" />
        </View>
      </Raised>
      <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
        {t('paywall.title')}
      </Text>
      {BENEFITS.map((b) => (
        <View key={b.id} className="mb-3 flex-row items-center" style={{ gap: theme.space[3] }}>
          <BenefitIcon id={b.id} />
          <Text className="flex-1 text-bodyL text-ink">{t(b.text)}</Text>
        </View>
      ))}
      <Panel tone="info" className="mt-1">
        <Text className="text-body text-ink">{t('paywall.free')}</Text>
      </Panel>
      <Button label={t('paywall.start')} onPress={() => onStartTrial?.()} />
      <Button label={t('paywall.later')} tone="quiet" onPress={onLater} />
    </Screen>
  );
}
