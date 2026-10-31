import { useRef } from 'react';
import { WebView } from 'react-native-webview';
import type { Translate } from '../../i18n';
import { isAllowedVideoHost } from './media';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';
import { usePalette } from './theme';
import { usePauseMediaInBackground, type WebViewHandle } from './usePauseMediaInBackground';
import type { TrialState, VideoGatingProps } from '../plus';

/**
 * Native: the embed plays in a WebView that loads only after the tap and never leaves the allow-listed host. It
 * pauses when the app goes to the background.
 */
export function LessonVideo({
  t,
  block,
  gating,
  isPlus,
  trialState,
  onUnlock,
  autoPlay,
}: {
  t: Translate;
  block: VideoBlock;
  gating?: VideoGatingProps;
  isPlus?: boolean;
  trialState?: TrialState;
  onUnlock?: () => void;
  autoPlay?: boolean;
}) {
  const color = usePalette();
  const player = useRef<WebViewHandle>(null);
  usePauseMediaInBackground(player);
  const videoGating: VideoGatingProps = gating ?? { isPlus, trialState, onUnlock, autoPlay };
  return (
    <LessonVideoCard
      t={t}
      block={block}
      gating={videoGating}
      renderPlayer={({ uri, attempt, onLoaded, onError }) => (
        <WebView
          key={attempt}
          ref={player}
          source={{ uri }}
          style={{ flex: 1, backgroundColor: color.outline }}
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
