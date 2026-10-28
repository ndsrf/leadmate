import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import type { Translate } from '../../i18n';
import { isAllowedVideoHost } from './media';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';
import { color } from './theme';
import { usePauseMediaInBackground, type WebViewHandle } from './usePauseMediaInBackground';

/**
 * Native: the embed plays in a WebView that loads only after the tap and never leaves the allow-listed host. It
 * pauses when the app goes to the background.
 */
export function LessonVideo({ t, block }: { t: Translate; block: VideoBlock }) {
  const player = useRef<WebViewHandle>(null);
  usePauseMediaInBackground(player);
  return (
    <LessonVideoCard
      t={t}
      block={block}
      renderPlayer={({ uri, attempt, onLoaded, onError }) => (
        <WebView
          key={attempt}
          ref={player}
          source={{ uri }}
          style={{ flex: 1, backgroundColor: color.ink }}
          originWhitelist={['https://www.youtube-nocookie.com']}
          onShouldStartLoadWithRequest={(request) => isAllowedVideoHost(request.url) || request.url === 'about:blank'}
          allowsInlineMediaPlayback
          allowsFullscreenVideo
          scrollEnabled={false}
          onLoadEnd={onLoaded}
          onError={onError}
          onHttpError={onError}
        />
      )}
    />
  );
}
