import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent, type ScrollView } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { useAppActive } from '../ui/useAppActive';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { Translate } from '../../i18n';
import type { NodeDef } from '../nodes/node';
import { mapModel, type MapNode, type MapWorld } from '../mapModel';
import { streakStatus, type StreakStatus } from '../celebrations';
import type { Stars } from '../stars';
import type { StreakRecord } from '../streak';
import { Button } from '../Overlays';
import { Badge, Chip, Panel, ProgressBar, Raised, StarRow } from '../ui/components';
import { connector, connectorVisual, labelOnRight, labelWidth, NODE_SIZE, nodeCenterX, nodeVisual, ROW_HEIGHT } from '../ui/mapLayout';
import { lockMessage, worldUnlockBanner, worldWalkSubtitle } from '../mapText';
import { BreedArt } from '../ui/BreedArt';
import type { BreedId } from '../onboarding/breeds';
import type { DogCoat } from '../onboarding/look';
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
  /** A Lesson is "for today": the Library chip shows a dot and a label. */
  libraryToday?: boolean;
  onLibrary?: () => void;
  /** Opens the Diary. */
  onDiary?: () => void;
  /** A non-blocking account card to show above the map, if any. */
  banner?: React.ReactNode;
  /** The Dog's breed, for drawing the avatar on the map. */
  breed?: BreedId;
  /** The Dog's coat, for drawing the avatar on the map. */
  coat?: DogCoat;
  /** Callback to navigate to PaywallScreen when a Plus element is tapped. */
  onPaywall?: () => void;
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
    transform: [{ rotate: '-45deg' as const }],
  });
  return (
    <View accessibilityLabel={label} className="mr-2 h-8 w-6 items-center justify-end" style={{ opacity: lit ? 1 : 0.35 }}>
      <View style={drop(20, color.flame)} />
      <View style={[drop(11, color.accent), { position: 'absolute', bottom: 4 }]} />
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

/** Play triangle glyph for open and next-up nodes. */
function PlayGlyph({ tint }: { tint: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 20 20" aria-hidden>
      <Path d="M6 4l11 6-11 6z" fill={tint} stroke={color.ink} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

/** The Dog's marker on the map: a paw (kept for compatibility), muted and ringed in amber while Rusty. */
export function PawMarker({ rusty, label }: { rusty: boolean; label: string }) {
  const fill = rusty ? color.flame : color.brandDeep;
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

/** The personalized Dog avatar marker beside the Next-Up Node. */
export function MapDogAvatar({
  breed = 'mestizo',
  coat = 'golden',
  rusty = false,
  label,
}: {
  breed?: BreedId;
  coat?: DogCoat;
  rusty?: boolean;
  label: string;
}) {
  return (
    <View
      accessibilityLabel={label}
      accessible={true}
      className="items-center justify-center"
      style={{ width: 56, height: 44 }}
    >
      {rusty && (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: 54,
            height: 38,
            borderRadius: 19,
            backgroundColor: color.flame,
            opacity: 0.35,
            borderWidth: 2,
            borderColor: color.accent,
          }}
        />
      )}
      <BreedArt breed={breed} coat={coat} width={52} />
    </View>
  );
}

/** The [Siguiente] badge pill below the Next-Up Node. */
export function NextUpBadge({ label }: { label: string }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: color.accent,
        borderWidth: 2,
        borderColor: color.ink,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 6,
        paddingVertical: 1,
        alignSelf: 'center',
        marginTop: 2,
      }}
    >
      <Text className="font-display text-[10px] uppercase font-bold text-ink">
        {label}
      </Text>
    </View>
  );
}

/** Starting house landmark at the beginning of World 1 (Board 11). */
export function HouseLandmark() {
  const ink = color.ink;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center mb-3"
    >
      <Svg width={44} height={40} viewBox="0 0 44 40" aria-hidden>
        <Path d="M22 4L4 18h36z" fill={color.coral} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        <Rect x={30} y={6} width={5} height={10} fill={color.inkMuted} stroke={ink} strokeWidth={2} />
        <Rect x={8} y={18} width={28} height={18} rx={2} fill={color.surface} stroke={ink} strokeWidth={2.4} />
        <Rect x={18} y={24} width={8} height={12} rx={1} fill={color.brandDeep} stroke={ink} strokeWidth={1.8} />
        <Circle cx={13} cy={23} r={3} fill={color.accent} stroke={ink} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

/** Decorative paper-cut scenery dots along active world trail borders. */
function SceneryBushes({ palette }: { palette: { ground: string; sky: string } }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <View style={{ position: 'absolute', left: 16, top: 40, width: 12, height: 12, borderRadius: 6, backgroundColor: palette.ground, opacity: 0.6, borderWidth: 1.5, borderColor: color.ink }} />
      <View style={{ position: 'absolute', right: 20, top: 110, width: 16, height: 16, borderRadius: 8, backgroundColor: palette.ground, opacity: 0.5, borderWidth: 1.5, borderColor: color.ink }} />
      <View style={{ position: 'absolute', left: 24, top: 220, width: 14, height: 14, borderRadius: 7, backgroundColor: palette.ground, opacity: 0.55, borderWidth: 1.5, borderColor: color.ink }} />
    </View>
  );
}

/** The one looping animation on the map. Under reduced motion it is a static ring instead. */
function NextUpRing({ pulse }: { pulse: boolean }) {
  const phase = useSharedValue(0);
  const active = useAppActive();
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
      style={[{ position: 'absolute', left: -7, top: -7, width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderStyle: 'dashed', borderColor: color.ink }, style]}
    />
  );
}

function NodeRow({
  t,
  entry,
  index,
  width,
  hasNext,
  nextState,
  rusty,
  worldUnlocked,
  pulse,
  breed,
  coat,
  onPress,
}: {
  t: Translate;
  entry: MapNode;
  index: number;
  width: number;
  hasNext: boolean;
  nextState?: 'locked' | 'open' | 'next' | 'done';
  rusty: boolean;
  worldUnlocked: boolean;
  pulse: boolean;
  breed?: BreedId;
  coat?: DogCoat;
  onPress: (entry: MapNode) => void;
}) {
  const c = nodeVisual(entry.state);
  const shadow = c.glyph === 'lock' ? 0 : theme.depth.sm.x;
  const cx = nodeCenterX(index, width);
  const onRight = labelOnRight(index);
  const seg = connector(index, width);
  const cSeg = connectorVisual(entry.state, nextState);
  const title = t(entry.node.title);
  const state = entry.state;
  const stateText = state === 'done' ? t('map.nodeDone') : state === 'next' ? t('map.nodeNext') : state === 'locked' ? t('map.nodeLocked') : '';
  const nodeSize = NODE_SIZE * c.scale;
  const offsetDiff = (nodeSize - NODE_SIZE) / 2;

  return (
    <View style={{ height: ROW_HEIGHT }}>
      {hasNext && (
        <>
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: seg.left - cSeg.outerWidth / 2,
              top: seg.top - seg.length / 2,
              width: cSeg.outerWidth,
              height: seg.length,
              borderRadius: cSeg.outerWidth / 2,
              backgroundColor: cSeg.outerColor,
              opacity: state === 'locked' ? 0.5 : 1,
              borderStyle: cSeg.kind === 'dashed' ? 'dashed' : 'solid',
              borderWidth: cSeg.kind === 'dashed' ? 2 : 0,
              transform: [{ rotate: `${seg.angle}deg` }],
            }}
          />
          {cSeg.kind === 'solid' && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: seg.left - cSeg.innerWidth / 2,
                top: seg.top - seg.length / 2,
                width: cSeg.innerWidth,
                height: seg.length,
                borderRadius: cSeg.innerWidth / 2,
                backgroundColor: cSeg.innerColor,
                transform: [{ rotate: `${seg.angle}deg` }],
              }}
            />
          )}
        </>
      )}
      <Pressable
        onPress={() => handlePress(() => onPress(entry))}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${stateText}`.trim()}
        accessibilityState={{ disabled: state === 'locked' }}
        style={{ position: 'absolute', left: cx - nodeSize / 2, top: -offsetDiff, width: nodeSize, height: nodeSize }}
      >
        {c.ring && <NextUpRing pulse={pulse} />}
        <Raised
          fill={c.fill}
          edge={c.edge}
          radius={nodeSize / 2}
          offset={shadow}
          faceStyle={{
            width: nodeSize - shadow,
            height: nodeSize - shadow,
            alignItems: 'center',
            justifyContent: 'center',
            borderStyle: c.glyph === 'lock' ? 'dashed' : 'solid',
            opacity: worldUnlocked ? 1 : 0.7,
          }}
        >
          {c.glyph === 'lock' ? (
            <LockIcon tint={c.ink} />
          ) : c.glyph === 'check' ? (
            <Text className="font-display text-displayM" style={{ color: c.ink }}>
              ✓
            </Text>
          ) : (
            <PlayGlyph tint={c.ink} />
          )}
        </Raised>
        {state === 'next' && (
          <>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: nodeSize + 2,
                left: -10,
                right: -10,
                alignItems: 'center',
              }}
            >
              <NextUpBadge label={t('map.badgeNext')} />
            </View>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: -18,
                right: -24,
              }}
            >
              <MapDogAvatar
                breed={breed}
                coat={coat}
                rusty={rusty}
                label={rusty ? t('map.dogRusty') : t('map.dog')}
              />
            </View>
          </>
        )}
      </Pressable>
      <Pressable
        onPress={() => handlePress(() => onPress(entry))}
        accessible={false}
        importantForAccessibility="no"
        style={{
          position: 'absolute',
          top: 0,
          minHeight: NODE_SIZE,
          justifyContent: 'center',
          width: labelWidth(index, width),
          ...(onRight ? { left: cx + NODE_SIZE / 2 + 12 } : { left: cx - NODE_SIZE / 2 - 12 - labelWidth(index, width) }),
          alignItems: onRight ? 'flex-start' : 'flex-end',
        }}
      >
        <Text className={`font-display text-body ${state === 'locked' ? 'text-inkMuted' : 'text-ink'}`} style={{ textAlign: onRight ? 'left' : 'right' }}>
          {title}
        </Text>
        {state === 'done' && entry.stars !== undefined && <StarRow stars={entry.stars} size={16} label={`${entry.stars} ${t('map.starsOf3')}`} />}
        {state === 'next' && <Text className="font-display text-caption text-ink">{t('map.nodeNext')}</Text>}
      </Pressable>
    </View>
  );
}

/** Compact collapsed header for subsequent locked Worlds. */
function CollapsedWorldHeader({
  t,
  entry,
  isExpanded,
  onToggle,
  onPaywall,
}: {
  t: Translate;
  entry: MapWorld;
  isExpanded: boolean;
  onToggle: () => void;
  onPaywall: () => void;
}) {
  const palette =
    theme.world[`w${entry.world.worldNumber}` as keyof typeof theme.world] ??
    (entry.world.worldNumber % 4 === 1
      ? theme.world.w1
      : entry.world.worldNumber % 4 === 2
        ? theme.world.w2
        : entry.world.worldNumber % 4 === 3
          ? theme.world.w3
          : theme.world.w4);

  return (
    <View className="mb-3">
      <Pressable
        onPress={() => handlePress(onToggle)}
        accessibilityRole="button"
        accessibilityLabel={`${t(entry.world.title)}. ${t(isExpanded ? 'map.collapsePreview' : 'map.openPreview')}`}
      >
        <Raised
          fill={palette.sky}
          radius={theme.radius.lg}
          offset={theme.depth.rest.x}
          faceStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space[3],
            paddingHorizontal: 14,
            paddingVertical: 12,
            opacity: 0.9,
          }}
        >
          <View
            className="items-center justify-center rounded-game-pill bg-surface"
            style={{ width: 36, height: 36, borderWidth: theme.border.ink, borderColor: color.ink }}
          >
            <LockIcon tint={color.ink} />
          </View>
          <View className="shrink flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-display text-title text-ink">{t(entry.world.title)}</Text>
              {entry.tier === 'plus' && (
                <Pressable
                  onPress={() => handlePress(onPaywall)}
                  accessibilityRole="button"
                  accessibilityLabel={t('world.plusBadge')}
                >
                  <Badge label={t('world.plusBadge')} tone="accent" />
                </Pressable>
              )}
            </View>
            <Text className="text-caption text-inkMuted">
              {t(entry.topics)}
            </Text>
          </View>
          <Text className="font-display text-body text-inkMuted">
            {isExpanded ? '▲' : '▼'}
          </Text>
        </Raised>
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
  isFirstLocked,
  isExpanded,
  onToggleExpand,
  onPressNode,
  onPressPaywall,
  onLayout,
  onPathLayout,
  breed,
  coat,
}: {
  t: Translate;
  entry: MapWorld;
  width: number;
  rusty: boolean;
  pulse: boolean;
  isFirstLocked: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPressNode: (n: MapNode) => void;
  onPressPaywall: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onPathLayout: (e: LayoutChangeEvent) => void;
  breed?: BreedId;
  coat?: DogCoat;
}) {
  const isArenaActive = entry.unlocked || isFirstLocked || isExpanded;
  const palette =
    theme.world[`w${entry.world.worldNumber}` as keyof typeof theme.world] ??
    (entry.world.worldNumber % 4 === 1
      ? theme.world.w1
      : entry.world.worldNumber % 4 === 2
        ? theme.world.w2
        : entry.world.worldNumber % 4 === 3
          ? theme.world.w3
          : theme.world.w4);

  if (!isArenaActive) {
    return (
      <View onLayout={onLayout}>
        <CollapsedWorldHeader
          t={t}
          entry={entry}
          isExpanded={isExpanded}
          onToggle={onToggleExpand}
          onPaywall={onPressPaywall}
        />
      </View>
    );
  }

  return (
    <View className="mb-6" onLayout={onLayout} style={{ opacity: entry.unlocked ? 1 : 0.9 }}>
      <Raised
        fill={palette.sky}
        radius={theme.radius.lg}
        offset={theme.depth.rest.x}
        className="mb-3"
        faceStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space[3],
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <View
          className="items-center justify-center rounded-game-pill bg-surface"
          style={{ width: 40, height: 40, borderWidth: theme.border.ink, borderColor: color.ink }}
        >
          {entry.unlocked ? (
            <Text className="font-display text-title text-ink">{entry.world.worldNumber}</Text>
          ) : (
            <LockIcon tint={color.ink} />
          )}
        </View>
        <View className="shrink flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="font-display text-title text-ink">{t(entry.world.title)}</Text>
            {entry.tier === 'plus' && (
              <Pressable
                onPress={() => handlePress(onPressPaywall)}
                accessibilityRole="button"
                accessibilityLabel={t('world.plusBadge')}
              >
                <Badge label={t('world.plusBadge')} tone="accent" />
              </Pressable>
            )}
          </View>
          <Text className="text-caption text-inkMuted">
            {worldWalkSubtitle(entry, t)} · {t(entry.topics)}
          </Text>
        </View>
      </Raised>

      {entry.unlocked && !entry.preview && <ProgressBar value={entry.done} max={entry.total} className="mb-3" />}

      {isFirstLocked && (
        <View
          className="mb-3 p-3 rounded-card bg-surface flex-row items-center"
          style={{ borderWidth: theme.border.ink, borderColor: color.ink }}
        >
          <Text className="mr-2 text-title">🔒</Text>
          <Text className="text-body text-ink flex-1">
            {worldUnlockBanner(entry, t)}
          </Text>
          {entry.tier === 'plus' && (
            <Button
              label={t('world.plusBadge')}
              tone="accent"
              onPress={onPressPaywall}
            />
          )}
        </View>
      )}

      <View
        className="overflow-hidden"
        style={{
          borderWidth: theme.border.ink,
          borderColor: color.ink,
          borderRadius: theme.radius.lg,
          backgroundColor: palette.sky,
          paddingTop: 16,
        }}
      >
        <SceneryBushes palette={palette} />
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 56, backgroundColor: palette.ground, opacity: 0.55 }}
        />

        {entry.world.worldNumber === 1 && <HouseLandmark />}

        {entry.preview && entry.nodes.length === 0 ? (
          <View className="p-6 items-center justify-center">
            <Badge label={t('world.previewBadge')} tone="accent" />
            <Text className="mt-3 font-display text-title text-ink text-center">
              {t('map.plusTeaserTitle')}
            </Text>
            <Text className="mt-1 mb-4 text-body text-inkMuted text-center">
              {t('map.plusTeaserBody')}
            </Text>
            <Button
              label={t('paywall.badge')}
              onPress={onPressPaywall}
            />
          </View>
        ) : (
          <View onLayout={onPathLayout} style={{ height: entry.nodes.length * ROW_HEIGHT, paddingHorizontal: 0 }}>
            {entry.nodes.map((node, i) => (
              <NodeRow
                key={node.node.id}
                t={t}
                entry={node}
                index={i}
                width={width - 2 * theme.border.ink}
                hasNext={i < entry.nodes.length - 1}
                nextState={entry.nodes[i + 1]?.state}
                rusty={rusty}
                worldUnlocked={entry.unlocked}
                pulse={pulse}
                breed={breed}
                coat={coat}
                onPress={onPressNode}
              />
            ))}
          </View>
        )}
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

export function WorldMapScreen({
  t,
  completed,
  stars,
  streak,
  today,
  dailyBest,
  rustyPrompt,
  rusty,
  skippedWarmup,
  onWarmup,
  onSkipWarmup,
  onDaily,
  onStartNode,
  onSettings,
  libraryToday = false,
  onLibrary = () => {},
  onDiary = () => {},
  banner,
  breed,
  coat,
  onPaywall = () => {},
}: WorldMapProps) {
  const model = mapModel(completed, stars);
  const motion = useMotion();
  const scroll = useRef<ScrollView>(null);
  const [width, setWidth] = useState(theme.size.readableWidth);
  const [lockNote, setLockNote] = useState<string | null>(null);
  const [expandedWorlds, setExpandedWorlds] = useState<Record<string, boolean>>({});
  const offsets = useRef<{ blocks: Record<string, number>; paths: Record<string, number> }>({ blocks: {}, paths: {} });
  const nextId = model.nextUp?.nodeId;

  const firstLockedWorldId = model.worlds.find((w) => !w.unlocked)?.world.id;

  // open the map scrolled to the next-up Node
  useEffect(() => {
    if (!model.nextUp) return;
    const world = model.worlds.find((w) => w.world.id === model.nextUp!.worldId);
    if (!world) return;
    const index = world.nodes.findIndex((n) => n.node.id === model.nextUp!.nodeId);
    if (index === -1) return;
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
    setLockNote(lockMessage(entry, t));
  };

  const toggleExpand = (worldId: string) => {
    setExpandedWorlds((prev) => ({ ...prev, [worldId]: !prev[worldId] }));
  };

  const header = (
    <View>
      <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        <StreakChip t={t} status={streakStatus(streak, today)} />
        <Chip
          label={t('daily.title')}
          value={dailyBest === undefined ? t('map.dailyNew') : `${dailyBest} ${t('results.scoreOutOf')}`}
          highlight={dailyBest === undefined}
          onPress={onDaily}
          accessibilityLabel={t('daily.title')}
        />
        <Chip
          label={libraryToday ? t('library.chipToday') : undefined}
          value={t('library.chip')}
          icon={libraryToday ? <View className="mr-2 h-3 w-3 rounded-game-pill bg-accent" style={{ borderWidth: 2, borderColor: color.ink }} /> : undefined}
          onPress={onLibrary}
          accessibilityLabel={libraryToday ? `${t('library.chip')}. ${t('library.chipToday')}` : t('library.chip')}
        />
        <Chip value={t('diary.chip')} onPress={onDiary} accessibilityLabel={t('diary.chip')} />
        <Chip value={t('map.settings')} onPress={onSettings} accessibilityLabel={t('map.settings')} />
      </View>
      {lockNote && (
        <Panel className="mt-2">
          <Text className="text-body text-ink">{lockNote}</Text>
        </Panel>
      )}
    </View>
  );

  return (
    <Screen header={header} scrollRef={scroll}>
      {banner}
      {rustyPrompt && (
        <Panel tone="warn" className="mb-4">
          <Text className="font-display text-title text-ink">{t('rusty.title')}</Text>
          <Text className="mt-1 text-body text-ink">{t('rusty.body')}</Text>
          <Button label={t('rusty.warmup')} onPress={onWarmup} />
          <Button label={t('rusty.skip')} tone="quiet" onPress={onSkipWarmup} />
        </Panel>
      )}
      {skippedWarmup && <Text className="mb-4 text-body text-ink">{t('rusty.skipped')}</Text>}
      {model.allComplete && <Text className="mb-4 text-body text-inkMuted">{t('map.allDone')}</Text>}
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {model.worlds.map((world) => (
          <WorldBlock
            key={world.world.id}
            t={t}
            entry={world}
            width={width}
            rusty={rusty}
            pulse={motion.pulse}
            isFirstLocked={world.world.id === firstLockedWorldId}
            isExpanded={!!expandedWorlds[world.world.id]}
            onToggleExpand={() => toggleExpand(world.world.id)}
            onPressNode={press}
            onPressPaywall={onPaywall}
            onLayout={(e) => (offsets.current.blocks[world.world.id] = e.nativeEvent.layout.y)}
            onPathLayout={(e) => (offsets.current.paths[world.world.id] = e.nativeEvent.layout.y)}
            breed={breed}
            coat={coat}
          />
        ))}
      </View>
    </Screen>
  );
}
