import { classifyTension, leashCurve, leashPath, leashPoint, tensionRatio } from './leash';

describe('Tension Ratio', () => {
  it('is distance over maximum leash length', () => {
    expect(tensionRatio({ x: 0, y: 0 }, { x: 1.5, y: 0 }, 2)).toBeCloseTo(0.75);
    expect(tensionRatio({ x: 0, y: 0 }, { x: 0, y: 3 }, 2)).toBeCloseTo(1.5);
  });
});

describe('tension state', () => {
  it.each([
    [0, 'slack'],
    [0.5, 'slack'],
    [0.8499, 'slack'],
    [0.85, 'taut'],
    [0.9, 'taut'],
    [1.0, 'taut'],
    [1.0001, 'rigid'],
    [1.5, 'rigid'],
  ])('ratio %p is %s', (ratio, state) => {
    expect(classifyTension(ratio)).toBe(state);
  });
});

describe('leash curve', () => {
  const handler = { x: 0, y: 0 };

  it('connects Handler hand and Dog collar', () => {
    const curve = leashCurve(handler, { x: 1, y: 0 }, 2);
    expect(leashPoint(curve, 0)).toEqual(curve.start);
    expect(leashPoint(curve, 1)).toEqual(curve.end);
    expect(curve.start).toMatchObject({ x: 0, y: 0 });
    expect(curve.end).toMatchObject({ x: 1, y: 0 });
  });

  it('sags below the straight line when there is slack', () => {
    const curve = leashCurve(handler, { x: 1, y: 0 }, 2);
    const straightMid = (curve.start.z + curve.end.z) / 2;
    expect(leashPoint(curve, 0.5).z).toBeLessThan(straightMid);
  });

  it('sags more with more slack and flattens at full extension', () => {
    const mid = (d: number) => {
      const c = leashCurve(handler, { x: d, y: 0 }, 2);
      return leashPoint(c, 0.5).z - (c.start.z + c.end.z) / 2;
    };
    expect(mid(1)).toBeLessThan(mid(1.5));
    expect(mid(2)).toBeCloseTo(0);
    expect(mid(2.1)).toBeCloseTo(0);
  });
});

describe('leash around wall corners', () => {
  const corner = [{ from: { x: 3, y: 0 }, to: { x: 3, y: 20 } }];

  it('is the straight distance without a wall in the way', () => {
    expect(tensionRatio({ x: 0, y: 5 }, { x: 2, y: 5 }, 4, corner)).toBeCloseTo(0.5);
    expect(tensionRatio({ x: 0, y: 5 }, { x: 2, y: 5 }, 4)).toBeCloseTo(0.5);
  });

  it('wraps around the corner vertex: the segments add up', () => {
    const handler = { x: 1, y: 2 };
    const dog = { x: 5, y: 2 };
    const path = leashPath(handler, dog, corner);
    expect(path.points).toEqual([handler, { x: 3, y: 0 }, dog]);
    expect(path.length).toBeCloseTo(2 * Math.hypot(2, 2));
    expect(tensionRatio(handler, dog, 10, corner)).toBeCloseTo((2 * Math.hypot(2, 2)) / 10);
  });

  it('never goes straight through the wall: wrapped length exceeds the clipped line', () => {
    const handler = { x: 1, y: 2 };
    const dog = { x: 5, y: 2 };
    expect(tensionRatio(handler, dog, 10, corner)).toBeGreaterThan(tensionRatio(handler, dog, 10));
  });

  it('wraps around two corners of a doorway', () => {
    const door = [
      { from: { x: 3, y: -10 }, to: { x: 3, y: -1 } },
      { from: { x: 3, y: 1 }, to: { x: 3, y: 10 } },
    ];
    const through = leashPath({ x: 1, y: 8 }, { x: 5, y: 8 }, door);
    expect(through.points.length).toBeGreaterThan(2);
    expect(through.length).toBeGreaterThan(4);
    // a straight line through the gap is not wrapped
    expect(leashPath({ x: 1, y: 0 }, { x: 5, y: 0 }, door).points).toHaveLength(2);
  });
});
