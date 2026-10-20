import { migrateRecord } from '../dogRecord';
import { withPull } from '../nodes/scenarios';
import { isDogKg, isHandlerKg, parseKg, pullFromWeights, PULL_TUNING } from './weights';

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
