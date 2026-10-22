import { useEffect, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { COLLAR_POINT, DOG_VIEW, HANDLER_LEAN_DEG, HANDLER_PALETTE, HANDLER_PIVOT, handlerHand, leashPath, postureSpec, tensionTone, type CaninePosture } from './canine';
import { Raised } from './components';
import { buttonStyle } from './styles';
import { color, theme } from './theme';
import { useMotion } from './useMotion';

/** Every scene is drawn in these units and scaled to the screen width. */
const SCENE = { w: 320, h: 190 } as const;
const DOG_W = 130;
const DOG_H = (DOG_W * DOG_VIEW.h) / DOG_VIEW.w;
/** Dog drawing units to scene units. */
const DOG_SCALE = DOG_W / DOG_VIEW.w;
const GROUND_Y = 100 * (DOG_H / DOG_VIEW.h);

const pctX = (x: number) => `${(x / SCENE.w) * 100}%` as const;
const pctY = (y: number) => `${(y / SCENE.h) * 100}%` as const;

/** A scene frame: a rounded, clipped stage whose height follows its width. */
function Stage({ children, onLayout }: { children: React.ReactNode; onLayout?: (e: LayoutChangeEvent) => void }) {
  return (
    <View onLayout={onLayout} style={{ width: '100%', aspectRatio: SCENE.w / SCENE.h, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: color.surfaceSunken, borderWidth: theme.border.ink, borderColor: color.ink }}>
      {children}
    </View>
  );
}

const fill = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const;

/** A chime ripple pulsing out of the bell while it rings. */
function BellRipple({ ringing, x, y }: { ringing: boolean; x: number; y: number }) {
  const { reduced } = useMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (ringing && !reduced) pulse.value = withRepeat(withTiming(1, { duration: 650 }), -1, false);
    else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
    return () => cancelAnimation(pulse);
  }, [ringing, reduced, pulse]);
  const style = useAnimatedStyle(() => ({ opacity: ringing ? (reduced ? 0.7 : 0.8 * (1 - pulse.value)) : 0, transform: [{ scale: 0.6 + pulse.value * 1.6 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: pctX(x), top: pctY(y), width: 30, height: 30, marginLeft: -15, marginTop: -15, borderRadius: 15, borderWidth: 3, borderColor: color.accent }, style]} />;
}

/** The posture a Dog takes decides where it stands in the Doorbell scene. */
const AT_DOOR: readonly CaninePosture[] = ['standing_waiting', 'alert_barking'];
const DOOR_DOG_X = 44;
const MAT_DOG_X = 170;

/**
 * The Doorbell Mat scene: door and bell on the left, the mat on the right. The Dog stands and barks at
 * the door, then walks to the mat and lies down; the mat lights up while it settles.
 */
export function DoorbellScene({ t, posture, ringing, coat }: { t: Translate; posture: CaninePosture; ringing: boolean; coat: DogCoat }) {
  const [width, setWidth] = useState(0);
  const atDoor = AT_DOOR.includes(posture);
  const x = useSharedValue(DOOR_DOG_X);
  useEffect(() => {
    x.value = withTiming(atDoor ? DOOR_DOG_X : MAT_DOG_X, { duration: atDoor ? 250 : 1100 });
  }, [atDoor, x]);
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: (x.value / SCENE.w) * width }] }));
  const matActive = posture === 'settling_towards_mat' || posture === 'calm_sphinx_on_mat';
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessibilityLabel={t(ringing ? 'minigame.doorRinging' : 'minigame.door')}>
        <Rect x={0} y={0} width={SCENE.w} height={140} fill={color.surfaceSunken} />
        <Rect x={0} y={96} width={SCENE.w} height={44} fill={color.edge} opacity={0.55} />
        <Rect x={0} y={94} width={SCENE.w} height={3} fill={color.lockedText} />
        <Rect x={0} y={140} width={SCENE.w} height={50} fill={color.lockedText} />
        <Rect x={0} y={136} width={SCENE.w} height={6} fill={color.surface} />
        <Rect x={150} y={24} width={72} height={54} rx={4} fill={color.info} opacity={0.55} />
        <Line x1={186} y1={24} x2={186} y2={78} stroke={color.surfaceSunken} strokeWidth={3} />
        <Line x1={150} y1={51} x2={222} y2={51} stroke={color.surfaceSunken} strokeWidth={3} />
        <Rect x={150} y={24} width={72} height={54} rx={4} fill="none" stroke={color.edge} strokeWidth={4} />
        <Rect x={8} y={14} width={78} height={128} rx={4} fill={color.lockedText} />
        <Rect x={14} y={20} width={66} height={122} rx={3} fill={color.edge} />
        <Rect x={24} y={30} width={46} height={42} rx={3} fill="none" stroke={color.lockedText} strokeWidth={3} />
        <Rect x={24} y={82} width={46} height={50} rx={3} fill="none" stroke={color.lockedText} strokeWidth={3} />
        <Circle cx={72} cy={84} r={4.5} fill={color.accent} />
        <Rect x={92} y={62} width={18} height={30} rx={5} fill={color.surface} />
        <Circle cx={101} cy={77} r={6} fill={ringing ? color.accent : color.flame} />
        <G>
          <Rect x={186} y={146} width={104} height={20} rx={8} fill={matActive ? color.brandDeep : color.lockedText} />
          <Rect x={188} y={144} width={100} height={20} rx={8} fill={matActive ? color.brand : color.info} />
          <Line x1={202} y1={150} x2={202} y2={158} stroke={color.onInfo} strokeWidth={2} opacity={0.5} />
          <Line x1={238} y1={150} x2={238} y2={158} stroke={color.onInfo} strokeWidth={2} opacity={0.5} />
          <Line x1={274} y1={150} x2={274} y2={158} stroke={color.onInfo} strokeWidth={2} opacity={0.5} />
        </G>
      </Svg>
      <BellRipple ringing={ringing} x={101} y={77} />
      <View accessible={false} style={{ position: 'absolute', left: pctX(0), top: pctY(158 - GROUND_Y), width: pctX(DOG_W) }}>
        <Animated.View style={move}>
          <CanineMinigameAvatar t={t} posture={posture} coat={coat} width={(width * DOG_W) / SCENE.w} facing={atDoor ? 'left' : 'right'} />
        </Animated.View>
      </View>
    </Stage>
  );
}

const DOG_LEFT = 168;

/**
 * The Poste scene: the Handler on the left holds the Leash, the Dog strains towards the lamp post on the
 * right. The Handler leans back and the Leash runs straight under tension, and sags when it eases.
 */
export function LeashScene({ t, posture, tension, coat }: { t: Translate; posture: CaninePosture; tension: number; coat: DogCoat }) {
  const [width, setWidth] = useState(0);
  const left = DOG_LEFT + (posture === 'straining' ? 8 : 0);
  const top = 148 - GROUND_Y;
  const collar = { x: left + COLLAR_POINT[posture].x * DOG_SCALE, y: top + COLLAR_POINT[posture].y * DOG_SCALE };
  const hand = handlerHand(tension);
  const taut = tension >= 0.5;
  const skin = HANDLER_PALETTE;
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}>
        <Rect x={0} y={0} width={SCENE.w} height={140} fill={color.surfaceSunken} />
        <Circle cx={44} cy={40} r={16} fill={color.accent} opacity={0.85} />
        <Ellipse cx={150} cy={140} rx={90} ry={34} fill={color.brandDeep} opacity={0.5} />
        <Ellipse cx={256} cy={144} rx={80} ry={30} fill={color.brandDeep} opacity={0.35} />
        <Rect x={0} y={136} width={SCENE.w} height={14} fill={color.brandDeep} />
        <Rect x={0} y={150} width={SCENE.w} height={40} fill={color.edge} />
        <Rect x={0} y={150} width={SCENE.w} height={4} fill={color.lockedText} />
        <Rect x={286} y={34} width={8} height={116} rx={3} fill={color.lockedText} />
        <Rect x={278} y={28} width={24} height={14} rx={6} fill={color.lockedText} />
        <Circle cx={290} cy={50} r={6} fill={color.accent} opacity={0.9} />
        <G transform={`rotate(${-HANDLER_LEAN_DEG * tension} ${HANDLER_PIVOT.x} ${HANDLER_PIVOT.y})`}>
          <Line x1={36} y1={116} x2={33} y2={146} stroke={skin.trousers} strokeWidth={9} strokeLinecap="round" />
          <Line x1={44} y1={116} x2={49} y2={146} stroke={skin.trousers} strokeWidth={9} strokeLinecap="round" />
          <Ellipse cx={32} cy={148} rx={8} ry={3.5} fill={skin.shoes} />
          <Ellipse cx={51} cy={148} rx={8} ry={3.5} fill={skin.shoes} />
          <Rect x={28} y={68} width={24} height={52} rx={10} fill={skin.shirt} />
          <Circle cx={40} cy={54} r={12} fill={skin.skin} />
          <Path d="M28 53 Q28 38 40 38 Q52 38 52 53 Q46 46 40 46 Q34 46 28 53 Z" fill={skin.hair} />
          <Circle cx={46} cy={55} r={1.8} fill={skin.hair} />
          <Line x1={46} y1={78} x2={62} y2={98} stroke={skin.shirt} strokeWidth={8} strokeLinecap="round" />
          <Circle cx={63} cy={99} r={4.5} fill={skin.skin} />
        </G>
      </Svg>
      <View accessible={false} style={{ position: 'absolute', left: pctX(left), top: pctY(top), width: pctX(DOG_W) }}>
        <CanineMinigameAvatar t={t} posture={posture} coat={coat} width={(width * DOG_W) / SCENE.w} />
      </View>
      <Svg style={fill} pointerEvents="none" viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessibilityLabel={t(taut ? 'minigame.leashTaut' : 'minigame.leashSlack')}>
        <Path d={leashPath(tension, hand, collar, 46)} stroke={taut ? color.danger : color.inkMuted} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      </Svg>
    </Stage>
  );
}

/** What the Dog is doing, in a few words: reading it is the skill the exercise trains. */
export function CueCaption({ t, posture }: { t: Translate; posture: CaninePosture }) {
  return (
    <View accessible={false} className="mt-3 flex-row items-center justify-center">
      <View className="rounded-game-md bg-surface px-4 py-2" style={{ borderWidth: theme.border.ink, borderColor: color.ink }}>
        <Text className="font-display text-body text-ink">{t(postureSpec(posture).cue)}</Text>
      </View>
    </View>
  );
}

/** One pip per round: green when it went well, red when it did not, an empty ring while pending. */
export function RoundPips({ t, total, results }: { t: Translate; total: number; results: readonly boolean[] }) {
  return (
    <View className="flex-row items-center" style={{ gap: theme.space[2] }}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < results.length;
        const key = !done ? 'minigame.round.pending' : results[i] ? 'minigame.round.hit' : 'minigame.round.miss';
        return (
          <View
            key={i}
            accessible
            accessibilityLabel={t(key)}
            style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: !done ? color.inkMuted : results[i] ? color.brandDeep : color.danger, backgroundColor: !done ? 'transparent' : results[i] ? color.brand : color.danger }}
          />
        );
      })}
    </View>
  );
}

/** The result of the round that just ended, coloured so it reads at a glance. */
export function ResultChip({ label, good }: { label: string | null; good: boolean }) {
  return (
    <View className="my-3 h-10 items-center justify-center">
      {label ? (
        <View className="rounded-game-md px-4 py-2" style={{ backgroundColor: good ? color.brand : color.danger, borderWidth: theme.border.ink, borderColor: color.ink }}>
          <Text className="font-display text-title" style={{ color: good ? color.onBrand : color.onDanger }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Leash tension as a bar that goes green, amber, red, so the user sees the pull building and easing. */
export function TensionGauge({ t, tension }: { t: Translate; tension: number }) {
  const tone = tensionTone(tension);
  const fillColor = tone === 'calm' ? theme.tension.slack : tone === 'warn' ? theme.tension.taut : theme.tension.rigid;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={t('minigame.tension')} accessibilityValue={{ min: 0, max: 100, now: Math.round(tension * 100) }} className="mt-3">
      <Text className="mb-1 text-body text-inkMuted">{t('minigame.tension')}</Text>
      <View className="overflow-hidden rounded-game-pill bg-surfaceSunken" style={{ height: 18, borderWidth: theme.border.ink, borderColor: color.ink }}>
        <View style={{ width: `${Math.round(tension * 100)}%`, height: '100%', backgroundColor: fillColor }} />
      </View>
    </View>
  );
}

/** The one big control of a Minigame: raised like every game button, with an icon, and it sinks while held. */
export function MinigameButton({ label, icon, onPressIn, onPressOut }: { label: string; icon: 'bell' | 'hand'; onPressIn?: () => void; onPressOut?: () => void }) {
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => {
        const s = buttonStyle('primary', { pressed });
        return (
          <Raised fill={s.fill} edge={s.edge} radius={theme.radius.lg} offset={theme.depth.md.x} shift={pressed ? theme.depth.md.x - theme.depth.pressed.x : 0} pressable
            faceStyle={{ minHeight: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.space[4], paddingHorizontal: theme.space[4] }}>
            <ButtonIcon icon={icon} tint={s.label} />
            <Text className="font-display text-title" style={{ color: s.label, flexShrink: 1, textAlign: 'center' }}>
              {label}
            </Text>
          </Raised>
        );
      }}
    </Pressable>
  );
}

function ButtonIcon({ icon, tint }: { icon: 'bell' | 'hand'; tint: string }) {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36">
      {icon === 'bell' ? (
        <G fill={tint}>
          <Path d="M18 4 C11 4 8 10 8 16 L8 22 L5 26 L31 26 L28 22 L28 16 C28 10 25 4 18 4 Z" />
          <Circle cx={18} cy={30} r={3.5} />
        </G>
      ) : (
        <G fill={tint}>
          <Rect x={7} y={14} width={5} height={14} rx={2.5} />
          <Rect x={13} y={7} width={5} height={21} rx={2.5} />
          <Rect x={19} y={9} width={5} height={19} rx={2.5} />
          <Rect x={25} y={14} width={5} height={14} rx={2.5} />
          <Path d="M7 24 L30 24 Q30 33 20 33 Q9 33 7 24 Z" />
        </G>
      )}
    </Svg>
  );
}
