import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { SCORE_WEIGHTS, type SimulationDebriefPayload } from '../../sim/payload';
import type { DailyCompletion } from '../daily';
import { Button, Row } from '../Overlays';
import { Screen } from './Screen';

/** Result of a Daily Stage: the 0-1000 score and what it is made of, the day's best, and replay. */
export function DailyResultScreen({
  t,
  payload,
  completion,
  onReplay,
  onDone,
}: {
  t: Translate;
  payload: SimulationDebriefPayload;
  completion: DailyCompletion;
  onReplay: () => void;
  onDone: () => void;
}) {
  const share = (part: number, of: number) => `${Math.round(part)} / ${of}`;
  return (
    <Screen>
      <Text className="mb-1 text-xl font-bold text-white">{t('daily.result.title')}</Text>
      <Text className="mb-3 text-sm text-slate-400">{completion.date}</Text>
      <View className="mb-3 items-center rounded-xl bg-slate-800 p-4">
        <Text className="text-xs uppercase text-slate-400">{t('daily.result.score')}</Text>
        <Text className="text-5xl font-bold text-white">{payload.handlingScore}</Text>
        <Text className="text-sm text-slate-400">{t('results.scoreOutOf')}</Text>
        {completion.improved && !completion.firstOfDay && <Text className="mt-2 text-sm text-green-400">{t('daily.result.newBest')}</Text>}
      </View>
      <Row label={t('daily.result.best')} value={String(completion.best)} />
      <Row label={t('daily.result.composure')} value={share(((100 - payload.peakArousalScore) / 100) * SCORE_WEIGHTS.composure, SCORE_WEIGHTS.composure)} />
      <Row label={t('daily.result.slack')} value={`${payload.slackPercentage}%`} />
      <Row label={t('daily.result.marker')} value={payload.markerAccuracyMs === undefined ? t('results.markerAccuracyNone') : `${payload.markerAccuracyMs} ${t('results.ms')}`} />
      <Row label={t('daily.result.sintonia')} value={`${payload.sintoniaTimeSeconds} ${t('results.seconds')}`} />
      {completion.streakCredited && <Text className="mt-3 text-sm text-amber-200">{t('daily.result.streak')}</Text>}
      <Text className="mt-3 text-xs text-slate-400">{t('daily.result.noProgress')}</Text>
      <Button label={t('daily.playAgain')} onPress={onReplay} />
      <Button label={t('daily.result.done')} tone="quiet" onPress={onDone} />
    </Screen>
  );
}
