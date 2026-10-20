import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { SimulationDebriefPayload } from '../../sim/payload';
import { Button, Row } from '../Overlays';
import { Choice, OptionCard, Panel, ProgressBar, StarRow } from '../ui/components';
import { CelebrationList } from '../ui/CelebrationList';
import { useReveal } from '../ui/useReveal';
import { useTicker } from '../ui/useTicker';
import type { Celebration } from '../celebrations';
import { starsFor, type Stars } from '../stars';
import { checkpointLimit, pickExercise, type NodeRun } from '../nodes/node';
import type { CheckpointSeconds } from '../dogRecord';
import { DIARY_OUTCOMES, type DiaryOutcome } from '../streak';
import { Screen } from './Screen';

export function PrimerScreen({ t, run, onNext, onExit }: { t: Translate; run: NodeRun; onNext: () => void; onExit: () => void }) {
  const total = run.node.primerCards.length;
  return (
    <Screen>
      <Text className="mb-1 text-sm text-inkDim">{t(run.node.title)}</Text>
      <View className="my-4 min-h-40 justify-center rounded-game-lg bg-surface p-6">
        <Text className="text-xl text-ink">{t(run.node.primerCards[run.card])}</Text>
      </View>
      <Text className="text-center text-sm text-inkDim">{`${run.card + 1} / ${total}`}</Text>
      <Button label={t('node.next')} onPress={onNext} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
    </Screen>
  );
}

/** Counts down in whole tenths; the answer only feeds the Debrief, so a timeout never blocks anything. */
export function CheckpointScreen({
  t,
  run,
  setting,
  onAnswer,
  onTimeout,
}: {
  t: Translate;
  run: NodeRun;
  setting: CheckpointSeconds;
  onAnswer: (option: number) => void;
  onTimeout: () => void;
}) {
  const limit = checkpointLimit(setting);
  const [left, setLeft] = useState<number | null>(limit);
  const elapsed = useRef(0);
  const timedOut = useRef(false);
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;

  // counts only while the app is in the foreground, so backgrounding does not eat the time
  useTicker(limit !== null && !timedOut.current, 100, (dt) => {
    elapsed.current += dt;
    const remaining = limit! - elapsed.current;
    if (remaining <= 0) {
      timedOut.current = true;
      timeout.current();
    } else setLeft(remaining);
  });

  return (
    <Screen>
      <Text className="mb-1 text-sm text-inkDim">{t('node.checkpoint.title')}</Text>
      {left !== null && limit !== null && <ProgressBar className="my-2" tone="accent" value={Math.max(0, left)} max={limit} />}
      {left !== null && <Text className="text-right text-xs text-inkDim">{`${Math.ceil(left)} ${t('node.checkpoint.seconds')}`}</Text>}
      <Text className="my-4 text-xl font-semibold text-ink">{t(run.node.checkpoint.question)}</Text>
      {run.node.checkpoint.options.map((option, i) => (
        <OptionCard key={option.text} label={t(option.text)} onPress={() => onAnswer(i)} />
      ))}
    </Screen>
  );
}

function StageRows({ t, p }: { t: Translate; p: SimulationDebriefPayload }) {
  return (
    <>
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
      <Row label={t('results.followMarks')} value={String(p.followMarks)} />
      <Row label={t('results.posteSuccesses')} value={String(p.posteSuccesses)} />
      <Row label={t('results.harshStops')} value={String(p.harshStops)} />
      <Row label={t('results.marks')} value={`${p.marksUsed} / ${p.markBudget}`} />
      <Row label={t('results.score')} value={`${p.handlingScore} ${t('results.scoreOutOf')}`} />
      <Row label={t('results.peakArousal')} value={`${p.peakArousalScore} / 100`} />
      <Text className="mt-1 text-xs text-inkDim">{t('results.peakArousalHint')}</Text>
      {p.sintoniaTimeSeconds > 0 && <Row label={t('results.sintonia')} value={`${p.sintoniaTimeSeconds} ${t('results.seconds')}`} />}
      {p.goSniffs > 0 && <Row label={t('results.goSniffs')} value={String(p.goSniffs)} />}
      <Row label={t('results.seed')} value={String(p.seed)} />
    </>
  );
}

const DIARY_KEYS = { completed: 'diary.completed', struggled: 'diary.struggled', skipped: 'diary.skipped' } as const;

/** The one-tap check-in on the real-world exercise: three answers, each a single press. */
export function WalkDiaryBar({ t, chosen, onChoose }: { t: Translate; chosen: DiaryOutcome | null; onChoose: (outcome: DiaryOutcome) => void }) {
  return (
    <View className="mt-4 rounded-game-lg bg-surface p-4">
      <Text className="text-sm font-semibold text-inkMuted">{t('diary.title')}</Text>
      <Text className="mt-1 text-base text-ink">{t('diary.question')}</Text>
      <View className="mt-1 flex-row flex-wrap">
        {DIARY_OUTCOMES.map((outcome) => (
          <Choice key={outcome} label={t(DIARY_KEYS[outcome])} selected={chosen === outcome} onPress={() => onChoose(outcome)} />
        ))}
      </View>
      {chosen && <Text className="mt-2 text-xs text-brand">{t('diary.saved')}</Text>}
    </View>
  );
}

/** Results, one real-world exercise for the weakest metric, and the Poste link after two failures. */
export function DebriefScreen({
  t,
  run,
  showPosteLink,
  diary,
  onDiary,
  onPosteLink,
  onDone,
  onPlayAgain,
  best,
  celebrations,
}: {
  t: Translate;
  run: NodeRun;
  showPosteLink: boolean;
  /** Today's Walk Diary answer for this Node, if any. */
  diary: DiaryOutcome | null;
  onDiary: (outcome: DiaryOutcome) => void;
  onPosteLink: () => void;
  onDone: () => void;
  onPlayAgain: () => void;
  /** The best stars on the Node after this run, which can be higher than this run's. */
  best: Stars;
  /** Celebrations of this completion, computed once when the Debrief opened. */
  celebrations: readonly Celebration[];
}) {
  const result = run.result;
  if (!result) return null;
  return <DebriefBody t={t} run={run} result={result} showPosteLink={showPosteLink} diary={diary} onDiary={onDiary} onPosteLink={onPosteLink} onDone={onDone} onPlayAgain={onPlayAgain} best={best} celebrations={celebrations} />;
}

function DebriefBody({
  t,
  run,
  result,
  showPosteLink,
  diary,
  onDiary,
  onPosteLink,
  onDone,
  onPlayAgain,
  best,
  celebrations,
}: {
  t: Translate;
  run: NodeRun;
  result: NonNullable<NodeRun['result']>;
  showPosteLink: boolean;
  diary: DiaryOutcome | null;
  onDiary: (outcome: DiaryOutcome) => void;
  onPosteLink: () => void;
  onDone: () => void;
  onPlayAgain: () => void;
  best: Stars;
  celebrations: readonly Celebration[];
}) {
  const exercise = pickExercise(run.node, result);
  const score = result.kind === 'stage' ? result.payload.handlingScore : undefined;
  const earned = starsFor(score);
  const reveal = useReveal({ score, stars: earned });
  const { phase, scoreShown, starsShown } = reveal.state;
  const revealing = phase !== 'done';
  const showRows = phase === 'rows' || phase === 'done';
  return (
    <Screen>
      <Pressable onPress={reveal.skip} disabled={!revealing} accessibilityLabel={revealing ? t('reveal.skip') : undefined}>
        <Text className="mb-3 font-display text-xl text-ink">{t('results.title')}</Text>
        {run.checkpoint && <Text className="mb-2 text-sm text-inkMuted">{t(`results.checkpoint.${run.checkpoint}`)}</Text>}
        <Panel className="mb-3 items-center">
          {score !== undefined ? (
            <>
              <Text className="font-display text-5xl text-ink">{String(scoreShown ?? 0)}</Text>
              <Text className="text-sm text-inkMuted">{t('results.scoreOutOf')}</Text>
            </>
          ) : (
            <Text className="mb-2 text-center text-sm text-inkMuted">{t('reveal.noScore')}</Text>
          )}
          <View className="mt-2">
            <StarRow stars={starsShown} size={36} label={`${earned} ${t('map.starsOf3')}`} />
          </View>
          {revealing && <Text className="mt-2 text-xs text-inkDim">{t('reveal.skip')}</Text>}
          {!revealing && best > earned && (
            <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-sm text-inkMuted">{t('reveal.best')}</Text>
              <StarRow stars={best} size={18} label={`${best} ${t('map.starsOf3')}`} />
            </View>
          )}
        </Panel>
      </Pressable>
      {phase === 'done' && <CelebrationList t={t} celebrations={celebrations} />}
      {showRows && (
        <>
          {result.kind === 'stage' ? (
            <>
              <StageRows t={t} p={result.payload} />
              {result.payload.harshStops > 0 && <Text className="mt-3 text-sm text-accent">{t('results.harshStopNote')}</Text>}
              <Text className="mt-3 text-xs text-inkDim">{t('results.equipmentNote')}</Text>
            </>
          ) : (
            <>
              {result.metrics.poste !== undefined && <Row label={t('results.minigame.poste')} value={`${Math.round(result.metrics.poste * 100)}%`} />}
              {result.metrics.timing !== undefined && <Row label={t('results.minigame.timing')} value={`${Math.round(result.metrics.timing * 100)}%`} />}
              {result.metrics.tension !== undefined && <Row label={t('results.minigame.tension')} value={`${Math.round(result.metrics.tension * 100)}%`} />}
            </>
          )}
          <View className="mt-4 rounded-game-lg bg-surface p-4">
            <Text className="text-sm font-semibold text-inkMuted">{t('results.exercise')}</Text>
            <Text className="mt-1 text-base text-ink">{t(exercise.key)}</Text>
          </View>
          <WalkDiaryBar t={t} chosen={diary} onChoose={onDiary} />
          {showPosteLink && (
            <View className="mt-4 rounded-game-lg bg-warn p-4">
              <Text className="text-sm text-onWarn">{t('results.posteHint')}</Text>
              <Button label={t('results.posteLink')} onPress={onPosteLink} />
            </View>
          )}
          <Button label={t('results.playAgain')} onPress={onPlayAgain} />
          <Button label={t('results.continue')} tone="quiet" onPress={onDone} />
        </>
      )}
    </Screen>
  );
}
