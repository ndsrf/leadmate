import { classifyTension, leashCurve, leashPoint, tensionRatio } from './leash';

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
