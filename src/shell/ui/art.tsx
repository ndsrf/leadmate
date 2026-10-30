import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
// Migas and the meadow are illustrations, drawn in the Light palette whatever the Appearance; the Lead is UI chrome.
import { lightColor, theme, usePalette } from './theme';

const { coat, coatDark, coatLight } = theme.mascot;

/** Migas trotting, drawn from the design's paper-cut mascot (viewBox 210 by 150). */
export function Migas({ width = 180, label }: { width?: number; label?: string }) {
  const ink = lightColor.ink;
  const leg = (x: number, rot: number, fill: string) => <Rect x={x} y={88} width={14} height={38} rx={7} fill={fill} stroke={ink} strokeWidth={3} transform={`rotate(${rot} ${x + 7} 92)`} />;
  return (
    <Svg width={width} height={(width * 150) / 210} viewBox="0 0 210 150" {...(label !== undefined ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true })}>
      <Ellipse cx={100} cy={132} rx={72} ry={6} fill={ink} opacity={0.14} />
      <Path d="M38 70C18 66 10 44 24 32" fill="none" stroke={ink} strokeWidth={17} strokeLinecap="round" />
      <Path d="M38 70C18 66 10 44 24 32" fill="none" stroke={coatDark} strokeWidth={11} strokeLinecap="round" />
      <G>
        {leg(116, -20, coatDark)}
        {leg(62, 16, coatDark)}
        {leg(102, 16, coat)}
        {leg(46, -18, coat)}
      </G>
      <Rect x={36} y={50} width={104} height={54} rx={27} fill={coat} stroke={ink} strokeWidth={3} />
      <Ellipse cx={88} cy={94} rx={34} ry={7} fill={coatLight} />
      <Path d="M130 60L142 74" stroke={ink} strokeWidth={16} strokeLinecap="round" />
      <Path d="M130 60L142 74" stroke={lightColor.brand} strokeWidth={10} strokeLinecap="round" />
      <Circle cx={141} cy={82} r={5} fill={lightColor.accent} stroke={ink} strokeWidth={2.5} />
      <Circle cx={152} cy={48} r={24} fill={coat} stroke={ink} strokeWidth={3} />
      <Rect x={162} y={44} width={36} height={24} rx={12} fill={coatLight} stroke={ink} strokeWidth={3} />
      <Ellipse cx={195} cy={51} rx={6} ry={5} fill={ink} />
      <Path d="M178 64q6 4 12 0" fill="none" stroke={ink} strokeWidth={2.5} strokeLinecap="round" />
      <Circle cx={160} cy={42} r={4} fill={ink} />
      <Circle cx={161.5} cy={40.5} r={1.4} fill={lightColor.surface} />
      <Path d="M142 26C124 26 120 52 132 62C146 58 150 40 148 28z" fill={coatDark} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
    </Svg>
  );
}

/** The Lead: a leash line with a coral clip on one end and a loop on the other. It underlines titles and divides sections. */
export function LeadLine({ width = 220, className = '' }: { width?: number; className?: string }) {
  const color = usePalette();
  return (
    <Svg width={width} height={(width * 30) / 310} viewBox="0 0 310 30" className={className} aria-hidden>
      <Path d="M10 10H120C140 10 146 24 155 24S170 10 190 10H300" fill="none" stroke={color.ink} strokeWidth={4} strokeLinecap="round" />
      <Circle cx={10} cy={10} r={6} fill={color.coral} stroke={color.ink} strokeWidth={3} />
      <Circle cx={301} cy={10} r={7} fill="none" stroke={color.ink} strokeWidth={4} />
    </Svg>
  );
}

/** Sky wash, a sun, two clouds and three paper hills with the road across them (viewBox 390 by 844), for the splash. */
export function MeadowBackdrop({ width, height }: { width: number; height: number }) {
  const ink = lightColor.ink;
  const w2 = theme.world.w2;
  return (
    <Svg width={width} height={height} viewBox="0 0 390 844" preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', left: 0, top: 0 }} aria-hidden>
      <Rect width={390} height={844} fill={lightColor.sky} />
      <Circle cx={296} cy={300} r={40} fill={lightColor.accent} stroke={ink} strokeWidth={4} />
      <G fill={lightColor.surface} stroke={ink} strokeWidth={3.5}>
        <Path d="M30 252a22 22 0 0 1 22-22 26 26 0 0 1 48 6 18 18 0 0 1 4 36H44a16 16 0 0 1-14-20z" />
        <Path d="M250 214a16 16 0 0 1 16-16 20 20 0 0 1 36 4 14 14 0 0 1 2 28h-38a14 14 0 0 1-16-16z" />
      </G>
      <Path d="M0 470C70 420 140 450 210 432S330 410 390 444V844H0Z" fill={w2.ground} stroke={ink} strokeWidth={4} />
      <Path d="M0 580C80 540 170 580 250 560S350 540 390 566V844H0Z" fill={lightColor.brand} stroke={ink} strokeWidth={4} />
      <Path d="M0 700C90 668 180 706 270 690S350 676 390 690V844H0Z" fill={lightColor.brandDeep} stroke={ink} strokeWidth={4} />
      <Path d="M-10 640C70 600 140 650 214 626S330 610 400 626" fill="none" stroke={ink} strokeWidth={30} strokeLinecap="round" />
      <Path d="M-10 640C70 600 140 650 214 626S330 610 400 626" fill="none" stroke={lightColor.surface} strokeWidth={22} strokeLinecap="round" />
      <Path d="M-10 640C70 600 140 650 214 626S330 610 400 626" fill="none" stroke={ink} strokeWidth={3.5} strokeLinecap="round" strokeDasharray="10 9" />
    </Svg>
  );
}

/** Starting house landmark at the beginning of World 1 (Board 11). */
export function HouseLandmark() {
  const ink = lightColor.ink;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className="items-center justify-center mb-3"
    >
      <Svg width={44} height={40} viewBox="0 0 44 40" aria-hidden>
        <Path d="M22 4L4 18h36z" fill={lightColor.coral} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        <Rect x={30} y={6} width={5} height={10} fill={lightColor.inkMuted} stroke={ink} strokeWidth={2} />
        <Rect x={8} y={18} width={28} height={18} rx={2} fill={lightColor.surface} stroke={ink} strokeWidth={2.4} />
        <Rect x={18} y={24} width={8} height={12} rx={1} fill={lightColor.brandDeep} stroke={ink} strokeWidth={1.8} />
        <Circle cx={13} cy={23} r={3} fill={lightColor.accent} stroke={ink} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

/** Decorative paper-cut scenery dots along active world trail borders. */
export function SceneryBushes({ palette }: { palette: { ground: string; sky: string } }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', inset: 0 }}>
      <View style={{ position: 'absolute', left: 16, top: 40, width: 12, height: 12, borderRadius: 6, backgroundColor: palette.ground, opacity: 0.6, borderWidth: 1.5, borderColor: lightColor.ink }} />
      <View style={{ position: 'absolute', right: 20, top: 110, width: 16, height: 16, borderRadius: 8, backgroundColor: palette.ground, opacity: 0.5, borderWidth: 1.5, borderColor: lightColor.ink }} />
      <View style={{ position: 'absolute', left: 24, top: 220, width: 14, height: 14, borderRadius: 7, backgroundColor: palette.ground, opacity: 0.55, borderWidth: 1.5, borderColor: lightColor.ink }} />
    </View>
  );
}
