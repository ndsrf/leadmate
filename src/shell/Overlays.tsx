import { Pressable, ScrollView, Text, View } from 'react-native';
import type { Translate } from '../i18n';
import type { SimulationDebriefPayload } from '../sim/payload';

function Button({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mt-4 items-center rounded-lg bg-green-500 px-6 py-3 active:bg-green-600">
      <Text className="text-base font-semibold text-green-950">{label}</Text>
    </Pressable>
  );
}

function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <View className="absolute inset-0 items-center justify-center bg-slate-900/85 p-4">
      <View className="max-h-full w-full max-w-sm rounded-xl bg-slate-800 p-5">{children}</View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 py-0.5">
      <Text className="flex-1 text-sm text-slate-200">{label}</Text>
      <Text className="text-sm font-bold text-white">{value}</Text>
    </View>
  );
}

export function ResultsScreen({ t, payload, onPlayAgain }: { t: Translate; payload: SimulationDebriefPayload; onPlayAgain: () => void }) {
  const p = payload;
  return (
    <Backdrop>
      <ScrollView>
        <Text className="mb-3 text-xl font-bold text-white">{t('results.title')}</Text>
        <Row label={t('results.duration')} value={`${p.durationSeconds} ${t('results.seconds')}`} />
        <Row label={t('results.slack')} value={`${p.slackPercentage}%`} />
        <Row label={t('results.taut')} value={`${p.tautPercentage}%`} />
        <Row label={t('results.pull')} value={`${p.pullPercentage}%`} />
        <Row
          label={t('results.markerAccuracy')}
          value={p.markerAccuracyMs === undefined ? t('results.markerAccuracyNone') : `${p.markerAccuracyMs} ${t('results.ms')}`}
        />
        <Row label={t('results.hits')} value={String(p.markerHits)} />
        <Row label={t('results.misses')} value={String(p.markerMisses)} />
        <Row label={t('results.reactive')} value={String(p.reactiveMarkers)} />
        <Row label={t('results.missed')} value={String(p.missedOpportunities)} />
        <Row label={t('results.checkIns')} value={String(p.checkInHits)} />
        <Row label={t('results.marks')} value={`${p.marksUsed} / ${p.markBudget}`} />
        <Row label={t('results.seed')} value={String(p.seed)} />
        <Button label={t('results.playAgain')} onPress={onPlayAgain} />
      </ScrollView>
    </Backdrop>
  );
}

export function ResumeOverlay({ t, onResume }: { t: Translate; onResume: () => void }) {
  return (
    <Backdrop>
      <Text className="text-xl font-bold text-white">{t('pause.title')}</Text>
      <Button label={t('pause.resume')} onPress={onResume} />
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
