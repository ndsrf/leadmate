import { useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { SimulationDebriefPayload } from '../../sim/payload';
import { Button, Row } from '../Overlays';
import { Badge, Choice, OptionCard, Panel, ProgressBar, StarRow } from '../ui/components';
import { InAppBrowserModal } from '../ui/InAppBrowserModal';
import { MediaPlaceholder } from '../ui/MediaPlaceholder';
import { CelebrationList } from '../ui/CelebrationList';
import { useReveal } from '../ui/useReveal';
import { useTicker } from '../ui/useTicker';
import type { Celebration } from '../celebrations';
import { starsFor, type Stars } from '../stars';
import { checkpointLimit, pickExercise, primerCardOf, type NodeRun } from '../nodes/node';
import type { CheckpointSeconds } from '../dogRecord';
import { DIARY_OUTCOMES, type DiaryOutcome } from '../streak';
import { Screen } from './Screen';

export function PrimerScreen({ t, run, onNext, onExit }: { t: Translate; run: NodeRun; onNext: () => void; onExit: () => void }) {
  const total = run.node.primerCards.length;
  const card = primerCardOf(run.node.primerCards[run.card]);
  const [guideOpen, setGuideOpen] = useState(false);
  return (
    <Screen>
      <ProgressBar value={run.card + 1} max={total} className="mb-3" />
      <Badge label={t(run.node.title)} tone="info" />
      <Panel className="my-4 min-h-40 justify-center">
        <Badge label={t(`primer.kind.${card.kind}`)} tone={card.kind === 'real-world' ? 'info' : 'quiet'} />
        <Text className="mt-3 text-bodyL text-ink">{t(card.text)}</Text>
        {card.media && <MediaPlaceholder key={`${run.node.id}:${run.card}`} t={t} media={card.media} />}
        {card.tutorialUrl && <Button label={t('primer.openGuide')} tone="quiet" onPress={() => setGuideOpen(true)} />}
      </Panel>
      <Text className="text-center font-display text-label text-inkMuted">{`${run.card + 1} / ${total}`}</Text>
      <Button label={t('node.next')} onPress={onNext} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
      {guideOpen && card.tutorialUrl && <InAppBrowserModal t={t} url={card.tutorialUrl} onClose={() => setGuideOpen(false)} />}
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
      <View className="flex-row items-center justify-between">
        <Badge label={t('node.checkpoint.title')} tone="warn" />
        {left !== null && <Text className="font-display text-label text-ink">{`${Math.ceil(left)} ${t('node.checkpoint.seconds')}`}</Text>}
      </View>
      {left !== null && limit !== null && <ProgressBar className="my-2" tone="accent" value={Math.max(0, left)} max={limit} />}
      <Text className="my-4 font-display text-displayM text-ink">{t(run.node.checkpoint.question)}</Text>
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
      <Text className="mt-1 text-caption text-inkMuted">{t('results.peakArousalHint')}</Text>
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
    <Panel className="mt-4">
      <Text className="font-display text-label text-inkMuted">{t('diary.title')}</Text>
      <Text className="mt-1 text-body text-ink">{t('diary.question')}</Text>
      <View className="mt-1 flex-row flex-wrap">
        {DIARY_OUTCOMES.map((outcome) => (
          <Choice key={outcome} label={t(DIARY_KEYS[outcome])} selected={chosen === outcome} onPress={() => onChoose(outcome)} />
        ))}
      </View>
      {chosen && <Text className="mt-2 text-caption text-brandText">{t('diary.saved')}</Text>}
    </Panel>
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
  const score = result.kind === 'stage' ? result.payload.handlingScore : result.handlingScore;
  // the Harness Ritual and the Doorbell Mat report the share of right actions, not Postes or timed marks
  const actionMinigame = run.node.simulation.minigame === 'harness-ritual' || run.node.simulation.minigame === 'doorbell-mat';
  const earned = starsFor(score);
  const reveal = useReveal({ score, stars: earned });
  const { phase, scoreShown, starsShown } = reveal.state;
  const revealing = phase !== 'done';
  const showRows = phase === 'rows' || phase === 'done';
  return (
    <Screen>
      <Pressable onPress={reveal.skip} disabled={!revealing} accessibilityLabel={revealing ? t('reveal.skip') : undefined}>
        <Text className="mb-3 font-display text-displayM text-ink">{t('results.title')}</Text>
        {run.checkpoint && <Text className="mb-2 text-body text-inkMuted">{t(`results.checkpoint.${run.checkpoint}`)}</Text>}
        <Panel className="mb-3 items-center">
          {score !== undefined ? (
            <>
              <Text className="font-display text-numeric text-ink">{String(scoreShown ?? 0)}</Text>
              <Text className="text-body text-inkMuted">{t('results.scoreOutOf')}</Text>
            </>
          ) : (
            <Text className="mb-2 text-center text-body text-inkMuted">{t('reveal.noScore')}</Text>
          )}
          <View className="mt-2">
            <StarRow stars={starsShown} size={36} label={`${earned} ${t('map.starsOf3')}`} />
          </View>
          {revealing && <Text className="mt-2 text-caption text-inkMuted">{t('reveal.skip')}</Text>}
          {!revealing && best > earned && (
            <View className="mt-2 flex-row items-center" style={{ gap: 6 }}>
              <Text className="text-body text-inkMuted">{t('reveal.best')}</Text>
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
              <Panel className="mb-1">
                <StageRows t={t} p={result.payload} />
              </Panel>
              {result.payload.harshStops > 0 && <Text className="mt-3 text-body text-ink">{t('results.harshStopNote')}</Text>}
              <Text className="mt-3 text-caption text-inkMuted">{t('results.equipmentNote')}</Text>
            </>
          ) : (
            <>
              {result.metrics.poste !== undefined && <Row label={t(actionMinigame ? 'results.minigame.beats' : 'results.minigame.poste')} value={`${Math.round(result.metrics.poste * 100)}%`} />}
              {result.metrics.timing !== undefined && <Row label={t(actionMinigame ? 'results.minigame.beats' : 'results.minigame.timing')} value={`${Math.round(result.metrics.timing * 100)}%`} />}
              {result.metrics.tension !== undefined && <Row label={t(actionMinigame ? 'results.minigame.calmChoices' : 'results.minigame.tension')} value={`${Math.round(result.metrics.tension * 100)}%`} />}
            </>
          )}
          <Panel tone="warn" className="mt-4">
            <Text className="font-display text-label text-ink">{t('results.exercise')}</Text>
            <Text className="mt-1 text-bodyL text-ink">{t(exercise.key)}</Text>
          </Panel>
          <WalkDiaryBar t={t} chosen={diary} onChoose={onDiary} />
          {showPosteLink && (
            <Panel tone="info" className="mt-4">
              <Text className="text-body text-ink">{t('results.posteHint')}</Text>
              <Button label={t('results.posteLink')} onPress={onPosteLink} />
            </Panel>
          )}
          <Button label={t('results.playAgain')} onPress={onPlayAgain} />
          <Button label={t('results.continue')} tone="secondary" onPress={onDone} />
        </>
      )}
    </Screen>
  );
}
