import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../i18n';
import { GameButton } from './ui/components';

/** The shell's standard button, drawn by the game kit; `quiet` is the secondary look. */
export function Button({ label, onPress, tone = 'primary', disabled }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet'; disabled?: boolean }) {
  return <GameButton label={label} onPress={onPress} variant={tone} disabled={disabled} />;
}

export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-overlay/85 p-4">
      <View className="max-h-full w-full max-w-sm rounded-game-lg bg-surface p-5">{children}</View>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-0.5">
      <Text className="flex-1 text-sm text-inkMuted">{label}</Text>
      <Text className="shrink text-right text-sm font-bold text-ink">{value}</Text>
    </View>
  );
}

export function ResumeOverlay({ t, onResume, onExit }: { t: Translate; onResume: () => void; onExit: () => void }) {
  return (
    <Backdrop>
      <Text className="font-display text-xl text-ink">{t('pause.title')}</Text>
      <Button label={t('pause.resume')} onPress={onResume} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
    </Backdrop>
  );
}

export function ErrorOverlay({ t, onRetry }: { t: Translate; onRetry: () => void }) {
  return (
    <Backdrop>
      <Text className="text-base text-ink">{t('error.loadFailed')}</Text>
      <Button label={t('error.retry')} onPress={onRetry} />
    </Backdrop>
  );
}

export function LoadingOverlay({ t }: { t: Translate }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-bg">
      <Text className="text-base text-inkMuted">{t('hud.loading')}</Text>
    </View>
  );
}

/** A one-shot hint over the Stage: it never takes a touch, so play goes on underneath. */
export function HintOverlay({ text }: { text: string }) {
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-16 items-center px-4">
      <View className="w-full max-w-md rounded-game-lg bg-surface/90 p-4">
        <Text className="text-base text-ink">{text}</Text>
      </View>
    </View>
  );
}
