import { Modal, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';

/** Web: react-native-webview has no web build, so the full guide is only offered in the mobile app. */
export function InAppBrowserModal({ t, onClose }: { t: Translate; url: string; onClose: () => void }) {
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-bg p-4">
        <Text className="font-display text-lg text-ink">{t('browser.title')}</Text>
        <View className="my-3 rounded-game-lg bg-warn p-4">
          <Text className="text-base text-onWarn">{t('browser.unsupported')}</Text>
        </View>
        <Button label={t('browser.close')} tone="quiet" onPress={onClose} />
      </View>
    </Modal>
  );
}
