import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { GameButton, Panel } from '../ui/components';
import { handlePress } from '../ui/press';

export interface ShopLinkCardProps {
  t: Translate;
  explanation: string;
  onOpen: () => void;
  actionLabel?: string;
  testID?: string;
}

/**
 * In-content card rendering a Shop recommendation with its explanation and a "Ver en la tienda" action.
 * Rendered on Lessons, Nodes, and Missions for recommendations with the 'view' trigger (max 2).
 */
export function ShopLinkCard({
  t,
  explanation,
  onOpen,
  actionLabel,
  testID = 'shop-link-card',
}: ShopLinkCardProps) {
  const label = actionLabel ?? t('shop.seeInShop');
  return (
    <Panel className="my-3">
      <Text className="text-body text-ink">{explanation}</Text>
      <View className="mt-3 flex-row justify-start">
        <GameButton
          label={label}
          onPress={() => handlePress(onOpen)}
          variant="secondary"
          testID={`${testID}-action`}
        />
      </View>
    </Panel>
  );
}
