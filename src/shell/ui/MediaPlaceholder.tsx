import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { LESSON_ART } from '../lessons/lessonArtRegistry';
import type { NodeMedia } from '../nodes/node';
import { Badge } from './components';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { mediaDisplay, placeholderReason } from './media';

/**
 * A Primer card's media: bundled Lesson art when it names some, the image when it has one and it loads, otherwise a canine-themed placeholder
 * with the media type badge and the caption, so the card keeps its layout offline or while pending.
 * A video shows its placeholder too; it plays from the full guide.
 */
export function MediaPlaceholder({ t, media }: { t: Translate; media: NodeMedia }) {
  const [failed, setFailed] = useState(false);
  const bundled = media.art !== undefined && media.art in LESSON_ART;
  const display = media.type === 'image' ? mediaDisplay(media, failed, bundled) : 'placeholder';
  return (
    <View className="mt-4 overflow-hidden rounded-game-lg bg-surfaceSunken">
      {display === 'bundled' && media.art !== undefined ? (
        <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
          <Image source={LESSON_ART[media.art]} accessibilityLabel={t(media.caption)} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
        </View>
      ) : display === 'media' ? (
        <Image source={{ uri: media.url }} accessibilityLabel={t(media.caption)} onError={() => setFailed(true)} style={{ width: '100%', height: 160 }} resizeMode="cover" />
      ) : (
        <View className="items-center justify-center py-4" style={{ minHeight: 160 }}>
          <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
          <Text className="mt-2 text-caption text-inkMuted">{t(placeholderReason(media, failed) === 'unavailable' ? 'media.unavailable' : 'media.pending')}</Text>
        </View>
      )}
      <View className="flex-row items-center gap-2 p-3">
        <Badge label={t(media.type === 'video' ? 'media.badge.video' : 'media.badge.image')} />
        <Text className="flex-1 text-body text-inkMuted">{t(media.caption)}</Text>
      </View>
    </View>
  );
}
