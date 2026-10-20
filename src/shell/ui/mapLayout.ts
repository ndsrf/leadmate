import { color } from './theme';

/** Geometry of the World Map path: pure, so the zig-zag and its connectors are testable without rendering. */
export const NODE_SIZE = 64;
export const ROW_HEIGHT = 104;
/** Horizontal centre of each Node as a share of the column width, repeating down the path. */
export const ZIG_ZAG = [0.2, 0.45, 0.8, 0.45] as const;

export function nodeCenterX(index: number, width: number): number {
  return ZIG_ZAG[index % ZIG_ZAG.length] * width;
}

/** Whether the label sits right of the Node (true) or left of it, always on the side with room. */
export function labelOnRight(index: number): boolean {
  return ZIG_ZAG[index % ZIG_ZAG.length] <= 0.5;
}

/** Horizontal room a label gets beside its Node at this column width. */
export function labelWidth(index: number, width: number): number {
  const cx = nodeCenterX(index, width);
  const gap = 12;
  return Math.max(0, labelOnRight(index) ? width - (cx + NODE_SIZE / 2 + gap) : cx - NODE_SIZE / 2 - gap);
}

export interface Segment {
  left: number;
  top: number;
  length: number;
  /** Rotation in degrees, clockwise, of a vertical bar. */
  angle: number;
}

/** The line joining the centre of Node `index` to the centre of the next one (drawn inside row `index`). */
export function connector(index: number, width: number): Segment {
  const x1 = nodeCenterX(index, width);
  const x2 = nodeCenterX(index + 1, width);
  const dx = x2 - x1;
  const dy = ROW_HEIGHT;
  const length = Math.hypot(dx, dy);
  return { left: (x1 + x2) / 2, top: NODE_SIZE / 2 + dy / 2, length, angle: (Math.atan2(-dx, dy) * 180) / Math.PI };
}

export type NodeGlyph = 'check' | 'number' | 'lock';

export interface NodeVisual {
  fill: string;
  edge: string;
  ink: string;
  /** What is drawn on the disc: colour is never the only cue for a state. */
  glyph: NodeGlyph;
  /** Only the next-up Node carries the attention ring (and the Dog). */
  ring: boolean;
}

export function nodeVisual(state: 'locked' | 'open' | 'next' | 'done'): NodeVisual {
  switch (state) {
    case 'done':
      return { fill: color.brand, edge: color.brandEdge, ink: color.onBrand, glyph: 'check', ring: false };
    case 'next':
      return { fill: color.accent, edge: color.accentEdge, ink: color.onAccent, glyph: 'number', ring: true };
    case 'open':
      return { fill: color.info, edge: color.infoEdge, ink: color.onInfo, glyph: 'number', ring: false };
    default:
      return { fill: color.locked, edge: color.quietEdge, ink: color.onLocked, glyph: 'lock', ring: false };
  }
}
