import React, { useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import type { ResolvedGame } from '../content/resolver';
import type { DogRecord } from '../dogRecord';
import { canSeeGame, pickRandomGame } from '../games';
import { Button } from '../Overlays';
import { Badge, Panel } from '../ui/components';
import { ContentPicture } from '../ui/ContentPicture';
import { handlePress } from '../ui/press';
import { theme } from '../ui/theme';
import { Screen } from './Screen';

export interface GamesScreenProps {
  t: Translate;
  games: readonly ResolvedGame[];
  isPlus?: boolean | DogRecord | null;
  onOpenGame: (gameId: string, options?: { from?: 'list' | 'random' }) => void;
  onOpenRandom?: (gameId: string) => void;
  onBack: () => void;
  lastRandomId?: string | null;
}

/**
 * Games screen: a "random game" button at the top and the list of games in content order below it.
 * Each list row shows the game's title, thumbnail, duration, difficulty, and Plus marker for locked games.
 */
export function GamesScreen({
  t,
  games,
  isPlus,
  onOpenGame,
  onOpenRandom,
  onBack,
  lastRandomId,
}: GamesScreenProps) {
  const tr = (k?: string | TextKey) => (k ? t(k as TextKey) || (k as string) : '');
  const lastPickedRef = useRef<string | null>(lastRandomId ?? null);

  // Content order: sort by `order` ascending; ties break by id.
  const sortedGames = [...games].sort((a, b) =>
    a.order !== b.order ? a.order - b.order : a.id.localeCompare(b.id)
  );

  const handleRandomPress = () => {
    if (sortedGames.length === 0) return;
    const ids = sortedGames.map((g) => g.id);
    const pickedId = pickRandomGame(ids, lastPickedRef.current);
    if (!pickedId) return;
    lastPickedRef.current = pickedId;

    if (onOpenRandom) {
      onOpenRandom(pickedId);
    } else {
      onOpenGame(pickedId, { from: 'random' });
    }
  };

  const header = (
    <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
      <Text className="shrink font-display text-title text-ink" accessibilityRole="header">
        {t('games.title')}
      </Text>
      <Button label={t('games.back')} tone="secondary" onPress={onBack} testID="games-back-button" />
    </View>
  );

  return (
    <Screen header={header}>
      {/* 1. Random game button first at the top */}
      <View className="w-full mb-4">
        <Button
          label={t('games.randomButton')}
          tone="primary"
          onPress={() => handlePress(handleRandomPress)}
          testID="games-random-button"
          accessibilityLabel={t('games.random')}
        />
      </View>

      {/* 2. List of games in content order */}
      {sortedGames.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <Text className="text-body text-inkMuted">{t('games.empty')}</Text>
        </View>
      ) : (
        <View className="w-full">
          {sortedGames.map((game) => {
            const hasAccess = canSeeGame(game, isPlus);
            const firstImage = game.images?.[0];
            const durationLabel = game.minutes
              ? t('games.duration').replace('{minutes}', String(game.minutes))
              : null;
            const difficultyKey = game.difficulty
              ? (`games.difficulty.${game.difficulty}` as const)
              : null;
            const difficultyLabel = difficultyKey ? t(difficultyKey) : null;

            return (
              <Pressable
                key={game.id}
                testID="game-row"
                accessibilityRole="button"
                accessibilityLabel={tr(game.title)}
                onPress={() => handlePress(() => onOpenGame(game.id, { from: 'list' }))}
                style={{ marginBottom: theme.space[3], minHeight: theme.size.touchMin }}
              >
                <Panel>
                  <View className="flex-row items-center" style={{ gap: theme.space[3] }}>
                    {/* Thumbnail */}
                    {firstImage && (
                      <View
                        style={{
                          width: 80,
                          height: 45,
                          borderRadius: theme.radius.md,
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <ContentPicture
                          t={t}
                          art={firstImage.file}
                          itemPath={`games/${game.id}`}
                          style={{ width: '100%', height: '100%' }}
                        />
                      </View>
                    )}

                    {/* Info */}
                    <View className="flex-1 justify-center">
                      <View className="flex-row items-center justify-between">
                        <Text className="shrink font-display text-body font-bold text-ink">
                          {tr(game.title)}
                        </Text>
                        {!hasAccess && (
                          <View testID="game-plus-badge">
                            <Badge label={t('games.plusLock')} tone="accent" />
                          </View>
                        )}
                      </View>

                      {/* Meta badges: duration & difficulty */}
                      {(durationLabel || difficultyLabel) && (
                        <View
                          className="flex-row items-center mt-1 flex-wrap"
                          style={{ gap: theme.space[1] }}
                        >
                          {durationLabel && (
                            <Text className="text-caption text-inkMuted">{durationLabel}</Text>
                          )}
                          {durationLabel && difficultyLabel && (
                            <Text className="text-caption text-inkMuted">•</Text>
                          )}
                          {difficultyLabel && (
                            <Text className="text-caption text-inkMuted">{difficultyLabel}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </View>
                </Panel>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}
