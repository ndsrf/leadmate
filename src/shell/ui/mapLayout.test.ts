import { es } from '../../i18n';
import { NODES } from '../nodes/content';
import { connector, connectorVisual, KIND_GLYPH, labelOnRight, labelWidth, NODE_SIZE, nodeCenterX, nodeVisual, ROW_HEIGHT, rowExtent, stretchFlag } from './mapLayout';
import { mapModel } from '../mapModel';
import { progressOf } from '../world';
import { lightColor, theme } from './theme';

describe('World Map layout', () => {
  it('zig-zags and repeats', () => {
    expect([0, 1, 2, 3, 4].map((i) => nodeCenterX(i, 100))).toEqual([20, 45, 80, 45, 20]);
  });

  it('keeps every Node and a readable label inside a 320-point screen', () => {
    const width = 320 - 32;
    for (let i = 0; i < 8; i++) {
      const cx = nodeCenterX(i, width);
      expect(cx - NODE_SIZE / 2).toBeGreaterThanOrEqual(0);
      expect(cx + NODE_SIZE / 2).toBeLessThanOrEqual(width);
      expect(labelWidth(i, width)).toBeGreaterThanOrEqual(96);
    }
  });

  it('puts the label on the side with room', () => {
    expect(labelOnRight(0)).toBe(true);
    expect(labelOnRight(2)).toBe(false);
  });

  it('draws a straight connector for equal columns and a slanted one otherwise', () => {
    expect(connector(1, 300).angle).toBeLessThan(0); // 0.5 -> 0.8: runs down and to the right
    const c = connector(3, 300); // 0.5 -> 0.2: leans left going down
    expect(c.length).toBeGreaterThan(ROW_HEIGHT);
    expect(c.angle).toBeGreaterThan(0);
  });

  it('distinguishes solid completed trail from dashed upcoming trail', () => {
    expect(connectorVisual(lightColor, 'done', 'done').kind).toBe('solid');
    expect(connectorVisual(lightColor, 'done', 'next').kind).toBe('dashed');
    expect(connectorVisual(lightColor, 'next', 'open').kind).toBe('dashed');
    expect(connectorVisual(lightColor, 'locked', 'locked').kind).toBe('dashed');
  });

  it('gives next-up node an attention ring and enlarged scale', () => {
    const next = nodeVisual(lightColor, 'next');
    expect(next.ring).toBe(true);
    expect(next.scale).toBeGreaterThan(1);
    expect(next.glyph).toBe('paw');

    const open = nodeVisual(lightColor, 'open');
    expect(open.ring).toBe(false);
    expect(open.scale).toBe(1);
    expect(open.glyph).toBe('paw');

    const done = nodeVisual(lightColor, 'done');
    expect(done.glyph).toBe('check');
  });

  it('gives Nodes a touch target of at least 44 points', () => {
    expect(NODE_SIZE).toBeGreaterThanOrEqual(theme.size.touchMin);
  });

  it('lets a Node title 40 percent longer than Spanish wrap inside its row at 320 points', () => {
    const CHAR = 7.5; // average glyph width at 14 points
    const LINE = 20;
    const width = 320 - 32;
    for (const node of NODES) {
      const chars = Math.ceil(es[node.title].length * 1.4);
      for (let i = 0; i < 4; i++) {
        const lines = Math.ceil((chars * CHAR) / labelWidth(i, width));
        expect({ node: node.id, fits: lines * LINE <= ROW_HEIGHT }).toEqual({ node: node.id, fits: true });
      }
    }
  });

  it('draws each Stop kind with its own glyph when open or next-up', () => {
    expect(KIND_GLYPH).toEqual({ theory: 'book', 'how-to-play': 'controller', node: 'paw', mission: 'flag' });
    for (const kind of ['theory', 'how-to-play', 'node', 'mission'] as const) {
      expect(nodeVisual(lightColor, 'open', kind).glyph).toBe(KIND_GLYPH[kind]);
      expect(nodeVisual(lightColor, 'next', kind).glyph).toBe(KIND_GLYPH[kind]);
    }
    expect(new Set(Object.values(KIND_GLYPH)).size).toBe(4);
  });

  it('draws a waiting Mission with a moon, and an optional Lesson with a dashed edge', () => {
    expect(nodeVisual(lightColor, 'waiting', 'mission')).toMatchObject({ glyph: 'moon', ring: false });
    expect(nodeVisual(lightColor, 'owed', 'mission')).toMatchObject({ glyph: 'hourglass', ring: false });
    expect(nodeVisual(lightColor, 'open', 'theory', true).dashed).toBe(true);
    expect(nodeVisual(lightColor, 'open', 'theory').dashed).toBe(false);
  });

  it('flags the end of each Stretch at its Mission with "Tramo N"', () => {
    const stops = mapModel(progressOf([]), {}, new Date(2026, 4, 2)).worlds[0].stops;
    expect(stops.map((s) => stretchFlag(s.kind, s.stretch)?.label ?? null)).toEqual([null, null, null, 1, null, null, 2, null, null, 3]);
  });

  it('lays out a World of 12 Stops without overlap, within a 320-point screen', () => {
    const width = 320 - 32;
    for (let i = 0; i < 12; i++) {
      const cx = nodeCenterX(i, width);
      expect(cx - (NODE_SIZE * 1.08) / 2).toBeGreaterThanOrEqual(0);
      expect(cx + (NODE_SIZE * 1.08) / 2).toBeLessThanOrEqual(width);
      if (i > 0) expect(rowExtent(i).top).toBeGreaterThanOrEqual(rowExtent(i - 1).bottom);
    }
    expect(12 * ROW_HEIGHT).toBe(rowExtent(11).top + ROW_HEIGHT);
  });
});
