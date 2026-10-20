import type Phaser from 'phaser';
import type { SceneryItem, SceneryTheme } from '../../src/sim/geometry';
import { project } from '../../src/hud/iso';
import type { Vec2 } from '../../src/sim/vec';

/** Props drawn as Kenney textures; the rest are drawn from shapes below. */
export const TEXTURED: Record<string, readonly string[]> = {
  tree: ['treeShort', 'treeTall', 'treeAltShort', 'treeAltTall'],
  conifer: ['coniferShort', 'coniferTall'],
};

export const WALL_HEIGHT: Record<SceneryTheme, number> = { indoor_apartment: 2.2, quiet_suburb: 1.2, urban_street: 3, open_park: 0.8 };
export const WALL_COLORS: Record<SceneryTheme, { side: number; top: number }> = {
  indoor_apartment: { side: 0xcbd5e1, top: 0xf1f5f9 },
  quiet_suburb: { side: 0xa8a29e, top: 0xd6d3d1 },
  urban_street: { side: 0x94a3b8, top: 0xcbd5e1 },
  open_park: { side: 0x854d0e, top: 0xa16207 },
};

const rect = (g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) => g.fillStyle(color).fillRect(x, y, w, h);

/** Draws a prop with its base at the screen point `(x, y)`: simple isometric-ish shapes, decorative only. */
export function drawProp(g: Phaser.GameObjects.Graphics, item: SceneryItem, x: number, y: number): void {
  g.fillStyle(0x000000, 0.2).fillEllipse(x, y, 30, 14);
  switch (item.type) {
    case 'bush':
    case 'hedge':
      g.fillStyle(0x15803d).fillEllipse(x, y - 10, item.type === 'hedge' ? 48 : 30, 24);
      g.fillStyle(0x22c55e).fillEllipse(x - 4, y - 14, 22, 14);
      break;
    case 'bench':
      rect(g, x - 16, y - 12, 32, 5, 0x92400e);
      rect(g, x - 16, y - 20, 32, 4, 0xb45309);
      rect(g, x - 14, y - 7, 3, 7, 0x57534e);
      rect(g, x + 11, y - 7, 3, 7, 0x57534e);
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
    case 'mailbox':
      rect(g, x - 2, y - 24, 4, 24, 0x57534e);
      g.fillStyle(0x2563eb).fillRoundedRect(x - 9, y - 38, 18, 14, 4);
      break;
    case 'fence':
      for (let i = -3; i <= 3; i++) rect(g, x + i * 6 - 1, y - 18, 3, 18, 0xe7e5e4);
      rect(g, x - 20, y - 14, 40, 3, 0xd6d3d1);
      break;
    case 'parked_car': {
      g.fillStyle(0x000000, 0.2).fillEllipse(x, y, 70, 28);
      g.fillStyle(0xdc2626).fillRoundedRect(x - 34, y - 24, 68, 20, 6);
      g.fillStyle(0xfca5a5).fillRoundedRect(x - 18, y - 38, 34, 16, 5);
      g.fillStyle(0x1e293b).fillCircle(x - 20, y - 4, 6).fillCircle(x + 20, y - 4, 6);
      break;
    }
    case 'bus_stop':
      rect(g, x - 18, y - 52, 3, 52, 0x475569);
      rect(g, x + 15, y - 52, 3, 52, 0x475569);
      rect(g, x - 22, y - 56, 44, 5, 0x0ea5e9);
      break;
    case 'sign':
      rect(g, x - 1, y - 44, 3, 44, 0x64748b);
      g.fillStyle(0x16a34a).fillRoundedRect(x - 12, y - 56, 24, 14, 2);
      break;
    case 'hydrant':
      g.fillStyle(0xef4444).fillRoundedRect(x - 5, y - 18, 10, 18, 3);
      break;
    case 'bike_rack':
      for (let i = -2; i <= 2; i++) g.lineStyle(2, 0x64748b).strokeCircle(x + i * 7, y - 7, 6);
      break;
    case 'pond':
      g.fillStyle(0x38bdf8, 0.9).fillEllipse(x, y - 2, 90, 44);
      g.fillStyle(0x7dd3fc, 0.7).fillEllipse(x - 8, y - 5, 50, 20);
      break;
    case 'picnic_table':
      rect(g, x - 20, y - 18, 40, 5, 0xb45309);
      rect(g, x - 16, y - 13, 3, 13, 0x78350f);
      rect(g, x + 13, y - 13, 3, 13, 0x78350f);
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
      rect(g, x - 16, y - 14, 32, 14, 0x78350f);
      rect(g, x - 12, y - 18, 8, 4, 0x0f172a);
      rect(g, x + 2, y - 18, 8, 4, 0xdc2626);
      break;
    case 'plant':
      g.fillStyle(0xb45309).fillRoundedRect(x - 7, y - 12, 14, 12, 2);
      g.fillStyle(0x16a34a).fillEllipse(x, y - 22, 22, 22);
      break;
    case 'mat':
      g.fillStyle(0x7c3aed, 0.9).fillEllipse(x, y - 1, 40, 18);
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
      rect(g, x - 14, y - 36, 28, 36, 0xa16207);
      rect(g, x - 1, y - 30, 2, 24, 0x422006);
      break;
    default:
      rect(g, x - 8, y - 16, 16, 16, 0x94a3b8);
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
