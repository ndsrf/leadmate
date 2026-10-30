import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent, type ScrollViewInstance } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useLive } from '../ui/useAppActive';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { Translate } from '../../i18n';
import { mapModel, nextMapChange, type MapStop, type MapWorld, type NodeState } from '../mapModel';
import { streakStatus, type StreakStatus } from '../celebrations';
import type { Stars } from '../stars';
import type { StreakRecord } from '../streak';
import type { DailyBarkdokuSolve } from '../dogRecord';
import { formatClock, solveTimeText } from '../puzzle/engine';
import type { Progress, Stop } from '../world';
import type { DogRecord } from '../dogRecord';
import { isPlus, plusEndsAt } from '../plus';
import { Button } from '../Overlays';
import { Badge, Chip, GearGlyph, IconChip, LightRegion, Panel, ProgressBar, Raised, StarRow } from '../ui/components';
import { WorldSceneryBackground, HouseLandmark } from '../ui/WorldSceneryBackground';
export { HouseLandmark };
import { connector, connectorVisual, labelOnRight, labelWidth, NODE_SIZE, nodeCenterX, nodeVisual, ROW_HEIGHT, stretchFlag, type NodeGlyph } from '../ui/mapLayout';
import { lockMessage, owedItemLabel, stopAccessibilityLabel, stopBadge, stopMarks, worldUnlockBanner, worldWalkSubtitle } from '../mapText';
import { BreedArt } from '../ui/BreedArt';
import type { BreedId } from '../onboarding/breeds';
import type { DogCoat } from '../onboarding/look';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';
import { useMotion } from '../ui/useMotion';
import { Screen } from './Screen';

export interface WorldMapProps {
  t: Translate;
  /** What of the Dog record the trail reads. */
  progress: Progress;
  /** Whose LeadMate Plus the map checks with `isPlus` against its own clock: Plus Worlds open, and close when the trial ends. */
  membership?: Pick<DogRecord, 'onboarding'>;
  stars: Readonly<Record<string, Stars>>;
  /** A fixed clock for the waiting Missions (tests); without it the map keeps its own, see `useMapClock`. */
  now?: Date;
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
  /** Today's first Daily Barkdoku solve, if solved. */
  barkdokuToday?: DailyBarkdokuSolve;
  onBarkdoku?: () => void;
  /** Opens an available Stop by kind: a Lesson, a Node or a Mission. */
  onOpenStop: (stop: Stop) => void;
  /** Where the map was scrolled when a Stop was opened, so returning keeps the place. */
  initialScrollY?: number;
  onScroll?: (y: number) => void;
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
  /** Another screen (Settings, the Library, a Lesson) is shown over the map: its looping animation stands still. */
  covered?: boolean;
}

/** A flame drawn from two rotated drops, so it needs no emoji font; grey when there is no Streak to show. */
export function Flame({ lit, label }: { lit: boolean; label: string }) {
  const color = usePalette();
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

/** The glyph on a Stop's disc: its kind when open (book, controller, paw, flag), a moon while waiting, an hourglass while owed. */
function KindGlyph({ glyph, tint }: { glyph: Exclude<NodeGlyph, 'check' | 'lock'>; tint: string }) {
  const color = usePalette();
  // the tint is the glyph colour that reads on the disc; the faces are paper
  const ink = tint;
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" aria-hidden>
      {glyph === 'book' && (
        <>
          <Path d="M3 5c3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M21 5c-3-1.5-6-1.5-9 0v14c3-1.5 6-1.5 9 0z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
        </>
      )}
      {glyph === 'controller' && (
        <>
          <Path d="M5 8h14a3 3 0 013 3v3a3 3 0 01-5 2l-1-1H8l-1 1a3 3 0 01-5-2v-3a3 3 0 013-3z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M7 10v4M5 12h4" stroke={ink} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx={16} cy={11} r={1.3} fill={ink} />
          <Circle cx={18} cy={13.5} r={1.3} fill={ink} />
        </>
      )}
      {glyph === 'paw' && (
        <>
          <Circle cx={7} cy={9} r={2.2} fill={ink} />
          <Circle cx={10.5} cy={6} r={2.2} fill={ink} />
          <Circle cx={14.5} cy={6} r={2.2} fill={ink} />
          <Circle cx={18} cy={9} r={2.2} fill={ink} />
          <Path d="M12.5 11c3 0 5 3.5 5 5.5 0 2-2 2.5-5 2.5s-5-.5-5-2.5c0-2 2-5.5 5-5.5z" fill={ink} />
        </>
      )}
      {glyph === 'flag' && (
        <>
          <Path d="M6 3v18" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M6 4h12l-3 4 3 4H6z" fill={color.coral} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
        </>
      )}
      {glyph === 'moon' && <Path d="M15 3a9 9 0 100 18 7 7 0 010-18z" fill={color.accent} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />}
      {glyph === 'hourglass' && (
        <>
          <Path d="M6 3h12M6 21h12" stroke={ink} strokeWidth={2.2} strokeLinecap="round" />
          <Path d="M7 3c0 5 5 6 5 9s-5 4-5 9h10c0-5-5-6-5-9s5-4 5-9z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Path d="M9.5 19c.5-2 2.5-3 2.5-3s2 1 2.5 3z" fill={color.coral} />
        </>
      )}
    </Svg>
  );
}

/** The "Tramo N" flag drawn at each Mission, marking the end of a Stretch. */
function StretchFlag({ t, n }: { t: Translate; n: number }) {
  const color = usePalette();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="flex-row items-center"
      style={{ backgroundColor: color.surface, borderWidth: 2, borderColor: color.outline, borderRadius: theme.radius.pill, paddingHorizontal: 6, paddingVertical: 1, gap: 2 }}
    >
      <Text className="font-display text-[10px] font-bold uppercase text-ink">{t('map.stretch').replace('{n}', String(n))}</Text>
    </View>
  );
}

/** The Dog's marker on the map: a paw (kept for compatibility), muted and ringed in amber while Rusty. */
export function PawMarker({ rusty, label }: { rusty: boolean; label: string }) {
  const color = usePalette();
  const fill = rusty ? color.flame : color.brandDeep;
  const toe = { width: 7, height: 8, borderRadius: 4, backgroundColor: color.outline };
  return (
    <View accessibilityLabel={label} className="h-8 w-8 items-center justify-center rounded-game-pill" style={{ backgroundColor: fill, borderWidth: rusty ? 3 : 0, borderColor: color.accent }}>
      <View className="flex-row" style={{ gap: 2, marginBottom: 1 }}>
        <View style={[toe, { marginTop: 3 }]} />
        <View style={toe} />
        <View style={toe} />
        <View style={[toe, { marginTop: 3 }]} />
      </View>
      <View style={{ width: 12, height: 8, borderRadius: 5, backgroundColor: color.outline }} />
    </View>
  );
}

/** The personalized Dog avatar marker beside the Next-Up Node. */
export function MapDogAvatar({
  breed = 'mestizo',
  coat = 'golden',
  rusty = false,
  resting = false,
  label,
}: {
  breed?: BreedId;
  coat?: DogCoat;
  rusty?: boolean;
  /** Waiting at a Mission: drawn lying low and smaller, with a moon. */
  resting?: boolean;
  label: string;
}) {
  const color = usePalette();
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
      <View style={resting ? { transform: [{ scaleY: 0.8 }, { translateY: 5 }] } : undefined}>
        <BreedArt breed={breed} coat={coat} width={resting ? 46 : 52} />
      </View>
      {resting && (
        <View pointerEvents="none" style={{ position: 'absolute', top: -6, right: 0 }}>
          <KindGlyph glyph="moon" tint={color.outline} />
        </View>
      )}
    </View>
  );
}

/** The badge pill below a Stop: [Siguiente], [¿Cómo fue?], or when a waiting Mission opens. */
export function NextUpBadge({ label, quiet = false }: { label: string; quiet?: boolean }) {
  const color = usePalette();
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        backgroundColor: quiet ? color.surface : color.accent,
        borderWidth: 2,
        borderColor: color.outline,
        borderRadius: theme.radius.pill,
        paddingHorizontal: 6,
        paddingVertical: 1,
        alignSelf: 'center',
        marginTop: 2,
      }}
    >
      <Text className={`font-display text-[10px] uppercase font-bold ${quiet ? 'text-ink' : 'text-onAccent'}`}>
        {label}
      </Text>
    </View>
  );
}

/** The longest delay setTimeout keeps; a later check-in is rescheduled when the timer fires. */
const MAX_TIMER_MS = 2 ** 31 - 1;

/**
 * The map's clock, for waiting Missions. It moves only when it matters: on return to the foreground or uncovering,
 * when the Missions change, and once at the next check-in opening or at `wakeAt` (the end of the trial), whichever
 * is first. No timer runs while the map is not `live`.
 */
function useMapClock(live: boolean, missions: Progress['missions'], wakeAt: number | null): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!live) return;
    const current = new Date();
    if (current.getTime() - now.getTime() >= 1000) {
      setNow(current);
      return;
    }
    const next = Math.min(nextMapChange(missions, current)?.getTime() ?? Infinity, wakeAt ?? Infinity);
    if (next === Infinity) return;
    const timer = setTimeout(() => setNow(new Date()), Math.min(next - current.getTime() + 250, MAX_TIMER_MS));
    return () => clearTimeout(timer);
  }, [live, missions, now, wakeAt]);
  return now;
}

/**
 * The one looping animation on the map. Under reduced motion it is a static ring instead; it also stands still
 * while it is not `live` (the app is in the background or the map is covered by another screen).
 */
function NextUpRing({ pulse, live }: { pulse: boolean; live: boolean }) {
  const color = usePalette();
  const phase = useSharedValue(0);
  useEffect(() => {
    if (!pulse || !live) {
      cancelAnimation(phase);
      phase.value = 0;
      return;
    }
    phase.value = withRepeat(withTiming(1, { duration: 1100 }), -1, false);
    return () => cancelAnimation(phase);
  }, [pulse, live, phase]);
  const style = useAnimatedStyle(() => ({ opacity: pulse ? 0.7 * (1 - phase.value) : 1, transform: [{ scale: pulse ? 1 + 0.35 * phase.value : 1 }] }));
  const size = NODE_SIZE + 14;
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: -7, top: -7, width: size, height: size, borderRadius: size / 2, borderWidth: 3, borderStyle: 'dashed', borderColor: color.outline }, style]}
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
  live,
  breed,
  coat,
  dogResting,
  onPress,
}: {
  t: Translate;
  entry: MapStop;
  index: number;
  width: number;
  hasNext: boolean;
  nextState?: NodeState;
  rusty: boolean;
  worldUnlocked: boolean;
  pulse: boolean;
  live: boolean;
  breed?: BreedId;
  coat?: DogCoat;
  /** The Dog rests beside this waiting Mission, because nothing is next-up. */
  dogResting: boolean;
  onPress: (entry: MapStop) => void;
}) {
  const color = usePalette();
  const c = nodeVisual(color, entry.state, entry.kind, entry.optional);
  const shadow = c.glyph === 'lock' ? 0 : theme.depth.sm.x;
  const cx = nodeCenterX(index, width);
  const onRight = labelOnRight(index);
  const seg = connector(index, width);
  const cSeg = connectorVisual(color, entry.state, nextState);
  const title = t(entry.title);
  const state = entry.state;
  const badge = stopBadge(entry, t);
  const flag = stretchFlag(entry.kind, entry.stretch);
  const marks = stopMarks(entry, t);
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
        accessibilityLabel={stopAccessibilityLabel(entry, t)}
        accessibilityState={{ disabled: state === 'locked' }}
        style={{ position: 'absolute', left: cx - nodeSize / 2, top: -offsetDiff, width: nodeSize, height: nodeSize }}
      >
        {c.ring && <NextUpRing pulse={pulse} live={live} />}
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
            borderStyle: c.dashed ? 'dashed' : 'solid',
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
            <KindGlyph glyph={c.glyph} tint={c.ink} />
          )}
        </Raised>
        {(badge || flag) && (
          <View
            pointerEvents="none"
            className="flex-row items-center justify-center"
            style={{ position: 'absolute', top: nodeSize + 2, left: -24, right: -24, gap: 2 }}
          >
            {badge && <NextUpBadge label={badge} quiet={state === 'waiting' || (state === 'owed' && !entry.checkInDue)} />}
            {flag && <StretchFlag t={t} n={flag.label} />}
          </View>
        )}
        {(state === 'next' || dogResting) && (
          <>
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
                resting={dogResting}
                label={rusty ? t('map.dogRusty') : t(dogResting ? 'map.dogWaiting' : 'map.dog')}
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
        <Text className="text-caption text-inkMuted" style={{ textAlign: onRight ? 'left' : 'right' }}>
          {[t(`map.stop.${entry.kind}`), ...marks].join(' · ')}
        </Text>
        {state === 'done' && entry.stars !== undefined && <StarRow stars={entry.stars} size={16} label={`${entry.stars} ${t('map.starsOf3')}`} />}
      </Pressable>
    </View>
  );
}

/** "Cerrar el mundo": the World's Owed Missions, each opening its Mission, shown at the end of its region. */
function CloseWorldPanel({ t, owed, onPress }: { t: Translate; owed: MapStop[]; onPress: (entry: MapStop) => void }) {
  const color = usePalette();
  return (
    <Panel tone="warn" className="mt-3">
      <Text className="font-display text-title text-ink">{t('map.closeWorld.title')}</Text>
      <Text className="mt-1 text-body text-ink">{t('map.closeWorld.body')}</Text>
      {owed.map((entry) => (
        <Pressable
          key={entry.stop.id}
          onPress={() => handlePress(() => onPress(entry))}
          accessibilityRole="button"
          accessibilityLabel={`${owedItemLabel(entry, t)}. ${t('map.owed')}`}
          className="mt-2 rounded-card bg-surface p-3"
          style={{ borderWidth: theme.border.ink, borderColor: color.outline }}
        >
          <Text className="flex-1 text-body text-ink">{owedItemLabel(entry, t)}</Text>
        </Pressable>
      ))}
    </Panel>
  );
}

/** Compact collapsed header for subsequent locked Worlds. */
function CollapsedWorldHeader({
  t,
  entry,
  isExpanded,
  onToggle,
}: {
  t: Translate;
  entry: MapWorld;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = usePalette();
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
            style={{ width: 36, height: 36, borderWidth: theme.border.ink, borderColor: color.outline }}
          >
            <LockIcon tint={color.ink} />
          </View>
          <View className="shrink flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-display text-title text-ink">{t(entry.world.title)}</Text>
              {entry.tier === 'plus' && <Badge label={t('world.plusBadge')} tone="accent" />}
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

type WorldBlockProps = {
  t: Translate;
  entry: MapWorld;
  width: number;
  rusty: boolean;
  pulse: boolean;
  live: boolean;
  isFirstLocked: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPressNode: (n: MapStop) => void;
  /** The waiting Mission the Dog rests at, when nothing is next-up. */
  restingAt?: Stop;
  onPressPaywall: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  onPathLayout: (e: LayoutChangeEvent) => void;
  breed?: BreedId;
  coat?: DogCoat;
};

/** A world's header and trail sit on its scenery, so they stay Light whatever the Appearance. */
function WorldBlock(props: WorldBlockProps) {
  const active = props.entry.unlocked || props.isFirstLocked || props.isExpanded;
  return (
    <LightRegion className={active ? 'mb-6' : undefined} onLayout={props.onLayout} style={active ? { opacity: props.entry.unlocked ? 1 : 0.9 } : undefined}>
      <WorldArena {...props} />
    </LightRegion>
  );
}

function WorldArena({
  t,
  entry,
  width,
  rusty,
  pulse,
  live,
  isFirstLocked,
  isExpanded,
  onToggleExpand,
  onPressNode,
  onPressPaywall,
  onPathLayout,
  breed,
  coat,
  restingAt,
}: WorldBlockProps) {
  const color = usePalette();
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
    return <CollapsedWorldHeader t={t} entry={entry} isExpanded={isExpanded} onToggle={onToggleExpand} />;
  }

  return (
    <>
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
          style={{ width: 40, height: 40, borderWidth: theme.border.ink, borderColor: color.outline }}
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
          style={{ borderWidth: theme.border.ink, borderColor: color.outline }}
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
          borderColor: color.outline,
          borderRadius: theme.radius.lg,
          backgroundColor: palette.sky,
          paddingTop: 16,
        }}
      >
        <WorldSceneryBackground
          worldId={entry.world.id}
          worldNumber={entry.world.worldNumber}
          palette={palette}
          stopCount={entry.stops.length}
          isExpandedPreview={entry.preview && entry.stops.length === 0}
        />

        {entry.preview && entry.stops.length === 0 ? (
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
          <View onLayout={onPathLayout} style={{ height: entry.stops.length * ROW_HEIGHT, paddingHorizontal: 0 }}>
            {entry.stops.map((stop, i) => (
              <NodeRow
                key={`${stop.stop.kind}:${stop.stop.id}`}
                t={t}
                entry={stop}
                index={i}
                width={width - 2 * theme.border.ink}
                hasNext={i < entry.stops.length - 1}
                nextState={entry.stops[i + 1]?.state}
                dogResting={!!restingAt && restingAt.kind === stop.stop.kind && restingAt.id === stop.stop.id}
                rusty={rusty}
                worldUnlocked={entry.unlocked}
                pulse={pulse}
                live={live}
                breed={breed}
                coat={coat}
                onPress={onPressNode}
              />
            ))}
          </View>
        )}
      </View>
      {entry.owed.length > 0 && <CloseWorldPanel t={t} owed={entry.owed} onPress={onPressNode} />}
    </>
  );
}

/** The streak, which also opens the Diary. */
function StreakChip({ t, status, onPress }: { t: Translate; status: StreakStatus; onPress: () => void }) {
  const running = status.mode === 'running';
  return (
    <Chip
      icon={<Flame lit={running} label={t('streak.flame')} />}
      value={running ? `${status.days} ${t(status.days === 1 ? 'streak.day' : 'streak.days')}` : t('map.streakStart')}
      onPress={onPress}
      accessibilityLabel={`${t('streak.flame')}. ${t('diary.chip')}`}
    />
  );
}

/** The Daily Barkdoku chip: "new" until today's first solve, then its Daily Solve Time against the Target Time. */
export function BarkdokuChip({ t, solve, onPress }: { t: Translate; solve?: DailyBarkdokuSolve; onPress?: () => void }) {
  const name = t('map.barkdoku.daily');
  if (!solve) return <Chip label={name} value={t('map.dailyNew')} highlight onPress={onPress} accessibilityLabel={`${name}. ${t('map.barkdoku.dailyHelp')}`} />;
  const time = formatClock(solve.seconds);
  const met = solve.targetSeconds !== undefined && solve.seconds <= solve.targetSeconds;
  const spoken =
    solve.targetSeconds === undefined
      ? t('minigame.barkdoku.clockLabel').replace('{time}', time)
      : t('minigame.barkdoku.clockLabelTarget').replace('{time}', time).replace('{target}', formatClock(solve.targetSeconds));
  return <Chip label={name} value={solveTimeText(solve.seconds, solve.targetSeconds)} onPress={onPress} accessibilityLabel={`${name}. ${spoken}${met ? `. ${t('minigame.barkdoku.targetMet')}` : ''}`} />;
}

export function WorldMapScreen({
  t,
  progress,
  membership,
  stars,
  now,
  streak,
  today,
  dailyBest,
  rustyPrompt,
  rusty,
  skippedWarmup,
  onWarmup,
  onSkipWarmup,
  onDaily,
  barkdokuToday,
  onBarkdoku,
  onOpenStop,
  initialScrollY,
  onScroll,
  onSettings,
  libraryToday = false,
  onLibrary = () => {},
  onDiary = () => {},
  banner,
  breed,
  coat,
  onPaywall = () => {},
  covered = false,
}: WorldMapProps) {
  const color = usePalette();
  const motion = useMotion();
  const live = useLive(covered);
  const plusEnd = membership ? (plusEndsAt(membership, new Date())?.getTime() ?? null) : null;
  const clock = useMapClock(live, progress.missions, plusEnd);
  const at = now ?? clock;
  const plus = !!membership && isPlus(membership, at);
  const model = useMemo(() => mapModel(plus ? { ...progress, plus } : progress, stars, at), [progress, plus, stars, at]);
  const scroll = useRef<ScrollViewInstance>(null);
  const [width, setWidth] = useState(theme.size.readableWidth);
  const [lockNote, setLockNote] = useState<string | null>(null);
  const [expandedWorlds, setExpandedWorlds] = useState<Record<string, boolean>>({});
  const offsets = useRef<{ blocks: Record<string, number>; paths: Record<string, number> }>({ blocks: {}, paths: {} });
  const focus = model.nextUp ?? model.waitingAt ?? null;
  const focusKey = focus ? `${focus.worldId}:${focus.stop.kind}:${focus.stop.id}` : undefined;

  const firstLockedWorldId = model.worlds.find((w) => !w.unlocked)?.world.id;

  // open the map where the user left it, or else scrolled to the next-up Stop (or the waiting Mission)
  useEffect(() => {
    if (initialScrollY !== undefined) {
      const timer = setTimeout(() => scroll.current?.scrollTo({ y: initialScrollY, animated: false }), 60);
      return () => clearTimeout(timer);
    }
    if (!focus) return;
    const world = model.worlds.find((w) => w.world.id === focus.worldId);
    if (!world) return;
    const index = world.stops.findIndex((s) => s.stop.kind === focus.stop.kind && s.stop.id === focus.stop.id);
    if (index === -1) return;
    const timer = setTimeout(() => {
      const y = (offsets.current.blocks[world.world.id] ?? 0) + (offsets.current.paths[world.world.id] ?? 0) + index * ROW_HEIGHT;
      scroll.current?.scrollTo({ y: Math.max(0, y - 140), animated: false });
    }, 60);
    return () => clearTimeout(timer);
    // only when the next-up Stop changes, not on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusKey]);

  useEffect(() => {
    if (!lockNote) return;
    const timer = setTimeout(() => setLockNote(null), 5000);
    return () => clearTimeout(timer);
  }, [lockNote]);

  const press = (entry: MapStop) => {
    if (entry.state !== 'locked') {
      setLockNote(null);
      onOpenStop(entry.stop);
      return;
    }
    setLockNote(lockMessage(entry, t));
  };

  const toggleExpand = (worldId: string) => {
    setExpandedWorlds((prev) => ({ ...prev, [worldId]: !prev[worldId] }));
  };

  const header = (
    <View>
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <View className="shrink">
          <StreakChip t={t} status={streakStatus(streak, today)} onPress={onDiary} />
        </View>
        <IconChip icon={<GearGlyph />} onPress={onSettings} accessibilityLabel={t('map.settings')} />
      </View>
      <View className="mt-2 flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        <Chip
          label={t('daily.title')}
          value={dailyBest === undefined ? t('map.dailyNew') : `${dailyBest} ${t('results.scoreOutOf')}`}
          highlight={dailyBest === undefined}
          onPress={onDaily}
          accessibilityLabel={t('daily.title')}
        />
        <BarkdokuChip t={t} solve={barkdokuToday} onPress={onBarkdoku} />
        <Chip
          label={libraryToday ? t('library.chipToday') : undefined}
          value={t('library.chip')}
          icon={libraryToday ? <View className="mr-2 h-3 w-3 rounded-game-pill bg-accent" style={{ borderWidth: 2, borderColor: color.outline }} /> : undefined}
          onPress={onLibrary}
          accessibilityLabel={libraryToday ? `${t('library.chip')}. ${t('library.chipToday')}` : t('library.chip')}
        />
        <Chip value={t('diary.chip')} onPress={onDiary} accessibilityLabel={t('diary.chip')} />
      </View>
      {lockNote && (
        <Panel className="mt-2">
          <Text className="text-body text-ink">{lockNote}</Text>
        </Panel>
      )}
    </View>
  );

  return (
    <Screen header={header} scrollRef={scroll} onScroll={onScroll ? (e) => onScroll(e.nativeEvent.contentOffset.y) : undefined}>
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
            live={live}
            isFirstLocked={world.world.id === firstLockedWorldId}
            isExpanded={!!expandedWorlds[world.world.id]}
            onToggleExpand={() => toggleExpand(world.world.id)}
            onPressNode={press}
            onPressPaywall={onPaywall}
            onLayout={(e) => (offsets.current.blocks[world.world.id] = e.nativeEvent.layout.y)}
            onPathLayout={(e) => (offsets.current.paths[world.world.id] = e.nativeEvent.layout.y)}
            breed={breed}
            coat={coat}
            restingAt={model.waitingAt?.worldId === world.world.id ? model.waitingAt.stop : undefined}
          />
        ))}
      </View>
    </Screen>
  );
}
