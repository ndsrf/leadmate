import { hudLayout, JOY_RADIUS, MARKER_RADIUS, type HudCue, type Point } from './layout';

/** Length of a Coach mark's arrow, in pixels. */
export const ARROW_LENGTH = 30;
/** Gap between an arrow tip and the control it points at. */
export const TIP_GAP = 10;
export const LABEL_HEIGHT = 44;
export const LABEL_MAX_WIDTH = 150;
export const LABEL_MIN_WIDTH = 70;
const SCREEN_PAD = 8;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CoachMark {
  /** Where the arrow tip touches, just outside the control. */
  tip: Point;
  /** Direction the arrow points, in radians (0 = right, pi/2 = down). */
  angle: number;
  /** Where the label goes. */
  label: Rect;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function onScreen(rect: Rect, width: number, height: number): Rect {
  return {
    ...rect,
    x: clamp(rect.x, SCREEN_PAD, Math.max(SCREEN_PAD, width - SCREEN_PAD - rect.width)),
    y: clamp(rect.y, SCREEN_PAD, Math.max(SCREEN_PAD, height - SCREEN_PAD - rect.height)),
  };
}

/**
 * Where the two Coach marks go for a screen size: "drag to move" above the joystick pointing down,
 * "tap to reward" left of the Marker pointing at it. Positions come from `hudLayout`, so they sit on
 * the real controls and never cover the Marker.
 */
export function coachMarks(width: number, height: number, cues: readonly HudCue[] = ['lets-go']): { move: CoachMark; mark: CoachMark } {
  const { joyHome, markerHome } = hudLayout(width, height, cues);

  const moveTip = { x: joyHome.x, y: joyHome.y - JOY_RADIUS - TIP_GAP };
  const moveWidth = Math.min(LABEL_MAX_WIDTH, width * 0.4);
  const move: CoachMark = {
    tip: moveTip,
    angle: Math.PI / 2,
    label: onScreen({ x: moveTip.x - moveWidth / 2, y: moveTip.y - ARROW_LENGTH - 4 - LABEL_HEIGHT, width: moveWidth, height: LABEL_HEIGHT }, width, height),
  };

  const markTip = { x: markerHome.x - MARKER_RADIUS - TIP_GAP, y: markerHome.y };
  const labelRight = markTip.x - ARROW_LENGTH - 4;
  // the room between the joystick ring and the arrow; the label wraps when it is narrow
  const room = labelRight - (joyHome.x + JOY_RADIUS + SCREEN_PAD);
  const markWidth = clamp(room, LABEL_MIN_WIDTH, LABEL_MAX_WIDTH);
  const mark: CoachMark = {
    tip: markTip,
    angle: 0,
    label: onScreen({ x: labelRight - markWidth, y: markTip.y - LABEL_HEIGHT / 2, width: markWidth, height: LABEL_HEIGHT }, width, height),
  };
  return { move, mark };
}

/**
 * Where an arrow toward the approaching dog goes: the point of the screen edge (inset by `inset`)
 * on the ray from the center at the `bearing` angle, and the angle it points.
 */
export function edgeArrow(width: number, height: number, bearing: number, inset = ARROW_LENGTH + 12): { position: Point; angle: number } {
  const cx = width / 2;
  const cy = height / 2;
  const dx = Math.cos(bearing);
  const dy = Math.sin(bearing);
  const halfW = Math.max(1, cx - inset);
  const halfH = Math.max(1, cy - inset);
  const t = Math.min(dx === 0 ? Infinity : halfW / Math.abs(dx), dy === 0 ? Infinity : halfH / Math.abs(dy));
  return { position: { x: cx + dx * t, y: cy + dy * t }, angle: bearing };
}
