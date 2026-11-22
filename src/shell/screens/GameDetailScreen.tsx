import React from 'react';
import { Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import type { ResolvedGame } from '../content/resolver';
import type { DogRecord } from '../dogRecord';
import { canSeeGame, computeLockedBars } from '../games';
import { Button } from '../Overlays';
import { Badge, Panel } from '../ui/components';
import { ContentPicture } from '../ui/ContentPicture';
import { usePalette, theme } from '../ui/theme';
import { RecommendationCard } from './RecommendationCard';
import { Screen } from './Screen';
import type { ShopLevel } from './ShopScreen';

export interface GameDetailScreenProps {
  t: Translate;
  game: ResolvedGame;
  isPlus?: boolean | DogRecord | null;
  onBack: () => void;
  onOpenPaywall?: () => void;
  onOpenShop?: (target: { level: ShopLevel; id?: string }) => void;
}

/**
 * Game detail screen: shows title, first illustration, and intro to everyone.
 * For Plus users or games flagged `free: true`, shows materials, safety note, steps,
 * tips, further illustrations, and shop links.
 * For non-Plus users on locked games, hides all gated content completely from the render
 * tree and accessibility, displaying only blurred-looking placeholder bars with a centered
 * Plus button to open the paywall.
 */
export function GameDetailScreen({
  t,
  game,
  isPlus,
  onBack,
  onOpenPaywall,
  onOpenShop,
}: GameDetailScreenProps) {
  const color = usePalette();
  const unlocked = canSeeGame(game, isPlus);
  const tr = (k?: string | TextKey) => (k ? t(k as TextKey) || (k as string) : '');

  const firstImage = game.images?.[0];
  const furtherImages = game.images?.slice(1) ?? [];

  const durationLabel = game.minutes
    ? t('games.duration').replace('{minutes}', String(game.minutes))
    : null;
  const difficultyKey = game.difficulty
    ? (`games.difficulty.${game.difficulty}` as const)
    : null;
  const difficultyLabel = difficultyKey ? t(difficultyKey) : null;

  // Compute placeholder bars count and widths derived from the hidden content length.
  // Absolutely no hidden text is included in the output of computeLockedBars.
  const hiddenContentKeys: Array<string | TextKey | undefined> = [
    ...(game.materials ?? []),
    game.safety,
    ...(game.steps ?? []),
    ...(game.tips ?? []),
  ];
  const hiddenText = hiddenContentKeys.map((k) => tr(k)).join(' ');
  const lockedBars = computeLockedBars(hiddenText);

  const header = (
    <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
      <Text
        className="shrink font-display text-title text-ink"
        accessibilityRole="header"
      >
        {tr(game.title)}
      </Text>
      <Button label={t('games.back')} tone="secondary" onPress={onBack} testID="game-back-button" />
    </View>
  );

  return (
    <Screen header={header}>
      <View className="w-full">
        {/* Title */}
        <Text className="font-display text-heading text-ink mb-2" accessibilityRole="header">
          {tr(game.title)}
        </Text>

        {/* Metadata: difficulty, duration, free tag */}
        <View className="flex-row items-center flex-wrap mb-3" style={{ gap: theme.space[2] }}>
          {difficultyLabel && <Badge label={difficultyLabel} tone="quiet" />}
          {durationLabel && <Badge label={durationLabel} tone="quiet" />}
          {game.free && <Badge label={t('games.plusLock')} tone="accent" />}
        </View>

        {/* First illustration (always shown) */}
        {firstImage && (
          <View
            className="w-full mb-3 overflow-hidden rounded-game-card"
            style={{ borderRadius: theme.radius.lg }}
            accessibilityLabel={tr(firstImage.alt)}
            accessibilityRole="image"
          >
            <ContentPicture
              t={t}
              art={firstImage.file}
              itemPath={`games/${game.id}`}
              style={{ width: '100%' }}
            />
          </View>
        )}

        {/* Intro (always shown) */}
        <Text className="text-body text-ink mb-4">{tr(game.intro)}</Text>

        {/* Gated content vs. Locked placeholder bars */}
        {unlocked ? (
          <View testID="game-unlocked-content" className="w-full">
            {/* Materials section with safety note inside */}
            {(Boolean(game.materials?.length) || Boolean(game.safety)) && (
              <View className="mb-5" testID="game-materials-section">
                <Text className="font-display text-title text-ink mb-2" accessibilityRole="header">
                  {t('games.materialsTitle')}
                </Text>

                {/* Safety note inside the materials block */}
                {game.safety && (
                  <View className="mb-3" testID="game-safety-note">
                    <Panel>
                      <Text className="font-display text-body font-bold text-ink mb-1">
                        {t('games.safetyTitle')}
                      </Text>
                      <Text className="text-body text-ink">{tr(game.safety)}</Text>
                    </Panel>
                  </View>
                )}

                {/* Materials items */}
                {game.materials?.map((matKey, i) => (
                  <Text key={i} className="text-body text-ink mb-1">
                    • {tr(matKey)}
                  </Text>
                ))}

                {/* Shop links for needs */}
                {game.needs && game.needs.length > 0 && (
                  <View className="mt-3" testID="game-shop-links">
                    {game.needs.map((link) => (
                      <RecommendationCard
                        key={link.target}
                        t={t}
                        explanation={tr(link.note) || t('shop.seeInShop')}
                        onOpen={() =>
                          onOpenShop?.({ level: link.targetKind as ShopLevel, id: link.target })
                        }
                        testID="game-shop-link"
                      />
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Steps section */}
            {game.steps && game.steps.length > 0 && (
              <View className="mb-5" testID="game-steps-section">
                <Text className="font-display text-title text-ink mb-3" accessibilityRole="header">
                  {t('games.steps')}
                </Text>
                {game.steps.map((stepKey, i) => (
                  <View key={i} className="mb-3 flex-row items-start">
                    <View
                      className="items-center justify-center mr-3"
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: color.accent,
                        flexShrink: 0,
                      }}
                    >
                      <Text className="font-bold text-ink" style={{ fontSize: 13 }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text className="flex-1 text-body text-ink leading-relaxed">{tr(stepKey)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tips section */}
            {game.tips && game.tips.length > 0 && (
              <View className="mb-5" testID="game-tips-section">
                <Text className="font-display text-title text-ink mb-2" accessibilityRole="header">
                  {t('games.tips')}
                </Text>
                {game.tips.map((tipKey, i) => (
                  <Panel key={i} className="mb-2">
                    <Text className="text-body text-ink">💡 {tr(tipKey)}</Text>
                  </Panel>
                ))}
              </View>
            )}

            {/* Further illustrations */}
            {furtherImages.length > 0 && (
              <View className="mb-5" testID="game-further-images">
                {furtherImages.map((img, i) => (
                  <View key={i} className="mb-3">
                    <View
                      className="w-full overflow-hidden"
                      style={{ borderRadius: theme.radius.lg }}
                      accessibilityLabel={tr(img.alt)}
                      accessibilityRole="image"
                    >
                      <ContentPicture
                        t={t}
                        art={img.file}
                        itemPath={`games/${game.id}`}
                        style={{ width: '100%' }}
                      />
                    </View>
                    {img.caption && (
                      <Text className="text-caption text-inkMuted mt-1">{tr(img.caption)}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : (
          /* Locked subtree: no real text is rendered, hidden from screen readers, Plus button centered over bars */
          <View
            testID="game-locked-section"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 180,
              marginTop: theme.space[2],
            }}
          >
            {/* Soft tinted placeholder bars: completely hidden from screen readers */}
            <View
              aria-hidden={true}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
              style={{ opacity: 0.6 }}
              testID="game-locked-bars"
            >
              {lockedBars.map((bar) => (
                <View
                  key={bar.id}
                  testID="game-locked-bar"
                  style={{
                    width: bar.width,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: color.surfaceSunken,
                    marginVertical: 6,
                  }}
                />
              ))}
            </View>

            {/* Centered Plus button over placeholder bars */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Button
                label={t('games.unlockWithPlus')}
                tone="primary"
                onPress={() => onOpenPaywall?.()}
                accessibilityLabel={t('games.plusLockLabel')}
                testID="game-plus-button"
              />
            </View>
          </View>
        )}
      </View>
    </Screen>
  );
}
