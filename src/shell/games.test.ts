import { pickRandomGame, canSeeGame, computeLockedBars } from './games';
import { newDogRecord, type DogRecord } from './dogRecord';
import { applyBillingSubscription, TRIAL_DAYS } from './plus';

const withTrial = (trialStartedAt: string | null, mockSubscribed?: boolean): DogRecord => {
  const r = newDogRecord();
  return { ...r, onboarding: { ...r.onboarding, trialStartedAt, mockSubscribed } };
};

describe('pickRandomGame (Task 3.1)', () => {
  it('returns null when ids list is empty', () => {
    expect(pickRandomGame([])).toBeNull();
  });

  it('single game returns itself, even when matching lastId', () => {
    expect(pickRandomGame(['eleccion-mano'])).toBe('eleccion-mano');
    expect(pickRandomGame(['eleccion-mano'], 'eleccion-mano')).toBe('eleccion-mano');
    expect(pickRandomGame(['eleccion-mano'], 'other-game')).toBe('eleccion-mano');
  });

  it('no immediate repeat when several games exist and lastId is provided', () => {
    const ids = ['game-1', 'game-2', 'game-3', 'game-4'];
    const lastId = 'game-2';

    // Test across range of RNG outputs [0, 0.25, 0.5, 0.75, 0.99]
    for (let r = 0; r < 1; r += 0.05) {
      const picked = pickRandomGame(ids, lastId, () => r);
      expect(picked).not.toBe(lastId);
      expect(ids).toContain(picked);
    }
  });

  it('picks deterministically with custom RNG', () => {
    const ids = ['game-a', 'game-b', 'game-c'];

    // With rng() => 0, pool of 3 picks index 0
    expect(pickRandomGame(ids, null, () => 0)).toBe('game-a');

    // With rng() => 0.5, pool of 3 picks index 1
    expect(pickRandomGame(ids, null, () => 0.5)).toBe('game-b');

    // With lastId='game-a', pool is ['game-b', 'game-c']
    expect(pickRandomGame(ids, 'game-a', () => 0)).toBe('game-b');
    expect(pickRandomGame(ids, 'game-a', () => 0.5)).toBe('game-c');
  });

  it('handles lastId that is not in the list', () => {
    const ids = ['game-1', 'game-2'];
    const picked = pickRandomGame(ids, 'unknown-id', () => 0);
    expect(picked).toBe('game-1');
  });
});

describe('canSeeGame (Task 3.1)', () => {
  const freeGame = { free: true };
  const plusGame = { free: false };
  const unspecifiedGame = {};

  it('Free game is open to all users', () => {
    // Boolean flags
    expect(canSeeGame(freeGame, false)).toBe(true);
    expect(canSeeGame(freeGame, true)).toBe(true);
    expect(canSeeGame(freeGame, null)).toBe(true);
    expect(canSeeGame(freeGame, undefined)).toBe(true);

    // Free user record (no plus)
    const freeRecord = withTrial(null);
    expect(canSeeGame(freeGame, freeRecord)).toBe(true);
  });

  it('Plus game is open only with Plus (boolean flag)', () => {
    expect(canSeeGame(plusGame, false)).toBe(false);
    expect(canSeeGame(plusGame, true)).toBe(true);
    expect(canSeeGame(plusGame, null)).toBe(false);
    expect(canSeeGame(plusGame, undefined)).toBe(false);

    expect(canSeeGame(unspecifiedGame, false)).toBe(false);
    expect(canSeeGame(unspecifiedGame, true)).toBe(true);
  });

  it('Plus game is open with an active trial through isPlus', () => {
    const start = new Date(2026, 4, 4, 18, 0);
    const unstartedRecord = withTrial(null);
    expect(canSeeGame(plusGame, unstartedRecord, start)).toBe(false);

    // Active trial at start + 5 minutes
    const trialRecord = withTrial(start.toISOString());
    expect(canSeeGame(plusGame, trialRecord, new Date(2026, 4, 4, 18, 5))).toBe(true);

    // Active trial on day 6
    const day6 = new Date(2026, 4, 10, 18, 0);
    expect(canSeeGame(plusGame, trialRecord, day6)).toBe(true);

    // Expired trial on day 8 (beyond 7 days)
    const day8 = new Date(2026, 4, 12, 18, 1);
    expect(canSeeGame(plusGame, trialRecord, day8)).toBe(false);
  });

  it('Plus game is open with an active subscription', () => {
    const now = new Date(2026, 5, 1, 12, 0, 0);
    const subscribed = applyBillingSubscription(newDogRecord(), { isPlus: true, expiresAt: null }, now);
    expect(canSeeGame(plusGame, subscribed, now)).toBe(true);
  });
});

describe('computeLockedBars (Task 3.2)', () => {
  it('is a pure function that returns deterministic bar counts and widths', () => {
    const text = 'Este es un texto secreto de prueba con varios pasos e instrucciones detalladas.';
    const res1 = computeLockedBars(text);
    const res2 = computeLockedBars(text);

    expect(res1).toEqual(res2);
    expect(res1.length).toBeGreaterThanOrEqual(3);
  });

  it('bar count and widths are bounded', () => {
    // 0 characters input
    const emptyBars = computeLockedBars('', { minBars: 3, maxBars: 8, minWidth: 40, maxWidth: 100 });
    expect(emptyBars.length).toBe(3);
    for (const b of emptyBars) {
      expect(b.widthPercent).toBeGreaterThanOrEqual(40);
      expect(b.widthPercent).toBeLessThanOrEqual(100);
      expect(b.width).toBe(`${b.widthPercent}%`);
    }

    // Huge input (100,000 characters) is capped at maxBars
    const hugeText = 'A'.repeat(100000);
    const hugeBars = computeLockedBars(hugeText, { minBars: 3, maxBars: 8, minWidth: 40, maxWidth: 100 });
    expect(hugeBars.length).toBe(8);
    for (const b of hugeBars) {
      expect(b.widthPercent).toBeGreaterThanOrEqual(40);
      expect(b.widthPercent).toBeLessThanOrEqual(100);
      expect(b.width).toBe(`${b.widthPercent}%`);
    }
  });

  it('derives count from text length: longer hidden text produces more bars than short text', () => {
    const shortText = 'Paso 1: toma un premio.';
    const longText = 'Paso 1: ' + 'descripción muy larga de la actividad '.repeat(15);

    const shortBars = computeLockedBars(shortText);
    const longBars = computeLockedBars(longText);

    expect(shortBars.length).toBeLessThan(longBars.length);
  });

  it('accepts string, number, string[], or undefined', () => {
    const fromString = computeLockedBars('Texto de prueba');
    const fromNumber = computeLockedBars(150);
    const fromArray = computeLockedBars(['Paso 1', 'Paso 2', 'Paso 3']);
    const fromUndefined = computeLockedBars(undefined);

    expect(Array.isArray(fromString)).toBe(true);
    expect(Array.isArray(fromNumber)).toBe(true);
    expect(Array.isArray(fromArray)).toBe(true);
    expect(Array.isArray(fromUndefined)).toBe(true);
  });

  it('CRITICAL: verify that NO hidden text is in the output', () => {
    const secretKeywords = [
      'SUPER_SECRET_RECIPE',
      'CONFIDENTIAL_DOG_INSTRUCTION',
      'TREAT_HIDDEN_LOCATION',
      'PASSWORD_12345',
    ];
    const secretText = secretKeywords.join(' ');

    const bars = computeLockedBars(secretText);
    const jsonOutput = JSON.stringify(bars);

    for (const secret of secretKeywords) {
      expect(jsonOutput).not.toContain(secret);
      expect(jsonOutput.toLowerCase()).not.toContain(secret.toLowerCase());
    }

    // The output objects only contain structural styling keys: id, widthPercent, width
    for (const bar of bars) {
      expect(Object.keys(bar).sort()).toEqual(['id', 'width', 'widthPercent']);
      expect(typeof bar.id).toBe('number');
      expect(typeof bar.widthPercent).toBe('number');
      expect(typeof bar.width).toBe('string');
      expect(bar.width.endsWith('%')).toBe(true);
    }
  });
});
