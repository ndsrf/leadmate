import { useEffect, type RefObject } from 'react';
import { AppState } from 'react-native';
import type { WebView } from 'react-native-webview';
import { PAUSE_MEDIA_JS } from './media';

/**
 * Pauses the media playing in `webView` when the app goes to the background. Android keeps WebView media playing
 * there otherwise; the media stays paused on return until the user plays it again. A brief iOS `inactive` (Control
 * Center, a system dialog) leaves it playing.
 */
export function usePauseMediaInBackground(webView: RefObject<WebView | null>): void {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => state === 'background' && webView.current?.injectJavaScript(PAUSE_MEDIA_JS));
    return () => sub.remove();
  }, [webView]);
}
