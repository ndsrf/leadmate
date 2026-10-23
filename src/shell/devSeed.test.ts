import { newDogRecord, RECORD_KEY } from './dogRecord';
import { devSeedRecord, withDevSeed } from './devSeed';
import { lessonDay } from './lessons/lesson';

const now = new Date(2026, 5, 20, 15);

describe('devSeedRecord', () => {
  it('ignores addresses without the seed', () => {
    expect(devSeedRecord('', now)).toBeNull();
    expect(devSeedRecord('?seed=other', now)).toBeNull();
  });

  it('opens a finished Dog on Day 3 by default, or the requested day', () => {
    const r = devSeedRecord('?seed=lessons', now)!;
    expect(r.onboarding.step).toBe('done');
    expect(lessonDay(r, now)).toBe(3);
    expect(lessonDay(devSeedRecord('?seed=lessons&day=1', now)!, now)).toBe(1);
    expect(lessonDay(devSeedRecord('?seed=lessons&day=5', now)!, now)).toBe(5);
  });
});

describe('withDevSeed', () => {
  it('answers the first record read with the seed, then reads the store', async () => {
    const data: Record<string, string> = { [RECORD_KEY]: JSON.stringify({ name: 'stored' }) };
    const store = { getItem: async (k: string) => data[k] ?? null, setItem: async (k: string, v: string) => void (data[k] = v) };
    const seeded = withDevSeed(store, newDogRecord());
    expect(JSON.parse((await seeded.getItem(RECORD_KEY))!).name).toBe('');
    expect(JSON.parse((await seeded.getItem(RECORD_KEY))!).name).toBe('stored');
  });

  it('is the plain store without a seed', () => {
    const store = { getItem: async () => null, setItem: async () => {} };
    expect(withDevSeed(store, null)).toBe(store);
  });
});
