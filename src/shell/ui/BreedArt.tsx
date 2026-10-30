import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { DogCoat } from '../../sim/config';
import type { BreedId } from '../onboarding/breeds';
import { BREED_SHAPES, BREED_VIEW, FIT_PIVOT, GROUND_Y, artBreed, fitScale, geometryOf, type BreedShape } from './breedShapes';
import { COAT_PALETTE, type CoatPalette } from './canine';
import { lightColor } from './theme';

const STROKE = 2.4;
const outline = { stroke: lightColor.ink, strokeWidth: STROKE, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

function Tail({ s, rump, pal }: { s: BreedShape; rump: { x: number; y: number }; pal: CoatPalette }) {
  const { x, y } = rump;
  const k = s.tail.size;
  const line = (d: string, w: number) => (
    <G>
      <Path d={d} fill="none" stroke={lightColor.ink} strokeWidth={w + STROKE * 1.6} strokeLinecap="round" />
      <Path d={d} fill="none" stroke={pal.shade} strokeWidth={w} strokeLinecap="round" />
    </G>
  );
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

function Ear({ s, head, pal, back, looking }: { s: BreedShape; head: { x: number; y: number }; pal: CoatPalette; back: boolean; looking: boolean }) {
  if (looking && PERK_DEG[s.ears.kind] !== 0) {
    return (
      <G transform={`rotate(${PERK_DEG[s.ears.kind]} ${head.x - s.headR * 0.4} ${head.y - s.headR * 0.5})`}>
        <Ear s={s} head={head} pal={pal} back={back} looking={false} />
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

/** One side-view Dog silhouette facing right: a body, four legs, a head with muzzle, ears and tail composed from the breed's shape. */
function Dog({ breed, pal, looking }: { breed: BreedId; pal: CoatPalette; looking: boolean }) {
  const s = BREED_SHAPES[artBreed(breed)];
  const g = geometryOf(s);
  const legTop = g.bodyCy;
  const leg = (cx: number, fill: string) => <Rect x={cx - s.legW / 2} y={legTop} width={s.legW} height={GROUND_Y - legTop} rx={s.legW / 2} fill={fill} {...outline} />;
  const neckBase = { x: g.bodyCx + s.bodyRx * 0.7, y: g.bodyTop + s.bodyRy * 0.5 };
  return (
    <G transform={`translate(${FIT_PIVOT.x} ${FIT_PIVOT.y}) scale(${fitScale(s)}) translate(${-FIT_PIVOT.x} ${-FIT_PIVOT.y})`}>
      <Ellipse cx={g.bodyCx} cy={GROUND_Y + 2} rx={s.bodyRx + 6} ry={4} fill={lightColor.ink} opacity={0.14} />
      {leg(g.legX.back + 6, pal.shade)}
      {leg(g.legX.front + 6, pal.shade)}
      <Tail s={s} rump={g.rump} pal={pal} />
      <Ellipse cx={g.bodyCx} cy={g.bodyCy} rx={s.bodyRx} ry={s.bodyRy} fill={pal.fill} {...outline} transform={s.sloped ? `rotate(-5 ${g.bodyCx} ${g.bodyCy})` : undefined} />
      <Ellipse cx={g.bodyCx + 2} cy={g.bodyCy + s.bodyRy * 0.55} rx={s.bodyRx * 0.62} ry={s.bodyRy * 0.3} fill={pal.belly} />
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
      <Ear s={s} head={g.head} pal={pal} back looking={looking} />
      <Circle cx={g.head.x} cy={g.head.y} r={s.headR} fill={pal.fill} {...outline} />
      <Rect x={g.snout.x} y={g.snout.y} width={s.snout.l + s.headR * 0.5} height={s.snout.h} rx={s.snout.h / 2} fill={pal.belly} {...outline} />
      <Ellipse cx={g.snout.x + s.snout.l + s.headR * 0.5 - 3} cy={g.snout.y + 3} rx={3} ry={2.4} fill={lightColor.ink} />
      {s.topknot && <Circle cx={g.head.x - 1} cy={g.head.y - s.headR - 2} r={s.headR * 0.55} fill={pal.fill} {...outline} />}
      <Ear s={s} head={g.head} pal={pal} back={false} looking={looking} />
      {looking && <Circle cx={g.head.x + s.headR * 0.3} cy={g.head.y - s.headR * 0.1} r={4.4} fill={lightColor.surface} {...outline} strokeWidth={1.6} />}
      <Circle cx={g.head.x + s.headR * 0.3} cy={g.head.y - s.headR * 0.1} r={looking ? 2.8 : 2.4} fill={lightColor.ink} />
      <Circle cx={g.head.x + s.headR * 0.38} cy={g.head.y - s.headR * 0.18} r={0.8} fill={lightColor.surface} />
      {looking && (
        <G>
          {[0, 1].map((i) => (
            <Path key={i} d={`M${g.snout.x + s.snout.l + s.headR * 0.5 + 5 + i * 6} ${g.head.y - s.headR * 0.1 - 6} Q${g.snout.x + s.snout.l + s.headR * 0.5 + 9 + i * 6} ${g.head.y - s.headR * 0.1} ${g.snout.x + s.snout.l + s.headR * 0.5 + 5 + i * 6} ${g.head.y - s.headR * 0.1 + 6}`} fill="none" stroke={lightColor.accent} strokeWidth={2.4} strokeLinecap="round" />
          ))}
        </G>
      )}
    </G>
  );
}

/**
 * A Dog silhouette in the chosen coat, drawn as vector art so it scales with the weight and takes the theme's ink. "Otra raza"
 * is drawn as a Mestizo. Decorative unless `label` is given. `looking` raises the ears and fixes the gaze (the Diagnostic signal).
 */
export function BreedArt({ breed, coat, width = 120, label, looking = false }: { breed: BreedId; coat: DogCoat; width?: number; label?: string; looking?: boolean }) {
  const pal = COAT_PALETTE[coat];
  const height = (width * BREED_VIEW.h) / BREED_VIEW.w;
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${BREED_VIEW.w} ${BREED_VIEW.h}`} {...(label !== undefined ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true })}>
      <Dog breed={breed} pal={pal} looking={looking} />
    </Svg>
  );
}
