import type { NodeState, StopKind } from '../mapModel';
import type { Palette } from './theme';

/** Geometry of the World Map path: pure, so the zig-zag and its connectors are testable without rendering. */
export const NODE_SIZE = 64;
export const ROW_HEIGHT = 104;
export const SATELLITE_SIZE = 40;
export const SATELLITE_OFFSET_X = 64;

/** Horizontal centre of each Node as a share of the column width, repeating down the path. */
export const ZIG_ZAG = [0.2, 0.45, 0.8, 0.45] as const;

export function nodeCenterX(index: number, width: number): number {
  return ZIG_ZAG[index % ZIG_ZAG.length] * width;
}

/** Horizontal centre of a Satellite Stop anchored to row `index`, placed on the side opposite the label. */
export function satelliteCenterX(index: number, width: number): number {
  const cx = nodeCenterX(index, width);
  const onRight = labelOnRight(index);
  const margin = SATELLITE_SIZE / 2 + 8;
  return onRight ? Math.max(margin, cx - SATELLITE_OFFSET_X) : Math.min(width - margin, cx + SATELLITE_OFFSET_X);
}

/** The connector segment between the parent node center and the satellite stop center. */
export function satelliteConnector(index: number, width: number): Segment {
  const x1 = nodeCenterX(index, width);
  const x2 = satelliteCenterX(index, width);
  const y = NODE_SIZE / 2;
  const dx = x2 - x1;
  const length = Math.abs(dx);
  return {
    left: (x1 + x2) / 2,
    top: y,
    length,
    angle: (Math.atan2(-dx, 0) * 180) / Math.PI,
  };
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
export function connector(index: number, width: number, dy = ROW_HEIGHT): Segment {
  const x1 = nodeCenterX(index, width);
  const x2 = nodeCenterX(index + 1, width);
  const dx = x2 - x1;
  const length = Math.hypot(dx, dy);
  return { left: (x1 + x2) / 2, top: NODE_SIZE / 2 + dy / 2, length, angle: (Math.atan2(-dx, dy) * 180) / Math.PI };
}

export type ConnectorKind = 'solid' | 'dashed';

export interface ConnectorVisual {
  kind: ConnectorKind;
  outerWidth: number;
  innerWidth: number;
  outerColor: string;
  innerColor: string;
}

/** Path styles distinguishing completed solid trails from upcoming dashed trails (Board 11). */
export function connectorVisual(color: Palette, fromState: NodeState, toState?: NodeState): ConnectorVisual {
  const isSolid = fromState === 'done' && toState === 'done';
  if (isSolid) {
    return {
      kind: 'solid',
      outerWidth: 14,
      innerWidth: 7,
      outerColor: color.outline,
      innerColor: color.brand,
    };
  }
  return {
    kind: 'dashed',
    outerWidth: 8,
    innerWidth: 4,
    outerColor: color.outline,
    innerColor: color.surface,
  };
}

/** The kind glyphs: a book for a theory Lesson, a controller for a How-to-play Lesson, a paw for a Node, a flag for a Mission. */
export type KindGlyph = 'book' | 'controller' | 'paw' | 'flag';
export type NodeGlyph = 'check' | 'lock' | 'moon' | 'hourglass' | KindGlyph;

export const KIND_GLYPH: Record<StopKind, KindGlyph> = { theory: 'book', 'how-to-play': 'controller', node: 'paw', mission: 'flag' };

export interface NodeVisual {
  fill: string;
  edge: string;
  ink: string;
  /** What is drawn on the disc: colour is never the only cue for a state, and an open Stop shows its kind. */
  glyph: NodeGlyph;
  /** Only the next-up Stop carries the attention ring (and the Dog). */
  ring: boolean;
  scale: number;
  /** A dashed edge: locked, or an optional Lesson. */
  dashed: boolean;
}

/** How a Stop's disc is drawn for its state and kind; a waiting Mission shows a moon instead of its flag, an owed one an hourglass. */
export function nodeVisual(color: Palette, state: NodeState, kind: StopKind = 'node', optional = false): NodeVisual {
  switch (state) {
    case 'done':
      return { fill: color.brand, edge: color.outline, ink: color.onBrand, glyph: 'check', ring: false, scale: 1, dashed: false };
    case 'next':
      return { fill: color.accent, edge: color.outline, ink: color.onAccent, glyph: KIND_GLYPH[kind], ring: true, scale: 1.08, dashed: false };
    case 'open':
      return { fill: color.surface, edge: color.outline, ink: color.ink, glyph: KIND_GLYPH[kind], ring: false, scale: 1, dashed: optional };
    case 'waiting':
      return { fill: color.surfaceSunken, edge: color.outline, ink: color.ink, glyph: 'moon', ring: false, scale: 1, dashed: false };
    case 'owed':
      return { fill: color.accentSoft, edge: color.outline, ink: color.ink, glyph: 'hourglass', ring: false, scale: 1, dashed: false };
    default:
      return { fill: color.locked, edge: color.lockedText, ink: color.lockedText, glyph: 'lock', ring: false, scale: 1, dashed: true };
  }
}

/** A Stretch flag marks a Mission Stop: "Tramo N" with the 1-based Stretch number. */
export function stretchFlag(kind: StopKind, stretch: number): { label: number } | null {
  return kind === 'mission' ? { label: stretch + 1 } : null;
}

export interface SatelliteVisual {
  fill: string;
  edge: string;
  ink: string;
  glyph: 'book';
  completed: boolean;
}

export function satelliteVisual(color: Palette, completed: boolean): SatelliteVisual {
  return {
    fill: completed ? color.accentSoft : color.surface,
    edge: color.outline,
    ink: color.ink,
    glyph: 'book',
    completed,
  };
}

/** The vertical extent of a Stop row, from its top to the bottom of its badge and Stretch flag; rows never overlap. */
export function rowExtent(index: number): { top: number; bottom: number } {
  return { top: index * ROW_HEIGHT, bottom: index * ROW_HEIGHT + NODE_SIZE * 1.08 + BADGE_HEIGHT };
}

/** Room under a Stop for its badge ("Siguiente", "¿Cómo fue?", the waiting time) and the Stretch flag. */
export const BADGE_HEIGHT = 20;

/** Height of a section header band on the World Map. */
export const SECTION_HEADER_HEIGHT = 44;

/**
 * The vertical offset of a Stop at `index`, given the starting indexes of each section.
 * Each section header shifts all Stops at or after its starting index down by `SECTION_HEADER_HEIGHT`.
 * With no sections, this is `index * ROW_HEIGHT`.
 */
export function stopYOffset(index: number, sectionStartIndexes: readonly number[] = []): number {
  const headersBefore = sectionStartIndexes.filter((startIndex) => startIndex <= index).length;
  return index * ROW_HEIGHT + headersBefore * SECTION_HEADER_HEIGHT;
}

/**
 * The vertical offset of a section header at `sectionIndex`, given the starting indexes of each section.
 */
export function sectionHeaderYOffset(sectionIndex: number, sectionStartIndexes: readonly number[] = []): number {
  const startIndex = sectionStartIndexes[sectionIndex] ?? 0;
  return startIndex * ROW_HEIGHT + sectionIndex * SECTION_HEADER_HEIGHT;
}
