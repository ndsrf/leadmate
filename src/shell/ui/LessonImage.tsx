import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { LESSON_ART } from '../lessons/lessonArtRegistry';
import { Badge, Raised } from './components';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { LessonArt, isLessonArt } from './lessonArt';
import { lessonImageKind } from './media';
import { theme, usePalette } from './theme';

/** The 16:9 picture of Lesson art: a bundled illustration, an inline scene or a remote address; broken or unknown falls back to the themed placeholder. */
export function LessonPicture({ t, art }: { t: Translate; art: string }) {
  const color = usePalette();
  const [failed, setFailed] = useState(false);
  const kind = lessonImageKind(art, { bundled: art in LESSON_ART, inline: isLessonArt(art) }, failed);
  return (
    <View style={{ aspectRatio: 16 / 9, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: color.surfaceSunken }}>
      {kind === 'bundled' && <Image source={LESSON_ART[art]} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
      {kind === 'art' && isLessonArt(art) && <LessonArt name={art} width={640} />}
      {kind === 'remote' && <Image source={{ uri: art }} onError={() => setFailed(true)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
      {kind === 'placeholder' && (
        <>
          <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
          <Text className="mt-2 text-caption text-inkMuted">{t(failed ? 'media.unavailable' : 'media.pending')}</Text>
        </>
      )}
    </View>
  );
}

/** A Lesson image block: the picture, its type badge, the placeholder badge when provisional, and the caption. */
export function LessonImage({ t, block }: { t: Translate; block: Extract<LessonBlock, { type: 'image' }> }) {
  const color = usePalette();
  return (
    <View className="mt-4" accessible accessibilityRole="image" accessibilityLabel={`${t(block.alt)}. ${t(block.caption)}`}>
      <Raised fill={color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        <LessonPicture t={t} art={block.art} />
        <View className="flex-row flex-wrap items-center gap-2 p-3">
          <Badge label={t('media.badge.image')} />
          {block.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
          <Text className="text-body text-inkMuted" style={{ flexBasis: '100%' }}>{t(block.caption)}</Text>
        </View>
      </Raised>
    </View>
  );
}
