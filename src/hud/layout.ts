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

export const MARKER_RADIUS = 52;
export const CUE_RADIUS = 34;
export const SNIFF_RADIUS = 34;
/** Widest label under or over a Cue or Go Sniff button: the room up to the neighboring button. */
export const CUE_LABEL_WIDTH = CUE_RADIUS * 2.4;

export type HudCue = 'lets-go' | 'leave-it';

export interface HudLayout {
  joyHome: Point;
  markerHome: Point;
  /** The "Let's Go" Cue button sits above the Marker, under the right thumb. */
  cueHome: Point;
  /** The "Leave It" Cue button: beside "Let's Go" in a two-Cue Stage, in its place when it is the only one. */
  leaveItHome: Point;
  /** The contextual Go Sniff button, beside the Marker. */
  sniffHome: Point;
}

/**
 * Where the HUD controls go: joystick under the left thumb, Marker and Cues under the right. With
 * both Cues the "Leave It" button sits to the left of "Let's Go"; a single Cue takes the main slot.
 */
export function hudLayout(width: number, height: number, cues: readonly HudCue[] = ['lets-go']): HudLayout {
  const margin = Math.min(120, height * 0.25);
  const markerHome = { x: width - Math.min(120, width * 0.18), y: height - margin };
  const cueHome = { x: markerHome.x, y: markerHome.y - MARKER_RADIUS - CUE_RADIUS - 14 };
  const both = cues.includes('lets-go') && cues.includes('leave-it');
  return {
    joyHome: { x: Math.min(130, width * 0.2), y: height - margin },
    markerHome,
    cueHome,
    leaveItHome: both ? { x: cueHome.x - 2 * CUE_RADIUS - 14, y: cueHome.y } : cueHome,
    sniffHome: { x: markerHome.x - MARKER_RADIUS - SNIFF_RADIUS - 14, y: markerHome.y },
  };
}

/** The Cue buttons on show in a Stage, in the order they are laid out. */
export function visibleCues(cues: readonly HudCue[]): HudCue[] {
  return (['lets-go', 'leave-it'] as const).filter((c) => cues.includes(c));
}
