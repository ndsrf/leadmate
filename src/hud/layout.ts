/** Longer text must still fit: shrinks the font size until the string fits `maxWidth`. */
export const CHAR_WIDTH_EM = 0.6;
export const MIN_FONT_PX = 9;

/** Estimated rendered width of `text` at `fontPx`. */
export function textWidth(text: string, fontPx: number): number {
  return text.length * fontPx * CHAR_WIDTH_EM;
}

export function fitFontSize(text: string, maxWidth: number, basePx: number): number {
  if (text.length === 0) return basePx;
  const fit = maxWidth / (text.length * CHAR_WIDTH_EM);
  return Math.max(MIN_FONT_PX, Math.min(basePx, Math.floor(fit)));
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const MARKER_RADIUS = 52;
/** Radius of the joystick ring. */
export const JOY_RADIUS = 70;
export const CUE_RADIUS = 34;
export const SNIFF_RADIUS = 34;
/** The Jackpot button is smaller than the Marker: a second, rarer reward. */
export const JACKPOT_RADIUS = 26;
/** Room kept at the bottom of the screen for the Arousal bar. */
const AROUSAL_BAR_ROOM = 20;
/** Widest label under or over a Cue or Go Sniff button: the room up to the neighboring button. */
export const CUE_LABEL_WIDTH = CUE_RADIUS * 2.4;

/** Dog portrait sizing: 96-120 px from the screen's short side (readable-dog Decision 6). */
export const PORTRAIT_MIN_SIZE = 96;
export const PORTRAIT_MAX_SIZE = 120;
export const PORTRAIT_MARGIN = 12;

export interface Insets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface PortraitLayout extends Point {
  size: number;
}

/** Tells whether `point` falls inside the Dog portrait's touch area. */
export function isPointInPortrait(point: Point, portrait: PortraitLayout): boolean {
  return Math.hypot(point.x - portrait.x, point.y - portrait.y) <= portrait.size * 0.55;
}

export type HudCue = 'lets-go' | 'leave-it';

/** A close-view button: its center and size, in pixels. */
export interface CloseButton extends Point {
  w: number;
  h: number;
}

/** Where the close view's thumb controls go; the Phaser scene builds its buttons from this and the Coach marks point at it. */
export interface CloseHudLayout {
  gather: CloseButton;
  poste: CloseButton;
  marker: CloseButton;
}

export const CLOSE_HUD_MARGIN = 24;

/**
 * Round buttons as in design 18: Recoger bottom-left (84), Marcar bottom-right (84) and Poste (64) above Marcar.
 * The HTML view (`handDrillView.ts`) positions its buttons at these same centers.
 */
export function closeHudLayout(width: number, height: number): CloseHudLayout {
  return {
    gather: { x: width - 58, y: height - 86, w: 84, h: 84 },
    marker: { x: 58, y: height - 86, w: 84, h: 84 },
    poste: { x: width - 58, y: height - 186, w: 64, h: 64 },
  };
}

export interface HudLayout {
  joyHome: Point;
  markerHome: Point;
  /** The "Let's Go" Cue button sits above the Marker, under the right thumb. */
  cueHome: Point;
  /** The "Leave It" Cue button: beside "Let's Go" in a two-Cue Stage, in its place when it is the only one. */
  leaveItHome: Point;
  /** The contextual Go Sniff button, beside the Marker. */
  sniffHome: Point;
  /** The Dog portrait center and size, in the top-right corner away from the back button. */
  portraitHome: Point;
  portraitSize: number;
  portrait: PortraitLayout;
  /** The Jackpot button, only in a Stage with a Jackpot budget: under Go Sniff, or left of it when the screen is too short. */
  jackpotHome: Point | null;
}

/**
 * Where the HUD controls go: joystick under the left thumb, Marker and Cues under the right. With
 * both Cues the "Leave It" button sits to the left of "Let's Go"; a single Cue takes the main slot.
 * The Dog portrait sits in the top-right corner, sized 96-120 px from the short side, respecting insets.
 */
export function hudLayout(
  width: number,
  height: number,
  cues: readonly HudCue[] = ['lets-go'],
  options: { insets?: Insets; jackpot?: boolean } = {},
): HudLayout {
  const insets = options.insets ?? {};
  const jackpot = options.jackpot ?? false;
  const margin = Math.min(120, height * 0.25);
  const markerHome = { x: width - Math.min(120, width * 0.18), y: height - margin };
  const cueHome = { x: markerHome.x, y: markerHome.y - MARKER_RADIUS - CUE_RADIUS - 14 };
  const both = cues.includes('lets-go') && cues.includes('leave-it');

  const shortSide = Math.min(width, height);
  const size = Math.max(PORTRAIT_MIN_SIZE, Math.min(PORTRAIT_MAX_SIZE, Math.round(shortSide * 0.28)));
  const insetTop = insets.top ?? 0;
  const insetRight = insets.right ?? 0;
  const portraitHome: Point = {
    x: width - insetRight - PORTRAIT_MARGIN - size / 2,
    y: insetTop + PORTRAIT_MARGIN + size / 2,
  };

  const sniffHome = { x: markerHome.x - MARKER_RADIUS - SNIFF_RADIUS - 14, y: markerHome.y };
  const below = sniffHome.y + SNIFF_RADIUS + 10 + JACKPOT_RADIUS;
  const fitsBelow = below + JACKPOT_RADIUS <= height - AROUSAL_BAR_ROOM;
  return {
    joyHome: { x: Math.min(130, width * 0.2), y: height - margin },
    markerHome,
    cueHome,
    leaveItHome: both ? { x: cueHome.x - 2 * CUE_RADIUS - 14, y: cueHome.y } : cueHome,
    sniffHome,
    jackpotHome: !jackpot ? null : fitsBelow ? { x: sniffHome.x, y: below } : { x: sniffHome.x - SNIFF_RADIUS - JACKPOT_RADIUS - 14, y: sniffHome.y },
    portraitHome,
    portraitSize: size,
    portrait: {
      x: portraitHome.x,
      y: portraitHome.y,
      size,
    },
  };
}

/** The Cue buttons on show in a Stage, in the order they are laid out. */
export function visibleCues(cues: readonly HudCue[]): HudCue[] {
  return (['lets-go', 'leave-it'] as const).filter((c) => cues.includes(c));
}

/**
 * The shell's back button (`SimulatorBackButton`): 44 points, 12 points from the top-left corner (more with insets).
 * The Stage draws nothing under it.
 */
export const BACK_BUTTON: Rect = { x: 12, y: 12, width: 44, height: 44 };

/** The Dog portrait's box at top-right (readable-dog design Decision 6), the same one `hudLayout` places. */
export function portraitSlot(width: number, height: number): Rect {
  const { portrait } = hudLayout(width, height);
  return { x: portrait.x - portrait.size / 2, y: portrait.y - portrait.size / 2, width: portrait.size, height: portrait.size };
}

/** Bounding boxes around the interactive HUD controls. */
export function controlZones(width: number, height: number, cues: readonly HudCue[] = ['lets-go']): Rect[] {
  const l = hudLayout(width, height, cues);
  const zones: Rect[] = [
    { x: l.joyHome.x - JOY_RADIUS - 8, y: l.joyHome.y - JOY_RADIUS - 8, width: 2 * JOY_RADIUS + 16, height: 2 * JOY_RADIUS + 16 },
    { x: l.markerHome.x - MARKER_RADIUS - 8, y: l.markerHome.y - MARKER_RADIUS - 8, width: 2 * MARKER_RADIUS + 16, height: 2 * MARKER_RADIUS + 16 },
  ];
  if (cues.includes('lets-go')) {
    zones.push({ x: l.cueHome.x - CUE_RADIUS - 6, y: l.cueHome.y - CUE_RADIUS - 24, width: 2 * CUE_RADIUS + 12, height: 2 * CUE_RADIUS + 30 });
  }
  if (cues.includes('leave-it')) {
    zones.push({ x: l.leaveItHome.x - CUE_RADIUS - 6, y: l.leaveItHome.y - CUE_RADIUS - 24, width: 2 * CUE_RADIUS + 12, height: 2 * CUE_RADIUS + 30 });
  }
  zones.push({ x: l.sniffHome.x - SNIFF_RADIUS - 6, y: l.sniffHome.y - SNIFF_RADIUS - 24, width: 2 * SNIFF_RADIUS + 12, height: 2 * SNIFF_RADIUS + 30 });
  zones.push(BACK_BUTTON);
  return zones;
}

export interface StageMeterLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  badge: Point;
  bar: Rect;
}

/**
 * Layout for Stage Meters in top-left under the back button, clear of controls, coach marks, and portrait slot.
 */
export function stageMetersLayout(width: number, height: number, meters: readonly { id: string }[]): StageMeterLayout[] {
  if (meters.length === 0) return [];
  const portrait = portraitSlot(width, height);
  const meterWidth = Math.min(136, Math.max(100, Math.floor(portrait.x - 32)));
  const meterHeight = 26;
  const gapY = 8;
  const startX = 16;
  const startY = BACK_BUTTON.y + BACK_BUTTON.height + 10;

  return meters.map((m, index) => {
    const y = startY + index * (meterHeight + gapY);
    return {
      id: m.id,
      x: startX,
      y,
      width: meterWidth,
      height: meterHeight,
      badge: { x: startX + 13, y: y + 13 },
      bar: { x: startX + 28, y: y + 4, width: meterWidth - 32, height: meterHeight - 8 },
    };
  });
}

/**
 * Placement for the pop-up Feedback Message: above the Dog, clear of controls, clamped to screen.
 */
export function feedbackMessagePosition(dogPos: Point, width: number, height: number, cues: readonly HudCue[] = ['lets-go']): Point {
  const defaultYOffset = 54;
  let targetX = dogPos.x;
  let targetY = dogPos.y - defaultYOffset;

  const padX = 60;
  const padY = 30;
  targetX = Math.max(padX, Math.min(width - padX, targetX));
  targetY = Math.max(padY, Math.min(height - padY, targetY));

  const zones = controlZones(width, height, cues);
  const msgW = 100;
  const msgH = 30;

  for (const z of zones) {
    const overlaps = !(
      targetX + msgW / 2 <= z.x ||
      z.x + z.width <= targetX - msgW / 2 ||
      targetY + msgH / 2 <= z.y ||
      z.y + z.height <= targetY - msgH / 2
    );
    if (overlaps) {
      if (z.y - msgH - 10 >= padY) {
        targetY = z.y - msgH / 2 - 8;
      } else if (z.x - msgW / 2 - 8 >= padX) {
        targetX = z.x - msgW / 2 - 8;
      } else {
        targetY = z.y + z.height + msgH / 2 + 8;
      }
    }
  }

  return { x: targetX, y: targetY };
}

/**
 * Banner layout for Big-tier feedback effects: under the top safe area, between the back button and the Dog portrait.
 */
export function bannerLayout(width: number, height: number): Rect {
  const left = BACK_BUTTON.x + BACK_BUTTON.width + 8;
  const right = portraitSlot(width, height).x - 8;
  const bannerW = Math.min(512, right - left);
  const bannerH = 72;
  return {
    x: (left + right) / 2,
    y: 20 + bannerH / 2,
    width: bannerW,
    height: bannerH,
  };
}
