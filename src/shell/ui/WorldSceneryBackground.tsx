import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Path, Rect } from 'react-native-svg';
import { lightColor as color } from './theme';
import { ROW_HEIGHT } from './mapLayout';

export interface WorldSceneryPalette {
  sky: string;
  ground: string;
  accent?: string;
  soft?: string;
  deep?: string;
}

const absoluteFill = {
  position: 'absolute' as const,
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
};

/** Offset from the top of the card to the beginning of the interactive path. */
export const TOP_LANDMARK_HEIGHT = 48;
export const TOP_LANDMARK_GAP = 12;
export const CARD_PADDING_TOP = 16;
export const PATH_TOP_OFFSET = CARD_PADDING_TOP + TOP_LANDMARK_HEIGHT + TOP_LANDMARK_GAP;

// ---------------------------------------------------------------------------
// Standardized Top Landmarks (48px height)
// ---------------------------------------------------------------------------

/** Standardized 48px Top Landmark entrance for World 1 (Home & Thresholds). Absorbs HouseLandmark. */
export function HomeTopLandmark({ palette }: { palette?: WorldSceneryPalette }) {
  const ink = color.ink;
  const accent = palette?.accent ?? color.coral;
  const deep = palette?.deep ?? color.brandDeep;
  const soft = palette?.soft ?? color.accent;

  return (
    <View
      testID="top-landmark-1"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ width: 52, height: TOP_LANDMARK_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={52} height={TOP_LANDMARK_HEIGHT} viewBox="0 0 52 48" aria-hidden>
        {/* Chimney */}
        <Rect x={36} y={6} width={6} height={12} rx={1} fill={color.inkMuted} stroke={ink} strokeWidth={2} />
        {/* Gable roof */}
        <Path d="M26 4 L6 20 h40 z" fill={accent} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
        {/* House facade */}
        <Rect x={11} y={20} width={30} height={24} rx={2} fill={color.surface} stroke={ink} strokeWidth={2.4} />
        {/* Doorway arch */}
        <Path d="M21 44 v-10 a5 5 0 0 1 10 0 v10 z" fill={deep} stroke={ink} strokeWidth={1.8} />
        {/* Round window */}
        <Circle cx={16} cy={27} r={3.5} fill={soft} stroke={ink} strokeWidth={1.5} />
        <Line x1={12.5} y1={27} x2={19.5} y2={27} stroke={ink} strokeWidth={1} />
        <Line x1={16} y1={23.5} x2={16} y2={30.5} stroke={ink} strokeWidth={1} />
      </Svg>
    </View>
  );
}

/** Standardized 48px Top Landmark entrance for World 2 (The Quiet Sidewalk). */
export function SidewalkTopLandmark({ palette }: { palette?: WorldSceneryPalette }) {
  const ink = color.ink;
  const accent = palette?.accent ?? color.brand;
  const deep = palette?.deep ?? color.brandDeep;
  const soft = palette?.soft ?? color.accentSoft;

  return (
    <View
      testID="top-landmark-2"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ width: 56, height: TOP_LANDMARK_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={56} height={TOP_LANDMARK_HEIGHT} viewBox="0 0 56 48" aria-hidden>
        {/* Street signpost */}
        <Rect x={8} y={6} width={3} height={38} rx={1} fill={color.inkMuted} stroke={ink} strokeWidth={1.5} />
        <Rect x={2} y={8} width={20} height={10} rx={2} fill={accent} stroke={ink} strokeWidth={1.8} />
        <Line x1={5} y1={13} x2={19} y2={13} stroke={color.surface} strokeWidth={1.5} strokeLinecap="round" />
        {/* Brick pillar */}
        <Rect x={22} y={12} width={14} height={32} rx={1} fill={deep} stroke={ink} strokeWidth={2} />
        <Rect x={20} y={8} width={18} height={5} rx={1.5} fill={soft} stroke={ink} strokeWidth={1.8} />
        <Line x1={22} y1={22} x2={36} y2={22} stroke={ink} strokeWidth={1} />
        <Line x1={22} y1={32} x2={36} y2={32} stroke={ink} strokeWidth={1} />
        {/* Picket fence attached to pillar */}
        <Rect x={36} y={20} width={18} height={4} fill={color.surface} stroke={ink} strokeWidth={1.5} />
        <Rect x={36} y={34} width={18} height={4} fill={color.surface} stroke={ink} strokeWidth={1.5} />
        <Path d="M39 16 l3 -3 l3 3 v28 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
        <Path d="M48 16 l3 -3 l3 3 v28 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

/** Standardized 48px Top Landmark entrance for World 3 (Urban Navigations). */
export function UrbanTopLandmark({ palette }: { palette?: WorldSceneryPalette }) {
  const ink = color.ink;
  const accent = palette?.accent ?? color.coral;
  const deep = palette?.deep ?? color.edge;
  const soft = palette?.soft ?? color.infoSoft;

  return (
    <View
      testID="top-landmark-3"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ width: 60, height: TOP_LANDMARK_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={60} height={TOP_LANDMARK_HEIGHT} viewBox="0 0 60 48" aria-hidden>
        {/* Distant building silhouettes */}
        <Rect x={4} y={14} width={14} height={30} rx={1} fill={soft} stroke={ink} strokeWidth={1.5} />
        <Rect x={20} y={4} width={18} height={40} rx={1} fill={deep} stroke={ink} strokeWidth={1.5} />
        <Line x1={29} y1={0} x2={29} y2={4} stroke={ink} strokeWidth={2} />
        <Rect x={40} y={12} width={16} height={32} rx={1} fill={soft} stroke={ink} strokeWidth={1.5} />
        {/* Transit shelter arch in foreground */}
        <Rect x={12} y={24} width={4} height={20} fill={color.inkMuted} stroke={ink} strokeWidth={1.5} />
        <Rect x={44} y={24} width={4} height={20} fill={color.inkMuted} stroke={ink} strokeWidth={1.5} />
        <Path d="M8 24 Q30 14 52 24 l-2 4 Q30 18 10 28 z" fill={accent} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
        <Circle cx={30} cy={20} r={5} fill={color.surface} stroke={ink} strokeWidth={1.5} />
        <Path d="M28 22 v-4 l2 2 l2 -2 v4" fill="none" stroke={ink} strokeWidth={1.2} />
      </Svg>
    </View>
  );
}

/** Standardized 48px Top Landmark entrance for World 4 (Fast Wheels & High Arousal). */
export function ParkTopLandmark({ palette }: { palette?: WorldSceneryPalette }) {
  const ink = color.ink;
  const accent = palette?.accent ?? color.brand;
  const deep = palette?.deep ?? color.brandDeep;
  const soft = palette?.soft ?? color.accent;

  return (
    <View
      testID="top-landmark-4"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ width: 56, height: TOP_LANDMARK_HEIGHT, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={56} height={TOP_LANDMARK_HEIGHT} viewBox="0 0 56 48" aria-hidden>
        {/* Timber pergola posts */}
        <Rect x={10} y={12} width={5} height={32} rx={1} fill={deep} stroke={ink} strokeWidth={1.8} />
        <Rect x={41} y={12} width={5} height={32} rx={1} fill={deep} stroke={ink} strokeWidth={1.8} />
        {/* Overhead beam */}
        <Rect x={6} y={10} width={44} height={5} rx={1} fill={deep} stroke={ink} strokeWidth={2} />
        {/* Trellis rafters */}
        <Rect x={12} y={5} width={4} height={6} rx={1} fill={soft} stroke={ink} strokeWidth={1.5} />
        <Rect x={26} y={5} width={4} height={6} rx={1} fill={soft} stroke={ink} strokeWidth={1.5} />
        <Rect x={40} y={5} width={4} height={6} rx={1} fill={soft} stroke={ink} strokeWidth={1.5} />
        {/* Trail signpost & leaf */}
        <Rect x={20} y={22} width={3} height={22} fill={color.inkMuted} stroke={ink} strokeWidth={1.2} />
        <Path d="M16 22 h16 l4 4 l-4 4 h-16 z" fill={soft} stroke={ink} strokeWidth={1.6} strokeLinejoin="round" />
        <Circle cx={10} cy={18} r={3} fill={accent} stroke={ink} strokeWidth={1} />
      </Svg>
    </View>
  );
}

/** Backward-compatible export for HouseLandmark. */
export function HouseLandmark({ palette }: { palette?: WorldSceneryPalette } = {}) {
  return (
    <View
      testID="top-landmark"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ alignItems: 'center', justifyContent: 'center', marginBottom: TOP_LANDMARK_GAP }}
    >
      <HomeTopLandmark palette={palette} />
    </View>
  );
}

/** Dispatches the standardized 48px Top Landmark entrance based on worldNumber (1-4). */
export function TopLandmark({
  worldNumber,
  palette,
}: {
  worldNumber: number;
  palette?: WorldSceneryPalette;
}) {
  let content: React.ReactNode = null;
  const num = ((worldNumber - 1) % 4) + 1;
  switch (num) {
    case 1:
      content = <HomeTopLandmark palette={palette} />;
      break;
    case 2:
      content = <SidewalkTopLandmark palette={palette} />;
      break;
    case 3:
      content = <UrbanTopLandmark palette={palette} />;
      break;
    case 4:
      content = <ParkTopLandmark palette={palette} />;
      break;
    default:
      content = <HomeTopLandmark palette={palette} />;
      break;
  }

  return (
    <View
      testID="top-landmark"
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden={true}
      style={{ alignItems: 'center', justifyContent: 'center', height: TOP_LANDMARK_HEIGHT, marginBottom: TOP_LANDMARK_GAP }}
    >
      {content}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Enriched Full-Height Environmental Backdrops (Active Worlds)
// ---------------------------------------------------------------------------

/** World 1 (Home): Cozy domestic wallpaper, arched windows, framed art, wainscoting, and hearth flooring */
export function World1EnvironmentalBackdrop({ palette }: { palette: WorldSceneryPalette }) {
  const soft = palette.soft ?? color.accentSoft;
  const deep = palette.deep ?? color.coral;
  const accent = palette.accent ?? color.coral;
  const ink = color.ink;

  return (
    <View testID="environmental-backdrop-1" style={absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 380 800" preserveAspectRatio="none" aria-hidden>
        {/* 1. Upper wall fill */}
        <Rect x={0} y={0} width={380} height={520} fill={palette.sky} />

        {/* Wallpaper vertical pinstripes */}
        <Line x1={40} y1={0} x2={40} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={80} y1={0} x2={80} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={120} y1={0} x2={120} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={160} y1={0} x2={160} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={220} y1={0} x2={220} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={260} y1={0} x2={260} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={300} y1={0} x2={300} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />
        <Line x1={340} y1={0} x2={340} y2={520} stroke={soft} strokeWidth={1} opacity={0.18} />

        {/* Wallpaper diamond trellis lattice pattern */}
        <Path
          d="
            M0 40 L40 0 L80 40 L120 0 L160 40 L200 0 L240 40 L280 0 L320 40 L360 0 L400 40
            M0 120 L40 80 L80 120 L120 80 L160 120 L200 80 L240 120 L280 80 L320 120 L360 80 L400 120
            M0 200 L40 160 L80 200 L120 160 L160 200 L200 160 L240 200 L280 160 L320 200 L360 160 L400 200
            M0 280 L40 240 L80 280 L120 240 L160 280 L200 240 L240 280 L280 240 L320 280 L360 240 L400 280
            M0 360 L40 320 L80 360 L120 320 L160 360 L200 320 L240 360 L280 320 L320 360 L360 320 L400 360
            M0 440 L40 400 L80 440 L120 400 L160 440 L200 400 L240 440 L280 400 L320 440 L360 400 L400 440
          "
          stroke={soft}
          strokeWidth={1.2}
          fill="none"
          opacity={0.2}
        />

        {/* Ceiling crown molding */}
        <Rect x={0} y={0} width={380} height={14} fill={color.surface} opacity={0.7} />
        <Line x1={0} y1={14} x2={380} y2={14} stroke={deep} strokeWidth={1.5} opacity={0.35} />

        {/* Festive hanging pennant garland */}
        <Path d="M0 22 Q95 38 190 24 Q285 38 380 22" fill="none" stroke={ink} strokeWidth={1.2} opacity={0.25} />
        <Path d="M30 26 l6 12 l6 -12 z" fill={accent} opacity={0.45} />
        <Path d="M65 29 l6 12 l6 -12 z" fill={soft} opacity={0.55} />
        <Path d="M100 31 l6 12 l6 -12 z" fill={deep} opacity={0.45} />
        <Path d="M140 30 l6 12 l6 -12 z" fill={color.surface} opacity={0.7} />
        <Path d="M235 30 l6 12 l6 -12 z" fill={deep} opacity={0.45} />
        <Path d="M275 31 l6 12 l6 -12 z" fill={soft} opacity={0.55} />
        <Path d="M310 29 l6 12 l6 -12 z" fill={accent} opacity={0.45} />
        <Path d="M345 26 l6 12 l6 -12 z" fill={color.surface} opacity={0.7} />

        {/* Hanging ceiling pendant chandelier */}
        <Line x1={190} y1={14} x2={190} y2={44} stroke={ink} strokeWidth={2} opacity={0.5} />
        <Circle cx={190} cy={50} r={18} fill={soft} opacity={0.5} />
        <Path d="M178 44 l12 -12 l12 12 z" fill={deep} opacity={0.7} />

        {/* Arched Window (Left: y=80 to 175) with garden view */}
        <G opacity={0.85}>
          {/* Outdoor sky cut-out inside window */}
          <Path d="M16 115 A22 22 0 0 1 60 115 V175 H16 Z" fill={color.sky} stroke={ink} strokeWidth={2} />
          {/* Sun & cloud outside window */}
          <Circle cx={48} cy={110} r={8} fill={soft} />
          <Path d="M20 135 Q30 125 40 135 Z" fill={color.surface} opacity={0.8} />
          <Path d="M16 160 Q38 145 60 160 V175 H16 Z" fill={color.brand} />
          {/* Window mullion cross */}
          <Line x1={38} y1={93} x2={38} y2={175} stroke={color.surface} strokeWidth={2} />
          <Line x1={16} y1={135} x2={60} y2={135} stroke={color.surface} strokeWidth={2} />
          {/* Window sill */}
          <Rect x={12} y={175} width={52} height={6} rx={1.5} fill={deep} stroke={ink} strokeWidth={1.5} />
          {/* Potted succulent on sill */}
          <Rect x={32} y={165} width={12} height={10} rx={1} fill={accent} stroke={ink} strokeWidth={1} />
          <Circle cx={38} cy={162} r={4} fill={color.brand} />
        </G>

        {/* Arched Window (Right: y=80 to 175) */}
        <G opacity={0.85}>
          <Path d="M320 115 A22 22 0 0 1 364 115 V175 H320 Z" fill={color.sky} stroke={ink} strokeWidth={2} />
          <Circle cx={336} cy={110} r={8} fill={soft} />
          <Path d="M320 158 Q342 142 364 158 V175 H320 Z" fill={color.brand} />
          <Line x1={342} y1={93} x2={342} y2={175} stroke={color.surface} strokeWidth={2} />
          <Line x1={320} y1={135} x2={364} y2={135} stroke={color.surface} strokeWidth={2} />
          <Rect x={316} y={175} width={52} height={6} rx={1.5} fill={deep} stroke={ink} strokeWidth={1.5} />
        </G>

        {/* Framed Wall Portraits & Shelves (Mid-wall y=200 to 340) */}
        {/* Left framed portrait: Dog silhouette */}
        <G opacity={0.8}>
          <Rect x={18} y={210} width={42} height={48} rx={2} fill={color.surface} stroke={deep} strokeWidth={2} />
          <Circle cx={39} cy={230} r={11} fill={soft} />
          <Path d="M33 234 Q39 222 45 234" fill={ink} />
          <Circle cx={39} cy={228} r={3} fill={ink} />
        </G>

        {/* Right framed diploma / certificate */}
        <G opacity={0.8}>
          <Rect x={320} y={210} width={42} height={48} rx={2} fill={color.surface} stroke={deep} strokeWidth={2} />
          <Rect x={326} y={218} width={30} height={3} fill={ink} opacity={0.4} />
          <Rect x={326} y={225} width={24} height={3} fill={ink} opacity={0.4} />
          <Circle cx={341} cy={242} r={6} fill={accent} stroke={ink} strokeWidth={1} />
          <Path d="M338 247 l-2 7 l5 -3 l5 3 l-2 -7" fill={accent} />
        </G>

        {/* Floating bookshelf (y=320 to 360) */}
        <G opacity={0.85}>
          {/* Wooden shelf */}
          <Rect x={14} y={350} width={62} height={5} rx={1} fill={deep} stroke={ink} strokeWidth={1.2} />
          {/* Books */}
          <Rect x={20} y={326} width={9} height={24} rx={1} fill={accent} stroke={ink} strokeWidth={1} />
          <Rect x={31} y={322} width={8} height={28} rx={1} fill={color.brand} stroke={ink} strokeWidth={1} />
          <Rect x={41} y={330} width={10} height={20} rx={1} fill={soft} stroke={ink} strokeWidth={1} />
          {/* Alarm clock */}
          <Circle cx={62} cy={342} r={6} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Line x1={62} y1={342} x2={62} y2={339} stroke={ink} strokeWidth={1} />
          <Line x1={62} y1={342} x2={65} y2={342} stroke={ink} strokeWidth={1} />
        </G>

        {/* Hanging wall cuckoo clock (Right side y=310 to 370) */}
        <G opacity={0.85}>
          <Path d="M335 320 l15 -14 l15 14 v30 h-30 z" fill={deep} stroke={ink} strokeWidth={1.5} />
          <Circle cx={350} cy={332} r={7} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Line x1={350} y1={350} x2={350} y2={370} stroke={ink} strokeWidth={1.5} />
          <Circle cx={350} cy={372} r={3} fill={accent} />
        </G>

        {/* Wall sconce lamps casting upward amber glow fans (y=420 to 470) */}
        <Path d="M25 435 L12 410 L38 410 Z" fill={soft} opacity={0.4} />
        <Rect x={22} y={434} width={6} height={10} rx={1} fill={deep} stroke={ink} strokeWidth={1} />
        <Path d="M355 435 L342 410 L368 410 Z" fill={soft} opacity={0.4} />
        <Rect x={352} y={434} width={6} height={10} rx={1} fill={deep} stroke={ink} strokeWidth={1} />

        {/* 2. Wainscoting paneling (y=500 to 680) */}
        <Rect x={0} y={500} width={380} height={180} fill={color.surface} opacity={0.45} />
        {/* Chair rail molding */}
        <Rect x={0} y={494} width={380} height={14} fill={deep} opacity={0.3} />
        <Line x1={0} y1={494} x2={380} y2={494} stroke={soft} strokeWidth={1.5} opacity={0.5} />
        <Line x1={0} y1={508} x2={380} y2={508} stroke={ink} strokeWidth={1} opacity={0.15} />

        {/* Wainscoting recessed beveled panels */}
        <Rect x={15} y={520} width={48} height={145} rx={3} fill={color.surface} stroke={deep} strokeWidth={1.2} opacity={0.35} />
        <Rect x={75} y={520} width={48} height={145} rx={3} fill={color.surface} stroke={deep} strokeWidth={1.2} opacity={0.35} />
        <Rect x={257} y={520} width={48} height={145} rx={3} fill={color.surface} stroke={deep} strokeWidth={1.2} opacity={0.35} />
        <Rect x={317} y={520} width={48} height={145} rx={3} fill={color.surface} stroke={deep} strokeWidth={1.2} opacity={0.35} />

        {/* 3. Hardwood floor & hearth baseline (y=680 to 800) */}
        <Rect x={0} y={680} width={380} height={120} fill={palette.ground} opacity={0.35} />
        {/* Baseboard molding */}
        <Rect x={0} y={674} width={380} height={8} fill={deep} stroke={ink} strokeWidth={1} opacity={0.35} />
        {/* Floorboard seams */}
        <Line x1={0} y1={718} x2={380} y2={718} stroke={deep} strokeWidth={1.2} opacity={0.25} />
        <Line x1={0} y1={756} x2={380} y2={756} stroke={deep} strokeWidth={1.2} opacity={0.25} />
        <Line x1={60} y1={680} x2={40} y2={718} stroke={deep} strokeWidth={1.2} opacity={0.2} />
        <Line x1={180} y1={680} x2={160} y2={718} stroke={deep} strokeWidth={1.2} opacity={0.2} />
        <Line x1={300} y1={680} x2={280} y2={718} stroke={deep} strokeWidth={1.2} opacity={0.2} />
        <Line x1={120} y1={718} x2={100} y2={756} stroke={deep} strokeWidth={1.2} opacity={0.2} />
        <Line x1={240} y1={718} x2={220} y2={756} stroke={deep} strokeWidth={1.2} opacity={0.2} />

        {/* Cozy central braided oval rug */}
        <Ellipse cx={190} cy={760} rx={130} ry={32} fill={color.surface} stroke={deep} strokeWidth={1.2} opacity={0.45} />
        <Ellipse cx={190} cy={760} rx={105} ry={24} fill={soft} stroke={accent} strokeWidth={1} opacity={0.4} />
        <Ellipse cx={190} cy={760} rx={75} ry={16} fill={color.surface} stroke={deep} strokeWidth={1} opacity={0.45} />

        {/* Dog corner on left (y=700 to 765): Plush bed, dog bowl, and bone */}
        <G opacity={0.9}>
          <Ellipse cx={44} cy={742} rx={28} ry={16} fill={deep} stroke={ink} strokeWidth={1.8} />
          <Ellipse cx={44} cy={740} rx={22} ry={12} fill={soft} stroke={ink} strokeWidth={1.2} />
          {/* Ceramic water bowl with water surface */}
          <Ellipse cx={85} cy={754} rx={14} ry={7} fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Ellipse cx={85} cy={753} rx={11} ry={5} fill={color.sky} />
          {/* Dog bone treat */}
          <Path d="M78 732 h12 a3 3 0 0 0 0 -6 a3 3 0 0 0 0 6 h-12 a3 3 0 0 0 0 -6 a3 3 0 0 0 0 6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
        </G>

        {/* Potted monstera plant on right (y=665 to 750) */}
        <G opacity={0.9}>
          {/* Terracotta pot */}
          <Path d="M336 715 L332 748 h24 L352 715 z" fill={deep} stroke={ink} strokeWidth={1.8} />
          <Rect x={330} y={710} width={28} height={6} rx={1} fill={accent} stroke={ink} strokeWidth={1.5} />
          {/* Big leafy fronds */}
          <Path d="M344 710 Q325 680 318 695 Q335 700 344 710" fill={color.brand} stroke={ink} strokeWidth={1.2} />
          <Path d="M344 710 Q344 670 348 678 Q346 695 344 710" fill={color.brandDeep} stroke={ink} strokeWidth={1.2} />
          <Path d="M344 710 Q365 675 372 690 Q358 698 344 710" fill={color.brand} stroke={ink} strokeWidth={1.2} />
        </G>
      </Svg>
    </View>
  );
}

/** World 2 (The Quiet Sidewalk): Suburban neighborhood cottages, picket fences, mailboxes, trees, and paved sidewalk */
export function World2EnvironmentalBackdrop({ palette }: { palette: WorldSceneryPalette }) {
  const soft = palette.soft ?? color.accentSoft;
  const ground = palette.ground;
  const deep = palette.deep ?? color.brandDeep;
  const accent = palette.accent ?? color.brand;
  const ink = color.ink;

  return (
    <View testID="environmental-backdrop-2" style={absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 380 800" preserveAspectRatio="none" aria-hidden>
        {/* 1. Sky background */}
        <Rect x={0} y={0} width={380} height={800} fill={palette.sky} />

        {/* Morning sun with glowing aura */}
        <Circle cx={320} cy={55} r={26} fill={soft} opacity={0.6} />
        <Circle cx={320} cy={55} r={38} fill="none" stroke={soft} strokeWidth={2} strokeDasharray="4,6" opacity={0.4} />

        {/* Drifting fluffy storybook clouds */}
        <Path
          d="M20 38 Q34 22 54 26 Q72 16 90 28 Q104 26 110 40 Q116 52 98 56 L28 56 Q12 54 20 38 Z"
          fill={color.surface}
          opacity={0.8}
        />
        <Path
          d="M140 75 Q154 62 172 66 Q188 56 202 68 Q214 66 220 78 L148 78 Z"
          fill={color.surface}
          opacity={0.65}
        />
        <Path
          d="M250 115 Q266 98 286 102 Q304 90 322 104 Q336 102 342 116 L258 116 Z"
          fill={color.surface}
          opacity={0.7}
        />

        {/* Birds flying in V-formation */}
        <Path d="M70 90 Q76 84 82 90 Q88 84 94 90" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.45} />
        <Path d="M88 102 Q94 96 100 102 Q106 96 112 102" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.45} />

        {/* 2. Distant suburban horizon (y=180 to 320) */}
        {/* Rolling green hills */}
        <Path d="M0 240 Q95 190 190 220 T380 200 L380 340 L0 340 Z" fill={ground} opacity={0.45} />
        {/* Distant tree canopies */}
        <Circle cx={35} cy={205} r={18} fill={accent} opacity={0.5} />
        <Circle cx={70} cy={215} r={15} fill={deep} opacity={0.5} />
        <Circle cx={150} cy={210} r={20} fill={accent} opacity={0.5} />
        <Circle cx={295} cy={200} r={18} fill={deep} opacity={0.5} />
        <Circle cx={335} cy={195} r={22} fill={accent} opacity={0.5} />

        {/* Rows of suburban cottage rooftops */}
        <Path
          d="
            M0 280
            L28 250 L56 280 L76 280 L76 240 L84 240 L84 280
            L115 245 L150 280 L180 260 L210 280 L235 255 L265 280
            L305 240 L340 280 L380 255 L380 340 L0 340 Z
          "
          fill={deep}
          opacity={0.55}
        />
        {/* Chimney smoke puffs */}
        <Circle cx={80} cy={230} r={5} fill={color.surface} opacity={0.7} />
        <Circle cx={83} cy={220} r={6.5} fill={color.surface} opacity={0.5} />

        {/* 3. Midground neighborhood cottages & gardens (y=320 to 560) */}
        {/* Suburban cottage on left verge (y=320 to 420) */}
        <G opacity={0.85}>
          <Path d="M8 350 L34 322 L60 350 Z" fill={deep} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Rect x={14} y={350} width={40} height={36} fill={color.surface} stroke={ink} strokeWidth={1.8} />
          {/* Front door & window */}
          <Rect x={26} y={362} width={14} height={24} rx={1} fill={accent} stroke={ink} strokeWidth={1.2} />
          <Circle cx={46} cy={360} r={5} fill={soft} stroke={ink} strokeWidth={1} />
        </G>

        {/* Neighborhood leafy tree on right verge (y=310 to 420) */}
        <G opacity={0.9}>
          <Rect x={342} y={360} width={8} height={40} fill={deep} stroke={ink} strokeWidth={1.5} />
          <Circle cx={346} cy={335} r={24} fill={ground} stroke={ink} strokeWidth={1.8} />
          <Circle cx={336} cy={330} r={14} fill={accent} opacity={0.8} />
          <Circle cx={356} cy={342} r={12} fill={deep} opacity={0.5} />
        </G>

        {/* Continuous picket fence along both margins (y=420 to 580) */}
        <G opacity={0.85}>
          {/* Left picket fence */}
          <Line x1={2} y1={450} x2={58} y2={450} stroke={ink} strokeWidth={1.5} />
          <Line x1={2} y1={470} x2={58} y2={470} stroke={ink} strokeWidth={1.5} />
          <Path d="M8 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M22 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M36 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M50 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />

          {/* Mailbox on post beside fence */}
          <Rect x={48} y={495} width={14} height={9} rx={3} fill={color.coral} stroke={ink} strokeWidth={1.2} />
          <Line x1={54} y1={504} x2={54} y2={530} stroke={ink} strokeWidth={2} />
          <Path d="M60 497 l4 -4 v5" stroke={ink} strokeWidth={1.2} fill="none" />

          {/* Right picket fence & garden flowers */}
          <Line x1={322} y1={450} x2={378} y2={450} stroke={ink} strokeWidth={1.5} />
          <Line x1={322} y1={470} x2={378} y2={470} stroke={ink} strokeWidth={1.5} />
          <Path d="M328 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M342 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M356 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M370 438 l3 -3 l3 3 v42 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.2} />

          {/* Sunflowers in right flowerbed */}
          <Circle cx={335} cy={510} r={7} fill={soft} stroke={ink} strokeWidth={1} />
          <Circle cx={335} cy={510} r={3} fill={deep} />
          <Line x1={335} y1={517} x2={335} y2={536} stroke={accent} strokeWidth={1.8} />
          <Circle cx={360} cy={518} r={6} fill={color.coral} stroke={ink} strokeWidth={1} />
          <Line x1={360} y1={524} x2={360} y2={538} stroke={accent} strokeWidth={1.8} />
        </G>

        {/* 4. Sidewalk & Curbside (y=560 to 800) */}
        {/* Sidewalk flagstone path */}
        <Rect x={0} y={560} width={380} height={160} fill={color.surface} opacity={0.6} />
        {/* Sidewalk joints */}
        <Line x1={0} y1={560} x2={380} y2={560} stroke={ink} strokeWidth={2} opacity={0.4} />
        <Line x1={0} y1={620} x2={380} y2={620} stroke={ink} strokeWidth={1.5} opacity={0.3} />
        <Line x1={0} y1={680} x2={380} y2={680} stroke={ink} strokeWidth={1.5} opacity={0.3} />
        <Line x1={95} y1={560} x2={95} y2={620} stroke={ink} strokeWidth={1.5} opacity={0.3} />
        <Line x1={285} y1={560} x2={285} y2={620} stroke={ink} strokeWidth={1.5} opacity={0.3} />
        <Line x1={190} y1={620} x2={190} y2={680} stroke={ink} strokeWidth={1.5} opacity={0.3} />

        {/* Classic sidewalk lamp post (Right: y=570 to 670) */}
        <G opacity={0.9}>
          <Circle cx={345} cy={595} r={16} fill={soft} opacity={0.5} />
          <Rect x={343} y={608} width={4} height={60} fill={color.inkMuted} stroke={ink} strokeWidth={1.5} />
          <Path d="M338 608 h14 l-3 -16 h-8 z" fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Path d="M336 592 l9 -6 l9 6 z" fill={deep} stroke={ink} strokeWidth={1.5} />
          <Rect x={338} y={664} width={14} height={4} rx={1} fill={deep} stroke={ink} strokeWidth={1.2} />
        </G>

        {/* Fire hydrant on curbside (Left: y=630 to 680) */}
        <G opacity={0.9}>
          <Rect x={30} y={640} width={14} height={20} rx={3} fill={color.coral} stroke={ink} strokeWidth={1.5} />
          <Circle cx={37} cy={636} r={4} fill={color.coral} stroke={ink} strokeWidth={1.5} />
          <Rect x={26} y={646} width={5} height={6} rx={1} fill={soft} stroke={ink} strokeWidth={1} />
          <Rect x={43} y={646} width={5} height={6} rx={1} fill={soft} stroke={ink} strokeWidth={1} />
          <Rect x={27} y={658} width={20} height={4} rx={1} fill={deep} stroke={ink} strokeWidth={1.2} />
        </G>

        {/* Roadway curb & asphalt street at bottom (y=700 to 800) */}
        <Rect x={0} y={700} width={380} height={100} fill={ground} opacity={0.85} />
        <Line x1={0} y1={700} x2={380} y2={700} stroke={deep} strokeWidth={3} opacity={0.6} />
        {/* White dashed road center markings */}
        <Line x1={30} y1={750} x2={80} y2={750} stroke={color.surface} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <Line x1={165} y1={750} x2={215} y2={750} stroke={color.surface} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
        <Line x1={300} y1={750} x2={350} y2={750} stroke={color.surface} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      </Svg>
    </View>
  );
}

/** World 3 (Urban Navigations): Layered high-rise skyline, brownstones, fire escapes, storefronts, and crosswalk street */
export function World3EnvironmentalBackdrop({ palette }: { palette: WorldSceneryPalette }) {
  const soft = palette.soft ?? color.infoSoft;
  const deep = palette.deep ?? color.edge;
  const accent = palette.accent ?? color.coral;
  const ink = color.ink;

  return (
    <View testID="environmental-backdrop-3" style={absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 380 800" preserveAspectRatio="none" aria-hidden>
        {/* 1. City sky background */}
        <Rect x={0} y={0} width={380} height={800} fill={palette.sky} />

        {/* Far skyscraper silhouette layer with lit window grids */}
        <Path
          d="
            M0 240
            L24 240 L24 80 L56 80 L56 240
            L92 240 L92 45 L126 45 L126 240
            L165 240 L165 110 L195 110 L195 240
            L230 240 L230 60 L265 60 L265 240
            L305 240 L305 95 L340 95 L340 240
            L380 240 L380 120 L400 120 L400 240 Z
          "
          fill={deep}
          opacity={0.45}
        />
        {/* Antennas & beacon lights */}
        <Line x1={109} y1={20} x2={109} y2={45} stroke={ink} strokeWidth={1.8} opacity={0.5} />
        <Circle cx={109} cy={18} r={2.5} fill={accent} />
        <Line x1={247} y1={36} x2={247} y2={60} stroke={ink} strokeWidth={1.8} opacity={0.5} />
        <Circle cx={247} cy={34} r={2.5} fill={accent} />

        {/* Far skyscraper window rows */}
        <G fill={soft} opacity={0.6}>
          <Rect x={98} y={65} width={4} height={4} />
          <Rect x={106} y={65} width={4} height={4} />
          <Rect x={114} y={65} width={4} height={4} />
          <Rect x={98} y={80} width={4} height={4} />
          <Rect x={106} y={80} width={4} height={4} />
          <Rect x={114} y={80} width={4} height={4} />
          <Rect x={236} y={75} width={4} height={4} />
          <Rect x={244} y={75} width={4} height={4} />
          <Rect x={252} y={75} width={4} height={4} />
        </G>

        {/* Midground brownstones with water tanks (y=140 to 300) */}
        <Path
          d="
            M0 260
            L45 260 L45 140 L85 140 L85 260
            L145 260 L145 160 L185 160 L185 260
            L225 260 L225 145 L265 145 L265 260
            L320 260 L320 165 L365 165 L365 260 L380 260 L380 340 L0 340 Z
          "
          fill={soft}
          opacity={0.55}
        />
        {/* Rooftop water tower */}
        <Rect x={155} y={142} width={18} height={16} rx={2} fill={accent} opacity={0.6} />
        <Path d="M152 142 l12 -8 l12 8 z" fill={deep} opacity={0.7} />
        <Line x1={158} y1={158} x2={158} y2={164} stroke={ink} strokeWidth={1.5} opacity={0.5} />
        <Line x1={170} y1={158} x2={170} y2={164} stroke={ink} strokeWidth={1.5} opacity={0.5} />

        {/* 2. Brick townhouse facades framing margins (y=200 to 580) */}
        <Rect x={0} y={180} width={52} height={480} fill={deep} opacity={0.4} />
        <Rect x={328} y={180} width={52} height={480} fill={deep} opacity={0.4} />
        <Line x1={52} y1={180} x2={52} y2={660} stroke={ink} strokeWidth={2} opacity={0.35} />
        <Line x1={328} y1={180} x2={328} y2={660} stroke={ink} strokeWidth={2} opacity={0.35} />

        {/* Arched windows down left facade */}
        <G fill={soft} stroke={ink} strokeWidth={1.2} opacity={0.8}>
          <Rect x={12} y={220} width={22} height={18} rx={2} />
          <Rect x={12} y={280} width={22} height={18} rx={2} />
          <Rect x={12} y={340} width={22} height={18} rx={2} />
          <Rect x={12} y={400} width={22} height={18} rx={2} />
          <Rect x={12} y={460} width={22} height={18} rx={2} />
        </G>

        {/* Arched windows down right facade */}
        <G fill={soft} stroke={ink} strokeWidth={1.2} opacity={0.8}>
          <Rect x={346} y={220} width={22} height={18} rx={2} />
          <Rect x={346} y={280} width={22} height={18} rx={2} />
          <Rect x={346} y={340} width={22} height={18} rx={2} />
          <Rect x={346} y={400} width={22} height={18} rx={2} />
          <Rect x={346} y={460} width={22} height={18} rx={2} />
        </G>

        {/* Exterior metal fire escape staircases on right facade */}
        <G stroke={ink} strokeWidth={1.5} opacity={0.65}>
          <Rect x={342} y={238} width={28} height={5} fill={deep} />
          <Rect x={342} y={298} width={28} height={5} fill={deep} />
          <Rect x={342} y={358} width={28} height={5} fill={deep} />
          <Rect x={342} y={418} width={28} height={5} fill={deep} />
          <Line x1={344} y1={243} x2={368} y2={298} />
          <Line x1={368} y1={303} x2={344} y2={358} />
          <Line x1={344} y1={363} x2={368} y2={418} />
        </G>

        {/* 3. Commercial storefronts & metro street level (y=540 to 800) */}
        {/* Striped Bakery Awning on Left Storefront (y=530 to 570) */}
        <G opacity={0.9}>
          <Path d="M4 534 l44 0 l-4 14 l-36 0 z" fill={accent} stroke={ink} strokeWidth={1.8} />
          <Line x1={15} y1={534} x2={13} y2={548} stroke={color.surface} strokeWidth={2} />
          <Line x1={26} y1={534} x2={25} y2={548} stroke={color.surface} strokeWidth={2} />
          <Line x1={37} y1={534} x2={36} y2={548} stroke={color.surface} strokeWidth={2} />
          {/* Bakery display window */}
          <Rect x={8} y={548} width={36} height={20} fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Circle cx={26} cy={558} r={4} fill={accent} />
        </G>

        {/* Metro / Subway Portal on Right (y=520 to 580) */}
        <G opacity={0.9}>
          <Rect x={332} y={540} width={42} height={28} rx={2} fill={color.surfaceSunken} stroke={ink} strokeWidth={1.8} />
          <Path d="M330 540 Q353 526 376 540" fill="none" stroke={deep} strokeWidth={2.5} />
          <Circle cx={353} cy={530} r={6} fill={color.surface} stroke={ink} strokeWidth={1.2} />
          <Path d="M351 533 v-6 l2 3 l2 -3 v6" fill="none" stroke={ink} strokeWidth={1} />
        </G>

        {/* Asphalt road and broad zebra crosswalk at street level (y=660 to 800) */}
        <Rect x={0} y={670} width={380} height={130} fill={palette.ground} opacity={0.88} />
        <Line x1={0} y1={670} x2={380} y2={670} stroke={ink} strokeWidth={2.5} opacity={0.6} />

        {/* Bold zebra crosswalk stripes across the street */}
        <G fill={color.surface} opacity={0.85}>
          <Rect x={35} y={690} width={24} height={10} rx={1} />
          <Rect x={75} y={690} width={24} height={10} rx={1} />
          <Rect x={115} y={690} width={24} height={10} rx={1} />
          <Rect x={240} y={690} width={24} height={10} rx={1} />
          <Rect x={280} y={690} width={24} height={10} rx={1} />
          <Rect x={320} y={690} width={24} height={10} rx={1} />
        </G>

        {/* Bicycle lane stencil marking on left road */}
        <G opacity={0.7} stroke={color.surface} strokeWidth={1.5} fill="none">
          <Circle cx={45} cy={750} r={6} />
          <Circle cx={65} cy={750} r={6} />
          <Path d="M45 750 L55 742 L65 750 M55 742 L55 736 h5" />
        </G>

        {/* Manhole sewer cover on right road */}
        <Circle cx={335} cy={755} r={14} fill={deep} stroke={ink} strokeWidth={1.8} opacity={0.7} />
        <Circle cx={335} cy={755} r={9} fill="none" stroke={ink} strokeWidth={1.2} strokeDasharray="3,3" opacity={0.5} />
      </Svg>
    </View>
  );
}

/** World 4 (Fast Wheels & High Arousal): Sunny park hills, radiating sun, kites, duck pond, agility hurdles, and meadow flora */
export function World4EnvironmentalBackdrop({ palette }: { palette: WorldSceneryPalette }) {
  const ground = palette.ground;
  const accent = palette.accent ?? color.brand;
  const soft = palette.soft ?? color.accent;
  const deep = palette.deep ?? color.brandDeep;
  const ink = color.ink;

  return (
    <View testID="environmental-backdrop-4" style={absoluteFill}>
      <Svg width="100%" height="100%" viewBox="0 0 380 800" preserveAspectRatio="none" aria-hidden>
        {/* 1. Warm park sky */}
        <Rect x={0} y={0} width={380} height={800} fill={palette.sky} />

        {/* Radiant golden park sun with corona and sunbeams */}
        <Circle cx={310} cy={60} r={25} fill={soft} opacity={0.65} />
        <Circle cx={310} cy={60} r={38} fill="none" stroke={soft} strokeWidth={2.5} strokeDasharray="4,6" opacity={0.45} />
        {/* Radiating sunbeams */}
        <Line x1={310} y1={20} x2={310} y2={10} stroke={soft} strokeWidth={2} opacity={0.4} />
        <Line x1={350} y1={60} x2={360} y2={60} stroke={soft} strokeWidth={2} opacity={0.4} />
        <Line x1={338} y1={32} x2={346} y2={24} stroke={soft} strokeWidth={2} opacity={0.4} />

        {/* Diamond kite soaring in the sky with tail ribbons */}
        <G opacity={0.85}>
          <Path d="M70 45 L85 30 L100 45 L85 60 Z" fill={accent} stroke={ink} strokeWidth={1.5} />
          <Line x1={70} y1={45} x2={100} y2={45} stroke={color.surface} strokeWidth={1} />
          <Line x1={85} y1={30} x2={85} y2={60} stroke={color.surface} strokeWidth={1} />
          {/* Fluttering tail string & bow ribbons */}
          <Path d="M85 60 Q90 75 80 85 T88 105" fill="none" stroke={ink} strokeWidth={1.2} />
          <Path d="M83 72 l4 -2 l-2 4 z" fill={color.coral} />
          <Path d="M79 84 l4 -2 l-2 4 z" fill={soft} />
          <Path d="M85 96 l4 -2 l-2 4 z" fill={color.coral} />
        </G>

        {/* Drifting puffy park clouds */}
        <Path
          d="M130 50 Q146 34 166 38 Q182 28 198 40 Q212 38 218 52 L138 52 Z"
          fill={color.surface}
          opacity={0.65}
        />
        <Path
          d="M20 90 Q34 76 50 80 Q64 70 78 82 L26 82 Z"
          fill={color.surface}
          opacity={0.55}
        />

        {/* 2. Rolling meadow hill ridges & woods (y=180 to 480) */}
        {/* Hill Ridge 1 (Far rolling ridge) */}
        <Path d="M0 240 Q100 180 200 220 T380 190 L380 400 L0 400 Z" fill={ground} opacity={0.45} />
        {/* Treeline silhouettes along hill 1 */}
        <G fill={accent} opacity={0.6}>
          <Path d="M40 215 l7 -16 l7 16 z" />
          <Path d="M70 210 l8 -18 l8 18 z" />
          <Path d="M145 218 l7 -16 l7 16 z" />
          <Path d="M225 212 l8 -18 l8 18 z" />
          <Path d="M305 204 l7 -16 l7 16 z" />
        </G>
        <Circle cx={105} cy={206} r={12} fill={deep} opacity={0.4} />
        <Circle cx={270} cy={206} r={11} fill={deep} opacity={0.4} />

        {/* Hill Ridge 2 (Midground meadow) */}
        <Path d="M0 360 Q120 300 240 340 T380 310 L380 560 L0 560 Z" fill={accent} opacity={0.35} />

        {/* Park Gazebo / Pavilion on left verge (y=290 to 370) */}
        <G opacity={0.88}>
          <Path d="M14 315 L40 295 L66 315 Z" fill={deep} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
          <Rect x={20} y={315} width={5} height={36} fill={deep} stroke={ink} strokeWidth={1.2} />
          <Rect x={55} y={315} width={5} height={36} fill={deep} stroke={ink} strokeWidth={1.2} />
          {/* Picnic table inside */}
          <Rect x={28} y={335} width={24} height={4} rx={1} fill={soft} stroke={ink} strokeWidth={1} />
          <Line x1={32} y1={339} x2={30} y2={351} stroke={ink} strokeWidth={1.2} />
          <Line x1={48} y1={339} x2={50} y2={351} stroke={ink} strokeWidth={1.2} />
        </G>

        {/* Serene Duck Pond on right verge (y=320 to 420) */}
        <G opacity={0.88}>
          <Ellipse cx={340} cy={370} rx={34} ry={18} fill={color.sky} stroke={ink} strokeWidth={1.8} />
          {/* Pond water ripples */}
          <Path d="M325 368 Q335 364 345 368 M335 374 Q345 370 355 374" fill="none" stroke={color.surface} strokeWidth={1.5} />
          {/* Wooden footbridge spanning pond */}
          <Path d="M312 368 Q340 348 368 368" fill="none" stroke={deep} strokeWidth={3} />
          <Path d="M312 372 Q340 352 368 372" fill="none" stroke={soft} strokeWidth={2} />
          {/* Reeds & cattails on bank */}
          <Line x1={372} y1={380} x2={372} y2={355} stroke={accent} strokeWidth={1.8} />
          <Rect x={370.5} y={357} width={3} height={8} rx={1.5} fill={deep} />
        </G>

        {/* Hill Ridge 3 (Near rolling meadow) */}
        <Path d="M0 500 Q100 450 210 490 T380 460 L380 720 L0 720 Z" fill={ground} opacity={0.55} />

        {/* 3. Park Trails, Agility Recreation & Flora (y=500 to 800) */}
        {/* Slatted wooden park bench under tree (Left: y=500 to 570) */}
        <G opacity={0.9}>
          {/* Grand park oak tree canopy */}
          <Circle cx={36} cy={490} r={24} fill={deep} stroke={ink} strokeWidth={1.8} />
          <Circle cx={26} cy={485} r={15} fill={accent} opacity={0.8} />
          <Rect x={33} y={514} width={6} height={32} fill={deep} stroke={ink} strokeWidth={1.2} />
          {/* Wooden park bench */}
          <Rect x={16} y={540} width={36} height={5} rx={1} fill={deep} stroke={ink} strokeWidth={1.5} />
          <Rect x={18} y={548} width={32} height={4} rx={1} fill={soft} stroke={ink} strokeWidth={1.2} />
          <Line x1={22} y1={552} x2={20} y2={562} stroke={ink} strokeWidth={1.5} />
          <Line x1={46} y1={552} x2={48} y2={562} stroke={ink} strokeWidth={1.5} />
        </G>

        {/* Dog Agility Hurdle Jump on right (y=510 to 570) */}
        <G opacity={0.9}>
          <Rect x={330} y={528} width={4} height={32} rx={1} fill={deep} stroke={ink} strokeWidth={1.5} />
          <Rect x={364} y={528} width={4} height={32} rx={1} fill={deep} stroke={ink} strokeWidth={1.5} />
          {/* Striped crossbar */}
          <Line x1={330} y1={540} x2={368} y2={540} stroke={accent} strokeWidth={3} />
          <Line x1={344} y1={540} x2={354} y2={540} stroke={color.surface} strokeWidth={3} />
          <Circle cx={332} cy={526} r={2.5} fill={color.coral} />
          <Circle cx={366} cy={526} r={2.5} fill={color.coral} />
        </G>

        {/* Park trail terrain base at bottom (y=680 to 800) */}
        <Rect x={0} y={680} width={380} height={120} fill={ground} opacity={0.85} />
        <Line x1={0} y1={680} x2={380} y2={680} stroke={deep} strokeWidth={3} opacity={0.6} />

        {/* Wildflower meadow flora & drinking fountain */}
        <G opacity={0.85}>
          {/* Dog drinking fountain (x=50, y=710) */}
          <Rect x={46} y={725} width={8} height={26} rx={2} fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Ellipse cx={50} cy={725} rx={8} ry={4} fill={color.sky} stroke={ink} strokeWidth={1.2} />
          <Ellipse cx={50} cy={745} rx={7} ry={3.5} fill={color.sky} stroke={ink} strokeWidth={1.2} />

          {/* Buttercups & daisies */}
          <Circle cx={120} cy={720} r={5} fill={soft} stroke={ink} strokeWidth={1} />
          <Circle cx={120} cy={720} r={2} fill={color.coral} />
          <Circle cx={260} cy={726} r={5} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Circle cx={260} cy={726} r={2} fill={soft} />
          <Circle cx={330} cy={718} r={5} fill={soft} stroke={ink} strokeWidth={1} />
          <Circle cx={330} cy={718} r={2} fill={color.coral} />

          {/* Grass blade tufts */}
          <Path d="M25 680 l4 -12 l4 12 M85 680 l4 -12 l4 12 M180 680 l4 -12 l4 12 M290 680 l4 -12 l4 12 M350 680 l4 -12 l4 12" fill="none" stroke={deep} strokeWidth={1.8} />
        </G>
      </Svg>
    </View>
  );
}

/** Dispatches the full-height environmental backdrop for active worlds (1-4). */
export function FullHeightEnvironmentalBackdrop({
  worldNumber,
  palette,
}: {
  worldNumber: number;
  palette: WorldSceneryPalette;
}) {
  const num = ((worldNumber - 1) % 4) + 1;
  let content: React.ReactNode = null;
  switch (num) {
    case 1:
      content = <World1EnvironmentalBackdrop palette={palette} />;
      break;
    case 2:
      content = <World2EnvironmentalBackdrop palette={palette} />;
      break;
    case 3:
      content = <World3EnvironmentalBackdrop palette={palette} />;
      break;
    case 4:
      content = <World4EnvironmentalBackdrop palette={palette} />;
      break;
    default:
      content = <World1EnvironmentalBackdrop palette={palette} />;
      break;
  }

  return (
    <View testID="environmental-backdrop" style={absoluteFill}>
      {content}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Margin Scenery Motifs & Enriched Vector Craft (Active Worlds)
// ---------------------------------------------------------------------------

function World1MarginMotifs({
  palette,
  rowIndex = 1,
}: {
  palette: WorldSceneryPalette;
  rowIndex?: number;
}) {
  const ink = color.ink;
  const isAlternate = rowIndex % 4 === 3;

  if (isAlternate) {
    return (
      <>
        {/* Left gutter: Hallway door, potted plant, and paw art */}
        <View style={{ position: 'absolute', left: 8, top: 14, width: 48, height: 74 }}>
          <Svg width={48} height={74} viewBox="0 0 48 74" aria-hidden>
            <Rect x={4} y={6} width={34} height={50} rx={2} fill={palette.soft ?? color.surfaceSunken} stroke={ink} strokeWidth={1.8} />
            <Rect x={10} y={14} width={22} height={42} fill={palette.sky} stroke={ink} strokeWidth={1.5} />
            <Line x1={2} y1={56} x2={42} y2={56} stroke={ink} strokeWidth={2} />
            <Line x1={6} y1={60} x2={38} y2={60} stroke={palette.deep ?? color.coral} strokeWidth={1.5} />
            <Rect x={14} y={0} width={14} height={12} rx={1} fill={color.surface} stroke={ink} strokeWidth={1.2} />
            <Circle cx={21} cy={6} r={2} fill={palette.deep ?? color.coral} />
            <Path d="M30 64 l2 -10 h8 l2 10 z" fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.2} />
            <Circle cx={36} cy={48} r={5} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.2} />
          </Svg>
        </View>
        {/* Right gutter: Fireplace mantel and clock */}
        <View style={{ position: 'absolute', right: 8, top: 12, width: 56, height: 80 }}>
          <Svg width={56} height={80} viewBox="0 0 56 80" aria-hidden>
            <Rect x={4} y={16} width={48} height={58} rx={2} fill={palette.soft ?? color.surfaceSunken} stroke={ink} strokeWidth={1.8} />
            <Rect x={14} y={34} width={28} height={40} rx={2} fill={color.ink} stroke={ink} strokeWidth={1.5} />
            <Path d="M24 68 Q28 52 32 68" fill={palette.accent ?? color.coral} />
            <Circle cx={28} cy={62} r={4} fill={palette.soft ?? color.accent} opacity={0.8} />
            <Rect x={2} y={12} width={52} height={6} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Rect x={22} y={4} width={12} height={8} rx={1} fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.2} />
            <Circle cx={28} cy={8} r={2} fill={color.surface} />
          </Svg>
        </View>
      </>
    );
  }

  // Row 1 (and 5, 9, etc.)
  return (
    <>
      {/* Left gutter: Bookshelf with trophies & books */}
      <View style={{ position: 'absolute', left: 8, top: 12, width: 52, height: 80 }}>
        <Svg width={52} height={80} viewBox="0 0 52 80" aria-hidden>
          <Rect x={4} y={8} width={44} height={66} rx={2} fill={color.surfaceSunken} stroke={ink} strokeWidth={1.8} />
          <Line x1={4} y1={30} x2={48} y2={30} stroke={ink} strokeWidth={1.5} />
          <Line x1={4} y1={52} x2={48} y2={52} stroke={ink} strokeWidth={1.5} />
          <Rect x={8} y={14} width={7} height={16} rx={1} fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1} />
          <Rect x={17} y={12} width={6} height={18} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1} />
          <Rect x={25} y={15} width={7} height={15} rx={1} fill={palette.soft ?? color.accent} stroke={ink} strokeWidth={1} />
          <Rect x={8} y={56} width={16} height={14} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1} />
          <Rect x={26} y={56} width={16} height={14} rx={1} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
        </Svg>
      </View>
      {/* Right gutter: Window frames, curtains, and floor mat */}
      <View style={{ position: 'absolute', right: 8, top: 14, width: 48, height: 74 }}>
        <Svg width={48} height={74} viewBox="0 0 48 74" aria-hidden>
          <Rect x={8} y={6} width={32} height={36} rx={2} fill={color.surface} stroke={ink} strokeWidth={2} />
          <Rect x={11} y={9} width={12} height={13} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
          <Rect x={25} y={9} width={12} height={13} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
          <Rect x={11} y={24} width={12} height={15} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
          <Rect x={25} y={24} width={12} height={15} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
          <Path d="M8 6 Q14 20 8 42" fill="none" stroke={palette.accent ?? color.coral} strokeWidth={2} />
          <Path d="M40 6 Q34 20 40 42" fill="none" stroke={palette.accent ?? color.coral} strokeWidth={2} />
          <Rect x={5} y={42} width={38} height={4} rx={1} fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.5} />
          <Rect x={8} y={50} width={32} height={8} rx={2} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
          <Line x1={12} y1={54} x2={36} y2={54} stroke={palette.soft ?? color.accent} strokeWidth={1} />
        </Svg>
      </View>
    </>
  );
}

function World2MarginMotifs({
  palette,
  rowIndex = 1,
}: {
  palette: WorldSceneryPalette;
  rowIndex?: number;
}) {
  const ink = color.ink;
  const isAlternate = rowIndex % 4 === 3;

  if (isAlternate) {
    return (
      <>
        {/* Left gutter: Garden pergola gate with bicycle */}
        <View style={{ position: 'absolute', left: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Rect x={6} y={16} width={6} height={58} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Rect x={42} y={16} width={6} height={58} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Rect x={2} y={12} width={50} height={6} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Circle cx={20} cy={60} r={9} fill="none" stroke={ink} strokeWidth={1.5} />
            <Circle cx={36} cy={60} r={9} fill="none" stroke={ink} strokeWidth={1.5} />
            <Path d="M20 60 L28 50 L36 60 M28 50 L28 42 M25 42 h6" stroke={palette.accent ?? color.brand} strokeWidth={1.8} fill="none" />
          </Svg>
        </View>
        {/* Right gutter: Suburban cottage porch with mailbox */}
        <View style={{ position: 'absolute', right: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Path d="M6 32 L27 10 L48 32 z" fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.8} strokeLinejoin="round" />
            <Rect x={10} y={32} width={34} height={42} fill={color.surface} stroke={ink} strokeWidth={1.8} />
            <Rect x={20} y={44} width={14} height={30} rx={1} fill={palette.accent ?? color.brand} stroke={ink} strokeWidth={1.5} />
            <Circle cx={30} cy={60} r={1.8} fill={palette.soft ?? color.accent} />
          </Svg>
        </View>
      </>
    );
  }

  // Row 1
  return (
    <>
      {/* Left gutter: Picket fence with flowering bush */}
      <View style={{ position: 'absolute', left: 8, top: 14, width: 50, height: 74 }}>
        <Svg width={50} height={74} viewBox="0 0 50 74" aria-hidden>
          <Path d="M4 52 Q12 24 25 24 Q38 24 46 52 Z" fill={palette.ground} stroke={ink} strokeWidth={1.8} />
          <Circle cx={25} cy={32} r={3} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1} />
          <Circle cx={16} cy={40} r={2.5} fill={palette.accent ?? color.brand} stroke={ink} strokeWidth={1} />
          <Circle cx={34} cy={40} r={2.5} fill={palette.accent ?? color.brand} stroke={ink} strokeWidth={1} />
          <Line x1={2} y1={44} x2={48} y2={44} stroke={ink} strokeWidth={2} />
          <Path d="M6 36 l3 -3 l3 3 v20 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Path d="M21 36 l3 -3 l3 3 v20 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Path d="M36 36 l3 -3 l3 3 v20 h-6 z" fill={color.surface} stroke={ink} strokeWidth={1.5} />
          <Line x1={0} y1={58} x2={50} y2={58} stroke={ink} strokeWidth={2} />
        </Svg>
      </View>
      {/* Right gutter: Streetlamp and mailbox */}
      <View style={{ position: 'absolute', right: 8, top: 14, width: 48, height: 74 }}>
        <Svg width={48} height={74} viewBox="0 0 48 74" aria-hidden>
          <Circle cx={18} cy={16} r={14} fill={palette.soft ?? color.accentSoft} opacity={0.65} />
          <Path d="M12 12 h12 l-2 10 h-8 z" fill={color.surface} stroke={ink} strokeWidth={1.8} />
          <Path d="M10 12 l8 -5 l8 5 z" fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
          <Circle cx={18} cy={6} r={1.5} fill={ink} />
          <Rect x={16.5} y={22} width={3} height={34} fill={color.inkMuted} stroke={ink} strokeWidth={1.5} />
          <Rect x={12} y={54} width={12} height={4} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
          <Rect x={32} y={44} width={10} height={14} rx={2} fill={color.coral} stroke={ink} strokeWidth={1.5} />
          <Circle cx={37} cy={42} r={3} fill={color.coral} stroke={ink} strokeWidth={1.2} />
          <Rect x={30} y={48} width={14} height={3} rx={1} fill={color.inkMuted} stroke={ink} strokeWidth={1} />
        </Svg>
      </View>
    </>
  );
}

function World3MarginMotifs({
  palette,
  rowIndex = 1,
}: {
  palette: WorldSceneryPalette;
  rowIndex?: number;
}) {
  const ink = color.ink;
  const isAlternate = rowIndex % 4 === 3;

  if (isAlternate) {
    return (
      <>
        {/* Left gutter: Metro kiosk entrance */}
        <View style={{ position: 'absolute', left: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Rect x={4} y={30} width={46} height={44} rx={2} fill={palette.soft ?? color.surfaceSunken} stroke={ink} strokeWidth={2} />
            <Path d="M2 30 Q27 16 52 30 Z" fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={2} />
            <Circle cx={27} cy={18} r={8} fill={color.surface} stroke={ink} strokeWidth={1.5} />
            <Path d="M24 21 v-6 l3 3 l3 -3 v6" fill="none" stroke={ink} strokeWidth={1.4} />
            <Rect x={10} y={42} width={34} height={20} fill={palette.sky} stroke={ink} strokeWidth={1.5} />
          </Svg>
        </View>
        {/* Right gutter: City cafe with outdoor umbrella & chalkboard */}
        <View style={{ position: 'absolute', right: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Path d="M12 36 Q28 18 44 36 Z" fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.8} />
            <Line x1={28} y1={36} x2={28} y2={74} stroke={ink} strokeWidth={2} />
            <Ellipse cx={28} cy={55} rx={15} ry={4} fill={palette.soft ?? color.surface} stroke={ink} strokeWidth={1.5} />
            <Path d="M42 74 l4 -16 l4 16" fill="none" stroke={ink} strokeWidth={1.5} />
            <Rect x={43} y={60} width={6} height={10} rx={1} fill={palette.deep ?? color.edge} stroke={ink} strokeWidth={1} />
          </Svg>
        </View>
      </>
    );
  }

  // Row 1
  return (
    <>
      {/* Left gutter: Shopfront awning and window */}
      <View style={{ position: 'absolute', left: 8, top: 14, width: 50, height: 74 }}>
        <Svg width={50} height={74} viewBox="0 0 50 74" aria-hidden>
          <Rect x={4} y={4} width={42} height={20} rx={1} fill={palette.soft ?? color.surfaceSunken} stroke={ink} strokeWidth={1.8} />
          <Rect x={16} y={8} width={18} height={12} rx={1} fill={palette.sky} stroke={ink} strokeWidth={1.2} />
          <Path d="M2 24 l46 0 l-4 12 l-38 0 z" fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.8} />
          <Line x1={13} y1={24} x2={11} y2={36} stroke={color.surface} strokeWidth={2} />
          <Line x1={25} y1={24} x2={24} y2={36} stroke={color.surface} strokeWidth={2} />
          <Line x1={37} y1={24} x2={36} y2={36} stroke={color.surface} strokeWidth={2} />
          <Rect x={8} y={36} width={34} height={18} fill={color.surface} stroke={ink} strokeWidth={1.8} />
          <Path d="M12 66 l4 -12 l4 12" fill="none" stroke={ink} strokeWidth={1.5} />
          <Rect x={13} y={55} width={6} height={8} fill={palette.deep ?? color.edge} stroke={ink} strokeWidth={1} />
          <Line x1={2} y1={66} x2={48} y2={66} stroke={ink} strokeWidth={2} />
        </Svg>
      </View>
      {/* Right gutter: Brownstone windows and crosswalk pavement */}
      <View style={{ position: 'absolute', right: 8, top: 14, width: 50, height: 74 }}>
        <Svg width={50} height={74} viewBox="0 0 50 74" aria-hidden>
          <Rect x={6} y={4} width={38} height={46} rx={2} fill={palette.deep ?? color.edge} stroke={ink} strokeWidth={2} />
          <Rect x={11} y={9} width={9} height={10} rx={1} fill={palette.soft ?? color.surface} stroke={ink} strokeWidth={1} />
          <Rect x={28} y={9} width={9} height={10} rx={1} fill={palette.soft ?? color.surface} stroke={ink} strokeWidth={1} />
          <Rect x={11} y={23} width={9} height={10} rx={1} fill={palette.soft ?? color.surface} stroke={ink} strokeWidth={1} />
          <Rect x={28} y={23} width={9} height={10} rx={1} fill={palette.soft ?? color.surface} stroke={ink} strokeWidth={1} />
          <Line x1={20} y1={12} x2={26} y2={20} stroke={ink} strokeWidth={1.5} />
          <Line x1={26} y1={20} x2={20} y2={28} stroke={ink} strokeWidth={1.5} />
          <Line x1={20} y1={28} x2={26} y2={36} stroke={ink} strokeWidth={1.5} />
          <Rect x={18} y={36} width={14} height={14} rx={1} fill={palette.accent ?? color.coral} stroke={ink} strokeWidth={1.2} />
          <Rect x={4} y={54} width={10} height={4} rx={1} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Rect x={18} y={54} width={10} height={4} rx={1} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Rect x={32} y={54} width={10} height={4} rx={1} fill={color.surface} stroke={ink} strokeWidth={1} />
        </Svg>
      </View>
    </>
  );
}

function World4MarginMotifs({
  palette,
  rowIndex = 1,
}: {
  palette: WorldSceneryPalette;
  rowIndex?: number;
}) {
  const ink = color.ink;
  const isAlternate = rowIndex % 4 === 3;

  if (isAlternate) {
    return (
      <>
        {/* Left gutter: Duck pond with footbridge */}
        <View style={{ position: 'absolute', left: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Ellipse cx={27} cy={56} rx={24} ry={14} fill={color.sky} stroke={ink} strokeWidth={1.8} />
            <Path d="M16 54 Q24 50 32 54 M22 60 Q30 56 38 60" fill="none" stroke={color.surface} strokeWidth={1.5} />
            <Path d="M8 54 Q27 38 46 54" fill="none" stroke={palette.deep ?? color.brandDeep} strokeWidth={2.8} />
            <Line x1={48} y1={68} x2={48} y2={44} stroke={palette.accent ?? color.brand} strokeWidth={1.8} />
            <Rect x={46.5} y={46} width={3} height={8} rx={1.5} fill={palette.deep ?? color.brandDeep} />
          </Svg>
        </View>
        {/* Right gutter: Park gazebo pavilion */}
        <View style={{ position: 'absolute', right: 8, top: 12, width: 54, height: 80 }}>
          <Svg width={54} height={80} viewBox="0 0 54 80" aria-hidden>
            <Path d="M8 28 L27 10 L46 28 Z" fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={2} strokeLinejoin="round" />
            <Rect x={14} y={28} width={5} height={44} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Rect x={35} y={28} width={5} height={44} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.5} />
            <Rect x={20} y={52} width={14} height={4} rx={1} fill={palette.soft ?? color.accent} stroke={ink} strokeWidth={1.2} />
            <Rect x={6} y={70} width={42} height={4} rx={1} fill={palette.ground} stroke={ink} strokeWidth={1.2} />
          </Svg>
        </View>
      </>
    );
  }

  // Row 1
  return (
    <>
      {/* Left gutter: Tree with birdhouse and flowers */}
      <View style={{ position: 'absolute', left: 8, top: 14, width: 50, height: 74 }}>
        <Svg width={50} height={74} viewBox="0 0 50 74" aria-hidden>
          <Rect x={22} y={36} width={6} height={24} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.8} />
          <Circle cx={25} cy={22} r={18} fill={palette.ground} stroke={ink} strokeWidth={2} />
          <Circle cx={18} cy={24} r={11} fill={palette.accent ?? color.brand} stroke={ink} strokeWidth={1.5} />
          <Circle cx={30} cy={18} r={10} fill={palette.soft ?? color.accentSoft} stroke={ink} strokeWidth={1.5} />
          <Rect x={26} y={38} width={8} height={8} rx={1} fill={color.surface} stroke={ink} strokeWidth={1} />
          <Path d="M25 38 l5 -4 l5 4 z" fill={palette.accent ?? color.brand} stroke={ink} strokeWidth={1} />
          <Circle cx={30} cy={42} r={1.5} fill={ink} />
          <Line x1={15} y1={60} x2={35} y2={60} stroke={ink} strokeWidth={2} />
          <Circle cx={12} cy={56} r={2} fill={palette.soft ?? color.accent} />
          <Circle cx={38} cy={56} r={2} fill={palette.accent ?? color.coral} />
        </Svg>
      </View>
      {/* Right gutter: Park bench and rolling hill verge */}
      <View style={{ position: 'absolute', right: 8, top: 14, width: 52, height: 74 }}>
        <Svg width={52} height={74} viewBox="0 0 52 74" aria-hidden>
          <Path d="M2 50 Q26 36 50 50" fill="none" stroke={palette.ground} strokeWidth={3} />
          <Rect x={10} y={24} width={32} height={6} rx={1} fill={palette.deep ?? color.brandDeep} stroke={ink} strokeWidth={1.8} />
          <Rect x={8} y={34} width={36} height={5} rx={1} fill={palette.soft ?? color.accent} stroke={ink} strokeWidth={1.8} />
          <Line x1={14} y1={39} x2={12} y2={50} stroke={ink} strokeWidth={2} />
          <Line x1={38} y1={39} x2={40} y2={50} stroke={ink} strokeWidth={2} />
          <Path d="M8 32 Q6 26 12 26" fill="none" stroke={ink} strokeWidth={1.5} />
          <Path d="M44 32 Q46 26 40 26" fill="none" stroke={ink} strokeWidth={1.5} />
          <Line x1={6} y1={50} x2={46} y2={50} stroke={ink} strokeWidth={1.5} />
        </Svg>
      </View>
    </>
  );
}

/** Dispatches thematic margin scenery for active worlds. */
export function MarginSceneryMotif({
  worldNumber,
  palette,
  rowIndex = 1,
}: {
  worldNumber: number;
  palette: WorldSceneryPalette;
  rowIndex?: number;
}) {
  const num = ((worldNumber - 1) % 4) + 1;
  switch (num) {
    case 1:
      return <World1MarginMotifs palette={palette} rowIndex={rowIndex} />;
    case 2:
      return <World2MarginMotifs palette={palette} rowIndex={rowIndex} />;
    case 3:
      return <World3MarginMotifs palette={palette} rowIndex={rowIndex} />;
    case 4:
      return <World4MarginMotifs palette={palette} rowIndex={rowIndex} />;
    default:
      return <World1MarginMotifs palette={palette} rowIndex={rowIndex} />;
  }
}

// ---------------------------------------------------------------------------
// Preview Backdrop Silhouettes (Worlds 5–8)
// ---------------------------------------------------------------------------

export function PreviewBackdropSilhouette({
  worldNumber,
  palette,
}: {
  worldNumber: number;
  palette: WorldSceneryPalette;
}) {
  const ink = color.ink;

  // Recall meadow (World 5): Twilight hills, starry sky, fireflies
  if (worldNumber === 5) {
    return (
      <View
        testID="preview-silhouette-5"
        style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'flex-end', opacity: 0.75 }}
      >
        <Svg width="100%" height={140} viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden>
          {/* Crescent moon */}
          <Path d="M270 20 a8 8 0 1 0 10 12 a10 10 0 1 1 -10 -12" fill={palette.soft ?? color.accentSoft} />
          {/* Twinkling stars */}
          <Circle cx={40} cy={30} r={1.5} fill={color.surface} />
          <Circle cx={90} cy={18} r={1.5} fill={color.surface} />
          <Circle cx={150} cy={35} r={2} fill={color.surface} />
          <Circle cx={210} cy={22} r={1.5} fill={color.surface} />
          {/* Far ridge */}
          <Path d="M0 90 Q80 50 180 80 T320 60 L320 140 L0 140 Z" fill={palette.ground} opacity={0.45} />
          {/* Near meadow ridge */}
          <Path d="M0 105 Q100 80 220 100 T320 90 L320 140 L0 140 Z" fill={palette.ground} opacity={0.7} />
          {/* Glowing fireflies */}
          <Circle cx={60} cy={95} r={3} fill={palette.accent ?? color.accent} />
          <Circle cx={140} cy={85} r={3.5} fill={palette.soft ?? color.accentSoft} />
          <Circle cx={240} cy={90} r={3} fill={palette.accent ?? color.accent} />
        </Svg>
      </View>
    );
  }

  // Cafe terrace (World 6): Bistro terrace with strung lights, parasol umbrellas, and tables
  if (worldNumber === 6) {
    return (
      <View
        testID="preview-silhouette-6"
        style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'flex-end', opacity: 0.75 }}
      >
        <Svg width="100%" height={140} viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden>
          {/* Festoon string light banner */}
          <Path d="M0 30 Q160 60 320 30" fill="none" stroke={ink} strokeWidth={1.5} opacity={0.4} />
          <Circle cx={60} cy={42} r={3} fill={palette.soft ?? color.accentSoft} />
          <Circle cx={110} cy={48} r={3.5} fill={palette.soft ?? color.accentSoft} />
          <Circle cx={160} cy={52} r={4} fill={palette.soft ?? color.accentSoft} />
          <Circle cx={210} cy={48} r={3.5} fill={palette.soft ?? color.accentSoft} />
          <Circle cx={260} cy={42} r={3} fill={palette.soft ?? color.accentSoft} />
          {/* Cafe umbrellas and patio table */}
          <Path d="M40 75 Q70 52 100 75 Z" fill={palette.accent ?? color.coral} opacity={0.65} />
          <Line x1={70} y1={75} x2={70} y2={120} stroke={ink} strokeWidth={2} opacity={0.5} />
          <Ellipse cx={70} cy={100} rx={16} ry={4} fill={palette.soft ?? color.surface} opacity={0.7} />
          <Path d="M220 70 Q250 48 280 70 Z" fill={palette.deep ?? color.brandDeep} opacity={0.65} />
          <Line x1={250} y1={70} x2={250} y2={115} stroke={ink} strokeWidth={2} opacity={0.5} />
          <Ellipse cx={250} cy={95} rx={16} ry={4} fill={palette.soft ?? color.surface} opacity={0.7} />
        </Svg>
      </View>
    );
  }

  // Hiking ridge (World 7): Alpine ridge with sharp mountain peaks and pine trees
  if (worldNumber === 7) {
    return (
      <View
        testID="preview-silhouette-7"
        style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'flex-end', opacity: 0.75 }}
      >
        <Svg width="100%" height={140} viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden>
          {/* Soaring eagle silhouette */}
          <Path d="M140 25 Q150 18 160 25 Q170 18 180 25" fill="none" stroke={ink} strokeWidth={1.8} opacity={0.5} />
          {/* Mountain peaks */}
          <Path
            d="M0 105 L50 45 L100 85 L160 30 L220 85 L270 45 L320 80 L320 140 L0 140 Z"
            fill={palette.deep ?? color.edge}
            opacity={0.5}
          />
          {/* Pine trees along ridge */}
          <Path d="M40 85 l8 -18 l8 18 z" fill={palette.ground} opacity={0.7} />
          <Path d="M110 80 l7 -16 l7 16 z" fill={palette.ground} opacity={0.7} />
          <Path d="M210 82 l8 -18 l8 18 z" fill={palette.ground} opacity={0.7} />
          <Path d="M280 76 l9 -20 l9 20 z" fill={palette.ground} opacity={0.7} />
        </Svg>
      </View>
    );
  }

  // Crowds plaza (World 8): Municipal town hall clock tower, festival bunting, and tiered fountain
  return (
    <View
      testID="preview-silhouette-8"
      style={{ ...absoluteFill, alignItems: 'center', justifyContent: 'flex-end', opacity: 0.75 }}
    >
      <Svg width="100%" height={140} viewBox="0 0 320 140" preserveAspectRatio="none" aria-hidden>
        {/* Plaza festival bunting */}
        <Path d="M0 25 Q160 45 320 25" fill="none" stroke={ink} strokeWidth={1.4} opacity={0.4} />
        {/* Town hall clock tower */}
        <Rect x={135} y={20} width={50} height={95} rx={2} fill={palette.soft ?? color.surface} opacity={0.55} />
        <Path d="M135 20 L160 4 L185 20 Z" fill={palette.deep ?? color.edge} opacity={0.6} />
        <Circle cx={160} cy={35} r={9} fill={color.surface} opacity={0.8} />
        <Line x1={160} y1={35} x2={160} y2={30} stroke={ink} strokeWidth={1.5} opacity={0.7} />
        <Line x1={160} y1={35} x2={164} y2={35} stroke={ink} strokeWidth={1.5} opacity={0.7} />
        {/* Splashing water fountain arcs */}
        <Path d="M60 115 Q80 92 100 115" fill="none" stroke={palette.accent ?? color.info} strokeWidth={2.5} opacity={0.55} />
        <Path d="M220 115 Q240 92 260 115" fill="none" stroke={palette.accent ?? color.info} strokeWidth={2.5} opacity={0.55} />
      </Svg>
    </View>
  );
}

// ---------------------------------------------------------------------------
// WorldSceneryBackground Assembly
// ---------------------------------------------------------------------------

export interface WorldSceneryBackgroundProps {
  worldId?: string;
  worldNumber: number;
  palette: WorldSceneryPalette;
  stopCount?: number;
  isExpandedPreview?: boolean;
}

/**
 * Renders Trail Scenery for active or expanded World blocks on the World Map.
 * Provides Top Landmarks for active worlds, enriched full-height environmental backdrops,
 * paper-cut margin motifs at middle-row intervals, and subtle silhouettes for expanded preview worlds.
 */
export function WorldSceneryBackground({
  worldNumber,
  palette,
  stopCount = 0,
  isExpandedPreview = false,
}: WorldSceneryBackgroundProps) {
  const isPreview = isExpandedPreview || (worldNumber >= 5 && stopCount === 0);

  // Middle-row gutter intervals (index % 2 === 1) guaranteed outside the node clearance corridor
  const middleRowIndices: number[] = [];
  if (!isPreview && stopCount > 0) {
    for (let i = 1; i < stopCount; i += 2) {
      middleRowIndices.push(i);
    }
  }

  return (
    <>
      {/* 1. Top Landmark in-flow entrance for active worlds (1-4) */}
      {!isPreview && (
        <TopLandmark worldNumber={worldNumber} palette={palette} />
      )}

      {/* 2. Absolute decorative backdrop layers */}
      <View
        testID="world-scenery-background"
        pointerEvents="none"
        aria-hidden={true}
        accessibilityElementsHidden={true}
        importantForAccessibility="no-hide-descendants"
        style={absoluteFill}
      >
        {/* Full-height environmental backdrop for active worlds (1-4) */}
        {!isPreview && (
          <FullHeightEnvironmentalBackdrop worldNumber={worldNumber} palette={palette} />
        )}

        {/* Bottom ground strip */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 56,
            backgroundColor: palette.ground,
            opacity: 0.3,
          }}
        />

        {/* Preview world subtle silhouette (Worlds 5-8) */}
        {isPreview && (
          <View testID="preview-silhouette" style={absoluteFill}>
            <PreviewBackdropSilhouette worldNumber={worldNumber} palette={palette} />
          </View>
        )}

        {/* Middle-row margin scenery (outside the node corridor) */}
        {!isPreview && middleRowIndices.length > 0 && (
          <View testID="margin-scenery" style={absoluteFill}>
            {middleRowIndices.map((rowIndex) => (
              <View
                key={`margin-row-${rowIndex}`}
                testID={`margin-row-${rowIndex}`}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: PATH_TOP_OFFSET + rowIndex * ROW_HEIGHT,
                  height: ROW_HEIGHT,
                }}
              >
                <MarginSceneryMotif worldNumber={worldNumber} palette={palette} rowIndex={rowIndex} />
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  );
}
