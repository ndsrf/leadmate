import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { SCORE_WEIGHTS, type SimulationDebriefPayload } from '../../sim/payload';
import type { Celebration } from '../celebrations';
import type { DailyCompletion } from '../daily';
import { Button, Row } from '../Overlays';
import { CelebrationList } from '../ui/CelebrationList';
import { Panel } from '../ui/components';
import { useReveal } from '../ui/useReveal';
import { Screen } from './Screen';

/** Result of a Daily Stage: the 0-1000 score counting up and what it is made of, the day's best, and replay. */
export function DailyResultScreen({
  t,
  payload,
  completion,
  celebrations,
  onReplay,
  onDone,
}: {
  t: Translate;
  payload: SimulationDebriefPayload;
  completion: DailyCompletion;
  /** Computed once when the result opened (new best, Streak day), then only displayed. */
  celebrations: readonly Celebration[];
  onReplay: () => void;
  onDone: () => void;
}) {
  const share = (part: number, of: number) => `${Math.round(part)} / ${of}`;
  const reveal = useReveal({ score: payload.handlingScore, stars: 0 });
  const { phase, scoreShown } = reveal.state;
  const showRows = phase === 'rows' || phase === 'done';
  return (
    <Screen>
      <Text className="mb-1 font-display text-xl text-ink">{t('daily.result.title')}</Text>
      <Text className="mb-3 text-sm text-inkDim">{completion.date}</Text>
      <Pressable onPress={reveal.skip} disabled={phase === 'done'} accessibilityLabel={phase === 'done' ? undefined : t('reveal.skip')}>
        <Panel className="mb-3 items-center">
          <Text className="text-xs uppercase text-inkDim">{t('daily.result.score')}</Text>
          <Text className="font-display text-5xl text-ink">{String(scoreShown ?? 0)}</Text>
          <Text className="text-sm text-inkDim">{t('results.scoreOutOf')}</Text>
          {phase !== 'done' && <Text className="mt-2 text-xs text-inkDim">{t('reveal.skip')}</Text>}
        </Panel>
      </Pressable>
      {phase === 'done' && <CelebrationList t={t} celebrations={celebrations} />}
      {showRows && (
        <View>
          <Row label={t('daily.result.best')} value={String(completion.best)} />
          <Row label={t('daily.result.composure')} value={share(((100 - payload.peakArousalScore) / 100) * SCORE_WEIGHTS.composure, SCORE_WEIGHTS.composure)} />
          <Row label={t('daily.result.slack')} value={`${payload.slackPercentage}%`} />
          <Row label={t('daily.result.marker')} value={payload.markerAccuracyMs === undefined ? t('results.markerAccuracyNone') : `${payload.markerAccuracyMs} ${t('results.ms')}`} />
          <Row label={t('daily.result.sintonia')} value={`${payload.sintoniaTimeSeconds} ${t('results.seconds')}`} />
          <Text className="mt-3 text-xs text-inkDim">{t('daily.result.noProgress')}</Text>
          <Button label={t('daily.playAgain')} onPress={onReplay} />
          <Button label={t('daily.result.done')} tone="quiet" onPress={onDone} />
        </View>
      )}
    </Screen>
  );
}
