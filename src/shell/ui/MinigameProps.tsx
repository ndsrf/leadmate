import { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import type { BreedId } from '../onboarding/breeds';
import { BreedArt } from './BreedArt';
import { CanineMinigameAvatar } from './CanineMinigameAvatar';
import { atDoor, livingRoomSpot, COLLAR_POINT, DOG_VIEW, HANDLER_LEAN_DEG, HANDLER_PALETTE, HANDLER_PIVOT, handlerHand, leashPath, postureSpec, tensionTone, type CaninePosture } from './canine';
import type { ReadDogAction } from '../nodes/readDog';
import { Raised } from './components';
import { buttonStyle } from './styles';
// The *Scene illustrations stay Light whatever the Appearance; the captions, pips, gauge and buttons are UI chrome.
import { lightColor, theme, usePalette } from './theme';
import { useMotion } from './useMotion';
import { useEndlessLoop, useMotionGate } from './useMotionGate';

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
    <View onLayout={onLayout} style={{ width: '100%', aspectRatio: SCENE.w / SCENE.h, borderRadius: theme.radius.lg, overflow: 'hidden', backgroundColor: lightColor.surfaceSunken, borderWidth: theme.border.ink, borderColor: lightColor.ink }}>
      {children}
    </View>
  );
}

const fill = { position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' } as const;

/** A chime ripple pulsing out of the bell while it rings. */
export function BellRipple({ ringing, x, y }: { ringing: boolean; x: number; y: number }) {
  const { reduced } = useMotion();
  const gate = useMotionGate(ringing);
  const pulse = useSharedValue(0);
  const start = useCallback(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 650 }), -1, false);
  }, [pulse]);
  const stop = useCallback(() => {
    cancelAnimation(pulse);
    pulse.value = 0;
  }, [pulse]);
  useEndlessLoop('bell-ripple', gate, start, stop);
  const style = useAnimatedStyle(() => ({ opacity: ringing ? (reduced ? 0.7 : 0.8 * (1 - pulse.value)) : 0, transform: [{ scale: 0.6 + pulse.value * 1.6 }] }));
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', left: pctX(x), top: pctY(y), width: 30, height: 30, marginLeft: -15, marginTop: -15, borderRadius: 15, borderWidth: 3, borderColor: lightColor.accent }, style]} />;
}

const DOOR_DOG_X = 44;
const MAT_DOG_X = 170;

/** The hallway behind the Doorbell Mat and the Harness Ritual: door with its bell on the left, a window, the floor. */
function RoomBackdrop({ ringing }: { ringing: boolean }) {
  return (
    <G>
      <Rect x={0} y={0} width={SCENE.w} height={140} fill={lightColor.surfaceSunken} />
      <Rect x={0} y={96} width={SCENE.w} height={44} fill={lightColor.edge} opacity={0.55} />
      <Rect x={0} y={94} width={SCENE.w} height={3} fill={lightColor.lockedText} />
      <Rect x={0} y={140} width={SCENE.w} height={50} fill={lightColor.lockedText} />
      <Rect x={0} y={136} width={SCENE.w} height={6} fill={lightColor.surface} />
      <Rect x={150} y={24} width={72} height={54} rx={4} fill={lightColor.info} opacity={0.55} />
      <Line x1={186} y1={24} x2={186} y2={78} stroke={lightColor.surfaceSunken} strokeWidth={3} />
      <Line x1={150} y1={51} x2={222} y2={51} stroke={lightColor.surfaceSunken} strokeWidth={3} />
      <Rect x={150} y={24} width={72} height={54} rx={4} fill="none" stroke={lightColor.edge} strokeWidth={4} />
      <Rect x={8} y={14} width={78} height={128} rx={4} fill={lightColor.lockedText} />
      <Rect x={14} y={20} width={66} height={122} rx={3} fill={lightColor.edge} />
      <Rect x={24} y={30} width={46} height={42} rx={3} fill="none" stroke={lightColor.lockedText} strokeWidth={3} />
      <Rect x={24} y={82} width={46} height={50} rx={3} fill="none" stroke={lightColor.lockedText} strokeWidth={3} />
      <Circle cx={72} cy={84} r={4.5} fill={lightColor.accent} />
      <Rect x={92} y={62} width={18} height={30} rx={5} fill={lightColor.surface} />
      <Circle cx={101} cy={77} r={6} fill={ringing ? lightColor.accent : lightColor.flame} />
    </G>
  );
}

/**
 * The Doorbell Mat scene: door and bell on the left, the mat on the right. The Dog stands and barks at
 * the door, then walks to the mat once it is sent there; the mat lights up while the Dog is on it.
 */
export function DoorbellScene({ t, posture, ringing, coat }: { t: Translate; posture: CaninePosture; ringing: boolean; coat: DogCoat }) {
  const [width, setWidth] = useState(0);
  const atTheDoor = atDoor(posture);
  const x = useSharedValue(DOOR_DOG_X);
  useEffect(() => {
    x.value = withTiming(atTheDoor ? DOOR_DOG_X : MAT_DOG_X, { duration: atTheDoor ? 250 : 1100 });
  }, [atTheDoor, x]);
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: (x.value / SCENE.w) * width }] }));
  const matActive = !atTheDoor;
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessibilityLabel={t(ringing ? 'minigame.doorRinging' : 'minigame.door')}>
        <RoomBackdrop ringing={ringing} />
        <G>
          <Rect x={186} y={146} width={104} height={20} rx={8} fill={matActive ? lightColor.brandDeep : lightColor.lockedText} />
          <Rect x={188} y={144} width={100} height={20} rx={8} fill={matActive ? lightColor.brand : lightColor.info} />
          <Line x1={202} y1={150} x2={202} y2={158} stroke={lightColor.onInfo} strokeWidth={2} opacity={0.5} />
          <Line x1={238} y1={150} x2={238} y2={158} stroke={lightColor.onInfo} strokeWidth={2} opacity={0.5} />
          <Line x1={274} y1={150} x2={274} y2={158} stroke={lightColor.onInfo} strokeWidth={2} opacity={0.5} />
        </G>
      </Svg>
      <BellRipple ringing={ringing} x={101} y={77} />
      <View accessible={false} style={{ position: 'absolute', left: pctX(0), top: pctY(158 - GROUND_Y), width: pctX(DOG_W) }}>
        <Animated.View style={move}>
          <CanineMinigameAvatar t={t} posture={posture} coat={coat} width={(width * DOG_W) / SCENE.w} facing={atTheDoor ? 'left' : 'right'} />
        </Animated.View>
      </View>
    </Stage>
  );
}

const HARNESS_DOG_X = 100;

/** The Harness Ritual scene: the hallway with the harness on a hook; it moves onto the Dog once Put on harness works. */
export function HarnessScene({ t, posture, harness, coat }: { t: Translate; posture: CaninePosture; harness: boolean; coat: DogCoat }) {
  const [width, setWidth] = useState(0);
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessibilityLabel={t(harness ? 'minigame.harnessOn' : 'minigame.harnessScene')}>
        <RoomBackdrop ringing={false} />
        <Rect x={248} y={34} width={30} height={6} rx={3} fill={lightColor.lockedText} />
        {!harness && (
          <G>
            <Path d="M254 40 L254 78 M272 40 L272 78" stroke={lightColor.danger} strokeWidth={5} strokeLinecap="round" />
            <Path d="M254 78 Q263 92 272 78" stroke={lightColor.danger} strokeWidth={5} strokeLinecap="round" fill="none" />
            <Circle cx={263} cy={40} r={4} fill={lightColor.accent} stroke={lightColor.ink} strokeWidth={1} />
          </G>
        )}
      </Svg>
      <View accessible={false} style={{ position: 'absolute', left: pctX(HARNESS_DOG_X), top: pctY(158 - GROUND_Y), width: pctX(DOG_W) }}>
        <CanineMinigameAvatar t={t} posture={posture} coat={coat} width={(width * DOG_W) / SCENE.w} harness={harness} />
      </View>
    </Stage>
  );
}

const LIVING_DOG_X = { floor: 62, sofa: 26, bed: 194 } as const;
const LIVING_DOG_LIFT = { floor: 0, sofa: 30, bed: 6 } as const;
/** How far the Handler steps towards the Dog to send it off, in scene units. */
export const HANDLER_STEP = 46;

/** The living room of the Basics scenes: a sofa on the left, the garden door at the back, the Dog's bed on the right, a rug. */
function LivingRoomBackdrop() {
  return (
    <G>
      <Rect x={0} y={0} width={SCENE.w} height={140} fill={lightColor.surfaceSunken} />
      <Rect x={0} y={136} width={SCENE.w} height={6} fill={lightColor.surface} />
      <Rect x={0} y={140} width={SCENE.w} height={50} fill={lightColor.edge} />
      <Ellipse cx={150} cy={164} rx={110} ry={18} fill={theme.world.basics.accent} opacity={0.35} />
      {/* garden door */}
      <Rect x={232} y={22} width={62} height={116} rx={3} fill={lightColor.surface} stroke={lightColor.lockedText} strokeWidth={3} />
      <Rect x={240} y={30} width={20} height={48} fill={lightColor.sky} />
      <Rect x={266} y={30} width={20} height={48} fill={lightColor.sky} />
      <Path d="M240 70 Q250 62 260 70 V78 H240 Z M266 70 Q276 62 286 70 V78 H266 Z" fill={lightColor.brand} />
      <Circle cx={286} cy={96} r={3.5} fill={lightColor.accent} />
      {/* sofa */}
      <Rect x={8} y={74} width={112} height={40} rx={10} fill={theme.world.basics.deep} />
      <Rect x={2} y={102} width={124} height={34} rx={10} fill={theme.world.basics.accent} />
      <Rect x={14} y={104} width={48} height={16} rx={5} fill={theme.world.basics.soft} />
      <Rect x={66} y={104} width={48} height={16} rx={5} fill={theme.world.basics.soft} />
      <Rect x={10} y={134} width={6} height={10} fill={lightColor.lockedText} />
      <Rect x={112} y={134} width={6} height={10} fill={lightColor.lockedText} />
      {/* the Dog's bed */}
      <Path d="M196 160 Q196 138 250 138 Q304 138 304 160 Q304 172 250 172 Q196 172 196 160 Z" fill={theme.world.basics.deep} />
      <Ellipse cx={250} cy={160} rx={42} ry={9} fill={theme.world.basics.soft} />
    </G>
  );
}

/** The Handler of the living room, standing at the left edge; `x` moves the whole figure. */
function LivingHandler() {
  const skin = HANDLER_PALETTE;
  return (
    <Svg width="100%" height="100%" viewBox="0 0 60 190" aria-hidden>
      <Line x1={26} y1={136} x2={23} y2={176} stroke={skin.trousers} strokeWidth={9} strokeLinecap="round" />
      <Line x1={34} y1={136} x2={39} y2={176} stroke={skin.trousers} strokeWidth={9} strokeLinecap="round" />
      <Ellipse cx={22} cy={178} rx={8} ry={3.5} fill={skin.shoes} />
      <Ellipse cx={41} cy={178} rx={8} ry={3.5} fill={skin.shoes} />
      <Rect x={18} y={84} width={24} height={56} rx={10} fill={skin.shirt} />
      <Line x1={22} y1={92} x2={20} y2={130} stroke={skin.shirt} strokeWidth={7} strokeLinecap="round" />
      <Line x1={38} y1={92} x2={40} y2={130} stroke={skin.shirt} strokeWidth={7} strokeLinecap="round" />
      <Circle cx={30} cy={70} r={12} fill={skin.skin} />
      <Path d="M18 69 Q18 54 30 54 Q42 54 42 69 Q36 62 30 62 Q24 62 18 69 Z" fill={skin.hair} />
    </Svg>
  );
}

/**
 * The Basics scenes: a living room with a sofa, the garden door and the Dog's own bed. The Dog is on the sofa, in its
 * bed or on the floor by its state, facing the Handler while on the floor. While `sending`, the Handler steps calmly towards the Dog, arms down and never
 * touching it, and the Dog walks off to its bed. Under reduced motion both simply appear in place.
 */
export function LivingRoomScene({ t, posture, sending, coat }: { t: Translate; posture: CaninePosture; sending: boolean; coat: DogCoat }) {
  const [width, setWidth] = useState(0);
  const { reduced } = useMotion();
  const spot = sending ? 'bed' : livingRoomSpot(posture);
  const x = useSharedValue<number>(LIVING_DOG_X[spot]);
  const lift = useSharedValue<number>(LIVING_DOG_LIFT[spot]);
  const step = useSharedValue(0);
  useEffect(() => {
    const duration = reduced ? 0 : sending ? 1000 : 300;
    x.value = withTiming(LIVING_DOG_X[spot], { duration });
    lift.value = withTiming(LIVING_DOG_LIFT[spot], { duration });
    step.value = withTiming(sending ? HANDLER_STEP : 0, { duration: reduced ? 0 : 600 });
  }, [spot, sending, reduced, x, lift, step]);
  const move = useAnimatedStyle(() => ({ transform: [{ translateX: (x.value / SCENE.w) * width }, { translateY: (-lift.value / SCENE.h) * ((width * SCENE.h) / SCENE.w) }] }));
  const walk = useAnimatedStyle(() => ({ transform: [{ translateX: (step.value / SCENE.w) * width }] }));
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessibilityLabel={t(sending ? 'minigame.sendingAway' : 'minigame.livingRoom')}>
        <LivingRoomBackdrop />
      </Svg>
      <View accessible={false} style={{ position: 'absolute', left: pctX(0), top: pctY(164 - GROUND_Y), width: pctX(DOG_W) }}>
        <Animated.View style={move}>
          <CanineMinigameAvatar t={t} posture={sending ? 'standing_waiting' : posture} coat={coat} width={(width * DOG_W) / SCENE.w} facing={spot === 'floor' ? 'left' : 'right'} />
        </Animated.View>
      </View>
      <Animated.View accessible={false} pointerEvents="none" testID="living-handler" style={[{ position: 'absolute', left: pctX(-14), top: 0, width: pctX(60), height: '100%' }, walk]}>
        <LivingHandler />
      </Animated.View>
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
        <Rect x={0} y={0} width={SCENE.w} height={140} fill={lightColor.surfaceSunken} />
        <Circle cx={44} cy={40} r={16} fill={lightColor.accent} opacity={0.85} />
        <Ellipse cx={150} cy={140} rx={90} ry={34} fill={lightColor.brandDeep} opacity={0.5} />
        <Ellipse cx={256} cy={144} rx={80} ry={30} fill={lightColor.brandDeep} opacity={0.35} />
        <Rect x={0} y={136} width={SCENE.w} height={14} fill={lightColor.brandDeep} />
        <Rect x={0} y={150} width={SCENE.w} height={40} fill={lightColor.edge} />
        <Rect x={0} y={150} width={SCENE.w} height={4} fill={lightColor.lockedText} />
        <Rect x={286} y={34} width={8} height={116} rx={3} fill={lightColor.lockedText} />
        <Rect x={278} y={28} width={24} height={14} rx={6} fill={lightColor.lockedText} />
        <Circle cx={290} cy={50} r={6} fill={lightColor.accent} opacity={0.9} />
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
        <Path d={leashPath(tension, hand, collar, 46)} stroke={taut ? lightColor.danger : lightColor.inkMuted} strokeWidth={3.5} strokeLinecap="round" fill="none" />
      </Svg>
    </Stage>
  );
}

/** What the Dog is doing, in a few words: reading it is the skill the exercise trains. */
export function CueCaption({ t, posture }: { t: Translate; posture: CaninePosture }) {
  const color = usePalette();
  return (
    <View accessible={false} className="mt-3 flex-row items-center justify-center">
      <View className="rounded-game-lg bg-surface px-5 py-2.5 max-w-full" style={{ borderWidth: theme.border.ink, borderColor: color.outline }}>
        <Text className="text-center font-display text-title text-ink">{t(postureSpec(posture).cue)}</Text>
      </View>
    </View>
  );
}

/** One pip per round: green when it went well, red when it did not, an empty ring while pending. */
export function RoundPips({ t, total, results }: { t: Translate; total: number; results: readonly boolean[] }) {
  const color = usePalette();
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
  const color = usePalette();
  return (
    <View className="my-3 min-h-[52px] items-center justify-center">
      {label ? (
        <View className="rounded-game-lg px-5 py-2.5 max-w-full" style={{ backgroundColor: good ? color.brand : color.danger, borderWidth: theme.border.ink, borderColor: color.outline }}>
          <Text className="text-center font-display text-title" style={{ color: good ? color.onBrand : color.onDanger }}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Leash tension as a bar that goes green, amber, red, so the user sees the pull building and easing. */
export function TensionGauge({ t, tension }: { t: Translate; tension: number }) {
  const color = usePalette();
  const tone = tensionTone(tension);
  const fillColor = tone === 'calm' ? theme.tension.slack : tone === 'warn' ? theme.tension.taut : theme.tension.rigid;
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={t('minigame.tension')} accessibilityValue={{ min: 0, max: 100, now: Math.round(tension * 100) }} className="mt-3">
      <Text className="mb-1 text-body text-inkMuted">{t('minigame.tension')}</Text>
      <View className="overflow-hidden rounded-game-pill bg-surfaceSunken" style={{ height: 18, borderWidth: theme.border.ink, borderColor: color.outline }}>
        <View style={{ width: `${Math.round(tension * 100)}%`, height: '100%', backgroundColor: fillColor }} />
      </View>
    </View>
  );
}

export type ActionIcon = ReadDogAction | 'hand';

/** The one big control of the Poste practice: raised like every game button, with an icon, and it sinks while held. */
export function MinigameButton({ label, icon, onPressIn, onPressOut }: { label: string; icon: ActionIcon; onPressIn?: () => void; onPressOut?: () => void }) {
  const color = usePalette();
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => {
        const s = buttonStyle(color, 'primary', { pressed });
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

export interface ActionButton {
  action: ReadDogAction;
  label: string;
  /** What the action does, read with the label by screen readers. */
  effect: string;
}

/** The actions of an action Minigame in a 2x2 grid of large targets, each with an icon, a label and an accessible name and effect. */
export function ActionButtonRow({ actions, onPress, disabled = false }: { actions: readonly ActionButton[]; onPress: (action: ReadDogAction) => void; disabled?: boolean }) {
  const color = usePalette();
  return (
    <View className="flex-row flex-wrap" style={{ gap: theme.space[3] }}>
      {actions.map(({ action, label, effect }) => (
        <View key={action} style={{ flexBasis: '47%', flexGrow: 1 }}>
          <Pressable onPress={() => onPress(action)} disabled={disabled} accessibilityRole="button" accessibilityLabel={`${label}. ${effect}`} accessibilityState={{ disabled }}>
            {({ pressed }) => {
              const s = buttonStyle(color, 'primary', { pressed });
              return (
                <Raised fill={s.fill} edge={s.edge} radius={theme.radius.lg} offset={theme.depth.md.x} shift={pressed ? theme.depth.md.x - theme.depth.pressed.x : 0} pressable
                  faceStyle={{ minHeight: 76, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: theme.space[1], paddingHorizontal: theme.space[2], opacity: disabled ? 0.6 : 1 }}>
                  <ButtonIcon icon={action} tint={s.label} />
                  <Text className="font-display text-body" style={{ color: s.label, textAlign: 'center' }}>
                    {label}
                  </Text>
                </Raised>
              );
            }}
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function ButtonIcon({ icon, tint }: { icon: ActionIcon; tint: string }) {
  const color = usePalette();
  return (
    <Svg width={32} height={32} viewBox="0 0 36 36" aria-hidden>
      {icon === 'marker' ? (
        <G>
          <Rect x={7} y={8} width={22} height={20} rx={6} fill={tint} />
          <Circle cx={18} cy={18} r={5} fill="none" stroke={color.brand} strokeWidth={3} />
          <Path d="M3 12 L6 14 M33 12 L30 14 M18 2 L18 6" stroke={tint} strokeWidth={2.5} strokeLinecap="round" />
        </G>
      ) : icon === 'cue' ? (
        <G fill={tint}>
          <Path d="M6 14 L14 14 L22 7 L22 29 L14 22 L6 22 Z" />
          <Path d="M26 12 Q31 18 26 24" stroke={tint} strokeWidth={2.5} strokeLinecap="round" fill="none" />
          <Path d="M29 8 Q37 18 29 28" stroke={tint} strokeWidth={2.5} strokeLinecap="round" fill="none" />
        </G>
      ) : icon === 'wait' ? (
        <G>
          <Rect x={8} y={5} width={20} height={4} rx={2} fill={tint} />
          <Rect x={8} y={27} width={20} height={4} rx={2} fill={tint} />
          <Path d="M10 9 L26 9 L19 18 L26 27 L10 27 L17 18 Z" fill="none" stroke={tint} strokeWidth={2.5} strokeLinejoin="round" />
        </G>
      ) : icon === 'harness' ? (
        <G fill="none" stroke={tint} strokeWidth={3.5} strokeLinecap="round">
          <Path d="M10 6 L10 22 M26 6 L26 22" />
          <Path d="M10 22 Q18 32 26 22" />
          <Path d="M10 12 L26 12" />
        </G>
      ) : icon === 'mat' ? (
        <G>
          <Rect x={3} y={14} width={30} height={13} rx={5} fill={tint} />
          <Path d="M12 20 L24 20 M20 16 L24 20 L20 24" stroke={color.brand} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : icon === 'ignore' ? (
        <G fill="none" stroke={tint} strokeWidth={2.8} strokeLinecap="round">
          <Path d="M4 18 Q18 6 32 18 Q18 30 4 18 Z" />
          <Circle cx={18} cy={18} r={4.5} fill={tint} />
          <Path d="M6 30 L30 6" />
        </G>
      ) : icon === 'send-bed' ? (
        <G>
          <Path d="M3 24 Q3 14 18 14 Q33 14 33 24 Q33 30 18 30 Q3 30 3 24 Z" fill={tint} />
          <Path d="M10 8 L24 8 M20 4 L24 8 L20 12" stroke={tint} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : icon === 'send-away' ? (
        <G fill="none" stroke={tint} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M5 18 L29 18 M21 10 L29 18 L21 26" />
          <Circle cx={8} cy={8} r={2.5} fill={tint} />
          <Circle cx={8} cy={28} r={2.5} fill={tint} />
        </G>
      ) : icon === 'go-outside' ? (
        <G>
          <Rect x={4} y={4} width={16} height={28} rx={2} fill="none" stroke={tint} strokeWidth={2.8} />
          <Path d="M16 18 L32 18 M26 12 L32 18 L26 24" stroke={tint} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </G>
      ) : icon === 'cuddle' ? (
        <Path d="M18 31 C2 20 4 6 13 7 C16 7 18 10 18 12 C18 10 20 7 23 7 C32 6 34 20 18 31 Z" fill={tint} />
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

const MEADOW_DOG_W = 190;

/**
 * The Diagnostic scene: the Dog in its breed and coat on a meadow, looking at the user while the signal is on. The posture
 * change is immediate under reduced motion; otherwise the Dog gives a short pop as it turns.
 */
export function DiagnosticScene({ t, breed, coat, looking }: { t: Translate; breed: BreedId; coat: DogCoat; looking: boolean }) {
  const [width, setWidth] = useState(0);
  const { reduced } = useMotion();
  const pop = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      pop.value = 0;
      return;
    }
    pop.value = withTiming(looking ? 1 : 0, { duration: theme.motion.duration.quick });
  }, [looking, reduced, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + pop.value * 0.05 }] }));
  const dogH = (MEADOW_DOG_W * 110) / 160;
  return (
    <Stage onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <Svg style={fill} viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} aria-hidden>
        <Rect x={0} y={0} width={SCENE.w} height={SCENE.h} fill={lightColor.sky} />
        <Circle cx={270} cy={40} r={20} fill={lightColor.accent} stroke={lightColor.ink} strokeWidth={2.5} />
        <Path d="M0 122C50 100 110 118 170 106S280 96 320 112V190H0Z" fill={theme.world.sidewalk.ground} stroke={lightColor.ink} strokeWidth={2.5} />
        <Path d="M0 150C70 132 150 156 230 142S300 134 320 142V190H0Z" fill={lightColor.brand} stroke={lightColor.ink} strokeWidth={2.5} />
        <Path d="M0 174C80 162 170 182 250 170S300 166 320 170V190H0Z" fill={lightColor.brandDeep} stroke={lightColor.ink} strokeWidth={2.5} />
      </Svg>
      <View accessible={false} style={{ position: 'absolute', left: pctX(66), top: pctY(150 - (dogH * 100) / 110), width: pctX(MEADOW_DOG_W) }}>
        <Animated.View style={popStyle}>
          <BreedArt breed={breed} coat={coat} width={(width * MEADOW_DOG_W) / SCENE.w} looking={looking} label={t(looking ? 'minigame.dog.looking' : 'minigame.dog.standing_waiting')} />
        </Animated.View>
      </View>
    </Stage>
  );
}

const PAW_PATHS = ['M9 14a2.4 3 0 1 0 0.1 0z', 'M15 8a2.4 3 0 1 0 0.1 0z', 'M23 8a2.4 3 0 1 0 0.1 0z', 'M29 14a2.4 3 0 1 0 0.1 0z', 'M19 17c-6 0-10 5-10 9 0 3.5 3 4.5 6 4 2-.4 2.6-.6 4-.6s2 .2 4 .6c3 .5 6-.5 6-4 0-4-4-9-10-9z'];

/** The Diagnostic progress: one paw per response, filled brand green; empty paws stay outlined, so the count reads without colour. */
export function PawRow({ t, filled, total }: { t: Translate; filled: number; total: number }) {
  const color = usePalette();
  const label = t('diagnostic.paws').split('{n}').join(String(filled)).split('{total}').join(String(total));
  return (
    <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: total, now: filled }} className="flex-row items-center" style={{ gap: theme.space[1] }}>
      {Array.from({ length: total }, (_, i) => (
        <Svg key={i} width={32} height={32} viewBox="0 0 38 38" aria-hidden>
          {PAW_PATHS.map((d) => (
            <Path key={d} d={d} fill={i < filled ? color.brand : color.surfaceSunken} stroke={color.ink} strokeWidth={2.2} strokeLinejoin="round" />
          ))}
        </Svg>
      ))}
    </View>
  );
}
