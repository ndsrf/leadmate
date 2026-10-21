import type Phaser from 'phaser';
import type { SceneryItem, SceneryTheme } from '../../src/sim/geometry';
import { project } from '../../src/hud/iso';
import { shapeOf, type GroundDecor, type GroundPatch, type GroundSurface } from '../../src/sim/scenery';
import type { Vec2 } from '../../src/sim/vec';

export const WALL_HEIGHT: Record<SceneryTheme, number> = { indoor_apartment: 2.2, quiet_suburb: 1.2, urban_street: 3, open_park: 0.8 };
export const WALL_COLORS: Record<SceneryTheme, { side: number; top: number }> = {
  indoor_apartment: { side: 0xcbd5e1, top: 0xf1f5f9 },
  quiet_suburb: { side: 0xa8a29e, top: 0xd6d3d1 },
  urban_street: { side: 0x94a3b8, top: 0xcbd5e1 },
  open_park: { side: 0x854d0e, top: 0xa16207 },
};

const rect = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x, y, w, h);

/** Lightens or darkens a 0xRRGGBB color by `amount` (-1 to 1). */
function shade(color: number, amount: number): number {
  const mix = (c: number) => Math.max(0, Math.min(255, Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))));
  return (mix((color >> 16) & 255) << 16) | (mix((color >> 8) & 255) << 8) | mix(color & 255);
}

/**
 * An upright box standing on the ground at world position `center`, `length` long along `angle`,
 * `width` across and `height` tall, drawn in the isometric view with its footprint matching the
 * collision segment of the prop. Faces turned toward the viewer are shaded; the top is lightest.
 */
export function box(g: Phaser.GameObjects.Graphics, center: Vec2, angle: number, length: number, width: number, height: number, color: number, lift = 0): void {
  const u = { x: Math.cos(angle) * length / 2, y: Math.sin(angle) * length / 2 };
  const v = { x: -Math.sin(angle) * width / 2, y: Math.cos(angle) * width / 2 };
  const at = (su: number, sv: number): Vec2 => ({ x: center.x + u.x * su + v.x * sv, y: center.y + u.y * su + v.y * sv });
  const corners = [at(-1, -1), at(1, -1), at(1, 1), at(-1, 1)];
  const low = corners.map((c) => project(c, lift));
  const high = corners.map((c) => project(c, lift + height));
  // side faces whose outer edge is lower on screen face the viewer; paint them back to front
  const faces = [0, 1, 2, 3]
    .map((i) => ({ i, y: (low[i].y + low[(i + 1) % 4].y) / 2 }))
    .sort((p, q) => p.y - q.y);
  const sideTone = [0, -0.2, -0.35, -0.1];
  for (const { i } of faces) {
    const j = (i + 1) % 4;
    const mid = (low[i].y + low[j].y) / 2;
    const centre = (low[0].y + low[1].y + low[2].y + low[3].y) / 4;
    if (mid < centre - 0.01) continue; // faces turned away are hidden by the others
    g.fillStyle(shade(color, sideTone[i]));
    g.fillPoints([low[i], low[j], high[j], high[i]], true);
  }
  g.fillStyle(shade(color, 0.25)).fillPoints(high, true);
}

/** The point at `along` meters along a long prop and `across` to its side. */
function onProp(item: SceneryItem, along: number, across = 0): Vec2 {
  const a = item.angle ?? 0;
  return { x: item.pos.x + Math.cos(a) * along - Math.sin(a) * across, y: item.pos.y + Math.sin(a) * along + Math.cos(a) * across };
}

/** Draws a prop with its base at the screen point `(x, y)`: simple isometric-ish shapes, decorative only. */
export function drawProp(g: Phaser.GameObjects.Graphics, item: SceneryItem, x: number, y: number): void {
  const angle = item.angle ?? 0;
  const long = shapeOf(item.type).length;
  g.fillStyle(0x000000, 0.2).fillEllipse(x, y, long ? Math.min(70, 16 + long * 14) : 30, 14);
  switch (item.type) {
    case 'bush':
      g.fillStyle(0x15803d).fillEllipse(x, y - 10, 30, 24);
      g.fillStyle(0x22c55e).fillEllipse(x - 4, y - 14, 22, 14);
      break;
    case 'hedge':
      box(g, item.pos, angle, 2.4, 0.7, 0.8, 0x15803d);
      break;
    case 'bench':
      box(g, item.pos, angle, 1.5, 0.45, 0.2, 0x92400e, 0.25);
      box(g, onProp(item, 0, 0.2), angle, 1.5, 0.08, 0.35, 0xb45309, 0.45);
      box(g, onProp(item, -0.6, 0), angle, 0.08, 0.35, 0.25, 0x57534e);
      box(g, onProp(item, 0.6, 0), angle, 0.08, 0.35, 0.25, 0x57534e);
      break;
    case 'lamp_post':
    case 'lamp':
      rect(g, x - 2, y - 62, 4, 62, 0x475569);
      g.fillStyle(0xfde047).fillCircle(x, y - 64, 6);
      break;
    case 'bin':
      g.fillStyle(0x334155).fillRoundedRect(x - 8, y - 22, 16, 22, 3);
      rect(g, x - 9, y - 24, 18, 3, 0x1e293b);
      break;
    case 'trash_can':
      g.fillStyle(0x15803d).fillRoundedRect(x - 10, y - 26, 20, 26, 4);
      rect(g, x - 11, y - 29, 22, 4, 0x166534);
      break;
    case 'mailbox':
      rect(g, x - 2, y - 24, 4, 24, 0x57534e);
      g.fillStyle(0x2563eb).fillRoundedRect(x - 9, y - 38, 18, 14, 4);
      break;
    case 'mailbox_row':
      box(g, item.pos, angle, 1.6, 0.25, 0.35, 0x2563eb, 0.55);
      box(g, onProp(item, -0.6), angle, 0.06, 0.06, 0.55, 0x57534e);
      box(g, onProp(item, 0.6), angle, 0.06, 0.06, 0.55, 0x57534e);
      break;
    case 'fence':
      box(g, item.pos, angle, 3, 0.06, 0.1, 0xd6d3d1, 0.15);
      for (let i = -3; i <= 3; i++) box(g, onProp(item, i * 0.45), angle, 0.08, 0.06, 0.65, 0xe7e5e4);
      break;
    case 'parked_car': {
      const body = [0xdc2626, 0x2563eb, 0xf59e0b, 0x16a34a][Math.abs(Math.round(item.pos.x * 7 + item.pos.y * 3)) % 4];
      box(g, item.pos, angle, 3.4, 1.5, 0.55, body, 0.2);
      box(g, onProp(item, -0.2), angle, 1.8, 1.3, 0.45, 0xbfdbfe, 0.75);
      for (const [a, b] of [[-1.1, -0.7], [-1.1, 0.7], [1.1, -0.7], [1.1, 0.7]]) box(g, onProp(item, a, b), angle, 0.5, 0.2, 0.4, 0x1e293b);
      break;
    }
    case 'bus_stop':
      box(g, item.pos, angle, 2.4, 0.9, 0.08, 0x0ea5e9, 2);
      box(g, onProp(item, -1.1, -0.4), angle, 0.08, 0.08, 2, 0x475569);
      box(g, onProp(item, 1.1, -0.4), angle, 0.08, 0.08, 2, 0x475569);
      box(g, onProp(item, 0, -0.4), angle, 2.2, 0.05, 1.4, 0x7dd3fc, 0.5);
      break;
    case 'sign':
      rect(g, x - 1, y - 44, 3, 44, 0x64748b);
      g.fillStyle(0x16a34a).fillRoundedRect(x - 12, y - 56, 24, 14, 2);
      break;
    case 'hydrant':
      g.fillStyle(0xef4444).fillRoundedRect(x - 5, y - 18, 10, 18, 3);
      break;
    case 'bike_rack':
      box(g, item.pos, angle, 1.4, 0.06, 0.06, 0x64748b, 0.55);
      for (let i = -2; i <= 2; i++) box(g, onProp(item, i * 0.3), angle, 0.05, 0.06, 0.6, 0x64748b);
      break;
    case 'pond':
      // flat water; the scene bakes it into the ground instead of drawing it here
      g.fillStyle(0x38bdf8, 0.9).fillEllipse(x, y - 2, 90, 44);
      g.fillStyle(0x7dd3fc, 0.7).fillEllipse(x - 8, y - 5, 50, 20);
      break;
    case 'fountain':
      g.fillStyle(0x94a3b8).fillEllipse(x, y - 6, 56, 28);
      g.fillStyle(0x38bdf8).fillEllipse(x, y - 8, 46, 22);
      rect(g, x - 3, y - 34, 6, 28, 0xcbd5e1);
      g.fillStyle(0x7dd3fc, 0.8).fillCircle(x, y - 38, 6);
      break;
    case 'kiosk':
      box(g, item.pos, angle, 1.2, 1.2, 1.6, 0xf59e0b);
      box(g, item.pos, angle, 1.5, 1.5, 0.1, 0xdc2626, 1.6);
      break;
    case 'flower_bed':
      box(g, item.pos, angle, 1.6, 0.7, 0.25, 0x92400e);
      g.fillStyle(0xf472b6).fillCircle(x - 12, y - 14, 4).fillStyle(0xfacc15).fillCircle(x, y - 17, 4).fillStyle(0xf87171).fillCircle(x + 12, y - 14, 4);
      break;
    case 'scooter':
      rect(g, x - 1, y - 26, 3, 26, 0x6366f1);
      rect(g, x - 9, y - 28, 18, 3, 0x1e293b);
      g.fillStyle(0x1e293b).fillCircle(x - 7, y - 3, 3).fillCircle(x + 7, y - 3, 3);
      break;
    case 'garden_gnome':
      g.fillStyle(0xdc2626).fillTriangle(x - 5, y - 10, x + 5, y - 10, x, y - 24);
      g.fillStyle(0xfcd34d).fillCircle(x, y - 9, 4);
      break;
    case 'picnic_table':
      box(g, item.pos, angle, 1.8, 0.8, 0.08, 0xb45309, 0.7);
      box(g, onProp(item, 0, -0.55), angle, 1.8, 0.25, 0.06, 0x92400e, 0.4);
      box(g, onProp(item, 0, 0.55), angle, 1.8, 0.25, 0.06, 0x92400e, 0.4);
      box(g, onProp(item, -0.7), angle, 0.08, 0.7, 0.7, 0x78350f);
      box(g, onProp(item, 0.7), angle, 0.08, 0.7, 0.7, 0x78350f);
      break;
    case 'door':
      rect(g, x - 14, y - 70, 28, 70, 0x92400e);
      g.fillStyle(0xfde047).fillCircle(x + 8, y - 34, 2);
      break;
    case 'coat_rack':
      rect(g, x - 1, y - 60, 3, 60, 0x57534e);
      rect(g, x - 12, y - 56, 24, 3, 0x57534e);
      g.fillStyle(0x6366f1).fillRoundedRect(x - 12, y - 52, 10, 22, 3);
      break;
    case 'shoe_rack':
      box(g, item.pos, angle, 0.9, 0.35, 0.4, 0x78350f);
      box(g, onProp(item, -0.2), angle, 0.2, 0.15, 0.1, 0x0f172a, 0.4);
      box(g, onProp(item, 0.2), angle, 0.2, 0.15, 0.1, 0xdc2626, 0.4);
      break;
    case 'plant':
      g.fillStyle(0xb45309).fillRoundedRect(x - 7, y - 12, 14, 12, 2);
      g.fillStyle(0x16a34a).fillEllipse(x, y - 22, 22, 22);
      break;
    case 'umbrella_stand':
      g.fillStyle(0x475569).fillRoundedRect(x - 6, y - 18, 12, 18, 3);
      rect(g, x - 1, y - 34, 3, 18, 0xef4444);
      break;
    case 'stool':
      g.fillStyle(0xa16207).fillEllipse(x, y - 16, 18, 9);
      rect(g, x - 6, y - 15, 2, 15, 0x78350f);
      rect(g, x + 4, y - 15, 2, 15, 0x78350f);
      break;
    case 'dog_bed':
      g.fillStyle(0x7c3aed, 0.9).fillEllipse(x, y - 3, 34, 16);
      g.fillStyle(0xc4b5fd, 0.9).fillEllipse(x, y - 4, 22, 9);
      break;
    case 'elevator_panel':
      rect(g, x - 8, y - 50, 16, 26, 0x475569);
      g.fillStyle(0xfbbf24).fillCircle(x, y - 42, 3).fillCircle(x, y - 32, 3);
      break;
    case 'picture':
      rect(g, x - 12, y - 56, 24, 18, 0x78350f);
      rect(g, x - 10, y - 54, 20, 14, 0x7dd3fc);
      break;
    case 'cabinet':
      box(g, item.pos, angle, 1.0, 0.45, 1.1, 0xa16207);
      box(g, onProp(item, 0, 0.23), angle, 0.04, 0.02, 0.5, 0x422006, 0.3);
      break;
    case 'shelf':
      box(g, item.pos, angle, 1.3, 0.35, 1.5, 0x92400e);
      for (const lift of [0.4, 0.8, 1.2]) box(g, onProp(item, 0, 0.19), angle, 1.1, 0.04, 0.05, 0xfde68a, lift);
      break;
    case 'sofa':
      box(g, item.pos, angle, 1.8, 0.8, 0.4, 0x6366f1);
      box(g, onProp(item, 0, -0.35), angle, 1.8, 0.15, 0.45, 0x4f46e5, 0.4);
      break;
    default:
      rect(g, x - 8, y - 16, 16, 16, 0x94a3b8);
  }
}

// -- Ground Cover ----------------------------------------------------------------------------------

/** Flat colors per floor surface: the main tone, the second tone of its pattern and the line color. */
export const SURFACE_STYLE: Record<GroundSurface, { a: number; b: number; line: number }> = {
  tile: { a: 0xd6c7a8, b: 0xc8b78f, line: 0xb9a77d },
  wood: { a: 0xb98a5a, b: 0xa87a4c, line: 0x8a5e36 },
  carpet: { a: 0xa78bfa, b: 0x9a7ff0, line: 0x8b6fe0 },
  paving: { a: 0xb8bcc4, b: 0xaeb3bc, line: 0x9ca3af },
  cobble: { a: 0x9a8f84, b: 0x8c8176, line: 0x6f655b },
  grass: { a: 0x8bb04f, b: 0x82a648, line: 0x759b41 },
  dirt: { a: 0xa8805a, b: 0x9b7550, line: 0x7c5a3a },
  sand: { a: 0xe8d9a8, b: 0xdecd98, line: 0xc9b87e },
  asphalt: { a: 0x6b7280, b: 0x646b78, line: 0x4b5563 },
};

/** The four ground corners of a rectangle `length` x `width` centred at `c`, turned by `angle`. */
function rectCorners(c: Vec2, angle: number, length: number, width: number): Vec2[] {
  const u = { x: Math.cos(angle) * length / 2, y: Math.sin(angle) * length / 2 };
  const v = { x: -Math.sin(angle) * width / 2, y: Math.cos(angle) * width / 2 };
  return [
    { x: c.x - u.x - v.x, y: c.y - u.y - v.y },
    { x: c.x + u.x - v.x, y: c.y + u.y - v.y },
    { x: c.x + u.x + v.x, y: c.y + u.y + v.y },
    { x: c.x - u.x + v.x, y: c.y - u.y + v.y },
  ].map((p) => p);
}

/** Paints a strip of floor along a route leg, with a pattern of lines that reads as the surface; `gap` leaves a lane in the middle untouched. */
export function drawGroundPatch(g: Phaser.GameObjects.Graphics, patch: GroundPatch, gap = 0): void {
  const dx = patch.to.x - patch.from.x;
  const dy = patch.to.y - patch.from.y;
  if (Math.hypot(dx, dy) === 0) return;
  if (gap > 0 && gap < patch.halfWidth) {
    drawGroundBand(g, patch, -patch.halfWidth, -gap);
    drawGroundBand(g, patch, gap, patch.halfWidth);
  } else {
    drawGroundBand(g, patch, -patch.halfWidth, patch.halfWidth);
  }
}

/** One band of a patch, from `side0` to `side1` meters to the left of the path (negative: to the right). */
function drawGroundBand(g: Phaser.GameObjects.Graphics, patch: GroundPatch, side0: number, side1: number): void {
  const style = SURFACE_STYLE[patch.surface];
  const dx = patch.to.x - patch.from.x;
  const dy = patch.to.y - patch.from.y;
  const len = Math.hypot(dx, dy);
  const dir = { x: dx / len, y: dy / len };
  const perp = { x: -dir.y, y: dir.x };
  const point = (along: number, side: number): Vec2 => project({ x: patch.from.x + dir.x * along + perp.x * side, y: patch.from.y + dir.y * along + perp.y * side });
  g.fillStyle(style.a).fillPoints([point(0, side0), point(len, side0), point(len, side1), point(0, side1)], true);
  const cell = patch.surface === 'wood' ? 0.5 : patch.surface === 'cobble' ? 0.6 : 1;
  const across = side1 - side0;
  const cells = Math.max(1, Math.round(across / cell));
  g.lineStyle(1, style.line, 0.55);
  const lined = patch.surface === 'tile' || patch.surface === 'wood' || patch.surface === 'paving' || patch.surface === 'cobble';
  for (let k = 0; lined && k <= cells; k++) {
    const side = side0 + (k / cells) * across;
    const a = point(0, side);
    const b = point(len, side);
    g.lineBetween(a.x, a.y, b.x, b.y);
    if (k < cells && patch.surface !== 'wood') {
      for (let along = 0; along <= len; along += patch.surface === 'cobble' ? 0.6 : 1.4) {
        const p = point(along, side);
        const q = point(along, side + across / cells);
        g.lineBetween(p.x, p.y, q.x, q.y);
      }
    }
  }
  if (patch.surface === 'grass' || patch.surface === 'dirt' || patch.surface === 'sand') {
    // scattered flecks, from the patch geometry so the same Stage always looks the same
    g.fillStyle(style.b, 0.9);
    for (let along = 0.3; along < len; along += 0.9) {
      const side = side0 + (Math.sin(along * 12.9898 + patch.from.x * 78.233 + patch.from.y) * 0.5 + 0.5) * across;
      const p = point(along, side);
      g.fillEllipse(p.x, p.y, 7, 3.5);
    }
  }
}

/** Paints a small flat decoration lying on the floor. */
export function drawDecor(g: Phaser.GameObjects.Graphics, decor: GroundDecor): void {
  const quad = rectCorners(decor.pos, decor.angle, decor.size.x, decor.size.y).map((p) => project(p));
  const c = project(decor.pos);
  switch (decor.kind) {
    case 'rug':
      g.fillStyle(0x7c3aed, 0.9).fillPoints(quad, true);
      g.lineStyle(2, 0xfcd34d, 0.9).strokePoints(quad, true);
      g.fillStyle(0xa78bfa, 0.9).fillPoints(rectCorners(decor.pos, decor.angle, decor.size.x * 0.6, decor.size.y * 0.55).map((p) => project(p)), true);
      break;
    case 'puddle':
      g.fillStyle(0x7dd3fc, 0.55).fillEllipse(c.x, c.y, decor.size.x * 36, decor.size.y * 18);
      break;
    case 'flower_patch':
      g.fillStyle(0x16a34a, 0.9).fillEllipse(c.x, c.y, decor.size.x * 30, decor.size.y * 15);
      for (const [dx, dy, color] of [[-9, -2, 0xf472b6], [0, 2, 0xfacc15], [9, -1, 0xf87171], [4, -4, 0xffffff]] as const) g.fillStyle(color).fillCircle(c.x + dx, c.y + dy, 2.5);
      break;
    case 'painted_line':
      g.fillStyle(0xf8fafc, 0.85).fillPoints(quad, true);
      break;
  }
}

/** Ground tile bounds in tile units covering the route, the walls and the scenery plus a margin. */
export function groundBounds(points: readonly Vec2[], tileMeters: number, margin: number): { i0: number; i1: number; j0: number; j1: number } {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    i0: Math.floor((Math.min(...xs) - margin) / tileMeters),
    i1: Math.ceil((Math.max(...xs) + margin) / tileMeters),
    j0: Math.floor((Math.min(...ys) - margin) / tileMeters),
    j1: Math.ceil((Math.max(...ys) + margin) / tileMeters),
  };
}

/** The raised box of a wall segment: ground edge and top edge as screen points. */
export function wallQuad(from: Vec2, to: Vec2, height: number): [Vec2, Vec2, Vec2, Vec2] {
  return [project(from), project(to), project(to, height), project(from, height)];
}
