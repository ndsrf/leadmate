import { useCallback } from 'react';
import Animated, { cancelAnimation, useAnimatedProps, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { DogCoat } from '../../sim/config';
import type { BreedId } from '../onboarding/breeds';
import { BREED_SHAPES, BREED_VIEW, FIT_PIVOT, GROUND_Y, artBreed, fitScale, geometryOf, type BreedShape } from './breedShapes';
import { COAT_PALETTE, type CoatPalette } from './canine';
import { partsOf, type RtdParts } from './rtdArt';
import { lightColor } from './theme';
import { useEndlessLoop, useMotionGate } from './useMotionGate';
import { useMotion } from './useMotion';
import type { RtdSignal } from '../nodes/readTheDog';

const STROKE = 2.4;
const outline = { stroke: lightColor.ink, strokeWidth: STROKE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

// created on first use so a screen that never draws the wag (and tests that mock Reanimated) never needs it
let animatedG: ReturnType<typeof makeAnimatedG> | undefined;
const makeAnimatedG = () => Animated.createAnimatedComponent(G);
const getAnimatedG = () => (animatedG ??= makeAnimatedG());
const WAG_DEG = 16;
const WAG_MS = 280;
/** The loose wag stops at this angle under reduced motion: a still, curved tail. */
const STILL_WAG_DEG = -28;

/** The breed's tail swinging about the rump while the wag shows; an endless loop only while the gate is open. */
function WagTail({ s, rump, pal }: { s: BreedShape; rump: { x: number; y: number }; pal: CoatPalette }) {
  const gate = useMotionGate(true);
  const angle = useSharedValue(0);
  const start = useCallback(() => {
    angle.value = withRepeat(withSequence(withTiming(-WAG_DEG, { duration: WAG_MS }), withTiming(WAG_DEG, { duration: WAG_MS })), -1, true);
  }, [angle]);
  const stop = useCallback(() => {
    cancelAnimation(angle);
    angle.value = 0;
  }, [angle]);
  useEndlessLoop('rtd-wag', gate, start, stop);
  const props = useAnimatedProps(() => ({ rotation: angle.value, originX: rump.x, originY: rump.y }));
  const AnimatedG = getAnimatedG();
  return (
    <AnimatedG animatedProps={props}>
      <Tail s={s} rump={rump} pal={pal} mode="neutral" />
    </AnimatedG>
  );
}

function Tail({ s, rump, pal, mode }: { s: BreedShape; rump: { x: number; y: number }; pal: CoatPalette; mode: RtdParts['tail'] }) {
  const { x, y } = rump;
  const k = s.tail.size;
  const line = (d: string, w: number) => (
    <G>
      <Path d={d} fill="none" stroke={lightColor.ink} strokeWidth={w + STROKE * 1.6} strokeLinecap="round" />
      <Path d={d} fill="none" stroke={pal.shade} strokeWidth={w} strokeLinecap="round" />
    </G>
  );
  if (mode === 'low') return line(`M${x + 2} ${y + 4} Q${x - 4} ${y + 14} ${x - 6 * k} ${y + 26 * k}`, 5);
  if (mode === 'stiff') return line(`M${x + 2} ${y + 2} L${x - 4 * k} ${y - 26 * k}`, 5);
  if (mode === 'wag') {
    return (
      <G transform={`rotate(${STILL_WAG_DEG} ${x} ${y})`}>
        <Tail s={s} rump={rump} pal={pal} mode="neutral" />
      </G>
    );
  }
  switch (s.tail.kind) {
    case 'straight':
      return line(`M${x + 2} ${y + 2} Q${x - 10 * k} ${y + 6} ${x - 18 * k} ${y + 14}`, 6);
    case 'sickle':
      return line(`M${x + 2} ${y + 2} Q${x - 12 * k} ${y - 4} ${x - 12 * k} ${y - 20 * k}`, 5);
    case 'plume':
      return line(`M${x + 2} ${y + 2} Q${x - 18 * k} ${y - 2} ${x - 22 * k} ${y + 14 * k}`, 9);
    case 'curl':
      return line(`M${x + 2} ${y + 4} Q${x - 14 * k} ${y - 4} ${x - 8 * k} ${y - 16 * k} Q${x} ${y - 20 * k} ${x + 6} ${y - 12 * k}`, 9);
    case 'stub':
      return line(`M${x + 2} ${y + 2} L${x - 7 * k} ${y - 4 * k}`, 6);
    case 'pom':
      return (
        <G>
          {line(`M${x + 2} ${y + 2} Q${x - 8} ${y - 4} ${x - 11} ${y - 12}`, 4)}
          <Circle cx={x - 12} cy={y - 16} r={7 * k} fill={pal.shade} {...outline} />
        </G>
      );
  }
}

/** Ears held up: hanging ears swing up from the head while the Dog looks. */
const PERK_DEG: Record<BreedShape['ears']['kind'], number> = { prick: 0, bat: 0, rose: -14, floppy: -34, long: -38 };
/** Ears pinned back: upright ears fold toward the neck, hanging ears swing back. */
const PIN_DEG: Record<BreedShape['ears']['kind'], number> = { prick: -58, bat: -58, rose: -34, floppy: 22, long: 24 };

function Ear({ s, head, pal, back, mode }: { s: BreedShape; head: { x: number; y: number }; pal: CoatPalette; back: boolean; mode: RtdParts['ears'] }) {
  const turn = mode === 'up' ? PERK_DEG[s.ears.kind] : mode === 'pinned' ? PIN_DEG[s.ears.kind] : 0;
  if (turn !== 0) {
    return (
      <G transform={`rotate(${turn} ${head.x - s.headR * 0.4} ${head.y - s.headR * 0.5})`}>
        <Ear s={s} head={head} pal={pal} back={back} mode="relaxed" />
      </G>
    );
  }
  const r = s.headR;
  const k = s.ears.size;
  const { x, y } = head;
  const shapeProps = { fill: pal.shade, ...outline };
  switch (s.ears.kind) {
    case 'prick':
      return back ? null : <Path d={`M${x - r * 0.7} ${y - r * 0.5} L${x - r * 0.35} ${y - r * 0.5 - 20 * k} L${x + r * 0.35} ${y - r * 0.8} Z`} {...shapeProps} />;
    case 'bat':
      return back ? null : <Path d={`M${x - r * 0.8} ${y - r * 0.3} Q${x - r * 0.9} ${y - r * 0.5 - 22 * k} ${x - r * 0.25} ${y - r * 0.5 - 20 * k} Q${x + r * 0.3} ${y - r * 0.6} ${x + r * 0.4} ${y - r * 0.8} Z`} {...shapeProps} />;
    case 'rose':
      return back ? null : <Path d={`M${x - r * 0.8} ${y - r * 0.4} Q${x - r * 0.4} ${y - r - 8 * k} ${x + r * 0.3} ${y - r * 0.8} Q${x + r * 0.1} ${y - r * 0.2} ${x - r * 0.8} ${y - r * 0.4} Z`} {...shapeProps} />;
    case 'floppy':
      return back ? null : <Path d={`M${x - r * 0.6} ${y - r * 0.7} Q${x - r * 1.3} ${y + r * 0.4 * k} ${x - r * 0.5} ${y + r * 0.9 * k} Q${x + r * 0.2} ${y + r * 0.4} ${x + r * 0.1} ${y - r * 0.7} Z`} {...shapeProps} />;
    case 'long':
      return back ? null : <Path d={`M${x - r * 0.6} ${y - r * 0.7} Q${x - r * 1.5} ${y + r * 0.6 * k} ${x - r * 0.6} ${y + r * 1.5 * k} Q${x + r * 0.3} ${y + r * 0.8} ${x + r * 0.15} ${y - r * 0.7} Z`} {...shapeProps} />;
  }
}

/** Raised fur along the back, from the withers to the rump, as a zig-zag ridge on the body outline. */
export function hacklesPath(s: BreedShape): string {
  const g = geometryOf(s);
  const n = 7;
  let d = '';
  for (let i = 0; i <= n; i++) {
    const t = 0.62 - (1.2 * i) / n; // from the withers (front) back to the rump
    const x = g.bodyCx + s.bodyRx * t;
    const y = g.bodyCy - s.bodyRy * Math.sqrt(Math.max(0, 1 - t * t));
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${(y + 1.5).toFixed(1)}`;
    if (i < n) {
      const tm = t - 0.6 / n;
      const xm = g.bodyCx + s.bodyRx * tm;
      const ym = g.bodyCy - s.bodyRy * Math.sqrt(Math.max(0, 1 - tm * tm));
      d += `L${(xm - 1.5).toFixed(1)} ${(ym - 10).toFixed(1)}`;
    }
  }
  return `${d}Z`;
}

function Eye({ cx, cy, mode }: { cx: number; cy: number; mode: RtdParts['eyes'] }) {
  switch (mode) {
    case 'wide':
      return (
        <G>
          <Circle cx={cx} cy={cy} r={4.4} fill={lightColor.surface} {...outline} strokeWidth={1.6} />
          <Circle cx={cx} cy={cy} r={2.8} fill={lightColor.ink} />
          <Circle cx={cx + 1.5} cy={cy - 1.2} r={0.8} fill={lightColor.surface} />
        </G>
      );
    case 'whale':
      // the white shows behind the pupil: a wide crescent while the face stays turned away
      return (
        <G>
          <Ellipse cx={cx} cy={cy} rx={5.2} ry={4.4} fill={lightColor.surface} {...outline} strokeWidth={1.6} />
          <Circle cx={cx + 2.2} cy={cy + 0.4} r={2.3} fill={lightColor.ink} />
        </G>
      );
    case 'fixed':
      return (
        <G>
          <Circle cx={cx} cy={cy} r={3} fill={lightColor.surface} {...outline} strokeWidth={1.4} />
          <Circle cx={cx + 0.8} cy={cy} r={2.1} fill={lightColor.ink} />
          <Path d={`M${cx - 5} ${cy - 5.5} L${cx + 5.5} ${cy - 2.6}`} stroke={lightColor.ink} strokeWidth={2.2} strokeLinecap="round" />
        </G>
      );
    default:
      return (
        <G>
          <Circle cx={cx} cy={cy} r={2.4} fill={lightColor.ink} />
          <Circle cx={cx + 0.8} cy={cy - 0.8} r={0.8} fill={lightColor.surface} />
        </G>
      );
  }
}

function Mouth({ s, snout, mode }: { s: BreedShape; snout: { x: number; y: number }; mode: RtdParts['mouth'] }) {
  const x0 = snout.x + 2;
  const x1 = snout.x + s.snout.l + s.headR * 0.5 - 2;
  const y = snout.y + s.snout.h * 0.62;
  switch (mode) {
    case 'open':
      return <Path d={`M${x0 + 3} ${y - 1} Q${(x0 + x1) / 2} ${y + 6} ${x1} ${y - 2}`} fill="none" stroke={lightColor.ink} strokeWidth={1.8} strokeLinecap="round" />;
    case 'tongue_flick':
      return (
        <G>
          <Path d={`M${x1 - 6} ${y} L${x1 + 5} ${y + 1.5}`} stroke={lightColor.ink} strokeWidth={1.8} strokeLinecap="round" />
          <Path d={`M${x1 - 1} ${y + 1} Q${x1 + 6} ${y + 8} ${x1 + 1} ${y + 11}`} fill="none" stroke={lightColor.ink} strokeWidth={5.2} strokeLinecap="round" />
          <Path d={`M${x1 - 1} ${y + 1} Q${x1 + 6} ${y + 8} ${x1 + 1} ${y + 11}`} fill="none" stroke={lightColor.coral} strokeWidth={2.6} strokeLinecap="round" />
        </G>
      );
    case 'tight':
      // a light line inside an ink one: it reads on a black muzzle as well as a pale one
      return (
        <G>
          <Path d={`M${x0 - 2} ${y} L${x1 + 2} ${y}`} stroke={lightColor.ink} strokeWidth={4.6} strokeLinecap="round" />
          <Path d={`M${x0 - 2} ${y} L${x1 + 2} ${y}`} stroke={lightColor.surface} strokeWidth={2} strokeLinecap="round" />
          <Path d={`M${x0 - 4} ${y - 3} L${x0 - 2} ${y + 1}`} stroke={lightColor.ink} strokeWidth={3.4} strokeLinecap="round" />
          <Path d={`M${x0 - 4} ${y - 3} L${x0 - 2} ${y + 1}`} stroke={lightColor.surface} strokeWidth={1.4} strokeLinecap="round" />
        </G>
      );
    default:
      return null;
  }
}

/** The body transform a pose puts on the whole Dog about the feet: a play bow tips the rear up, a lean weights the front. */
function bodyTransform(body: RtdParts['body'], g: ReturnType<typeof geometryOf>): string | undefined {
  if (body === 'bow') return `rotate(12 ${g.legX.front + 6} ${GROUND_Y})`;
  if (body === 'lean') return `rotate(4 ${g.legX.back + 6} ${GROUND_Y})`;
  return undefined;
}

/** One side-view Dog silhouette facing right: a body, four legs, a head with muzzle, ears and tail composed from the breed's shape. */
function Dog({ breed, pal, parts, reduced }: { breed: BreedId; pal: CoatPalette; parts: RtdParts; reduced: boolean }) {
  const s = BREED_SHAPES[artBreed(breed)];
  const g = geometryOf(s);
  const legTop = g.bodyCy;
  const leg = (cx: number, fill: string) => <Rect x={cx - s.legW / 2} y={legTop} width={s.legW} height={GROUND_Y - legTop} rx={s.legW / 2} fill={fill} {...outline} />;
  const neckBase = { x: g.bodyCx + s.bodyRx * 0.7, y: g.bodyTop + s.bodyRy * 0.5 };
  const eye = { x: g.head.x + s.headR * 0.3, y: g.head.y - s.headR * 0.1 };
  const bowScale = parts.body === 'bow' ? 0.93 : 1;
  const slope = s.sloped ? `rotate(-5 ${g.bodyCx} ${g.bodyCy})` : undefined;
  return (
    <G transform={`translate(${FIT_PIVOT.x} ${FIT_PIVOT.y}) scale(${fitScale(s) * bowScale}) translate(${-FIT_PIVOT.x} ${-FIT_PIVOT.y})`}>
      <Ellipse cx={g.bodyCx} cy={GROUND_Y + 2} rx={s.bodyRx + 6} ry={4} fill={lightColor.ink} opacity={0.14} />
      <G transform={bodyTransform(parts.body, g)}>
        {leg(g.legX.back + 6, pal.shade)}
        {leg(g.legX.front + 6, pal.shade)}
        {parts.tail === 'wag' && !reduced ? <WagTail s={s} rump={g.rump} pal={pal} /> : <Tail s={s} rump={g.rump} pal={pal} mode={parts.tail} />}
        <Ellipse cx={g.bodyCx} cy={g.bodyCy} rx={s.bodyRx} ry={s.bodyRy} fill={pal.fill} {...outline} transform={slope} />
        <Ellipse cx={g.bodyCx + 2} cy={g.bodyCy + s.bodyRy * 0.55} rx={s.bodyRx * 0.62} ry={s.bodyRy * 0.3} fill={pal.belly} />
        {parts.hackles && <Path d={hacklesPath(s)} fill={pal.shade} {...outline} strokeWidth={2} transform={slope} />}
        {leg(g.legX.back, pal.fill)}
        {leg(g.legX.front, pal.fill)}
        {s.fluff && (
          <G>
            {[0, 1, 2].map((i) => (
              <Circle key={i} cx={g.bodyCx + s.bodyRx * (0.72 - i * 0.04)} cy={g.bodyCy + s.bodyRy * (0.05 + i * 0.32)} r={5.5} fill={pal.belly} {...outline} />
            ))}
          </G>
        )}
        <Path d={`M${neckBase.x - 8} ${neckBase.y} L${g.head.x} ${g.head.y + s.headR * 0.5}`} stroke={lightColor.ink} strokeWidth={s.headR * 1.15 + STROKE * 1.6} strokeLinecap="round" fill="none" />
        <Path d={`M${neckBase.x - 8} ${neckBase.y} L${g.head.x} ${g.head.y + s.headR * 0.5}`} stroke={pal.fill} strokeWidth={s.headR * 1.15} strokeLinecap="round" fill="none" />
        <Ear s={s} head={g.head} pal={pal} back mode={parts.ears} />
        <Circle cx={g.head.x} cy={g.head.y} r={s.headR} fill={pal.fill} {...outline} />
        <Rect x={g.snout.x} y={g.snout.y} width={s.snout.l + s.headR * 0.5} height={s.snout.h} rx={s.snout.h / 2} fill={pal.belly} {...outline} />
        <Ellipse cx={g.snout.x + s.snout.l + s.headR * 0.5 - 3} cy={g.snout.y + 3} rx={3} ry={2.4} fill={lightColor.ink} />
        <Mouth s={s} snout={g.snout} mode={parts.mouth} />
        {s.topknot && <Circle cx={g.head.x - 1} cy={g.head.y - s.headR - 2} r={s.headR * 0.55} fill={pal.fill} {...outline} />}
        <Ear s={s} head={g.head} pal={pal} back={false} mode={parts.ears} />
        <Eye cx={eye.x} cy={eye.y} mode={parts.eyes} />
        {parts.gaze && (
          <G>
            {[0, 1].map((i) => (
              <Path key={i} d={`M${g.snout.x + s.snout.l + s.headR * 0.5 + 5 + i * 6} ${g.head.y - s.headR * 0.1 - 6} Q${g.snout.x + s.snout.l + s.headR * 0.5 + 9 + i * 6} ${g.head.y - s.headR * 0.1} ${g.snout.x + s.snout.l + s.headR * 0.5 + 5 + i * 6} ${g.head.y - s.headR * 0.1 + 6}`} fill="none" stroke={lightColor.accent} strokeWidth={2.4} strokeLinecap="round" />
            ))}
          </G>
        )}
      </G>
    </G>
  );
}

/**
 * A Dog silhouette in the chosen coat, drawn as vector art so it scales with the weight and takes the theme's ink. "Otra raza"
 * is drawn as a Mestizo. Decorative unless `label` is given. `signal` draws a Body Signal (Read the Dog); `looking` (or
 * `signal="looking"`) raises the ears and fixes the gaze (the old Diagnostic signal). The loose wag is the only motion and
 * stays a still curve under reduced motion.
 */
export function BreedArt({ breed, coat, width = 120, label, looking = false, signal }: { breed: BreedId; coat: DogCoat; width?: number; label?: string; looking?: boolean; signal?: RtdSignal | 'looking' }) {
  const pal = COAT_PALETTE[coat];
  const { reduced } = useMotion();
  const height = (width * BREED_VIEW.h) / BREED_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${BREED_VIEW.w} ${BREED_VIEW.h}`} {...(label !== undefined ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true })}>
      <Dog breed={breed} pal={pal} parts={partsOf(signal, looking)} reduced={reduced} />
    </Svg>
  );
}
