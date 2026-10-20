import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import { Button } from '../Overlays';
import { findNode } from '../nodes/content';
import { missingPrerequisites, type NodeDef } from '../nodes/node';
import { activeToday, shownStreak, type StreakRecord } from '../streak';
import { isNodeOpen, isWorldUnlocked, nodesOfWorld, WORLDS, type WorldDef } from '../world';
import { Screen } from './Screen';

export interface HomeProps {
  t: Translate;
  completed: readonly string[];
  streak: StreakRecord;
  /** Local date of today, `YYYY-MM-DD`. */
  today: string;
  /** Best Daily Stage score of today, if played. */
  dailyBest: number | undefined;
  /** The Dog is Rusty and the user has not chosen yet. */
  rustyPrompt: boolean;
  skippedWarmup: boolean;
  onWarmup: () => void;
  onSkipWarmup: () => void;
  onDaily: () => void;
  onStartNode: (node: NodeDef) => void;
  onSettings: () => void;
  /** A non-blocking account card to show above the lessons, if any. */
  banner?: React.ReactNode;
}

/** A flame drawn from two rotated drops, so it needs no emoji font; grey when there is no Streak to show. */
export function Flame({ lit, label }: { lit: boolean; label: string }) {
  const drop = (size: number, color: string) => ({
    width: size,
    height: size,
    backgroundColor: color,
    borderTopLeftRadius: size / 2,
    borderBottomLeftRadius: size / 2,
    borderBottomRightRadius: size / 2,
    borderTopRightRadius: 0,
    transform: [{ rotate: '-45deg' }],
  });
  return (
    <View accessibilityLabel={label} className="mr-3 h-10 w-8 items-center justify-end" style={{ opacity: lit ? 1 : 0.3 }}>
      <View style={drop(26, '#f97316')} />
      <View style={[drop(14, '#fde047'), { position: 'absolute', bottom: 5 }]} />
    </View>
  );
}

/** The active Streak: a flame and the number of days, with a nudge to keep it alive. */
export function StreakBanner({ t, streak, today }: { t: Translate; streak: StreakRecord; today: string }) {
  const days = shownStreak(streak, today);
  const keepAlive = days > 0 && !activeToday(streak, today);
  const hasBest = streak.best > 1;
  return (
    <View className="mb-4 flex-row items-center rounded-xl bg-slate-800 p-3" accessibilityRole="summary">
      <Flame lit={days > 0} label={t('streak.flame')} />
      <View className="flex-1">
        <Text className="text-lg font-bold text-white">{days > 0 ? `${days} ${t(days === 1 ? 'streak.day' : 'streak.days')}` : t('streak.start')}</Text>
        {keepAlive && <Text className="text-xs text-amber-200">{t('streak.keep')}</Text>}
        {hasBest && <Text className="text-xs text-slate-400">{`${t('streak.best')}: ${streak.best}`}</Text>}
      </View>
    </View>
  );
}

function NodeCard({ t, node, completed, open, onStart }: { t: Translate; node: NodeDef; completed: readonly string[]; open: boolean; onStart: (n: NodeDef) => void }) {
  const missing = missingPrerequisites(node, completed);
  return (
    <Pressable
      disabled={!open}
      onPress={() => onStart(node)}
      accessibilityRole="button"
      className={`mb-3 rounded-xl p-4 ${open ? 'bg-slate-800 active:bg-slate-700' : 'bg-slate-800/50'}`}
    >
      <Text className={`text-lg font-semibold ${open ? 'text-white' : 'text-slate-500'}`}>{t(node.title)}</Text>
      {completed.includes(node.id) && <Text className="mt-1 text-xs text-green-400">{t('home.done')}</Text>}
      {!open && missing.length > 0 && (
        <Text className="mt-1 text-xs text-slate-400">
          {t('home.locked')} {missing.map((id) => (findNode(id) ? t(findNode(id)!.title) : id)).join(', ')}
        </Text>
      )}
    </Pressable>
  );
}

function WorldSection({ t, world, completed, onStart }: { t: Translate; world: WorldDef; completed: readonly string[]; onStart: (n: NodeDef) => void }) {
  const unlocked = isWorldUnlocked(world, completed);
  const done = world.nodes.filter((id) => completed.includes(id)).length;
  return (
    <View className="mb-4">
      <Text className={`text-base font-bold ${unlocked ? 'text-white' : 'text-slate-500'}`}>{t(world.title)}</Text>
      <Text className="mb-2 text-xs text-slate-400">{unlocked ? `${t('world.progress')}: ${done} / ${world.nodes.length}` : t('world.locked')}</Text>
      {unlocked && nodesOfWorld(world).map((node) => <NodeCard key={node.id} t={t} node={node} completed={completed} open={isNodeOpen(node, completed)} onStart={onStart} />)}
    </View>
  );
}

export function HomeScreen({ t, completed, streak, today, dailyBest, rustyPrompt, skippedWarmup, onWarmup, onSkipWarmup, onDaily, onStartNode, onSettings, banner }: HomeProps) {
  return (
    <Screen>
      <Text className="mb-4 text-2xl font-bold text-white">{t('home.title')}</Text>
      <StreakBanner t={t} streak={streak} today={today} />
      {banner}
      {rustyPrompt && (
        <View className="mb-4 rounded-xl bg-amber-900/60 p-4">
          <Text className="text-lg font-bold text-amber-100">{t('rusty.title')}</Text>
          <Text className="mt-1 text-sm text-amber-50">{t('rusty.body')}</Text>
          <Button label={t('rusty.warmup')} onPress={onWarmup} />
          <Button label={t('rusty.skip')} tone="quiet" onPress={onSkipWarmup} />
        </View>
      )}
      {skippedWarmup && <Text className="mb-4 text-sm text-amber-200">{t('rusty.skipped')}</Text>}
      <View className="mb-4 rounded-xl bg-indigo-900/60 p-4">
        <Text className="text-lg font-bold text-white">{t('daily.title')}</Text>
        <Text className="mt-1 text-sm text-indigo-100">{t('daily.subtitle')}</Text>
        <Text className="mt-2 text-xs text-indigo-200">{dailyBest === undefined ? t('daily.notPlayed') : `${t('daily.best')}: ${dailyBest} ${t('results.scoreOutOf')}`}</Text>
        <Button label={t(dailyBest === undefined ? 'daily.play' : 'daily.playAgain')} onPress={onDaily} />
      </View>
      <Text className="mb-2 text-sm font-semibold uppercase text-slate-400">{t('home.nodes')}</Text>
      {WORLDS.map((world) => (
        <WorldSection key={world.id} t={t} world={world} completed={completed} onStart={onStartNode} />
      ))}
      <Button label={t('home.settings')} tone="quiet" onPress={onSettings} />
    </Screen>
  );
}
