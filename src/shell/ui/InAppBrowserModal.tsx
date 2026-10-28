import { useRef, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { Panel } from './components';
import { browserNext, isWebUrl, type BrowserState } from './media';
import { color } from './theme';
import { usePauseMediaInBackground, type WebViewHandle } from './usePauseMediaInBackground';

/**
 * A slide-over for a web-hosted full guide. The Primer card stays where it was underneath, so closing
 * returns straight to it; offline or unreachable shows a notice with a retry and never blocks the lesson. Media on
 * the page pauses when the app goes to the background.
 */
export function InAppBrowserModal({ t, url, onClose }: { t: Translate; url: string; onClose: () => void }) {
  const [state, setState] = useState<BrowserState>(isWebUrl(url) ? 'loading' : 'offline');
  const [attempt, setAttempt] = useState(0);
  const openable = isWebUrl(url);
  const page = useRef<WebViewHandle>(null);
  usePauseMediaInBackground(page);
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-display text-title text-ink">{t('browser.title')}</Text>
          <Button label={t('browser.close')} tone="secondary" onPress={onClose} />
        </View>
        {state === 'offline' || !openable ? (
          <Panel tone="warn">
            <Text className="text-bodyL text-ink">{t('browser.offline')}</Text>
            {openable && (
              <Button
                label={t('browser.retry')}
                onPress={() => {
                  setState((s) => browserNext(s, 'retry'));
                  setAttempt((n) => n + 1);
                }}
              />
            )}
          </Panel>
        ) : (
          <WebView
            key={attempt}
            ref={page}
            source={{ uri: url }}
            style={{ flex: 1, backgroundColor: color.bg }}
            onLoadEnd={() => setState((s) => browserNext(s, 'loaded'))}
            onError={() => setState((s) => browserNext(s, 'error'))}
            onHttpError={() => setState((s) => browserNext(s, 'error'))}
          />
        )}
      </View>
    </Modal>
  );
}
