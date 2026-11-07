import { View } from 'react-native';
import type { Translate } from '../../i18n';
import { getActiveContent } from '../content/runtime';
import { Badge } from './components';

export function BetaContentBadge({ t }: { t: Translate }) {
  const content = getActiveContent();
  if (content.channel !== 'beta') {
    return null;
  }
  return (
    <View testID="beta-content-indicator" accessibilityLabel={t('content.betaIndicator')}>
      <Badge label={t('content.betaIndicator')} tone="accent" />
    </View>
  );
}
