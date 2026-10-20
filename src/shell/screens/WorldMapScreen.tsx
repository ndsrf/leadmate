import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent, type ScrollView } from 'react-native';
import { useAppActive } from '../ui/useAppActive';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { Translate } from '../../i18n';
import type { NodeDef } from '../nodes/node';
import { mapModel, type MapNode, type MapWorld } from '../mapModel';
import { streakStatus, type StreakStatus } from '../celebrations';
import type { Stars } from '../stars';
import type { StreakRecord } from '../streak';
import { Button } from '../Overlays';
import { Chip, Panel, ProgressBar, StarRow } from '../ui/components';
import { connector, labelOnRight, labelWidth, NODE_SIZE, nodeCenterX, nodeVisual, ROW_HEIGHT } from '../ui/mapLayout';
import { lockMessage } from '../mapText';
import { handlePress } from '../ui/press';
import { color, theme } from '../ui/theme';
import { useMotion } from '../ui/useMotion';
import { Screen } from './Screen';

export interface WorldMapProps {
  t: Translate;
  completed: readonly string[];
  stars: Readonly<Record<string, Stars>>;
  streak: StreakRecord;
  /** Local date of today, `YYYY-MM-DD`. */
  today: string;
  /** Best Daily Stage score of today, if played. */
  dailyBest: number | undefined;
  /** The Dog is Rusty and the user has not chosen yet. */
  rustyPrompt: boolean;
  /** The Dog is Rusty (chosen or not): the map marker shows it. */
  rusty: boolean;
  skippedWarmup: boolean;
  onWarmup: () => void;
  onSkipWarmup: () => void;
  onDaily: () => void;
  onStartNode: (node: NodeDef) => void;
  onSettings: () => void;
  /** A non-blocking account card to show above the map, if any. */
  banner?: React.ReactNode;
}

/** A flame drawn from two rotated drops, so it needs no emoji font; grey when there is no Streak to show. */
export function Flame({ lit, label }: { lit: boolean; label: string }) {
  const drop = (size: number, fill: string) => ({
    width: size,
    height: size,
    backgroundColor: fill,
    borderTopLeftRadius: size / 2,
    borderBottomLeftRadius: size / 2,
    borderBottomRightRadius: size / 2,
    borderTopRightRadius: 0,
    transform: [{ rotate: '-45deg' }],
  });
  return (
    <View accessibilityLabel={label} className="mr-2 h-8 w-6 items-center justify-end" style={{ opacity: lit ? 1 : 0.35 }}>
      <View style={drop(20, color.flameOuter)} />
      <View style={[drop(11, color.flameInner), { position: 'absolute', bottom: 4 }]} />
    </View>
  );
}

/** A padlock drawn from views: the shape says "locked" without relying on colour. */
function LockIcon({ tint }: { tint: string }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="items-center">
      <View style={{ width: 14, height: 10, borderWidth: 3, borderBottomWidth: 0, borderTopLeftRadius: 7, borderTopRightRadius: 7, borderColor: tint }} />
      <View style={{ width: 22, height: 15, borderRadius: 4, backgroundColor: tint }} />
    </View>
  );
}

/** The Dog's marker on the map: a paw (no sprite frames exist for the shell), muted and ringed in amber while Rusty. */
export function PawMarker({ rusty, label }: { rusty: boolean; label: string }) {
  const fill = rusty ? color.accentEdge : color.brandEdge;
  const toe = { width: 7, height: 8, borderRadius: 4, backgroundColor: color.ink };
  return (
    <View accessibilityLabel={label} className="h-8 w-8 items-center justify-center rounded-game-pill" style={{ backgroundColor: fill, borderWidth: rusty ? 3 : 0, borderColor: color.accent }}>
      <View className="flex-row" style={{ gap: 2, marginBottom: 1 }}>
        <View style={[toe, { marginTop: 3 }]} />
        <View style={toe} />
        <View style={toe} />
        <View style={[toe, { marginTop: 3 }]} />
      </View>
      <View style={{ width: 12, height: 8, borderRadius: 5, backgroundColor: color.ink }} />
    </View>
  );
}

/** The one looping animation on the map. Under reduced motion it is a static ring instead. */
function NextUpRing({ pulse }: { pulse: boolean }) {
  const phase = useSharedValue(0);
  const active = useAppActive();
  // the loop stops while the app is in the background and starts again when it returns
  useEffect(() => {
    if (!pulse || !active) return;
    phase.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
    return () => cancelAnimation(phase);
  }, [pulse, active, phase]);
  const style = useAnimatedStyle(() => ({ opacity: pulse ? 0.7 * (1 - phase.value) : 1, transform: [{ scale: pulse ? 1 + 0.35 * phase.value : 1 }] }));
  const size = NODE_SIZE + 14;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: -7, top: -7, width: size, height: size, borderRadius: size / 2, borderWidth: 4, borderColor: color.accent }, style]}
    />
  );
}

function NodeRow({
  t,
  entry,
  index,
  width,
  hasNext,
  rusty,
  worldUnlocked,
  pulse,
  onPress,
}: {
  t: Translate;
  entry: MapNode;
  index: number;
  width: number;
  hasNext: boolean;
  rusty: boolean;
  worldUnlocked: boolean;
  pulse: boolean;
  onPress: (entry: MapNode) => void;
}) {
  const c = nodeVisual(entry.state);
  const cx = nodeCenterX(index, width);
  const onRight = labelOnRight(index);
  const seg = connector(index, width);
  const title = t(entry.node.title);
  const state = entry.state;
  const stateText = state === 'done' ? t('map.nodeDone') : state === 'next' ? t('map.nodeNext') : state === 'locked' ? t('map.nodeLocked') : '';
  return (
    <View style={{ height: ROW_HEIGHT }}>
      {hasNext && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: seg.left - 3, top: seg.top - seg.length / 2, width: 6, height: seg.length, borderRadius: 3, backgroundColor: state === 'done' ? color.brandEdge : color.surfaceHigh, transform: [{ rotate: `${seg.angle}deg` }] }}
        />
      )}
      <Pressable
        onPress={() => handlePress(() => onPress(entry))}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${stateText}`.trim()}
        accessibilityState={{ disabled: state === 'locked' }}
        style={{ position: 'absolute', left: cx - NODE_SIZE / 2, top: 0, width: NODE_SIZE, height: NODE_SIZE }}
      >
        {c.ring && <NextUpRing pulse={pulse} />}
        <View style={{ width: NODE_SIZE, height: NODE_SIZE, borderRadius: NODE_SIZE / 2, backgroundColor: c.edge, paddingBottom: theme.depth.edge }}>
          <View style={{ flex: 1, borderRadius: NODE_SIZE / 2, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center', opacity: worldUnlocked ? 1 : 0.7 }}>
            {c.glyph === 'lock' ? (
              <LockIcon tint={c.ink} />
            ) : (
              <Text className="font-display text-2xl" style={{ color: c.ink }}>
                {c.glyph === 'check' ? '✓' : String(index + 1)}
              </Text>
            )}
          </View>
        </View>
        {state === 'next' && (
          <View pointerEvents="none" style={{ position: 'absolute', right: -14, top: -14 }}>
            <PawMarker rusty={rusty} label={rusty ? t('map.dogRusty') : t('map.dog')} />
          </View>
        )}
      </Pressable>
      <Pressable
        onPress={() => handlePress(() => onPress(entry))}
        accessible={false}
        importantForAccessibility="no"
        style={{ position: 'absolute', top: 0, minHeight: NODE_SIZE, justifyContent: 'center', width: labelWidth(index, width), ...(onRight ? { left: cx + NODE_SIZE / 2 + 12 } : { left: cx - NODE_SIZE / 2 - 12 - labelWidth(index, width) }), alignItems: onRight ? 'flex-start' : 'flex-end' }}
      >
        <Text className={`text-sm font-semibold ${state === 'locked' ? 'text-inkDim' : 'text-ink'}`} style={{ textAlign: onRight ? 'left' : 'right' }}>
          {title}
        </Text>
        {state === 'done' && entry.stars !== undefined && <StarRow stars={entry.stars} size={16} label={`${entry.stars} ${t('map.starsOf3')}`} />}
        {state === 'next' && <Text className="text-xs font-bold text-accent">{t('map.nodeNext')}</Text>}
      </Pressable>
    </View>
  );
}

function WorldBlock({
  t,
  entry,
  width,
  rusty,
  pulse,
  onPress,
  onLayout,
  onPathLayout,
}: {
  t: Translate;
  entry: MapWorld;
  width: number;
  rusty: boolean;
  pulse: boolean;
  onPress: (n: MapNode) => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onPathLayout: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View className="mb-6" onLayout={onLayout} style={{ opacity: entry.unlocked ? 1 : 0.75 }}>
      <Text className={`font-display text-lg ${entry.unlocked ? 'text-ink' : 'text-inkMuted'}`}>{t(entry.world.title)}</Text>
      <Text className="mb-2 mt-0.5 text-xs text-inkMuted">{entry.unlocked ? `${t('world.progress')}: ${entry.done} / ${entry.total}` : t('world.locked')}</Text>
      {entry.unlocked && <ProgressBar value={entry.done} max={entry.total} className="mb-3" />}
      <View onLayout={onPathLayout} style={{ height: entry.nodes.length * ROW_HEIGHT }}>
        {entry.nodes.map((node, i) => (
          <NodeRow
            key={node.node.id}
            t={t}
            entry={node}
            index={i}
            width={width}
            hasNext={i < entry.nodes.length - 1}
            rusty={rusty}
            worldUnlocked={entry.unlocked}
            pulse={pulse}
            onPress={onPress}
          />
        ))}
      </View>
    </View>
  );
}

function StreakChip({ t, status }: { t: Translate; status: StreakStatus }) {
  const running = status.mode === 'running';
  return (
    <Chip
      icon={<Flame lit={running} label={t('streak.flame')} />}
      value={running ? `${status.days} ${t(status.days === 1 ? 'streak.day' : 'streak.days')}` : t('map.streakStart')}
      accessibilityLabel={t('streak.flame')}
    />
  );
}

export function WorldMapScreen({ t, completed, stars, streak, today, dailyBest, rustyPrompt, rusty, skippedWarmup, onWarmup, onSkipWarmup, onDaily, onStartNode, onSettings, banner }: WorldMapProps) {
  const model = mapModel(completed, stars);
  const motion = useMotion();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(theme.readableWidth);
  const [lockNote, setLockNote] = useState<string | null>(null);
  const offsets = useRef<{ blocks: Record<string, number>; paths: Record<string, number> }>({ blocks: {}, paths: {} });
  const nextId = model.nextUp?.nodeId;

  // open the map scrolled to the next-up Node
  useEffect(() => {
    if (!model.nextUp) return;
    const world = model.worlds.find((w) => w.world.id === model.nextUp!.worldId)!;
    const index = world.nodes.findIndex((n) => n.node.id === model.nextUp!.nodeId);
    const timer = setTimeout(() => {
      const y = (offsets.current.blocks[world.world.id] ?? 0) + (offsets.current.paths[world.world.id] ?? 0) + index * ROW_HEIGHT;
      scroll.current?.scrollTo({ y: Math.max(0, y - 140), animated: false });
    }, 60);
    return () => clearTimeout(timer);
    // only when the next-up Node changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nextId]);

  useEffect(() => {
    if (!lockNote) return;
    const timer = setTimeout(() => setLockNote(null), 5000);
    return () => clearTimeout(timer);
  }, [lockNote]);

  const press = (entry: MapNode) => {
    if (entry.state !== 'locked') {
      setLockNote(null);
      onStartNode(entry.node);
      return;
    }
    // a locked Node says what is missing and does not start
    setLockNote(lockMessage(entry, t));
  };

  const header = (
    <View>
      <View className="flex-row flex-wrap items-center" style={{ gap: theme.space.sm }}>
        <StreakChip t={t} status={streakStatus(streak, today)} />
        <Chip
          label={t('daily.title')}
          value={dailyBest === undefined ? t('map.dailyNew') : `${dailyBest} ${t('results.scoreOutOf')}`}
          highlight={dailyBest === undefined}
          onPress={onDaily}
          accessibilityLabel={t('daily.title')}
        />
        <Chip value={t('map.settings')} onPress={onSettings} accessibilityLabel={t('map.settings')} />
      </View>
      {lockNote && (
        <Panel className="mt-2">
          <Text className="text-sm text-ink">{lockNote}</Text>
        </Panel>
      )}
    </View>
  );

  return (
    <Screen header={header} scrollRef={scroll}>
      {banner}
      {rustyPrompt && (
        <Panel tone="warn" className="mb-4">
          <Text className="font-display text-lg text-onWarn">{t('rusty.title')}</Text>
          <Text className="mt-1 text-sm text-onWarn">{t('rusty.body')}</Text>
          <Button label={t('rusty.warmup')} onPress={onWarmup} />
          <Button label={t('rusty.skip')} tone="quiet" onPress={onSkipWarmup} />
        </Panel>
      )}
      {skippedWarmup && <Text className="mb-4 text-sm text-accent">{t('rusty.skipped')}</Text>}
      {model.allComplete && <Text className="mb-4 text-sm text-inkMuted">{t('map.allDone')}</Text>}
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {model.worlds.map((world) => (
          <WorldBlock
            key={world.world.id}
            t={t}
            entry={world}
            width={width}
            rusty={rusty}
            pulse={motion.pulse}
            onPress={press}
            onLayout={(e) => (offsets.current.blocks[world.world.id] = e.nativeEvent.layout.y)}
            onPathLayout={(e) => (offsets.current.paths[world.world.id] = e.nativeEvent.layout.y)}
          />
        ))}
      </View>
    </Screen>
  );
}
