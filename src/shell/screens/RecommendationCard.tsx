import { Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import type { LessonRecommendation } from '../lessons/lesson';
import type { ResolvedShop } from '../content/resolver';
import type { ShopLevel } from './ShopScreen';
import { GameButton, Panel } from '../ui/components';
import { handlePress } from '../ui/press';

export type RecommendationItem = LessonRecommendation;

export interface RecommendationCardProps {
  t: Translate;
  explanation: string;
  onOpen: () => void;
  actionLabel?: string;
  testID?: string;
}

/**
 * In-content card rendering an authored Recommendation with its explanation and a "Ver en la tienda" action.
 * Conforms to GLOSSARY.md domain terminology ("Recommendation" rather than "Shop link" or "ad").
 * Rendered on Lessons, Nodes, and Missions for recommendations with the 'view' trigger (max 2).
 */
export function RecommendationCard({
  t,
  explanation,
  onOpen,
  actionLabel,
  testID = 'shop-link-card',
}: RecommendationCardProps) {
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

export interface RecommendationListProps {
  recommendations?: RecommendationItem[];
  activeShop?: ResolvedShop;
  onOpenShop?: (target: { level: ShopLevel; id?: string }) => void;
  t: Translate;
  max?: number;
}

/**
 * Shared helper component for rendering in-content view recommendations (up to max, default 2).
 * Eliminates duplicate filtering and mapping across Lesson, Node, and Mission screens.
 */
export function RecommendationCardList({
  recommendations,
  activeShop,
  onOpenShop,
  t,
  max = 2,
}: RecommendationListProps) {
  if (!recommendations || recommendations.length === 0 || !activeShop || !onOpenShop) {
    return null;
  }
  const viewRecs = recommendations
    .filter((r) => r.when === 'view' && Boolean(activeShop.idToKind && activeShop.idToKind[r.target]))
    .slice(0, max);

  if (viewRecs.length === 0) return null;

  return (
    <>
      {viewRecs.map((rec) => (
        <RecommendationCard
          key={rec.id}
          t={t}
          explanation={t(rec.explanation as any) || (rec.explanation as string)}
          onOpen={() => onOpenShop({ level: rec.targetKind, id: rec.target })}
        />
      ))}
    </>
  );
}

// Backward-compatible alias
export const ShopLinkCard = RecommendationCard;
export type ShopLinkCardProps = RecommendationCardProps;
