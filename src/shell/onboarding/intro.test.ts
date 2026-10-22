import { loadDogRecord, newDogRecord, saveDogRecord, type DogRecord, type KeyValueStore } from '../dogRecord';
import { completeTaste, leavePayoff, leaveWelcome, renameDog, saveNameAndLook, withDogName } from './intro';
import type { OnboardingStep } from './flow';

const at = (step: OnboardingStep): DogRecord => ({ ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step } });

describe('the funnel before setup', () => {
  it('goes welcome, dog, taste, payoff, setup', () => {
    let r = newDogRecord();
    expect(r.onboarding.step).toBe('welcome');
    r = leaveWelcome(r);
    expect(r.onboarding.step).toBe('dog');
    r = saveNameAndLook(r, 'Luna', 'black');
    expect(r.onboarding.step).toBe('taste');
    r = completeTaste(r);
    expect(r.onboarding.step).toBe('payoff');
    r = leavePayoff(r);
    expect(r.onboarding.step).toBe('setup');
  });

  it('stores the trimmed name and the coat', () => {
    const r = saveNameAndLook(at('dog'), '  Luna ', 'black');
    expect(r).toMatchObject({ name: 'Luna', coat: 'black' });
  });

  it('does not continue on a blank name', () => {
    const start = at('dog');
    expect(saveNameAndLook(start, '   ', 'black')).toBe(start);
    expect(saveNameAndLook(start, 'x'.repeat(21), 'black')).toBe(start);
  });

  it('never moves a record that is somewhere else', () => {
    const later = at('diagnostic');
    expect(leaveWelcome(later)).toBe(later);
    expect(completeTaste(later)).toBe(later);
    expect(leavePayoff(later)).toBe(later);
    expect(saveNameAndLook(later, 'Luna', 'black')).toBe(later);
  });

  it('leaves the Dog record as it was apart from the onboarding step when the taste ends', () => {
    const before = { ...at('taste'), name: 'Luna', coat: 'black' as const };
    const after = completeTaste(before);
    expect({ ...after, onboarding: before.onboarding }).toEqual(before);
    expect(after.onboarding.step).toBe('payoff');
    expect(after.seenHints).toEqual([]);
    expect(after.attributes).toEqual(before.attributes);
    expect(after.streak).toEqual(before.streak);
    expect(after.walkDiary).toEqual([]);
    expect(after.lastStageDate).toBeNull();
  });
});

describe('Dog name in text', () => {
  it('uses the name, or a neutral word when there is none', () => {
    expect(withDogName('Hola {name}', 'Luna', 'tu perro')).toBe('Hola Luna');
    expect(withDogName('Hola {name}', '', 'tu perro')).toBe('Hola tu perro');
  });
});

describe('renaming in settings', () => {
  it('sets a name for a Dog that had none, without touching the funnel', () => {
    const done = { ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step: 'done' as const } };
    const r = renameDog(done, ' Luna ');
    expect(r.name).toBe('Luna');
    expect(r.onboarding).toEqual(done.onboarding);
  });

  it('keeps the old name when the new one is blank or too long', () => {
    const named = { ...newDogRecord(), name: 'Luna' };
    expect(renameDog(named, '  ')).toBe(named);
    expect(renameDog(named, 'x'.repeat(21))).toBe(named);
  });
});

describe('closing during the taste', () => {
  it('leaves the step at taste, so a restart plays it again', async () => {
    const data = new Map<string, string>();
    const store: KeyValueStore = { getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
    await saveDogRecord(store, at('taste'));
    expect((await loadDogRecord(store)).onboarding.step).toBe('taste');
  });
});
