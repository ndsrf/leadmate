import { coachMarks } from './coach';
import {
  bannerLayout,
  controlZones,
  feedbackMessagePosition,
  hudLayout,
  portraitSlot,
  stageMetersLayout,
  type Rect,
} from './layout';

function intersects(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

describe('stageMetersLayout (Task 3.3)', () => {
  const screens = [
    { name: '320 points', width: 320, height: 568 },
    { name: '375 points', width: 375, height: 667 },
    { name: '768 points', width: 768, height: 1024 },
  ];

  const meters = [{ id: 'nose' }, { id: 'connection' }];

  it.each(screens)('keeps Stage Meters on screen for $name', ({ width, height }) => {
    const layouts = stageMetersLayout(width, height, meters);
    expect(layouts).toHaveLength(2);
    for (const m of layouts) {
      expect(m.x).toBeGreaterThanOrEqual(8);
      expect(m.y).toBeGreaterThanOrEqual(8);
      expect(m.x + m.width).toBeLessThanOrEqual(width - 8);
      expect(m.y + m.height).toBeLessThanOrEqual(height - 8);
    }
  });

  it.each(screens)('never overlaps controls at $name', ({ width, height }) => {
    const layouts = stageMetersLayout(width, height, meters);
    const zones = controlZones(width, height, ['lets-go', 'leave-it']);
    for (const m of layouts) {
      const meterRect: Rect = { x: m.x, y: m.y, width: m.width, height: m.height };
      for (const z of zones) {
        expect(intersects(meterRect, z)).toBe(false);
      }
    }
  });

  it.each(screens)('never overlaps Coach marks at $name', ({ width, height }) => {
    const layouts = stageMetersLayout(width, height, meters);
    const marks = coachMarks(width, height, ['lets-go', 'leave-it']);
    for (const m of layouts) {
      const meterRect: Rect = { x: m.x, y: m.y, width: m.width, height: m.height };
      expect(intersects(meterRect, marks.move.label)).toBe(false);
      expect(intersects(meterRect, marks.mark.label)).toBe(false);
    }
  });

  it.each(screens)('never overlaps the Dog portrait slot at $name', ({ width, height }) => {
    const layouts = stageMetersLayout(width, height, meters);
    const portrait = portraitSlot(width, height);
    for (const m of layouts) {
      const meterRect: Rect = { x: m.x, y: m.y, width: m.width, height: m.height };
      expect(intersects(meterRect, portrait)).toBe(false);
    }
  });

  it('handles a single meter', () => {
    const layouts = stageMetersLayout(375, 667, [{ id: 'nose' }]);
    expect(layouts).toHaveLength(1);
    expect(layouts[0].id).toBe('nose');
  });

  it('handles empty meters', () => {
    const layouts = stageMetersLayout(375, 667, []);
    expect(layouts).toHaveLength(0);
  });
});

describe('feedbackMessagePosition & controlZones (Task 3.2)', () => {
  it('places message above dog when clear of controls', () => {
    const pos = feedbackMessagePosition({ x: 200, y: 300 }, 400, 700);
    expect(pos.x).toBe(200);
    expect(pos.y).toBeLessThan(300);
  });

  it('pushes message away if dog is inside a control zone', () => {
    const { markerHome } = hudLayout(400, 700);
    const pos = feedbackMessagePosition(markerHome, 400, 700, ['lets-go']);
    const zones = controlZones(400, 700, ['lets-go']);
    const msgRect: Rect = { x: pos.x - 50, y: pos.y - 15, width: 100, height: 30 };
    for (const z of zones) {
      expect(intersects(msgRect, z)).toBe(false);
    }
  });

  it('keeps banner under top safe area', () => {
    const b = bannerLayout(400, 700);
    expect(b.x).toBe(200);
    expect(b.y).toBeGreaterThanOrEqual(16);
    expect(b.y).toBeLessThan(120);
    expect(b.width).toBeGreaterThan(0);
  });
});
