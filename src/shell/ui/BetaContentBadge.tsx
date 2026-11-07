import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { getActiveContent } from '../content/runtime';

export function BetaContentBadge({ t }: { t: Translate }) {
  const content = getActiveContent();
  if (content.channel !== 'beta') {
    return null;
  }
  return (
    // Tiny overlay pinned to the top edge of the header; never intercepts touches.
    <View
      testID="beta-content-indicator"
      accessibilityLabel={t('content.betaIndicator')}
      pointerEvents="none"
      className="absolute rounded-game-pill bg-accent px-1.5"
      style={{ top: -8, right: 0, zIndex: 1 }}
    >
      <Text className="font-display text-ink" style={{ fontSize: 9, lineHeight: 12 }}>
        {t('content.betaIndicator')}
      </Text>
    </View>
  );
}
