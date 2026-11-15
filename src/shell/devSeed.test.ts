import { newDogRecord, RECORD_KEY } from './dogRecord';
import { devSeedRecord, withDevSeed, parseTargetWorld } from './devSeed';
import { lessonDay } from './lessons/lesson';
import { findWorld, isWorldComplete, isWorldUnlocked, stopLock, WORLDS } from './world';
import { isPlus } from './plus';

const now = new Date(2026, 5, 20, 15);

describe('devSeedRecord', () => {
  it('ignores addresses without the seed', () => {
    expect(devSeedRecord('', now)).toBeNull();
    expect(devSeedRecord('?seed=other', now)).toBeNull();
    expect(devSeedRecord('?seed=world0', now)).toBeNull();
    expect(devSeedRecord('?seed=world99', now)).toBeNull();
  });

  it('opens a finished Dog on Day 3 by default, or the requested day', () => {
    const r = devSeedRecord('?seed=lessons', now)!;
    expect(r.onboarding.step).toBe('done');
    expect(lessonDay(r, now)).toBe(3);
    expect(lessonDay(devSeedRecord('?seed=lessons&day=1', now)!, now)).toBe(1);
    expect(lessonDay(devSeedRecord('?seed=lessons&day=5', now)!, now)).toBe(5);
  });

  describe('world jump shortcuts', () => {
    it.each([
      ['world1', 1, 'basics'],
      ['w1', 1, 'basics'],
      ['basics', 1, 'basics'],
      ['world2', 2, 'home'],
      ['w2', 2, 'home'],
      ['home', 2, 'home'],
      ['world3', 3, 'sidewalk'],
      ['w3', 3, 'sidewalk'],
      ['sidewalk', 3, 'sidewalk'],
      ['world4', 4, 'urban'],
      ['w4', 4, 'urban'],
      ['urban', 4, 'urban'],
      ['world5', 5, 'park'],
      ['w5', 5, 'park'],
      ['park', 5, 'park'],
      ['world6', 6, 'recall'],
      ['w6', 6, 'recall'],
      ['recall', 6, 'recall'],
      ['world-6', 6, 'recall'],
      ['world7', 7, 'cafe'],
      ['w7', 7, 'cafe'],
      ['cafe', 7, 'cafe'],
      ['world8', 8, 'trails'],
      ['w8', 8, 'trails'],
      ['trails', 8, 'trails'],
      ['world9', 9, 'crowds'],
      ['w9', 9, 'crowds'],
      ['crowds', 9, 'crowds'],
    ])('parses ?seed=%s to World %d (%s)', (seed, expectedNum, expectedId) => {
      const parsed = parseTargetWorld(new URLSearchParams(`seed=${seed}`));
      expect(parsed).toBeDefined();
      expect(parsed!.worldNumber).toBe(expectedNum);
      expect(parsed!.id).toBe(expectedId);
    });

    it('supports ?seed=world with &w=... or &world=...', () => {
      expect(parseTargetWorld(new URLSearchParams('seed=world&w=6'))?.id).toBe('recall');
      expect(parseTargetWorld(new URLSearchParams('seed=world&world=3'))?.id).toBe('sidewalk');
      expect(parseTargetWorld(new URLSearchParams('seed=w&w=park'))?.id).toBe('park');
    });

    it('unlocks target World 6 directly with all prior worlds completed and Plus enabled', () => {
      const record = devSeedRecord('?seed=world6', now)!;
      expect(record).toBeDefined();
      expect(record.onboarding.step).toBe('done');
      expect(record.onboarding.mockSubscribed).toBe(true);
      expect(isPlus(record, now)).toBe(true);

      const world6 = findWorld('recall')!;
      expect(world6).toBeDefined();

      const progress = { ...record, plus: isPlus(record, now) };
      // All prior worlds (1-5) are marked complete
      for (const w of WORLDS.filter((w) => w.worldNumber < 6)) {
        expect(record.completedWorlds).toContain(w.id);
        expect(isWorldComplete(w, progress)).toBe(true);
      }

      // World 6 is unlocked
      expect(isWorldUnlocked(world6, progress)).toBe(true);

      // Prerequisite node for park-unpredictable ('park-mix') is completed
      expect(record.completedNodes).toContain('park-mix');

      // First stretch lessons of World 6 are pre-read by default
      expect(record.readLessons).toContain('theory-unpredictable-walks');
      expect(record.readLessons).toContain('howto-yield-pressure');

      // The park-unpredictable Stage Node is immediately open and playable
      expect(stopLock({ kind: 'node', id: 'park-unpredictable' }, progress)).toBeNull();
    });

    it('locks the Stage Node behind lessons when &fresh=1 or &clean=1 is passed', () => {
      const freshRecord = devSeedRecord('?seed=world6&fresh=1', now)!;
      expect(freshRecord.readLessons).not.toContain('theory-unpredictable-walks');
      expect(freshRecord.readLessons).not.toContain('howto-yield-pressure');

      const progress = { ...freshRecord, plus: true };
      const lock = stopLock({ kind: 'node', id: 'park-unpredictable' }, progress);
      expect(lock).toEqual({
        kind: 'stops',
        stops: expect.arrayContaining([
          { kind: 'lesson', id: 'theory-unpredictable-walks' },
          { kind: 'lesson', id: 'howto-yield-pressure' },
        ]),
      });
    });

    it('supports jumping to every playable World 1-5 with its first node open', () => {
      for (let n = 1; n <= 5; n++) {
        const record = devSeedRecord(`?seed=world${n}`, now)!;
        const world = WORLDS.find((w) => w.worldNumber === n)!;
        const progress = { ...record, plus: isPlus(record, now) };

        expect(isWorldUnlocked(world, progress)).toBe(true);
        // Prior worlds are complete
        for (const pw of WORLDS.filter((w) => w.worldNumber < n)) {
          expect(record.completedWorlds).toContain(pw.id);
          expect(isWorldComplete(pw, progress)).toBe(true);
        }

        // First node in world is unlocked
        const firstNode = world.stretches[0].find((s) => s.kind === 'node')!;
        expect(stopLock(firstNode, progress)).toBeNull();
      }
    });

    it('supports &stretch=N to jump into a later stretch of a world', () => {
      // World 3 Stretch 2 (blind corner)
      const r = devSeedRecord('?seed=world3&stretch=2', now)!;
      expect(r.completedNodes).toContain('walk-distraction');
      expect(r.readLessons).toContain('theory-blind-corner');
      const progress = { ...r, plus: true };
      expect(stopLock({ kind: 'node', id: 'blind-corner' }, progress)).toBeNull();
    });

    it('respects &lang and &name parameters', () => {
      const en = devSeedRecord('?seed=world6&lang=en&name=Buddy', now)!;
      expect(en.language).toBe('en');
      expect(en.name).toBe('Buddy');

      const es = devSeedRecord('?seed=world6&lang=es&name=Sol', now)!;
      expect(es.language).toBe('es');
      expect(es.name).toBe('Sol');
    });

    it('unlocks preview Worlds 7 to 9 with all playable worlds completed', () => {
      const r7 = devSeedRecord('?seed=world7', now)!;
      const progress7 = { ...r7, plus: isPlus(r7, now) };
      const cafe = findWorld('cafe')!;
      expect(isWorldUnlocked(cafe, progress7)).toBe(true);

      const r9 = devSeedRecord('?seed=world9', now)!;
      const progress9 = { ...r9, plus: isPlus(r9, now) };
      const crowds = findWorld('crowds')!;
      expect(isWorldUnlocked(crowds, progress9)).toBe(true);
    });
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
