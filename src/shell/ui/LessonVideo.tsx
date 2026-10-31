import { useEvent, useEventListener } from 'expo';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useEffect, useRef } from 'react';
import { AppState, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Translate } from '../../i18n';
import { APP_ORIGIN, isAllowedPlayerNavigation, videoEmbedPage } from './media';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';
import { usePalette } from './theme';
import { usePauseMediaInBackground, type WebViewHandle } from './usePauseMediaInBackground';

/**
 * Native: a Lesson Animation plays in `expo-video`, a YouTube video in a WebView. Either is created only after the
 * tap and pauses when the app goes to the background.
 */
export function LessonVideo({ t, block }: { t: Translate; block: VideoBlock }) {
  return (
    <LessonVideoCard
      t={t}
      block={block}
      renderPlayer={({ kind, uri, attempt, onLoaded, onError, onTime }) =>
        kind === 'animation' ? (
          <AnimationPlayer key={attempt} t={t} block={block} uri={uri} onLoaded={onLoaded} onError={onError} onTime={onTime} />
        ) : (
          <YouTubePlayer key={attempt} uri={uri} onLoaded={onLoaded} onError={onError} />
        )
      }
    />
  );
}

/** A Lesson Animation: silent, looping and inline, with no controls; a tap pauses or resumes it. Reports its playback time every 0.1 s for the subtitles. */
function AnimationPlayer({ t, block, uri, onLoaded, onError, onTime }: { t: Translate; block: VideoBlock; uri: string; onLoaded: () => void; onError: () => void; onTime: (seconds: number) => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = true;
    p.timeUpdateEventInterval = 0.1;
    p.play();
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => onTime(currentTime));
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  useEffect(() => {
    if (status === 'readyToPlay') onLoaded();
    if (status === 'error') onError();
  }, [status, onLoaded, onError]);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state === 'background' && player.pause());
    return () => sub.remove();
  }, [player]);
  return (
    <Pressable
      style={{ flex: 1 }}
      accessibilityRole="button"
      accessibilityLabel={t(block.alt)}
      onPress={() => (player.playing ? player.pause() : player.play())}
    >
      <VideoView player={player} style={{ flex: 1 }} nativeControls={false} contentFit="contain" playsInline allowsPictureInPicture={false} pointerEvents="none" />
    </Pressable>
  );
}

/**
 * A YouTube embed. It loads a small page at that origin holding the embed iframe, so YouTube
 * receives an origin and a referrer (ADR 0016); navigation stays on that page and the YouTube host.
 */
function YouTubePlayer({ uri, onLoaded, onError }: { uri: string; onLoaded: () => void; onError: () => void }) {
  const color = usePalette();
  const player = useRef<WebViewHandle>(null);
  usePauseMediaInBackground(player);
  return (
    <WebView
      ref={player}
      source={{ html: videoEmbedPage(uri), baseUrl: APP_ORIGIN }}
      style={{ flex: 1, backgroundColor: color.outline }}
      originWhitelist={['*']}
      onShouldStartLoadWithRequest={(request) => isAllowedPlayerNavigation(request.url)}
      allowsInlineMediaPlayback
      allowsFullscreenVideo
      scrollEnabled={false}
      onLoadEnd={onLoaded}
      onError={onError}
      onHttpError={onError}
    />
  );
}
