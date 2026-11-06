import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { Badge, Raised } from './components';
import { ContentPicture } from './ContentPicture';
import { theme, usePalette } from './theme';

/** The 16:9 picture of Lesson art: a bundled illustration, an inline scene or a remote address; broken or unknown falls back to the themed placeholder. */
export function LessonPicture({ t, art, itemPath }: { t: Translate; art: string; itemPath?: string }) {
  return <ContentPicture t={t} art={art} itemPath={itemPath} />;
}

/** A Lesson image block: the picture, its type badge and the caption. */
export function LessonImage({ t, block }: { t: Translate; block: Extract<LessonBlock, { type: 'image' }> }) {
  const color = usePalette();
  return (
    <View className="mt-4" accessible accessibilityRole="image" accessibilityLabel={`${t(block.alt)}. ${t(block.caption)}`}>
      <Raised fill={color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        <LessonPicture t={t} art={block.art} />
        <View className="flex-row flex-wrap items-center gap-2 p-3">
          <Badge label={t('media.badge.image')} />
          <Text className="text-body text-inkMuted" style={{ flexBasis: '100%' }}>{t(block.caption)}</Text>
        </View>
      </Raised>
    </View>
  );
}
