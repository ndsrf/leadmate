import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { TextKey, Translate } from '../../i18n';
import type { SimulationDebriefPayload } from '../../sim/payload';
import { Button, Row } from '../Overlays';
import { Badge, Choice, OptionCard, Panel, ProgressBar, Raised, StarRow, useFocus } from '../ui/components';
import { handlePress } from '../ui/press';
import { ContentPicture } from '../ui/ContentPicture';
import { theme, usePalette } from '../ui/theme';
import { InAppBrowserModal } from '../ui/InAppBrowserModal';
import { MediaPlaceholder } from '../ui/MediaPlaceholder';
import { CelebrationList } from '../ui/CelebrationList';
import { useReveal } from '../ui/useReveal';
import { useTicker } from '../ui/useTicker';
import { useLive } from '../ui/useAppActive';
import { createCountdown } from '../ui/countdown';
import type { Celebration } from '../celebrations';
import { starsFor, type Stars } from '../stars';
import { checkpointLimit, pickExercise, primerCardOf, shuffledOrder, type CheckpointQuestion, type NodeRun } from '../nodes/node';
import { isImageDuelQuestion, type ImageDuelQuestion } from '../nodes/content';
import { readDogSceneOf } from '../nodes/readDog';
import type { CheckpointSeconds } from '../dogRecord';
import { DIARY_OUTCOMES, type DiaryOutcome } from '../streak';
import { Screen } from './Screen';
import { RecommendationCardList } from './RecommendationCard';
import { getActiveContent } from '../content/runtime';
import { DebriefTimelineSection } from './DebriefTimeline';

export function PrimerScreen({
  t,
  run,
  onNext,
  onExit,
  onShop,
}: {
  t: Translate;
  run: NodeRun;
  onNext: () => void;
  onExit: () => void;
  onShop?: (target: { level: 'home' | 'category' | 'subcategory' | 'product'; id?: string }) => void;
}) {
  const total = run.node.primerCards.length;
  const card = primerCardOf(run.node.primerCards[run.card]);
  const [guideOpen, setGuideOpen] = useState(false);
  const activeShop = getActiveContent()?.resolved?.shop;

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
      <RecommendationCardList
        recommendations={run.node.recommendations}
        activeShop={activeShop}
        onOpenShop={onShop}
        t={t}
      />
      <Text className="text-center font-display text-label text-inkMuted">{`${run.card + 1} / ${total}`}</Text>
      <Button label={t('node.next')} onPress={onNext} />
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
      {guideOpen && card.tutorialUrl && <InAppBrowserModal t={t} url={card.tutorialUrl} onClose={() => setGuideOpen(false)} />}
    </Screen>
  );
}

/**
 * One question at a time, with "Pregunta n de N" when there are several. Each question is its own keyed view, so the
 * countdown restarts and the options are reshuffled per question, and the order stays put while it is on screen.
 */
export function CheckpointScreen({
  t,
  run,
  setting,
  onAnswer,
  onTimeout,
  random = Math.random,
}: {
  t: Translate;
  run: NodeRun;
  setting: CheckpointSeconds;
  onAnswer: (option: number) => void;
  onTimeout: () => void;
  random?: () => number;
}) {
  const question = run.node.checkpoint[run.question];
  if (!question) return null;
  const progress = run.node.checkpoint.length > 1 ? t('node.checkpoint.progress').replace('{n}', String(run.question + 1)).replace('{total}', String(run.node.checkpoint.length)) : null;

  if (isImageDuelQuestion(question)) {
    return (
      <ImageDuelQuestionView
        key={`${run.node.id}:${run.question}`}
        t={t}
        question={question}
        progress={progress}
        setting={setting}
        onAnswer={onAnswer}
        onTimeout={onTimeout}
        random={random}
      />
    );
  }

  return (
    <CheckpointQuestionView
      key={`${run.node.id}:${run.question}`}
      t={t}
      question={question}
      progress={progress}
      setting={setting}
      onAnswer={onAnswer}
      onTimeout={onTimeout}
      random={random}
    />
  );
}

/** A check badge in brand green or a cross badge in danger red, matching the Lesson art kit. */
export function DuelVerdictBadge({ verdict }: { verdict: 'check' | 'cross' }) {
  const color = usePalette();
  const isCheck = verdict === 'check';
  return (
    <View
      testID={`duel-badge-${verdict}`}
      aria-hidden
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
      }}
    >
      <Svg width={36} height={36} viewBox="0 0 36 36" aria-hidden>
        <Circle
          cx={18}
          cy={18}
          r={15}
          fill={isCheck ? color.brand : color.danger}
          stroke={color.ink}
          strokeWidth={3}
        />
        <Path
          d={isCheck ? 'M10 18l6 6l11 -12' : 'M12 12l12 12M24 12l-12 12'}
          fill="none"
          stroke={color.ink}
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}

function DuelImageOption({
  t,
  image,
  authoredIndex,
  isAnswered,
  isChosen,
  isCorrect,
  badge,
  onPress,
}: {
  t: Translate;
  image: ImageDuelQuestion['images'][number];
  authoredIndex: number;
  isAnswered: boolean;
  isChosen: boolean;
  isCorrect: boolean;
  badge: 'check' | 'cross' | null;
  onPress: () => void;
}) {
  const color = usePalette();
  const focus = useFocus();

  const baseLabel = t(image.alt);
  const accessibilityLabel = isAnswered
    ? `${baseLabel}. ${isCorrect ? t('node.duel.correct') : t('node.duel.incorrect')}`
    : baseLabel;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{
        disabled: isAnswered,
        ...(isChosen ? { selected: true } : {}),
      }}
      disabled={isAnswered}
      onPress={() => handlePress(onPress, isAnswered)}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      testID={`duel-option-${authoredIndex}`}
      className="mb-3 w-full"
      style={{ width: '100%', minHeight: theme.size.touchMin }}
    >
      {({ pressed }) => (
        <Raised
          fill={pressed && !isAnswered ? color.surfaceSunken : color.surface}
          radius={theme.radius.lg}
          offset={theme.depth.sm.x}
          shift={pressed && !isAnswered ? theme.depth.pressed.translate - 1 : 0}
          focused={focus.focused}
          pressable={!isAnswered}
          faceStyle={{ overflow: 'hidden', width: '100%' }}
        >
          <View style={{ width: '100%', position: 'relative' }}>
            <ContentPicture t={t} art={image.art} itemPath={image.itemPath} />
            {badge !== null && <DuelVerdictBadge verdict={badge} />}
          </View>
        </Raised>
      )}
    </Pressable>
  );
}

/**
 * Renders an Image Duel Checkpoint question: prompt plus two images stacked top/bottom, each tappable.
 * Shuffled top/bottom order per presentation. Before answering, no check, cross or colour hint is shown.
 * After answering (or on timeout), the chosen image and correct image are marked with check/cross badges,
 * the explanation is displayed, and the Next button advances the question.
 */
export function ImageDuelQuestionView({
  t,
  question,
  progress,
  setting,
  onAnswer,
  onTimeout,
  random,
}: {
  t: Translate;
  question: ImageDuelQuestion;
  progress: string | null;
  setting: CheckpointSeconds;
  onAnswer: (option: number) => void;
  onTimeout: () => void;
  random?: () => number;
}) {
  const color = usePalette();
  const limit = checkpointLimit(setting);
  const [left, setLeft] = useState<number | null>(limit === null ? null : Math.ceil(limit));
  const [chosen, setChosen] = useState<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  const isAnswered = chosen !== null || timedOut;

  const countdown = useMemo(
    () =>
      limit === null
        ? null
        : createCountdown(limit, setLeft, () => {
            setLeft(0);
            setTimedOut(true);
          }),
    [limit],
  );

  const order = useMemo(() => shuffledOrder(question.images.length, random), [question, random]);
  const live = useLive();

  // counts only while the app is in the foreground, and only while unanswered
  useTicker(countdown !== null && !countdown.timedOut && !isAnswered, 100, (dt) => countdown?.tick(dt), 'countdown');

  const handleNext = () => {
    if (chosen !== null) {
      onAnswer(chosen);
    } else if (timedOut) {
      onTimeout();
    }
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Badge label={t('node.checkpoint.title')} tone="warn" />
        {progress !== null && <Text className="font-display text-label text-inkMuted">{progress}</Text>}
        {left !== null && <Text className="font-display text-label text-ink">{`${left} ${t('node.checkpoint.seconds')}`}</Text>}
      </View>
      {left !== null && limit !== null && (
        <ProgressBar
          className="my-2"
          tone="accent"
          value={left}
          max={limit}
          runDown={{ live: live && !isAnswered }}
        />
      )}
      <Text className="my-4 font-display text-displayM text-ink">{t(question.question)}</Text>

      <View className="w-full flex-col">
        {order.map((authoredIndex) => {
          const image = question.images[authoredIndex];
          let badge: 'check' | 'cross' | null = null;
          if (isAnswered) {
            if (authoredIndex === question.correct) {
              badge = 'check';
            } else if (authoredIndex === chosen) {
              badge = 'cross';
            }
          }
          return (
            <DuelImageOption
              key={authoredIndex}
              t={t}
              image={image}
              authoredIndex={authoredIndex}
              isAnswered={isAnswered}
              isChosen={authoredIndex === chosen}
              isCorrect={authoredIndex === question.correct}
              badge={badge}
              onPress={() => {
                if (!isAnswered) {
                  setChosen(authoredIndex);
                }
              }}
            />
          );
        })}
      </View>

      {isAnswered && (
        <Panel className="my-3" tone="surface">
          <Text testID="duel-explanation" className="text-bodyL text-ink">{t(question.explanation)}</Text>
        </Panel>
      )}

      {isAnswered && (
        <Button
          label={t('node.next')}
          onPress={handleNext}
          testID="duel-next-button"
        />
      )}
    </Screen>
  );
}

/**
 * Counts down on a 100 ms ticker, which alone decides the timeout; the number and the screen change once a second
 * and the bar runs down smoothly on the UI thread. The answer only feeds the Debrief, so a timeout never blocks anything.
 * Options show in a random order; a press answers with the option's authored index.
 */
function CheckpointQuestionView({
  t,
  question,
  progress,
  setting,
  onAnswer,
  onTimeout,
  random,
}: {
  t: Translate;
  question: CheckpointQuestion;
  progress: string | null;
  setting: CheckpointSeconds;
  onAnswer: (option: number) => void;
  onTimeout: () => void;
  random?: () => number;
}) {
  const limit = checkpointLimit(setting);
  const [left, setLeft] = useState<number | null>(limit === null ? null : Math.ceil(limit));
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;
  const countdown = useMemo(() => (limit === null ? null : createCountdown(limit, setLeft, () => timeout.current())), [limit]);
  const order = useMemo(() => shuffledOrder(question.options.length, random), [question, random]);
  const live = useLive();

  // counts only while the app is in the foreground, so backgrounding does not eat the time
  useTicker(countdown !== null && !countdown.timedOut, 100, (dt) => countdown?.tick(dt), 'countdown');

  return (
    <Screen>
      <View className="flex-row items-center justify-between">
        <Badge label={t('node.checkpoint.title')} tone="warn" />
        {progress !== null && <Text className="font-display text-label text-inkMuted">{progress}</Text>}
        {left !== null && <Text className="font-display text-label text-ink">{`${left} ${t('node.checkpoint.seconds')}`}</Text>}
      </View>
      {left !== null && limit !== null && <ProgressBar className="my-2" tone="accent" value={left} max={limit} runDown={{ live }} />}
      <Text className="my-4 font-display text-displayM text-ink">{t(question.question)}</Text>
      {order.map((i) => (
        <OptionCard key={question.options[i].text} label={t(question.options[i].text)} onPress={() => onAnswer(i)} />
      ))}
    </Screen>
  );
}

/** The score of the Checkpoint and, for each question not answered right, its right answer and why. */
function CheckpointReview({ t, run }: { t: Translate; run: NodeRun }) {
  const asked = run.checkpoint.length;
  if (asked === 0) return null;
  const right = run.checkpoint.filter((a) => a === 'correct').length;
  const missed = run.node.checkpoint.flatMap((question, i) => {
    const answer = run.checkpoint[i];
    return answer && answer !== 'correct' ? [{ question, answer }] : [];
  });
  return (
    <View className="mb-2">
      <Text className="text-body text-inkMuted">{t('results.checkpoint.score').replace('{n}', String(right)).replace('{total}', String(asked))}</Text>
      {missed.map(({ question, answer }) => {
        const correct = question.options.find((o) => o.correct);
        return (
          <Panel key={question.question} className="mt-2">
            <Text className="font-display text-body text-ink">{t(question.question)}</Text>
            {answer === 'missed' && <Text className="mt-1 text-caption text-inkMuted">{t('results.checkpoint.missed')}</Text>}
            {correct && <Text className="mt-1 text-body text-brandText">{t('results.checkpoint.answer').replace('{answer}', t(correct.text))}</Text>}
            <Text className="mt-1 text-body text-ink">{t(question.explanation)}</Text>
          </Panel>
        );
      })}
    </View>
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
      {p.peakTensionRatio !== undefined && <Row label={t('results.peakTensionRatio')} value={p.peakTensionRatio.toFixed(2)} />}
      {p.shieldCoverageScore !== undefined && <Row label={t('results.shieldCoverage')} value={`${Math.round(p.shieldCoverageScore * 100)}%`} />}
      {p.leashHandlingAccuracy !== undefined && p.leashHandlingAccuracy > 0 && <Row label={t('results.leashHandlingAccuracy')} value={`${p.leashHandlingAccuracy} ${t('results.ms')}`} />}
    </>
  );
}

export const DIARY_KEYS = { completed: 'diary.completed', struggled: 'diary.struggled', skipped: 'diary.skipped' } as const;

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

/**
 * Results, one real-world exercise for the weakest metric, the Mission it is practice for, and the Poste link
 * after two failures. The Debrief asks nothing about the real walk: that is the Mission's check-in.
 */
export function DebriefScreen({
  t,
  run,
  showPosteLink,
  mission,
  onPosteLink,
  onDone,
  onPlayAgain,
  best,
  celebrations,
  onShop,
}: {
  t: Translate;
  run: NodeRun;
  showPosteLink: boolean;
  /** The title of the Mission that ends the Node's Stretch, if it has one. */
  mission?: TextKey;
  onPosteLink: () => void;
  onDone: () => void;
  onPlayAgain: () => void;
  /** The best stars on the Node after this run, which can be higher than this run's. */
  best: Stars;
  /** Celebrations of this completion, computed once when the Debrief opened. */
  celebrations: readonly Celebration[];
  onShop?: (target: { level: 'home' | 'category' | 'subcategory' | 'product'; id?: string }) => void;
}) {
  const result = run.result;
  if (!result) return null;
  return <DebriefBody t={t} run={run} result={result} showPosteLink={showPosteLink} mission={mission} onPosteLink={onPosteLink} onDone={onDone} onPlayAgain={onPlayAgain} best={best} celebrations={celebrations} onShop={onShop} />;
}

function DebriefBody({
  t,
  run,
  result,
  showPosteLink,
  mission,
  onPosteLink,
  onDone,
  onPlayAgain,
  best,
  celebrations,
  onShop,
}: {
  t: Translate;
  run: NodeRun;
  result: NonNullable<NodeRun['result']>;
  showPosteLink: boolean;
  mission?: TextKey;
  onPosteLink: () => void;
  onDone: () => void;
  onPlayAgain: () => void;
  best: Stars;
  celebrations: readonly Celebration[];
  onShop?: (target: { level: 'home' | 'category' | 'subcategory' | 'product'; id?: string }) => void;
}) {
  const exercise = pickExercise(run.node, result);
  const score = result.kind === 'stage' || result.kind === 'close_exercise' ? result.payload.handlingScore : result.handlingScore;
  // the read-the-Dog Minigames report the share of right actions, not Postes or timed marks
  const actionMinigame = readDogSceneOf(run.node.simulation.minigame) !== undefined;
  const earned = starsFor(score);
  const reveal = useReveal({ score, stars: earned });
  const { phase, scoreShown, starsShown } = reveal.state;
  const activeShop = getActiveContent()?.resolved?.shop;
  const revealing = phase !== 'done';
  const showRows = phase === 'rows' || phase === 'done';
  return (
    <Screen>
      <Pressable onPress={reveal.skip} disabled={!revealing} accessibilityLabel={revealing ? t('reveal.skip') : undefined}>
        <Text className="mb-3 font-display text-displayM text-ink">{t('results.title')}</Text>
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
      <CheckpointReview t={t} run={run} />
      {phase === 'done' && <CelebrationList t={t} celebrations={celebrations} />}
      {showRows && (
        <>
          {result.kind === 'stage' || result.kind === 'close_exercise' ? (
            <>
              {result.kind === 'stage' && result.payload.timeline !== undefined && (
                <DebriefTimelineSection t={t} payload={result.payload} />
              )}
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
          {run.node.debrief && result.kind === 'close_exercise' && result.payload.handDrillOutcome && (
            <Panel tone="info" className="mt-4">
              <Text className="text-bodyL text-ink">{t(result.payload.handDrillOutcome === 'calm' ? run.node.debrief.calm : run.node.debrief.notCalm)}</Text>
            </Panel>
          )}
          <Panel tone="warn" className="mt-4">
            <Text className="font-display text-label text-ink">{t('results.exercise')}</Text>
            <Text className="mt-1 text-bodyL text-ink">{t(exercise.key)}</Text>
            {mission && <Text className="mt-2 font-display text-body text-ink">{t('debrief.practiseFor').replace('{mission}', t(mission))}</Text>}
          </Panel>
          {showPosteLink && (
            <Panel tone="info" className="mt-4">
              <Text className="text-body text-ink">{t('results.posteHint')}</Text>
              <Button label={t('results.posteLink')} onPress={onPosteLink} />
            </Panel>
          )}
          <RecommendationCardList
            recommendations={run.node.recommendations}
            activeShop={activeShop}
            onOpenShop={onShop}
            t={t}
          />
          <Button label={t('results.playAgain')} onPress={onPlayAgain} />
          <Button label={t('results.continue')} tone="secondary" onPress={onDone} />
        </>
      )}
    </Screen>
  );
}
