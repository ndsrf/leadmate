import { useEffect } from 'react';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import { COAT_PALETTE, COLLAR_POINT, DOG_VIEW, emotePoint, postureSpec, type CaninePosture, type CoatPalette, type Emote, type Eyes } from './canine';
import { color } from './theme';
import { useLive } from './useAppActive';
import { useMotion } from './useMotion';

type Ears = 'up' | 'down' | 'back';

function Head({ x, y, pal, ears, mouth, eyes }: { x: number; y: number; pal: CoatPalette; ears: Ears; mouth: boolean; eyes: Eyes }) {
  return (
    <G>
      {ears === 'up' && <Path d={`M${x - 12} ${y - 8} L${x - 8} ${y - 30} L${x + 4} ${y - 12} Z`} fill={pal.shade} />}
      <Circle cx={x} cy={y} r={16} fill={pal.fill} />
      <Path d={`M${x + 4} ${y - 2} Q${x + 18} ${y - 4} ${x + 32} ${y + 2} L${x + 32} ${y + 10} Q${x + 30} ${y + 16} ${x + 20} ${y + 16} L${x + 10} ${y + 14} Z`} fill={pal.belly} />
      <Circle cx={x + 31} cy={y + 3} r={4.2} fill={color.onAccent} />
      {ears === 'down' && <Ellipse cx={x - 3} cy={y + 3} rx={6.5} ry={12} fill={pal.shade} transform={`rotate(14 ${x - 3} ${y + 3})`} />}
      {ears === 'back' && <Ellipse cx={x - 12} cy={y - 3} rx={12} ry={5} fill={pal.shade} transform={`rotate(-12 ${x - 12} ${y - 3})`} />}
      {eyes === 'closed' ? (
        <Path d={`M${x + 4} ${y - 5} Q${x + 8} ${y - 1} ${x + 12} ${y - 5}`} stroke={color.onAccent} strokeWidth={2} strokeLinecap="round" fill="none" />
      ) : eyes === 'wide' ? (
        <G>
          <Circle cx={x + 8} cy={y - 5} r={5.4} fill={color.surface} stroke={color.onAccent} strokeWidth={1.4} />
          <Circle cx={x + 9} cy={y - 5} r={2.4} fill={color.onAccent} />
        </G>
      ) : (
        <G>
          <Circle cx={x + 8} cy={y - 5} r={3.4} fill={color.onAccent} />
          <Circle cx={x + 9} cy={y - 6} r={1.1} fill={color.ink} />
        </G>
      )}
      {mouth ? (
        <G>
          <Path d={`M${x + 12} ${y + 10} L${x + 32} ${y + 9} L${x + 28} ${y + 23} Q${x + 20} ${y + 25} ${x + 12} ${y + 10} Z`} fill={color.onDanger} />
          <Ellipse cx={x + 23} cy={y + 20} rx={5.5} ry={3.4} fill={color.danger} />
          {[0, 1, 2].map((i) => (
            <Path key={i} d={`M${x + 40 + i * 8} ${y - 6 - i * 3} Q${x + 46 + i * 8} ${y + 4} ${x + 40 + i * 8} ${y + 14 + i * 3}`} stroke={color.accent} strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={1 - i * 0.25} />
          ))}
        </G>
      ) : (
        <Path d={`M${x + 12} ${y + 11} Q${x + 22} ${y + 14} ${x + 31} ${y + 9}`} stroke={color.onAccent} strokeWidth={1.8} strokeLinecap="round" fill="none" />
      )}
    </G>
  );
}

function Collar({ x, y }: { x: number; y: number }) {
  return (
    <G>
      <Line x1={x - 5} y1={y - 8} x2={x + 5} y2={y + 8} stroke={color.info} strokeWidth={5} />
      <Circle cx={x + 4} cy={y + 9} r={3.2} fill={color.accent} />
    </G>
  );
}

const leg = (x1: number, y1: number, x2: number, y2: number, stroke: string) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} strokeWidth={9} strokeLinecap="round" />;

function Pose({ posture, pal }: { posture: CaninePosture; pal: CoatPalette }) {
  const tail = (d: string) => <Path d={d} stroke={pal.shade} strokeWidth={7} strokeLinecap="round" fill="none" />;
  const neck = (x1: number, y1: number, x2: number, y2: number) => <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={pal.fill} strokeWidth={21} strokeLinecap="round" />;
  switch (posture) {
    case 'standing_waiting':
    case 'looking':
      return (
        <G>
          {tail(posture === 'looking' ? 'M33 54 Q16 50 16 30' : 'M33 54 Q18 52 14 38')}
          {leg(50, 74, 50, 97, pal.shade)}
          {leg(98, 74, 98, 97, pal.shade)}
          <Ellipse cx={72} cy={62} rx={40} ry={21} fill={pal.fill} />
          {leg(42, 74, 42, 97, pal.fill)}
          {leg(90, 74, 90, 97, pal.fill)}
          {neck(100, 56, 118, 42)}
          <Collar x={110} y={52} />
          <Head x={120} y={40} pal={pal} ears="up" mouth={false} eyes="open" />
        </G>
      );
    case 'alert_barking':
      return (
        <G>
          {tail('M33 54 Q14 46 18 22')}
          {leg(50, 74, 50, 97, pal.shade)}
          {leg(98, 74, 98, 97, pal.shade)}
          <Ellipse cx={72} cy={62} rx={40} ry={21} fill={pal.fill} />
          {leg(42, 74, 42, 97, pal.fill)}
          {leg(90, 74, 90, 97, pal.fill)}
          {neck(100, 54, 120, 34)}
          <Collar x={110} y={46} />
          <Head x={122} y={30} pal={pal} ears="up" mouth eyes="wide" />
        </G>
      );
    case 'settling_towards_mat':
      return (
        <G>
          {tail('M33 60 Q22 72 24 88')}
          {leg(52, 76, 60, 97, pal.shade)}
          {leg(88, 76, 80, 97, pal.shade)}
          <Ellipse cx={72} cy={64} rx={40} ry={20} fill={pal.fill} />
          {leg(44, 76, 34, 97, pal.fill)}
          {leg(96, 76, 106, 97, pal.fill)}
          {neck(100, 58, 116, 48)}
          <Collar x={108} y={53} />
          <Head x={118} y={46} pal={pal} ears="down" mouth={false} eyes="open" />
        </G>
      );
    case 'calm_sphinx_on_mat':
      return (
        <G>
          {tail('M26 92 Q14 98 8 94')}
          {leg(90, 96, 126, 97, pal.shade)}
          <Ellipse cx={68} cy={84} rx={40} ry={16} fill={pal.fill} />
          <Ellipse cx={46} cy={86} rx={22} ry={14} fill={pal.fill} />
          {leg(92, 92, 130, 94, pal.fill)}
          {neck(98, 78, 118, 70)}
          <Collar x={108} y={74} />
          <Head x={120} y={68} pal={pal} ears="down" mouth={false} eyes="closed" />
        </G>
      );
    case 'straining':
      return (
        <G>
          {tail('M33 56 Q16 48 20 26')}
          {leg(52, 78, 38, 97, pal.shade)}
          {leg(90, 80, 110, 97, pal.shade)}
          <Ellipse cx={70} cy={66} rx={40} ry={19} fill={pal.fill} transform="rotate(14 70 66)" />
          {leg(44, 78, 26, 97, pal.fill)}
          {leg(98, 78, 122, 97, pal.fill)}
          {neck(102, 62, 126, 56)}
          <Collar x={116} y={58} />
          <Head x={130} y={54} pal={pal} ears="back" mouth={false} eyes="open" />
        </G>
      );
    case 'jumping':
      return (
        <G transform="translate(0 -10)">
          {tail('M33 52 Q14 40 20 20')}
          {leg(50, 74, 40, 92, pal.shade)}
          {leg(98, 72, 114, 66, pal.shade)}
          <Ellipse cx={72} cy={62} rx={40} ry={21} fill={pal.fill} transform="rotate(-10 72 62)" />
          {leg(42, 74, 28, 90, pal.fill)}
          {leg(90, 72, 110, 80, pal.fill)}
          {neck(100, 54, 118, 40)}
          <Collar x={110} y={47} />
          <Head x={120} y={38} pal={pal} ears="up" mouth eyes="wide" />
        </G>
      );
    case 'sniffing':
      return (
        <G>
          {tail('M33 58 Q18 56 14 44')}
          {leg(50, 74, 50, 97, pal.shade)}
          {leg(98, 74, 98, 97, pal.shade)}
          <Ellipse cx={72} cy={62} rx={40} ry={21} fill={pal.fill} transform="rotate(6 72 62)" />
          {leg(42, 74, 42, 97, pal.fill)}
          {leg(90, 74, 90, 97, pal.fill)}
          {neck(100, 60, 118, 74)}
          <Collar x={112} y={70} />
          <Head x={124} y={80} pal={pal} ears="down" mouth={false} eyes="open" />
        </G>
      );
    case 'staring_door':
      return (
        <G>
          {tail('M33 54 Q18 52 8 50')}
          {leg(50, 74, 50, 97, pal.shade)}
          {leg(98, 74, 98, 97, pal.shade)}
          <Ellipse cx={72} cy={62} rx={40} ry={21} fill={pal.fill} />
          {leg(42, 74, 42, 97, pal.fill)}
          {leg(90, 74, 90, 97, pal.fill)}
          {neck(100, 56, 120, 44)}
          <Collar x={112} y={48} />
          <Head x={124} y={38} pal={pal} ears="up" mouth={false} eyes="wide" />
        </G>
      );
    case 'unsettled_on_mat':
      return (
        <G>
          {tail('M33 62 Q20 58 16 70')}
          {leg(52, 76, 60, 97, pal.shade)}
          {leg(88, 76, 80, 97, pal.shade)}
          <Ellipse cx={72} cy={64} rx={40} ry={20} fill={pal.fill} />
          {leg(44, 76, 34, 97, pal.fill)}
          {leg(96, 76, 112, 86, pal.fill)}
          {neck(100, 58, 116, 50)}
          <Collar x={108} y={55} />
          <Head x={118} y={48} pal={pal} ears="back" mouth={false} eyes="wide" />
        </G>
      );
    case 'relaxed_lying':
      return (
        <G>
          {tail('M26 94 Q12 96 8 88')}
          {leg(90, 98, 124, 99, pal.shade)}
          <Ellipse cx={68} cy={88} rx={42} ry={12} fill={pal.fill} />
          <Ellipse cx={50} cy={92} rx={20} ry={9} fill={pal.belly} />
          {leg(92, 96, 128, 97, pal.fill)}
          {neck(98, 86, 114, 82)}
          <Collar x={106} y={80} />
          <Head x={118} y={80} pal={pal} ears="down" mouth={false} eyes="closed" />
        </G>
      );
    case 'slack':
    case 'sitting_attentive':
      return (
        <G>
          {tail('M32 94 Q18 98 14 90')}
          {leg(80, 64, 80, 97, pal.shade)}
          <Ellipse cx={58} cy={72} rx={28} ry={23} fill={pal.fill} transform="rotate(-40 58 72)" />
          <Ellipse cx={46} cy={88} rx={20} ry={13} fill={pal.fill} />
          <Ellipse cx={62} cy={98} rx={12} ry={4.5} fill={pal.belly} />
          <Ellipse cx={82} cy={58} rx={13} ry={18} fill={pal.fill} />
          {leg(88, 62, 88, 97, pal.fill)}
          {neck(84, 52, 96, 30)}
          <Collar x={92} y={40} />
          <Head x={100} y={posture === 'slack' ? 26 : 23} pal={pal} ears={posture === 'slack' ? 'down' : 'up'} mouth={false} eyes="open" />
        </G>
      );
  }
}

/** The bubble beside the head: a symbol per emotion, so it reads next to the caption that names it in words. */
function EmoteBubble({ emote, x, y }: { emote: Emote; x: number; y: number }) {
  if (emote === 'none') return null;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Circle r={10} fill={color.surface} stroke={color.ink} strokeWidth={1.8} />
      {emote === 'alert' && (
        <G fill={color.danger}>
          <Rect x={-1.6} y={-6.5} width={3.2} height={8} rx={1.4} />
          <Circle cy={5} r={1.9} />
        </G>
      )}
      {emote === 'distracted' && <Path d="M-6 0 Q-3 -4 0 0 T6 0" stroke={color.info} strokeWidth={2} strokeLinecap="round" fill="none" />}
      {emote === 'love' && <Path d="M0 6 C-8 0 -6 -6 0 -2 C6 -6 8 0 0 6 Z" fill={color.danger} />}
      {emote === 'sleepy' && <Path d="M-4 -4 L4 -4 L-4 4 L4 4" stroke={color.inkMuted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />}
    </G>
  );
}

/** The harness on the Dog: a girth band behind the front legs with a strap up over the shoulders, anchored to the collar point. */
function Harness({ posture }: { posture: CaninePosture }) {
  const c = COLLAR_POINT[posture];
  return (
    <G>
      <Path d={`M${c.x - 20} ${c.y - 6} L${c.x - 14} ${c.y + 28}`} stroke={color.danger} strokeWidth={5} strokeLinecap="round" />
      <Path d={`M${c.x - 20} ${c.y - 6} L${c.x - 2} ${c.y + 4}`} stroke={color.danger} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={c.x - 20} cy={c.y - 6} r={3.2} fill={color.accent} stroke={color.ink} strokeWidth={1} />
    </G>
  );
}

/** How a posture moves while it is held: the bark and the jump bounce, the strain and the unrest shake, nothing else moves (nor anything in the background). Reduced motion holds still. */
function useWobble(posture: CaninePosture) {
  const { reduced } = useMotion();
  const live = useLive();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(x);
    cancelAnimation(y);
    x.value = 0;
    y.value = 0;
    if (reduced || !live) return;
    if (posture === 'alert_barking') y.value = withRepeat(withSequence(withTiming(-5, { duration: 140 }), withTiming(0, { duration: 140 })), -1, false);
    if (posture === 'jumping') y.value = withRepeat(withSequence(withTiming(-9, { duration: 200 }), withTiming(0, { duration: 200 })), -1, false);
    if (posture === 'unsettled_on_mat') x.value = withRepeat(withSequence(withTiming(-3, { duration: 160 }), withTiming(3, { duration: 160 })), -1, true);
    if (posture === 'sniffing') x.value = withRepeat(withSequence(withTiming(-2, { duration: 260 }), withTiming(2, { duration: 260 })), -1, true);
    if (posture === 'straining') x.value = withRepeat(withSequence(withTiming(-2, { duration: 70 }), withTiming(2, { duration: 70 })), -1, true);
    return () => {
      cancelAnimation(x);
      cancelAnimation(y);
    };
  }, [posture, reduced, live, x, y]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));
}

/** The Dog of a Minigame, drawn as vector art in the chosen coat so it stays crisp at any size. */
export function CanineMinigameAvatar({ t, posture, coat = 'golden', width = 150, facing = 'right', harness = false }: { t: Translate; posture: CaninePosture; coat?: DogCoat; width?: number; facing?: 'left' | 'right'; harness?: boolean }) {
  const pal = COAT_PALETTE[coat];
  const wobble = useWobble(posture);
  const height = (width * DOG_VIEW.h) / DOG_VIEW.w;
  return (
    <Animated.View accessible accessibilityRole="image" accessibilityLabel={`${t(postureSpec(posture).label)}${harness ? `. ${t('minigame.harnessOn')}` : ''}`} style={[{ width, height }, wobble]}>
      <Svg width={width} height={height} viewBox={`0 0 ${DOG_VIEW.w} ${DOG_VIEW.h}`} style={facing === 'left' ? { transform: [{ scaleX: -1 }] } : undefined}>
        <Ellipse cx={72} cy={100} rx={posture === 'calm_sphinx_on_mat' || posture === 'relaxed_lying' ? 56 : posture === 'jumping' ? 34 : 46} ry={5} fill={color.bg} opacity={0.35} />
        <Pose posture={posture} pal={pal} />
        {harness && <Harness posture={posture} />}
        <EmoteBubble emote={postureSpec(posture).emote} x={emotePoint(posture).x} y={emotePoint(posture).y} />
      </Svg>
    </Animated.View>
  );
}
