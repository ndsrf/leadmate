import { Modal, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { Panel } from './components';

/** Web: react-native-webview has no web build, so the full guide is only offered in the mobile app. */
export function InAppBrowserModal({ t, onClose }: { t: Translate; url: string; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-bg p-4">
        <Text className="font-display text-title text-ink">{t('browser.title')}</Text>
        <Panel tone="warn" className="my-3">
          <Text className="text-bodyL text-ink">{t('browser.unsupported')}</Text>
        </Panel>
        <Button label={t('browser.close')} tone="secondary" onPress={onClose} />
      </View>
    </Modal>
  );
}
