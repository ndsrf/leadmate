import { es } from '../../i18n';
import { NODES } from '../nodes/content';
import { connector, labelOnRight, labelWidth, NODE_SIZE, nodeCenterX, ROW_HEIGHT } from './mapLayout';
import { theme } from './theme';

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
});
