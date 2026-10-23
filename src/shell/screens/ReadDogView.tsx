import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { Button } from '../Overlays';
import { harnessOn, newReadDog, readDogHandlingScore, readDogMetrics, SCENE_ACTIONS, stepReadDog, currentState, type BeatOutcome, type ReadDogAction, type ReadDogEvent, type ReadDogRun, type ReadDogScene } from '../nodes/readDog';
import { AGITATION_SECONDS, postureSpec, wrongReaction, type CaninePosture } from '../ui/canine';
import { ActionButtonRow, CueCaption, DoorbellScene, HarnessScene, ResultChip, RoundPips } from '../ui/MinigameProps';
import { useTicker } from '../ui/useTicker';
import { Screen } from './Screen';

const TICK_MS = 50;
/** Seconds the finished scene stays on screen before the Debrief, so the last good beat is seen. */
const FINISH_SECONDS = 1.2;

const EVENT_KEYS = { correct: 'minigame.beat.correct', wrong: 'minigame.beat.wrong', failed: 'minigame.beat.failed', missed: 'minigame.beat.missed' } as const satisfies Record<ReadDogEvent['kind'], string>;
const HELP_KEYS = { harness: 'minigame.harness.help', doorbell: 'minigame.doorbell.help' } as const satisfies Record<ReadDogScene, string>;

export interface ReadDogResult {
  metrics: { poste?: number; timing?: number; tension: number };
  /** 0-1000, for the star rating. */
  handlingScore: number;
}

/**
 * Static Interactive Simulation shared by the Harness Ritual and the Doorbell Mat: each beat shows the
 * Dog in one state and the user picks the action that fits it.
 */
export function ReadDogView({ t, scene, seed, coat = 'golden', onCue, onFinish }: { t: Translate; scene: ReadDogScene; seed: number; coat?: DogCoat; onCue?: () => void; onFinish: (result: ReadDogResult) => void }) {
  const [started, setStarted] = useState(false);
  // per-tick state lives in a ref; React only hears about discrete changes (a beat closing, a reaction)
  const run = useRef<ReadDogRun>(newReadDog(scene, seed));
  const pressed = useRef<ReadDogAction | null>(null);
  const finishIn = useRef<number | null>(null);
  const finished = useRef(false);
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const [view, setView] = useState<ReadDogRun>(run.current);
  // a wrong choice shows the Dog's reaction for a moment, even though the beat is open again
  const agitation = useRef<{ left: number; posture: CaninePosture }>({ left: 0, posture: 'standing_waiting' });
  const [posture, setPosture] = useState<CaninePosture>(currentState(run.current));

  const baseline = currentState(view);
  useEffect(() => {
    if (started && !view.done) AccessibilityInfo.announceForAccessibility(t(postureSpec(baseline).label));
    // announce once per beat; the text does not change while a beat is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, view.index, view.done]);

  useTicker(started && !finished.current, TICK_MS, (dt) => {
    const action = pressed.current;
    pressed.current = null;
    const prev = run.current;
    const next = stepReadDog(prev, dt, action);
    run.current = next;
    if (next.last && next.last.seq !== prev.last?.seq) {
      if (next.last.kind === 'wrong' || next.last.kind === 'failed') agitation.current = { left: AGITATION_SECONDS, posture: wrongReaction(next.last.state, next.last.action) };
      else agitation.current.left = 0;
      setView(next);
    }
    agitation.current.left = Math.max(0, agitation.current.left - dt);
    setPosture(agitation.current.left > 0 ? agitation.current.posture : currentState(next));
    if (next.done && finishIn.current === null) finishIn.current = FINISH_SECONDS;
    if (finishIn.current !== null) {
      finishIn.current -= dt;
      if (finishIn.current <= 0 && !finished.current) {
        finished.current = true;
        finish.current({ metrics: readDogMetrics(next), handlingScore: readDogHandlingScore(next) });
      }
    }
  });

  const press = (action: ReadDogAction) => {
    if (finishIn.current !== null) return;
    pressed.current = action;
    if (action === 'cue') onCue?.();
  };

  const last = view.last;
  const hint = last && (last.kind === 'wrong' || last.kind === 'failed' || last.kind === 'missed') ? t(`minigame.hint.${last.state}`) : null;
  const beat = Math.min(view.outcomes.length + 1, view.script.length);
  const actions = SCENE_ACTIONS[scene].map((action) => ({ action, label: t(`minigame.action.${action}`), effect: t(`minigame.actionHint.${action}`) }));

  return (
    <Screen>
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="text-body text-inkMuted">{`${t('minigame.beat.label')} ${beat} ${t('minigame.beat.of')} ${view.script.length}`}</Text>
        <RoundPips t={t} total={view.script.length} results={view.outcomes.map((o: BeatOutcome) => o === 'correct')} />
      </View>
      <Text className="mb-4 text-bodyL text-ink">{t(HELP_KEYS[scene])}</Text>
      {scene === 'doorbell' ? (
        <DoorbellScene t={t} posture={posture} ringing={started && view.index === 0 && !view.done} coat={coat} />
      ) : (
        <HarnessScene t={t} posture={posture} harness={harnessOn(view)} coat={coat} />
      )}
      <CueCaption t={t} posture={posture} />
      <ResultChip label={last ? t(EVENT_KEYS[last.kind]) : null} good={last?.kind === 'correct'} />
      <View className="mb-3 min-h-[44px]" accessibilityLiveRegion="polite">
        {hint ? <Text className="text-body text-ink">{hint}</Text> : null}
      </View>
      {started ? <ActionButtonRow actions={actions} onPress={press} /> : <Button label={t('minigame.start')} onPress={() => setStarted(true)} />}
    </Screen>
  );
}

