import { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  PanResponder,
  Text,
  View,
} from 'react-native';
import type { Translate } from '../../i18n';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { withDogName } from '../onboarding/intro';
import {
  carryOf,
  newRound,
  READ_THE_DOG,
  replaySeed,
  roundResult,
  rtdFeedback,
  stepRound,
  swipeClass,
  type RoundOptions,
  type RoundResult,
  type RoundState,
  type RtdClass,
  type RtdSignal,
} from '../nodes/readTheDog';
import { feedback } from '../ui/feedback';
import {
  MinigameButton,
  ReadTheDogScene,
  RtdTimerBar,
} from '../ui/MinigameProps';
import type { FeedbackBurstProps } from '../ui/FeedbackBurst';
import { theme, usePalette } from '../ui/theme';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const TICK_MS = 20;

const fill = (
  text: string,
  values: Record<string, string | number>,
): string =>
  Object.entries(values).reduce(
    (s, [k, v]) => s.replace(`{${k}}`, String(v)),
    text,
  );

export interface ReadTheDogViewProps {
  t: Translate;
  record: Pick<DogRecord, 'breed' | 'coat'> & { name?: string };
  seed: number;
  onFinish?: (latency: number) => void;
  /** Called once per finished round with its anonymous result. */
  onRoundResult?: (result: RoundResult) => void;
}

export function ReadTheDogView({
  t,
  record,
  seed,
  onFinish,
  onRoundResult,
}: ReadTheDogViewProps) {
  const color = usePalette();
  const [started, setStarted] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [screenReader, setScreenReader] = useState(false);

  const reportResult = onRoundResult;
  // the first seed is the base of the whole session: a parent that re-renders with a new seed never changes a replay
  const baseSeed = useRef(seed).current;
  const finish = useRef(onFinish);
  finish.current = onFinish;

  const replayCount = useRef(0);
  const firstRoundLatency = useRef<number | null>(null);
  const roundReported = useRef(false);

  const roundOpts: RoundOptions = screenReader
    ? { fixedLevel: 0, screenReader: true }
    : {};

  const [firstRound] = useState(() => newRound(baseSeed, null, roundOpts));
  const state = useRef<RoundState>(firstRound);
  const pendingAnswer = useRef<RtdClass | null>(null);

  const [showingSignal, setShowingSignal] = useState<RtdSignal | null>(
    state.current.signal,
  );
  const [timeLeft, setTimeLeft] = useState<number>(state.current.timeLeft);
  const [totalTimer, setTotalTimer] = useState<number>(state.current.timer);
  const [combo, setCombo] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [burst, setBurst] = useState<FeedbackBurstProps | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [roundResultData, setRoundResultData] = useState<RoundResult | null>(
    null,
  );
  const [signalsToWatch, setSignalsToWatch] = useState<RtdSignal[]>([]);

  // Screen reader listener
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((enabled) => {
        if (mounted) setScreenReader(enabled);
      })
      .catch(() => {});

    const sub = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        if (mounted) setScreenReader(enabled);
      },
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  // Update initial round timer if screen reader is detected before start
  useEffect(() => {
    if (!started && screenReader) {
      state.current = newRound(baseSeed, null, {
        fixedLevel: 0,
        screenReader: true,
      });
      setTotalTimer(state.current.timer);
      setTimeLeft(state.current.timeLeft);
      setShowingSignal(state.current.signal);
    }
  }, [screenReader, started, baseSeed]);

  // When started, announce initial signal
  useEffect(() => {
    if (started && state.current.signal && state.current.phase === 'showing') {
      AccessibilityInfo.announceForAccessibility(
        t(`readTheDog.describe.${state.current.signal}`),
      );
    }
  }, [started, t]);

  useTicker(
    started && !isDone,
    TICK_MS,
    (dt) => {
      const answer = pendingAnswer.current;
      pendingAnswer.current = null;

      const prevSeq = state.current.last?.seq ?? 0;
      const prevSignal = state.current.signal;
      const prevPhase = state.current.phase;

      state.current = stepRound(state.current, dt, answer, roundOpts);

      // Event happened?
      if (state.current.last && state.current.last.seq > prevSeq) {
        const ev = state.current.last;
        const fb = rtdFeedback(ev.kind, state.current.combo, ev.signal);
        feedback.stage({
          polarity: fb.polarity,
          tier: fb.tier === 'wrong' ? 'small' : fb.tier,
          combo: fb.combo,
        });
        const line = withDogName(
          t(fb.textKey),
          record.name ?? '',
          t('dog.neutral'),
        );
        setBurst({
          id: ev.seq,
          tier: fb.tier,
          polarity: fb.polarity,
          text: line,
          combo: state.current.combo,
          onDone: () => setBurst(null),
        });
        setCaption(line);
        AccessibilityInfo.announceForAccessibility(line);
      }

      // Transition to new signal in showing phase?
      if (
        state.current.phase === 'showing' &&
        (prevPhase !== 'showing' || prevSignal !== state.current.signal)
      ) {
        setCaption(null);
        if (state.current.signal) {
          AccessibilityInfo.announceForAccessibility(
            t(`readTheDog.describe.${state.current.signal}`),
          );
        }
      }

      // Round ended?
      if (state.current.phase === 'done' && !roundReported.current) {
        roundReported.current = true;
        setIsDone(true);
        const res = roundResult(state.current);
        if (firstRoundLatency.current === null) {
          firstRoundLatency.current = res.latency;
        }
        setRoundResultData(res);
        setSignalsToWatch([...state.current.signalsToWatch]);
        reportResult?.(res);
      }

      setShowingSignal(state.current.signal);
      setTimeLeft(Math.max(0, state.current.timeLeft));
      setTotalTimer(state.current.timer);
      setCombo(state.current.combo);
      setScore(state.current.score);
    },
    'read-the-dog',
  );

  // Pan responder for swipe answers
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) =>
        Math.abs(g.dx) > 10 || Math.abs(g.dy) > 10,
      onPanResponderRelease: (_e, g) => {
        const cls = swipeClass(g.dx, g.dy);
        if (cls) {
          pendingAnswer.current = cls;
        }
      },
    }),
  ).current;

  const handleStart = () => {
    setStarted(true);
  };

  const handleAnswer = (cls: RtdClass) => {
    pendingAnswer.current = cls;
  };

  const handleReplay = () => {
    roundReported.current = false;
    replayCount.current += 1;
    const nextSeed = replaySeed(baseSeed, replayCount.current);
    const carry = carryOf(state.current);
    state.current = newRound(nextSeed, carry, roundOpts);
    setIsDone(false);
    setRoundResultData(null);
    setCaption(null);
    setBurst(null);
    setSignalsToWatch([]);
    setShowingSignal(state.current.signal);
    setTimeLeft(state.current.timeLeft);
    setTotalTimer(state.current.timer);
    setCombo(state.current.combo);
    setScore(state.current.score);
    setStarted(true); // Replay starts immediately with no start screen
    // the start effect does not run again, so the first signal of a replay is announced here
    if (state.current.signal) {
      AccessibilityInfo.announceForAccessibility(t(`readTheDog.describe.${state.current.signal}`));
    }
  };

  const handleContinue = () => {
    const lat = firstRoundLatency.current ?? roundResultData?.latency ?? 1.5;
    finish.current?.(lat);
  };

  const signalLabel =
    showingSignal && state.current.phase === 'showing'
      ? t(`readTheDog.describe.${showingSignal}`)
      : undefined;

  // Calculate share right
  const totalAnswers = roundResultData
    ? (Object.values(roundResultData.right) as number[]).reduce((a, b) => a + b, 0) +
      (Object.values(roundResultData.wrong) as number[]).reduce((a, b) => a + b, 0) +
      (Object.values(roundResultData.missed) as number[]).reduce((a, b) => a + b, 0)
    : 0;
  const rightAnswers = roundResultData
    ? (Object.values(roundResultData.right) as number[]).reduce((a, b) => a + b, 0)
    : 0;
  const sharePercent =
    totalAnswers > 0 ? Math.round((rightAnswers / totalAnswers) * 100) : 0;

  return (
    <Screen>
      <Text
        className="mb-1 font-display text-displayM text-ink"
        accessibilityRole="header"
      >
        {t('readTheDog.title')}
      </Text>
      {!started && <Text className="mb-3 text-bodyL text-inkMuted">{t('readTheDog.help')}</Text>}

      {started && !isDone && (
        <View className="mb-2">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-display text-body text-ink">
              {fill(t('readTheDog.combo'), { n: combo })}
            </Text>
            <Text className="font-display text-body text-inkMuted">
              {fill(t('readTheDog.score'), { points: score })}
            </Text>
          </View>
          <RtdTimerBar
            left={timeLeft}
            total={totalTimer}
            label={fill(t('readTheDog.timer'), { s: Math.ceil(timeLeft) })}
          />
        </View>
      )}

      {/* Dog scene with pan gesture handlers, margin from screen edges */}
      <View
        style={{ marginHorizontal: theme.space[2] }}
        {...panResponder.panHandlers}
      >
        <ReadTheDogScene
          breed={record.breed}
          coat={record.coat}
          signal={showingSignal}
          label={signalLabel}
          caption={caption}
          burst={burst}
        />
      </View>

      {!started ? (
        <View className="mt-4">
          <Button
            label={t('readTheDog.start')}
            accessibilityLabel={t('readTheDog.start')}
            onPress={handleStart}
          />
        </View>
      ) : isDone && roundResultData ? (
        <View
          className="mt-4 rounded-game-lg bg-surface p-4"
          style={{ borderWidth: theme.border.ink, borderColor: color.outline }}
        >
          <Text
            className="mb-2 font-display text-title text-ink"
            accessibilityRole="header"
          >
            {t('readTheDog.result.title')}
          </Text>
          <Text className="font-display text-body text-ink">
            {fill(t('readTheDog.result.score'), { points: roundResultData.score })}
          </Text>
          <Text className="font-display text-body text-ink">
            {fill(t('readTheDog.result.bestCombo'), {
              n: roundResultData.bestCombo,
            })}
          </Text>
          <Text className="font-display text-body text-ink">
            {fill(t('readTheDog.result.share'), { percent: sharePercent })}
          </Text>

          <View className="my-2">
            <Text className="font-display text-body text-inkMuted">
              {t('readTheDog.result.watch')}
            </Text>
            {signalsToWatch.length > 0 ? (
              <View className="mt-1 flex-row flex-wrap gap-2">
                {signalsToWatch.map((s) => (
                  <View
                    key={s}
                    className="rounded-game-md bg-surfaceSunken px-3 py-1"
                    style={{
                      borderWidth: theme.border.ink,
                      borderColor: color.outline,
                    }}
                  >
                    <Text className="font-display text-body text-ink">
                      {t(`readTheDog.name.${s}`)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-body text-inkMuted">
                {t('readTheDog.result.watchNone')}
              </Text>
            )}
          </View>

          <View className="mt-3 flex-col gap-2">
            <Button
              label={t('readTheDog.result.replay')}
              accessibilityLabel={t('readTheDog.result.replay')}
              onPress={handleReplay}
            />
            <Button
              label={t('readTheDog.result.continue')}
              accessibilityLabel={t('readTheDog.result.continue')}
              onPress={handleContinue}
            />
          </View>
        </View>
      ) : (
        <View className="mt-1 flex-col gap-2">
          <MinigameButton
            compact
            label={t('readTheDog.answer.calm')}
            icon="wait"
            onPressIn={() => handleAnswer('calm')}
          />
          <MinigameButton
            compact
            label={t('readTheDog.answer.alert')}
            icon="cue"
            onPressIn={() => handleAnswer('alert')}
          />
          <MinigameButton
            compact
            label={t('readTheDog.answer.about_to_react')}
            icon="send-away"
            onPressIn={() => handleAnswer('about_to_react')}
          />
        </View>
      )}
    </Screen>
  );
}
