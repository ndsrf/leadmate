import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import { color, theme } from './theme';

const { coat, coatDark, coatLight } = theme.mascot;

/** The placeholder illustrations a Lesson can name (`art` of an image block, `poster` of a video block). */
export const LESSON_ART_NAMES = ['leash', 'body', 'smile', 'marker', 'sniff', 'poster'] as const;
export type LessonArtName = (typeof LESSON_ART_NAMES)[number];

export function isLessonArt(name: string): name is LessonArtName {
  return (LESSON_ART_NAMES as readonly string[]).includes(name);
}

/** A flat-fill paper-cut dog, ink outline, in a 16:9 scene (viewBox 320 by 180); `head` lowers it for sniffing. */
function Dog({ x, y, head = 0, calm = false }: { x: number; y: number; head?: number; calm?: boolean }) {
  const ink = color.ink;
  return (
    <G transform={`translate(${x} ${y})`}>
      <Ellipse cx={30} cy={62} rx={42} ry={5} fill={ink} opacity={0.14} />
      <Rect x={-4} y={34} width={12} height={26} rx={6} fill={coatDark} stroke={ink} strokeWidth={2.5} />
      <Rect x={44} y={34} width={12} height={26} rx={6} fill={coatDark} stroke={ink} strokeWidth={2.5} />
      <Rect x={-14} y={10} width={80} height={40} rx={20} fill={coat} stroke={ink} strokeWidth={2.5} />
      <Path d="M-12 22C-26 16-28 2-18-6" fill="none" stroke={ink} strokeWidth={9} strokeLinecap="round" />
      <Path d="M-12 22C-26 16-28 2-18-6" fill="none" stroke={coatDark} strokeWidth={5} strokeLinecap="round" />
      <G transform={`translate(0 ${head})`}>
        <Circle cx={72} cy={6} r={17} fill={coat} stroke={ink} strokeWidth={2.5} />
        <Rect x={80} y={4} width={26} height={17} rx={8.5} fill={coatLight} stroke={ink} strokeWidth={2.5} />
        <Ellipse cx={103} cy={9} rx={4} ry={3.5} fill={ink} />
        <Circle cx={77} cy={2} r={2.8} fill={ink} />
        <Path d={calm ? 'M88 20q5 3 9 0' : 'M88 21q5 2 9 -1'} fill="none" stroke={ink} strokeWidth={2} strokeLinecap="round" />
        <Path d="M62 -6C50 -6 48 14 56 20C66 16 68 2 66 -4z" fill={coatDark} stroke={ink} strokeWidth={2.5} strokeLinejoin="round" />
      </G>
    </G>
  );
}

/** A flat paper-cut illustration for placeholder Lessons; decorative unless `label` is given. */
export function LessonArt({ name, width = 320, label }: { name: LessonArtName; width?: number; label?: string }) {
  const ink = color.ink;
  const a11y = label !== undefined ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true };
  return (
    <Svg width={width} height={(width * 180) / 320} viewBox="0 0 320 180" {...a11y}>
      <Rect width={320} height={180} fill={color.sky} />
      <Circle cx={270} cy={36} r={18} fill={color.accent} stroke={ink} strokeWidth={3} />
      <Path d="M0 120C60 100 120 124 190 110S290 100 320 112V180H0Z" fill={color.brand} stroke={ink} strokeWidth={3} />
      <Path d="M0 150C70 134 150 156 230 142S300 138 320 146V180H0Z" fill={color.brandDeep} stroke={ink} strokeWidth={3} />
      {name === 'leash' && (
        <>
          <Dog x={150} y={72} />
          <Path d="M60 90C90 128 130 128 148 106" fill="none" stroke={ink} strokeWidth={4} strokeLinecap="round" />
          <Circle cx={56} cy={84} r={9} fill={color.coral} stroke={ink} strokeWidth={3} />
        </>
      )}
      {name === 'body' && (
        <>
          <Dog x={120} y={72} calm />
          <Path d="M232 40q8-10 16 0M236 56q10-8 20 0" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {name === 'smile' && (
        <>
          <Dog x={190} y={72} calm />
          <Path d="M40 80C70 140 150 140 196 104" fill="none" stroke={ink} strokeWidth={5} strokeLinecap="round" />
          <Circle cx={40} cy={78} r={9} fill={color.coral} stroke={ink} strokeWidth={3} />
        </>
      )}
      {name === 'marker' && (
        <>
          <Dog x={110} y={72} calm />
          <Circle cx={250} cy={86} r={20} fill={color.accent} stroke={ink} strokeWidth={3} />
          <Path d="M250 74l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill={color.surface} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        </>
      )}
      {name === 'sniff' && (
        <>
          <Dog x={120} y={72} head={26} />
          <Path d="M232 140q4-14 8 0M248 142q4-12 8 0" fill="none" stroke={ink} strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {name === 'poster' && (
        <>
          <Dog x={70} y={72} calm />
          <Circle cx={248} cy={92} r={30} fill={color.surface} stroke={ink} strokeWidth={3.5} />
          <Path d="M240 76L264 92L240 108Z" fill={color.brand} stroke={ink} strokeWidth={3} strokeLinejoin="round" />
        </>
      )}
    </Svg>
  );
}
