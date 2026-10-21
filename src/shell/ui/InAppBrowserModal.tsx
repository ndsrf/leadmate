import { useState } from 'react';
import { Modal, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { browserNext, isWebUrl, type BrowserState } from './media';
import { color } from './theme';

/**
 * A slide-over for a web-hosted full guide. The Primer card stays where it was underneath, so closing
 * returns straight to it; offline or unreachable shows a notice with a retry and never blocks the lesson.
 */
export function InAppBrowserModal({ t, url, onClose }: { t: Translate; url: string; onClose: () => void }) {
  const [state, setState] = useState<BrowserState>(isWebUrl(url) ? 'loading' : 'offline');
  const [attempt, setAttempt] = useState(0);
  const openable = isWebUrl(url);
  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-bg p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-display text-lg text-ink">{t('browser.title')}</Text>
          <Button label={t('browser.close')} tone="quiet" onPress={onClose} />
        </View>
        {state === 'offline' || !openable ? (
          <View className="rounded-game-lg bg-warn p-4">
            <Text className="text-base text-onWarn">{t('browser.offline')}</Text>
            {openable && (
              <Button
                label={t('browser.retry')}
                onPress={() => {
                  setState((s) => browserNext(s, 'retry'));
                  setAttempt((n) => n + 1);
                }}
              />
            )}
          </View>
        ) : (
          <WebView
            key={attempt}
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
