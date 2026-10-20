import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { SimulationDebriefPayload } from '../../sim/payload';
import { Button, Row } from '../Overlays';
import { checkpointLimit, pickExercise, type NodeRun } from '../nodes/node';
import type { CheckpointSeconds } from '../dogRecord';
import { DIARY_OUTCOMES, type DiaryOutcome } from '../streak';
import { Screen } from './Screen';

export function PrimerScreen({ t, run, onNext, onExit }: { t: Translate; run: NodeRun; onNext: () => void; onExit: () => void }) {
  const total = run.node.primerCards.length;
  return (
    <Screen>
      <Text className="mb-1 text-sm text-slate-400">{t(run.node.title)}</Text>
      <View className="my-4 min-h-40 justify-center rounded-xl bg-slate-800 p-6">
        <Text className="text-xl text-white">{t(run.node.primerCards[run.card])}</Text>
      </View>
      <Text className="text-center text-sm text-slate-400">{`${run.card + 1} / ${total}`}</Text>
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

  useEffect(() => {
    if (limit === null) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const remaining = limit - (Date.now() - started) / 1000;
      if (remaining <= 0) {
        clearInterval(timer);
        onTimeout();
      } else setLeft(remaining);
    }, 100);
    return () => clearInterval(timer);
    // the timer belongs to this mount; a new answer or timeout leaves the screen
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  return (
    <Screen>
      <Text className="mb-1 text-sm text-slate-400">{t('node.checkpoint.title')}</Text>
      {left !== null && limit !== null && (
        <View className="my-2 h-2 overflow-hidden rounded-full bg-slate-700">
          <View className="h-2 bg-amber-400" style={{ width: `${Math.max(0, (left / limit) * 100)}%` }} />
        </View>
      )}
      {left !== null && <Text className="text-right text-xs text-slate-400">{`${Math.ceil(left)} ${t('node.checkpoint.seconds')}`}</Text>}
      <Text className="my-4 text-xl font-semibold text-white">{t(run.node.checkpoint.question)}</Text>
      {run.node.checkpoint.options.map((option, i) => (
        <Pressable key={option.text} onPress={() => onAnswer(i)} accessibilityRole="button" className="mb-3 rounded-xl bg-slate-800 p-4 active:bg-slate-700">
          <Text className="text-base text-white">{t(option.text)}</Text>
        </Pressable>
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
      <Text className="mt-1 text-xs text-slate-400">{t('results.peakArousalHint')}</Text>
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
    <View className="mt-4 rounded-xl bg-slate-800 p-4">
      <Text className="text-sm font-semibold text-slate-300">{t('diary.title')}</Text>
      <Text className="mt-1 text-base text-white">{t('diary.question')}</Text>
      <View className="mt-3 flex-row gap-2">
        {DIARY_OUTCOMES.map((outcome) => (
          <Pressable
            key={outcome}
            onPress={() => onChoose(outcome)}
            accessibilityRole="button"
            className={`flex-1 items-center rounded-lg px-2 py-3 ${chosen === outcome ? 'bg-green-500' : 'bg-slate-700 active:bg-slate-600'}`}
          >
            <Text className={`text-center text-sm font-semibold ${chosen === outcome ? 'text-green-950' : 'text-white'}`}>{t(DIARY_KEYS[outcome])}</Text>
          </Pressable>
        ))}
      </View>
      {chosen && <Text className="mt-2 text-xs text-green-400">{t('diary.saved')}</Text>}
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
}) {
  const result = run.result;
  if (!result) return null;
  const exercise = pickExercise(run.node, result);
  return (
    <Screen>
      <Text className="mb-3 text-xl font-bold text-white">{t('results.title')}</Text>
      {run.checkpoint && <Text className="mb-2 text-sm text-slate-300">{t(`results.checkpoint.${run.checkpoint}`)}</Text>}
      {result.kind === 'stage' ? (
        <>
          <StageRows t={t} p={result.payload} />
          {result.payload.harshStops > 0 && <Text className="mt-3 text-sm text-amber-200">{t('results.harshStopNote')}</Text>}
          <Text className="mt-3 text-xs text-slate-400">{t('results.equipmentNote')}</Text>
        </>
      ) : (
        <>
          {result.metrics.poste !== undefined && <Row label={t('results.minigame.poste')} value={`${Math.round(result.metrics.poste * 100)}%`} />}
          {result.metrics.timing !== undefined && <Row label={t('results.minigame.timing')} value={`${Math.round(result.metrics.timing * 100)}%`} />}
          {result.metrics.tension !== undefined && <Row label={t('results.minigame.tension')} value={`${Math.round(result.metrics.tension * 100)}%`} />}
        </>
      )}
      <View className="mt-4 rounded-xl bg-slate-800 p-4">
        <Text className="text-sm font-semibold text-slate-300">{t('results.exercise')}</Text>
        <Text className="mt-1 text-base text-white">{t(exercise.key)}</Text>
      </View>
      <WalkDiaryBar t={t} chosen={diary} onChoose={onDiary} />
      {showPosteLink && (
        <View className="mt-4 rounded-xl bg-amber-900/60 p-4">
          <Text className="text-sm text-amber-100">{t('results.posteHint')}</Text>
          <Button label={t('results.posteLink')} onPress={onPosteLink} />
        </View>
      )}
      <Button label={t('results.playAgain')} onPress={onPlayAgain} />
      <Button label={t('results.continue')} tone="quiet" onPress={onDone} />
    </Screen>
  );
}
