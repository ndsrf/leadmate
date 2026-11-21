import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { posteRingDrawing, POSTE_RING_CENTER } from '../nodes/posteRingLook';
import type { PosteRingProgress } from '../nodes/posteMinigame';
import { usePalette } from './theme';

const SCENE = { w: 320, h: 190 } as const;

/** A path along `fill` (0 to 1) of an ellipse, clockwise from the top. */
function arcPath(cx: number, cy: number, rx: number, ry: number, fill: number): string {
  const p = Math.min(0.999, Math.max(0, fill));
  const a = p * 2 * Math.PI;
  return `M ${cx} ${cy - ry} A ${rx} ${ry} 0 ${p > 0.5 ? 1 : 0} 1 ${(cx + rx * Math.sin(a)).toFixed(2)} ${(cy - ry * Math.cos(a)).toFixed(2)}`;
}

/**
 * The Poste practice ring around the Dog: it closes while the player holds Stop, lands when the Dog settles and flicks
 * open on a release. With reduced motion it is a fixed ring whose arc fills. Drawn over the scene, ink outline under accent.
 */
export function PosteRing({ ring, reducedMotion, snapAge, snapFromProgress, landedAge }: { ring: PosteRingProgress; reducedMotion: boolean; snapAge?: number; snapFromProgress?: number; landedAge?: number }) {
  const color = usePalette();
  const d = posteRingDrawing(ring, { reducedMotion, snapAge, snapFromProgress, landedAge });
  if (!d) return null;
  const { look, rx, ry } = d;
  const { x, y } = POSTE_RING_CENTER;
  return (
    <Svg style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }} pointerEvents="none" viewBox={`0 0 ${SCENE.w} ${SCENE.h}`} accessible={false}>
      {look.ghost ? (
        <>
          <Ellipse cx={x} cy={y} rx={look.ghost.radius * 0.62} ry={look.ghost.radius * 0.31} stroke={color.ink} strokeWidth={5} opacity={look.ghost.alpha} fill="none" />
          <Ellipse cx={x} cy={y} rx={look.ghost.radius * 0.62} ry={look.ghost.radius * 0.31} stroke={color.accent} strokeWidth={3} opacity={look.ghost.alpha} fill="none" />
        </>
      ) : null}
      {look.disc ? (
        <Ellipse cx={x} cy={y} rx={rx} ry={ry} fill={color.accent} stroke={color.ink} strokeWidth={3} />
      ) : (
        <>
          {look.fill < 1 ? <Ellipse cx={x} cy={y} rx={rx} ry={ry} stroke={color.surfaceSunken} strokeWidth={4} fill="none" opacity={look.alpha} /> : null}
          {look.fill > 0 ? (
            <>
              <Path d={look.fill >= 1 ? `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0` : arcPath(x, y, rx, ry, look.fill)} stroke={color.ink} strokeWidth={6} strokeLinecap="round" fill="none" opacity={look.alpha} />
              <Path d={look.fill >= 1 ? `M ${x - rx} ${y} a ${rx} ${ry} 0 1 0 ${2 * rx} 0 a ${rx} ${ry} 0 1 0 ${-2 * rx} 0` : arcPath(x, y, rx, ry, look.fill)} stroke={color.accent} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={look.alpha} />
            </>
          ) : null}
        </>
      )}
    </Svg>
  );
}
