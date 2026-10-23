import { coachMarks, edgeArrow, LABEL_MAX_WIDTH, type Rect } from './coach';
import type { Point } from './layout';
import { hudLayout, MARKER_RADIUS } from './layout';
import { withDogName } from '../shell/onboarding/intro';
import { es } from '../i18n/es';

/** True when the rectangle and the circle share any area. */
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function rectHitsCircle(rect: Rect, center: Point, radius: number): boolean {
  const nx = clamp(center.x, rect.x, rect.x + rect.width);
  const ny = clamp(center.y, rect.y, rect.y + rect.height);
  return Math.hypot(center.x - nx, center.y - ny) < radius;
}

const SIZES: [number, number][] = [
  [640, 360],
  [360, 640],
  [800, 400],
  [1024, 768],
  [320, 568],
  [1280, 720],
];

describe.each(SIZES)('Coach marks at %i x %i', (w, h) => {
  const { move, mark } = coachMarks(w, h);
  const { joyHome, markerHome } = hudLayout(w, h);

  it('keep their labels on screen', () => {
    for (const m of [move, mark]) {
      expect(m.label.x).toBeGreaterThanOrEqual(0);
      expect(m.label.y).toBeGreaterThanOrEqual(0);
      expect(m.label.x + m.label.width).toBeLessThanOrEqual(w);
      expect(m.label.y + m.label.height).toBeLessThanOrEqual(h);
      expect(m.label.width).toBeLessThanOrEqual(LABEL_MAX_WIDTH);
    }
  });

  it('point at the real controls', () => {
    expect(move.tip.x).toBe(joyHome.x);
    expect(move.tip.y).toBeLessThan(joyHome.y);
    expect(mark.tip.y).toBe(markerHome.y);
    expect(mark.tip.x).toBeLessThan(markerHome.x - MARKER_RADIUS);
  });

  it('never cover the Marker button', () => {
    expect(rectHitsCircle(mark.label, markerHome, MARKER_RADIUS)).toBe(false);
    expect(rectHitsCircle(move.label, markerHome, MARKER_RADIUS)).toBe(false);
  });
});

describe('approaching dog warning', () => {
  it('puts the edge arrow on the side the dog comes from', () => {
    const right = edgeArrow(640, 360, 0);
    expect(right.position.x).toBeGreaterThan(320);
    expect(right.position.y).toBeCloseTo(180);
    const up = edgeArrow(640, 360, -Math.PI / 2);
    expect(up.position.y).toBeLessThan(180);
    expect(up.position.x).toBeCloseTo(320);
  });

  it('keeps the arrow inside the screen at any bearing', () => {
    for (let a = -Math.PI; a <= Math.PI; a += 0.3) {
      const { position } = edgeArrow(640, 360, a);
      expect(position.x).toBeGreaterThanOrEqual(0);
      expect(position.x).toBeLessThanOrEqual(640);
      expect(position.y).toBeGreaterThanOrEqual(0);
      expect(position.y).toBeLessThanOrEqual(360);
    }
  });

  it('names the Dog, or falls back to the neutral text', () => {
    expect(withDogName(es['coach.dog.warning'], 'Luna', es['dog.neutral'])).toContain('Luna');
    const neutral = withDogName(es['coach.dog.warning'], '', es['dog.neutral']);
    expect(neutral).toContain(es['dog.neutral']);
    expect(neutral).not.toContain('{name}');
  });
});
