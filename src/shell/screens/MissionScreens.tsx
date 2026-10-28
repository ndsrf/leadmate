import { Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import type { Celebration } from '../celebrations';
import { clockTime, stopTitle } from '../mapText';
import { activeTarget, checkInOpensAt, offerEasier, opensAtMidnight, OTHER_PROBLEM, todaysAttempt, type Fix, type MissionDef, type MissionState } from '../missions/mission';
import type { DiaryOutcome } from '../streak';
import { Button } from '../Overlays';
import { Badge, OptionCard, Panel } from '../ui/components';
import { CelebrationList } from '../ui/CelebrationList';
import { LessonBlocks } from '../ui/LessonBlocks';
import { theme } from '../ui/theme';
import { DIARY_KEYS, WalkDiaryBar } from './NodeScreens';
import { Screen } from './Screen';

/** The title block every Mission screen opens with: "Misión", the placeholder badge and the Mission's title. */
function MissionHeading({ t, mission, heading }: { t: Translate; mission: MissionDef; heading: TextKey }) {
  return (
    <View className="mb-3">
      <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        <Badge label={t('mission.label')} tone="accent" />
        {mission.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
      </View>
      <Text className="mt-2 font-display text-caption text-inkMuted">{t(heading)}</Text>
      <Text className="font-display text-displayM text-ink" accessibilityRole="header">{t(mission.title)}</Text>
    </View>
  );
}

/** The active target: what to do on the walk, how many times, and what success looks like. */
function TargetPanel({ t, mission, state }: { t: Translate; mission: MissionDef; state: MissionState | undefined }) {
  const easier = state?.target === 'easier';
  return (
    <Panel tone="warn" className="mb-3">
      <Text className="font-display text-label text-ink">{t(easier ? 'mission.brief.easier' : 'mission.brief.what')}</Text>
      <Text className="mt-1 text-bodyL text-ink">{t(state ? activeTarget(mission, state) : mission.target)}</Text>
      {!easier && (
        <>
          <Text className="mt-3 font-display text-label text-ink">{t('mission.brief.reps')}</Text>
          <Text className="mt-1 text-body text-ink">{t('mission.brief.repsCount').replace('{n}', String(mission.reps))}</Text>
        </>
      )}
      <Text className="mt-3 font-display text-label text-ink">{t('mission.brief.success')}</Text>
      <Text className="mt-1 text-body text-ink">{t(mission.successSign)}</Text>
    </Panel>
  );
}

/** "When the check-in opens" in words: tomorrow, or at a time after the 8-hour minimum. */
export function opensText(state: MissionState, t: Translate): string {
  const opens = checkInOpensAt(state);
  if (!opens || opensAtMidnight(state)) return t('mission.waiting.opensTomorrow');
  return t('mission.waiting.opensAt').replace('{time}', clockTime(opens));
}

/** The three-skip offer: switch to the easier target, or keep the full one. */
function EasierOffer({ t, onAccept }: { t: Translate; onAccept: () => void }) {
  return (
    <Panel tone="info" className="mb-3">
      <Text className="font-display text-title text-ink">{t('mission.offer.title')}</Text>
      <Text className="mt-1 text-body text-ink">{t('mission.offer.body')}</Text>
      <Button label={t('mission.offer.accept')} onPress={onAccept} />
    </Panel>
  );
}

/** The brief: the target, "Tu foco" from the latest Debrief, the Stops that train it, and "Start mission". */
export function MissionBriefScreen({ t, mission, state, onStart, onClose }: { t: Translate; mission: MissionDef; state: MissionState | undefined; onStart: () => void; onClose: () => void }) {
  return (
    <Screen>
      <MissionHeading t={t} mission={mission} heading="mission.brief.title" />
      <TargetPanel t={t} mission={mission} state={state} />
      {state?.focus && (
        <Panel className="mb-3">
          <Text className="font-display text-label text-ink">{t('mission.brief.focus')}</Text>
          <Text className="mt-1 text-body text-ink">{t(state.focus)}</Text>
        </Panel>
      )}
      <Text className="font-display text-label text-inkMuted">{t('mission.brief.trains')}</Text>
      <Text className="mb-3 text-body text-ink">{mission.trains.map((s) => t(stopTitle(s) ?? mission.title)).join(', ')}</Text>
      <Button label={t('mission.brief.start')} onPress={onStart} />
      <Button label={t('mission.brief.later')} tone="secondary" onPress={onClose} />
    </Screen>
  );
}

/** A started Mission before its check-in opens: the target, when it opens, and today's answer if one was given. */
export function MissionWaitingScreen({ t, mission, state, now, onAcceptEasier, onClose }: { t: Translate; mission: MissionDef; state: MissionState; now: Date; onAcceptEasier: () => void; onClose: () => void }) {
  const today = todaysAttempt(state, now);
  return (
    <Screen>
      <MissionHeading t={t} mission={mission} heading="mission.waiting.title" />
      {offerEasier(state) && <EasierOffer t={t} onAccept={onAcceptEasier} />}
      <TargetPanel t={t} mission={mission} state={state} />
      <Panel className="mb-3">
        <Text className="text-body text-ink">{t('mission.waiting.body')}</Text>
        <Text className="mt-2 font-display text-body text-ink">{opensText(state, t)}</Text>
        {today && <Text className="mt-2 text-caption text-inkMuted">{t('mission.waiting.today').replace('{answer}', t(DIARY_KEYS[today.outcome]))}</Text>}
      </Panel>
      <Button label={t('mission.back')} tone="secondary" onPress={onClose} />
    </Screen>
  );
}

/** The check-in: "How did it go?" with the three Walk Diary answers. */
export function MissionCheckInScreen({ t, mission, state, onAnswer, onAcceptEasier, onClose }: { t: Translate; mission: MissionDef; state: MissionState; onAnswer: (outcome: DiaryOutcome) => void; onAcceptEasier: () => void; onClose: () => void }) {
  return (
    <Screen>
      <MissionHeading t={t} mission={mission} heading="mission.checkin.title" />
      {offerEasier(state) && <EasierOffer t={t} onAccept={onAcceptEasier} />}
      <TargetPanel t={t} mission={mission} state={state} />
      <Text className="text-body text-ink">{t('mission.checkin.question')}</Text>
      <WalkDiaryBar t={t} chosen={null} onChoose={onAnswer} />
      <Button label={t('mission.back')} tone="secondary" onPress={onClose} />
    </Screen>
  );
}

/** After "Costó un poco": the Mission's fixed problems plus "Otra cosa"; there is no free text. */
export function MissionProblemScreen({ t, mission, onPick, onBack }: { t: Translate; mission: MissionDef; onPick: (problemId: string) => void; onBack: () => void }) {
  return (
    <Screen>
      <MissionHeading t={t} mission={mission} heading="mission.problem.title" />
      <View style={{ gap: theme.space[2] }}>
        {mission.problems.map((p) => (
          <OptionCard key={p.id} label={t(p.label)} onPress={() => onPick(p.id)} />
        ))}
        <OptionCard label={t('mission.problem.other')} onPress={() => onPick(OTHER_PROBLEM)} />
      </View>
      <Button label={t('mission.back')} tone="secondary" onPress={onBack} />
    </Screen>
  );
}

/**
 * A Fix as one scrollable page: its blocks (reassurance, cause, corrections with media), the easier target,
 * "Practise again" and, from the second struggle, "Move on anyway".
 */
export function FixScreen({
  t,
  mission,
  fix,
  problem,
  canMoveOn,
  onPractise,
  onMoveOn,
  onDone,
}: {
  t: Translate;
  mission: MissionDef;
  fix: Fix;
  problem: TextKey;
  canMoveOn: boolean;
  onPractise: () => void;
  onMoveOn: () => void;
  onDone: () => void;
}) {
  return (
    <Screen>
      <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        <Badge label={t('fix.title')} tone="accent" />
        {fix.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
      </View>
      <Text className="mt-2 font-display text-caption text-inkMuted">{t(mission.title)}</Text>
      <Text className="font-display text-displayM text-ink" accessibilityRole="header">{t(problem)}</Text>
      <LessonBlocks t={t} blocks={fix.blocks} />
      <Panel tone="warn" className="mt-6">
        <Text className="font-display text-label text-ink">{t('fix.easier')}</Text>
        <Text className="mt-1 text-bodyL text-ink">{t(fix.easierTarget)}</Text>
      </Panel>
      <Button label={t('fix.practise')} onPress={onPractise} />
      {canMoveOn && (
        <View className="mt-2">
          <Text className="text-caption text-inkMuted">{t('fix.moveOnHint')}</Text>
          <Button label={t('fix.moveOn')} tone="secondary" onPress={onMoveOn} />
        </View>
      )}
      <Button label={t('fix.done')} tone="quiet" onPress={onDone} />
    </Screen>
  );
}

/** A passed Mission: the celebration, and the next Stretch is open. */
export function MissionPassedScreen({ t, mission, celebrations, onDone }: { t: Translate; mission: MissionDef; celebrations: readonly Celebration[]; onDone: () => void }) {
  return (
    <Screen>
      <MissionHeading t={t} mission={mission} heading="mission.passed.title" />
      <CelebrationList t={t} celebrations={celebrations} />
      <Text className="mb-3 text-body text-ink">{t('mission.passed.body')}</Text>
      <Button label={t('mission.back')} onPress={onDone} />
    </Screen>
  );
}
