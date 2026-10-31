import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { Migas } from '../ui/art';
import { Badge, Panel, Raised } from '../ui/components';
import { theme, usePalette } from '../ui/theme';
import { Screen } from './Screen';
import { PlanTierCards } from './PaywallScreen';
import { getBillingService, type BillingPackage, type BillingService } from '../billing';

export interface ValueRecapScreenProps {
  t: Translate;
  dogName?: string;
  streakDays: number;
  videosWatched: number;
  skipsUsed: number;
  packages?: BillingPackage[];
  billingService?: BillingService;
  onSubscribeAnnual?: () => void;
  onSubscribeMonthly?: () => void;
  onRestore?: () => (Promise<void>) | void;
  onContinueFree: () => void;
}

export function ValueRecapScreen({
  t,
  dogName,
  streakDays,
  videosWatched,
  skipsUsed,
  packages,
  billingService,
  onSubscribeAnnual,
  onSubscribeMonthly,
  onRestore,
  onContinueFree,
}: ValueRecapScreenProps) {
  const color = usePalette();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');
  const [packagesList, setPackagesList] = useState<BillingPackage[]>(packages ?? []);
  const [error, setError] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const billing = billingService ?? getBillingService();

  useEffect(() => {
    if (packages) {
      setPackagesList(packages);
      return;
    }
    billing.getPackages().then(setPackagesList).catch(() => {});
  }, [packages, billing]);

  const annualPkg = packagesList.find((p) => p.tier === 'annual');
  const monthlyPkg = packagesList.find((p) => p.tier === 'monthly');

  const annualPrice = annualPkg
    ? annualPkg.priceString.includes('/')
      ? annualPkg.priceString
      : `${annualPkg.priceString}/año`
    : undefined;

  const monthlyPrice = monthlyPkg
    ? monthlyPkg.priceString.includes('/')
      ? monthlyPkg.priceString
      : `${monthlyPkg.priceString}/mes`
    : undefined;

  const title = dogName && dogName.trim().length > 0
    ? t('recap.title').replace('{name}', dogName)
    : t('recap.titleDefault');

  const handleSubscribe = async () => {
    setError(null);
    setRestoreMessage(null);

    const targetPkg = selectedPlan === 'annual' ? annualPkg : monthlyPkg;
    if (targetPkg) {
      setBusy(true);
      try {
        const result = await billing.purchasePackage(targetPkg);
        if (result.userCancelled) return;
        if (!result.success || !result.isPlus) {
          setError(result.error ?? t('paywall.error'));
          return;
        }
      } catch (err: any) {
        if (!err?.userCancelled) {
          setError(err?.message ?? t('paywall.error'));
        }
        return;
      } finally {
        setBusy(false);
      }
    }

    if (selectedPlan === 'annual' && onSubscribeAnnual) {
      await onSubscribeAnnual();
      return;
    }
    if (selectedPlan === 'monthly' && onSubscribeMonthly) {
      await onSubscribeMonthly();
      return;
    }
  };

  const handleRestore = async () => {
    setError(null);
    setRestoreMessage(null);
    if (onRestore) {
      onRestore();
      return;
    }

    setBusy(true);
    try {
      const result = await billing.restorePurchases();
      if (result.success && result.isPlus) {
        setRestoreMessage(t('paywall.restoreSuccess'));
      } else {
        setRestoreMessage(t('paywall.restoreNotFound'));
      }
    } catch (err: any) {
      setError(err?.message ?? t('paywall.error'));
    } finally {
      setBusy(false);
    }
  };

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
        {([
          { icon: '🔥', text: t('recap.streak').replace('{days}', String(streakDays)) },
          { icon: '🎬', text: t('recap.videos').replace('{count}', String(videosWatched)) },
          { icon: '⚡', text: t('recap.skips').replace('{count}', String(skipsUsed)) },
        ] as const).map((stat, i) => (
          <View key={i} className="flex-row items-center gap-3">
            <Text className="text-displayM">{stat.icon}</Text>
            <View className="flex-1">
              <Text className="font-display text-body text-ink">{stat.text}</Text>
            </View>
          </View>
        ))}
      </Panel>

      <PlanTierCards
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        t={t}
        annualPrice={annualPrice}
        monthlyPrice={monthlyPrice}
      />

      {error && (
        <Panel tone="warn" className="mb-2">
          <Text className="text-body text-ink">{error}</Text>
        </Panel>
      )}

      {restoreMessage && (
        <Panel tone="info" className="mb-2">
          <Text className="text-body text-ink">{restoreMessage}</Text>
        </Panel>
      )}

      <Button
        label={t('paywall.plan.subscribe')}
        disabled={busy}
        onPress={handleSubscribe}
      />
      <Button
        label={t('recap.bypass')}
        tone="quiet"
        onPress={onContinueFree}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('paywall.restore')}
        onPress={handleRestore}
        disabled={busy}
        style={{ alignSelf: 'center', paddingVertical: theme.space[2] }}
      >
        <Text className="text-body text-ink font-body underline">
          {t('paywall.restore')}
        </Text>
      </Pressable>
    </Screen>
  );
}
