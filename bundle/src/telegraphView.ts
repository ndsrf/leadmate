import Phaser from 'phaser';
import { ARC_RADIUS, type ArcLook, type RingLook } from '../../src/hud/telegraphLook';
import { HUD_COLOR_NUM } from './tokens.generated';

const TAU = Math.PI * 2;
const START = -Math.PI / 2;
/** The ground ellipse of an isometric circle is half as tall as it is wide. */
const SQUASH = 0.5;
const OUTLINE = 4;
const STROKE = 4;

/** Strokes `fill` (0 to 1) of an ellipse clockwise from the top, as a polyline, optionally dashed. */
function strokeEllipseArc(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, fill: number, dashed: boolean): void {
  const steps = Math.max(8, Math.ceil(48 * fill));
  const dashOn = 5;
  const dashOff = 4;
  g.beginPath();
  let pen = false;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * fill;
    const on = !dashed || i % (dashOn + dashOff) < dashOn;
    const x = cx + Math.cos(START + TAU * t) * rx;
    const y = cy + Math.sin(START + TAU * t) * ry;
    if (on && !pen) g.moveTo(x, y);
    else if (on) g.lineTo(x, y);
    pen = on;
  }
  g.strokePath();
}

/** One ink-outlined accent stroke: the outline under, the accent over. */
function inkStroke(g: Phaser.GameObjects.Graphics, cx: number, cy: number, rx: number, ry: number, fill: number, dashed: boolean, alpha: number): void {
  g.lineStyle(STROKE + OUTLINE, HUD_COLOR_NUM.ink, alpha);
  strokeEllipseArc(g, cx, cy, rx, ry, fill, dashed);
  g.lineStyle(STROKE, HUD_COLOR_NUM.accent, alpha);
  strokeEllipseArc(g, cx, cy, rx, ry, fill, dashed);
}

/** Draws the Approach ring on the ground at (x, y). Landed is a solid disc and Good a dashed ring, so they differ by shape and not by colour. */
export function drawRing(g: Phaser.GameObjects.Graphics, x: number, y: number, look: RingLook | null): void {
  g.clear();
  if (!look) return;
  const rx = look.radius;
  const ry = rx * SQUASH;
  if (look.ghost) inkStroke(g, x, y, look.ghost.radius, look.ghost.radius * SQUASH, 1, false, look.ghost.alpha);
  if (look.disc) {
    g.fillStyle(HUD_COLOR_NUM.accent, look.alpha).fillEllipse(x, y, rx * 2, ry * 2);
    g.lineStyle(STROKE, HUD_COLOR_NUM.ink, look.alpha).strokeEllipse(x, y, rx * 2, ry * 2);
    return;
  }
  if (look.fill < 1 && !look.dashed) {
    // a reduced-motion fill-ring: the empty track, then the fill
    g.lineStyle(STROKE + OUTLINE, HUD_COLOR_NUM.ink, look.alpha * 0.5).strokeEllipse(x, y, rx * 2, ry * 2);
    g.lineStyle(STROKE, HUD_COLOR_NUM.surfaceSunken, look.alpha).strokeEllipse(x, y, rx * 2, ry * 2);
  }
  if (look.fill > 0) inkStroke(g, x, y, rx, ry, look.fill, look.dashed, look.alpha);
}

/** Draws the Check-in arc at the Dog's head (x, y): a small ring that closes to a disc on landing. */
export function drawArc(g: Phaser.GameObjects.Graphics, x: number, y: number, look: ArcLook | null): void {
  g.clear();
  if (!look) return;
  if (look.disc) {
    g.fillStyle(HUD_COLOR_NUM.accent, look.alpha).fillCircle(x, y, ARC_RADIUS * 0.8);
    g.lineStyle(3, HUD_COLOR_NUM.ink, look.alpha).strokeCircle(x, y, ARC_RADIUS * 0.8);
    return;
  }
  g.lineStyle(STROKE + OUTLINE, HUD_COLOR_NUM.ink, look.alpha * 0.35).strokeCircle(x, y, ARC_RADIUS);
  if (look.fill > 0) {
    g.lineStyle(STROKE + OUTLINE, HUD_COLOR_NUM.ink, look.alpha).beginPath().arc(x, y, ARC_RADIUS, START, START + TAU * look.fill).strokePath();
    g.lineStyle(STROKE, HUD_COLOR_NUM.accent, look.alpha).beginPath().arc(x, y, ARC_RADIUS, START, START + TAU * look.fill).strokePath();
  }
}

/** The Full-assist Marker highlight: an outline ring outside the button radius. Steady, or pulsing unless motion is reduced. */
export function drawMarkerHighlight(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, pulse: number): void {
  const r = radius + 10 + pulse * 4;
  g.lineStyle(STROKE + OUTLINE, HUD_COLOR_NUM.ink, 1).strokeCircle(x, y, r);
  g.lineStyle(STROKE, HUD_COLOR_NUM.accent, 1).strokeCircle(x, y, r);
}
