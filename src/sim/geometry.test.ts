import { closestOnSegment, hasLineOfSight, resolveWalls, segmentsCross, BODY_RADIUS } from './geometry';

const wall = { from: { x: 5, y: -10 }, to: { x: 5, y: 10 } };

describe('segments', () => {
  it('crosses strictly inside both', () => {
    expect(segmentsCross({ x: 0, y: 0 }, { x: 10, y: 0 }, wall.from, wall.to)).toBe(true);
    expect(segmentsCross({ x: 0, y: 0 }, { x: 4, y: 0 }, wall.from, wall.to)).toBe(false);
  });

  it('does not count touching an endpoint', () => {
    expect(segmentsCross({ x: 0, y: 10 }, { x: 10, y: 10 }, wall.from, wall.to)).toBe(false);
  });

  it('finds the closest point on a segment, clamped to its ends', () => {
    expect(closestOnSegment({ x: 0, y: 3 }, wall.from, wall.to)).toEqual({ x: 5, y: 3 });
    expect(closestOnSegment({ x: 0, y: 30 }, wall.from, wall.to)).toEqual(wall.to);
  });
});

describe('wall collision', () => {
  it('pushes a body out along the wall normal and leaves the sliding component alone', () => {
    const p = resolveWalls({ x: 4.9, y: 3 }, [wall]);
    expect(p.x).toBeCloseTo(5 - BODY_RADIUS);
    expect(p.y).toBeCloseTo(3);
  });

  it('leaves a body that is clear of the wall where it is', () => {
    expect(resolveWalls({ x: 2, y: 0 }, [wall])).toEqual({ x: 2, y: 0 });
  });

  it('keeps a body in a corner between two walls outside both', () => {
    const walls = [wall, { from: { x: -10, y: 5 }, to: { x: 10, y: 5 } }];
    const p = resolveWalls({ x: 4.95, y: 4.95 }, walls);
    for (const w of walls) {
      expect(Math.hypot(p.x - closestOnSegment(p, w.from, w.to).x, p.y - closestOnSegment(p, w.from, w.to).y)).toBeGreaterThanOrEqual(BODY_RADIUS - 1e-6);
    }
  });
});

describe('line of sight', () => {
  const car = { type: 'parked_car', pos: { x: 2, y: 0 }, visualShield: true };
  const bush = { type: 'bush', pos: { x: 2, y: 0 } };

  it('is clear in the open', () => expect(hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 }, [], [bush])).toBe(true));
  it('is blocked by a wall', () => expect(hasLineOfSight({ x: 0, y: 0 }, { x: 8, y: 0 }, [wall])).toBe(false));
  it('is blocked by a visual shield', () => expect(hasLineOfSight({ x: 0, y: 0 }, { x: 4, y: 0 }, [], [car])).toBe(false));
  it('passes beside a visual shield', () => expect(hasLineOfSight({ x: 0, y: 4 }, { x: 4, y: 4 }, [], [car])).toBe(true));
});
