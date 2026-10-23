import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { Badge, Raised } from './components';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { LessonArt, isLessonArt } from './lessonArt';
import { lessonImageKind } from './media';
import { color, theme } from './theme';

/** A Lesson image: bundled art or a remote address; offline, broken or unknown falls back to the themed placeholder. */
export function LessonImage({ t, block }: { t: Translate; block: Extract<LessonBlock, { type: 'image' }> }) {
  const [failed, setFailed] = useState(false);
  const kind = lessonImageKind(block.art, isLessonArt(block.art), failed);
  return (
    <View className="mt-4" accessible accessibilityRole="image" accessibilityLabel={`${t(block.alt)}. ${t(block.caption)}`}>
      <Raised fill={color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        <View style={{ aspectRatio: 16 / 9, width: '100%', alignItems: 'center', justifyContent: 'center' }}>
          {kind === 'art' && isLessonArt(block.art) && <LessonArt name={block.art} width={640} />}
          {kind === 'remote' && <Image source={{ uri: block.art }} onError={() => setFailed(true)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
          {kind === 'placeholder' && (
            <>
              <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
              <Text className="mt-2 text-caption text-inkMuted">{t(failed ? 'media.unavailable' : 'media.pending')}</Text>
            </>
          )}
        </View>
        <View className="flex-row flex-wrap items-center gap-2 p-3">
          <Badge label={t('media.badge.image')} />
          {block.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
          <Text className="text-body text-inkMuted" style={{ flexBasis: '100%' }}>{t(block.caption)}</Text>
        </View>
      </Raised>
    </View>
  );
}
