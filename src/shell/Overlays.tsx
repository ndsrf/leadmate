import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../i18n';

export function Button({ label, onPress, tone = 'primary' }: { label: string; onPress: () => void; tone?: 'primary' | 'quiet' }) {
  const style = tone === 'primary' ? 'bg-green-500 active:bg-green-600' : 'bg-slate-600 active:bg-slate-500';
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className={`mt-4 items-center rounded-lg px-6 py-3 ${style}`}>
      <Text className={`text-base font-semibold ${tone === 'primary' ? 'text-green-950' : 'text-white'}`}>{label}</Text>
    </Pressable>
  );
}

export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-slate-900/85 p-4">
      <View className="max-h-full w-full max-w-sm rounded-xl bg-slate-800 p-5">{children}</View>
    </View>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-0.5">
      <Text className="flex-1 text-sm text-slate-200">{label}</Text>
      <Text className="text-sm font-bold text-white">{value}</Text>
    </View>
  );
}

export function ResumeOverlay({ t, onResume, onExit }: { t: Translate; onResume: () => void; onExit: () => void }) {
  return (
    <Backdrop>
      <Text className="text-xl font-bold text-white">{t('pause.title')}</Text>
      <Button label={t('pause.resume')} onPress={onResume} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
    </Backdrop>
  );
}

export function ErrorOverlay({ t, onRetry }: { t: Translate; onRetry: () => void }) {
  return (
    <Backdrop>
      <Text className="text-base text-white">{t('error.loadFailed')}</Text>
      <Button label={t('error.retry')} onPress={onRetry} />
    </Backdrop>
  );
}

export function LoadingOverlay({ t }: { t: Translate }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-slate-900">
      <Text className="text-base text-slate-300">{t('hud.loading')}</Text>
    </View>
  );
}

/** A one-shot hint over the Stage: it never takes a touch, so play goes on underneath. */
export function HintOverlay({ text }: { text: string }) {
  return (
    <View pointerEvents="none" className="absolute inset-x-0 top-16 items-center px-4">
      <View className="w-full max-w-md rounded-xl bg-slate-800/90 p-4">
        <Text className="text-base text-white">{text}</Text>
      </View>
    </View>
  );
}
