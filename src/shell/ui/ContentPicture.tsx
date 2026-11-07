import { useEffect, useState } from 'react';
import { Image, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Translate } from '../../i18n';
import { MediaResolver, type MediaResolveResult } from '../content/mediaResolver';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { LessonArt, isLessonArt } from './lessonArt';
import { usePalette } from './theme';

export interface ContentPictureProps {
  t: Translate;
  art: string;
  itemPath?: string;
  channel?: 'beta' | 'stable';
  style?: StyleProp<ViewStyle>;
  resolver?: MediaResolver;
}

/**
 * Universal content picture component.
 * Displays local/bundled images or inline SVG art. If the image is not yet downloaded,
 * displays the themed placeholder, requests the file in the background, and replaces
 * the placeholder when the file arrives.
 */
export function ContentPicture({ t, art, itemPath, channel, style, resolver }: ContentPictureProps) {
  const color = usePalette();
  const res = resolver ?? MediaResolver.getInstance();

  const [state, setState] = useState<MediaResolveResult>({
    kind: 'placeholder',
    isPending: true,
  });

  useEffect(() => {
    let active = true;

    res
      .resolveImage(art, {
        itemPath,
        channel,
        onDownloaded: (uri) => {
          if (active) {
            setState({
              kind: 'local',
              uri,
              source: { uri },
            });
          }
        },
      })
      .then((initial) => {
        if (active) {
          setState(initial);
        }
      });

    return () => {
      active = false;
    };
  }, [art, itemPath, channel, res]);

  return (
    <View
      style={[
        {
          aspectRatio: 16 / 9,
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: color.surfaceSunken,
        },
        style,
      ]}
    >
      {state.kind === 'bundled' && state.source && (
        <Image source={state.source} style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      )}
      {state.kind === 'local' && state.source && (
        <Image source={state.source} testID="content-image" style={{ width: '100%', height: '100%' }} resizeMode="contain" />
      )}
      {state.kind === 'inline' && state.name && isLessonArt(state.name) && (
        <LessonArt name={state.name} width={640} />
      )}
      {state.kind === 'placeholder' && (
        <View testID="content-placeholder" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <CanineMinigameAvatar t={t} posture="calm_sphinx_on_mat" />
          <Text className="mt-2 text-caption text-inkMuted">
            {t(state.failed ? 'media.unavailable' : 'media.pending')}
          </Text>
        </View>
      )}
    </View>
  );
}
