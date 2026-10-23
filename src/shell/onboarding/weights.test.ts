import { migrateRecord } from '../dogRecord';
import { withPull } from '../nodes/scenarios';
import { DOG_KG_RANGE, fractionToKg, isDogKg, isHandlerKg, kgFromText, kgText, kgToFraction, parseKg, pullFromWeights, PULL_TUNING, stepKg } from './weights';

describe('pullFromWeights', () => {
  it('reproduces 0.8 for a 70 kg Handler and a 20 kg Dog', () => {
    expect(pullFromWeights(20, 70)).toBeCloseTo(0.8);
  });

  it('is lower for a heavier Dog', () => {
    expect(pullFromWeights(40, 70)).toBeLessThan(pullFromWeights(20, 70));
  });

  it('is higher for a heavier Handler', () => {
    expect(pullFromWeights(20, 90)).toBeGreaterThan(pullFromWeights(20, 60));
  });

  it('clamps at both ends', () => {
    expect(pullFromWeights(80, 30)).toBe(PULL_TUNING.min);
    expect(pullFromWeights(1, 200)).toBe(PULL_TUNING.max);
  });

  it('uses the default when a weight is missing or out of range', () => {
    expect(pullFromWeights(null, null)).toBe(0.8);
    expect(pullFromWeights(20, null)).toBe(0.8);
    expect(pullFromWeights(200, 70)).toBe(0.8);
  });
});

describe('weight validation', () => {
  it('accepts plausible values and rejects the rest', () => {
    expect(isDogKg(20)).toBe(true);
    expect(isDogKg(200)).toBe(false);
    expect(isDogKg(0.5)).toBe(false);
    expect(isHandlerKg(70)).toBe(true);
    expect(isHandlerKg(20)).toBe(false);
    expect(isHandlerKg(NaN)).toBe(false);
  });

  it('parses typed text', () => {
    expect(parseKg('22,5')).toBe(22.5);
    expect(parseKg(' 70 ')).toBe(70);
    expect(parseKg('')).toBeNull();
    expect(parseKg('abc')).toBeNull();
  });
});

describe('withPull', () => {
  it('carries the pullStrength derived from the record weights into the scenario', () => {
    const heavy = withPull({ leashLength: 3 }, { dogKg: 40, handlerKg: 70 });
    expect(heavy.pullStrength).toBeCloseTo(pullFromWeights(40, 70));
    expect(heavy.leashLength).toBe(3);
  });

  it('keeps 0.8 for a record without weights, such as a migrated version 2 record', () => {
    expect(withPull({}, migrateRecord({ version: 2 }).weights).pullStrength).toBe(0.8);
  });
});

describe('weight slider math', () => {
  const dog = DOG_KG_RANGE;

  it('maps a weight to a fraction of the track and back', () => {
    expect(kgToFraction(1, dog)).toBe(0);
    expect(kgToFraction(80, dog)).toBe(1);
    expect(fractionToKg(kgToFraction(12, dog), dog)).toBe(12);
    expect(fractionToKg(0.5, dog)).toBe(41);
  });

  it('pins to the ends and ignores nonsense', () => {
    expect(kgToFraction(500, dog)).toBe(1);
    expect(kgToFraction(-4, dog)).toBe(0);
    expect(fractionToKg(2, dog)).toBe(80);
    expect(fractionToKg(-1, dog)).toBe(1);
    expect(fractionToKg(Number.NaN, dog)).toBe(1);
  });

  it('steps from the value, or from the start when empty, and stops at the ends', () => {
    expect(stepKg(12, 1, dog, 20)).toBe(13);
    expect(stepKg(12, -1, dog, 20)).toBe(11);
    expect(stepKg(null, 1, dog, 20)).toBe(21);
    expect(stepKg(80, 1, dog, 20)).toBe(80);
    expect(stepKg(1, -1, dog, 20)).toBe(1);
  });

  it('shows whole numbers without decimals', () => {
    expect(kgText(12)).toBe('12');
    expect(kgText(30.5)).toBe('30.5');
    expect(kgText(2.25)).toBe('2.3');
  });

  it('reads typed text only inside the range, so slider and field agree', () => {
    expect(kgFromText('12', dog)).toBe(12);
    expect(kgFromText('12,5', dog)).toBe(12.5);
    expect(kgFromText('200', dog)).toBeNull();
    expect(kgFromText('', dog)).toBeNull();
    expect(kgFromText('abc', dog)).toBeNull();
  });
});
