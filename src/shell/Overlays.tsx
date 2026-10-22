import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../i18n';
import { GameButton, Panel } from './ui/components';
import type { ButtonVariant } from './ui/styles';
import { color } from './ui/theme';

/** The shell's standard button, drawn by the game kit; `secondary` sits beside a primary, `quiet` is a link. */
export function Button({ label, onPress, tone = 'primary', disabled }: { label: string; onPress: () => void; tone?: ButtonVariant; disabled?: boolean }) {
  return <GameButton label={label} onPress={onPress} variant={tone} disabled={disabled} />;
}

export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-ink/70 p-4">
      <Panel className="max-h-full w-full max-w-sm">{children}</Panel>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-4 py-2" style={{ borderBottomWidth: 2, borderStyle: 'dashed', borderColor: color.edge }}>
      <Text className="flex-1 text-body text-inkMuted">{label}</Text>
      <Text className="shrink text-right font-display text-body text-ink">{value}</Text>
    </View>
  );
}

export function ResumeOverlay({ t, onResume, onExit }: { t: Translate; onResume: () => void; onExit: () => void }) {
  return (
    <Backdrop>
      <Text className="font-display text-displayM text-ink">{t('pause.title')}</Text>
      <Button label={t('pause.resume')} onPress={onResume} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
    </Backdrop>
  );
}

export function ErrorOverlay({ t, onRetry }: { t: Translate; onRetry: () => void }) {
  return (
    <Backdrop>
      <Text className="text-bodyL text-ink">{t('error.loadFailed')}</Text>
      <Button label={t('error.retry')} onPress={onRetry} />
    </Backdrop>
  );
}

export function LoadingOverlay({ t }: { t: Translate }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-bg">
      <Text className="font-display text-title text-inkMuted">{t('hud.loading')}</Text>
    </View>
  );
}

/** A one-shot hint over the Stage: it never takes a touch, so play goes on underneath. */
export function HintOverlay({ text }: { text: string }) {
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-16 items-center px-4">
      <Panel className="w-full max-w-md">
        <Text className="text-bodyL text-ink">{text}</Text>
      </Panel>
    </View>
  );
}
