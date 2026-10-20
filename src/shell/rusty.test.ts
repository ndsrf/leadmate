import { defaultScenario } from '../sim/config';
import { runScripted } from '../sim/harness';
import { toSnapshot, newDogRecord } from './dogRecord';
import { isRusty, RUSTY_CAPACITY, sessionCapacity, WARMUP_SECONDS, warmupScenario } from './rusty';
import { resolveDog } from '../sim/learning';

const now = new Date('2026-06-10T12:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

describe('Rusty Dog', () => {
  it('needs a gap of 3 days', () => {
    expect(isRusty(daysAgo(2.9), now)).toBe(false);
    expect(isRusty(daysAgo(3), now)).toBe(true);
    expect(isRusty(daysAgo(30), now)).toBe(true);
  });

  it('is not rusty before the first Stage', () => {
    expect(isRusty(null, now)).toBe(false);
  });

  it('keeps full capacity after a completed warm-up, with no gap, or when not offered', () => {
    expect(sessionCapacity(true, 'completed')).toBe(1);
    expect(sessionCapacity(false, 'none')).toBe(1);
    expect(sessionCapacity(false, 'skipped')).toBe(1);
  });

  it('lowers capacity for the session only when the warm-up is skipped', () => {
    expect(sessionCapacity(true, 'skipped')).toBe(RUSTY_CAPACITY);
    const record = newDogRecord();
    const before = JSON.stringify(record);
    const snapshot = toSnapshot(record, sessionCapacity(true, 'skipped'));
    expect(JSON.stringify(record)).toBe(before);
    const full = resolveDog(toSnapshot({ ...record, attributes: { ...record.attributes, followChance: 0.8 } }, 1));
    const rusty = resolveDog({ ...snapshot, attributes: { ...snapshot.attributes, followChance: 0.8 } });
    expect(rusty.followChance).toBeLessThan(full.followChance);
  });

  it('runs an easy, ungraded 30-45 s walk with nothing to react to', () => {
    expect(WARMUP_SECONDS).toBeGreaterThanOrEqual(30);
    expect(WARMUP_SECONDS).toBeLessThanOrEqual(45);
    const stage = runScripted(1, () => ({ direction: { x: 1, y: 0 }, strength: 0.6, marker: false }), warmupScenario(defaultScenario));
    expect(stage.payload.peakArousalScore).toBe(0);
    expect(stage.payload.durationSeconds).toBeCloseTo(WARMUP_SECONDS, 0);
    expect(stage.payload.markBudget).toBe(0);
  });
});
