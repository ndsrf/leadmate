import { Text } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { Screen } from './Screen';

/** A stub: both buttons continue to the first Stage and nothing is locked either way. */
export function PaywallScreen({ t, onStartTrial, onLater }: { t: Translate; onStartTrial: () => void; onLater: () => void }) {
  return (
    <Screen>
      <Text className="mb-2 font-display text-displayM text-ink">{t('paywall.title')}</Text>
      <Text className="mb-2 text-bodyL text-inkMuted">{t('paywall.body')}</Text>
      <Button label={t('paywall.start')} onPress={onStartTrial} />
      <Button label={t('paywall.later')} tone="quiet" onPress={onLater} />
    </Screen>
  );
}
