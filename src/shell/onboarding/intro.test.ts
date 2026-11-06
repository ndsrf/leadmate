import { loadDogRecord, newDogRecord, saveDogRecord, type DogRecord, type KeyValueStore } from '../dogRecord';
import { completeTaste, leaveWelcome, namedTranslator, renameDog, saveMainConcerns, saveNameAndLook, withDogName } from './intro';
import type { OnboardingStep } from './flow';

const at = (step: OnboardingStep): DogRecord => ({ ...newDogRecord(), onboarding: { ...newDogRecord().onboarding, step } });

describe('the funnel before setup', () => {
  it('goes welcome, dog, concern, taste, setup', () => {
    let r = newDogRecord();
    expect(r.onboarding.step).toBe('welcome');
    r = leaveWelcome(r);
    expect(r.onboarding.step).toBe('dog');
    r = saveNameAndLook(r, 'Luna', 'black');
    expect(r.onboarding.step).toBe('concern');
    r = saveMainConcerns(r, ['bite-owner']);
    expect(r.onboarding.step).toBe('taste');
    r = completeTaste(r);
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
    expect(saveNameAndLook(later, 'Luna', 'black')).toBe(later);
  });

  it('leaves the Dog record as it was apart from the onboarding step when the taste ends', () => {
    const before = { ...at('taste'), name: 'Luna', coat: 'black' as const };
    const after = completeTaste(before);
    expect({ ...after, onboarding: before.onboarding }).toEqual(before);
    expect(after.onboarding.step).toBe('setup');
    expect(after.seenHints).toEqual([]);
    expect(after.attributes).toEqual(before.attributes);
    expect(after.streak).toEqual(before.streak);
    expect(after.walkDiary).toEqual([]);
    expect(after.lastStageDate).toBeNull();
  });
});

describe('the main concern step', () => {
  it('saves the answer once and moves on to the taste', () => {
    const r = saveMainConcerns(at('concern'), ['react-bicycle']);
    expect(r.mainConcerns).toEqual(['react-bicycle']);
    expect(r.onboarding.step).toBe('taste');
    expect(saveMainConcerns(r, ['bark-home'])).toBe(r);
  });

  it('saves up to three picks in order and selects each one', () => {
    const r = saveMainConcerns(at('concern'), ['eat-objects', 'react-food', 'bark-home', 'destroy']);
    expect(r.mainConcerns).toEqual(['eat-objects', 'react-food', 'bark-home']);
    expect(r.homeConcerns).toEqual({ 'eat-objects': 2, 'bark-home': 2 });
    expect(r.homeConcerns.destroy).toBeUndefined();
  });

  it('moves on when skipped, leaving the answer unset', () => {
    const r = saveMainConcerns(at('concern'), []);
    expect([r.mainConcerns, r.onboarding.step]).toEqual([[], 'taste']);
  });

  it('shows a home concern preselected in setup, without lowering one that is set', () => {
    expect(saveMainConcerns(at('concern'), ['eat-objects']).homeConcerns).toEqual({ 'eat-objects': 2 });
    const set = { ...at('concern'), homeConcerns: { destroy: 3 as const } };
    expect(saveMainConcerns(set, ['destroy']).homeConcerns).toEqual({ destroy: 3 });
  });

  it('selects an outdoor concern in the Trigger Profile without a second copy', () => {
    const off = { ...at('concern'), triggerProfile: { ...newDogRecord().triggerProfile, bicycle: 0 as const } };
    const r = saveMainConcerns(off, ['react-bicycle']);
    expect(r.triggerProfile.bicycle).toBe(2);
    expect(r.homeConcerns).toEqual({});
    expect(saveMainConcerns({ ...off, triggerProfile: { ...off.triggerProfile, bicycle: 3 } }, ['react-bicycle']).triggerProfile.bicycle).toBe(3);
  });

  it('does nothing for a record somewhere else', () => {
    const later = at('setup');
    expect(saveMainConcerns(later, ['bite-owner'])).toBe(later);
  });
});

describe('Dog name in text', () => {
  it('uses the name, or a neutral word when there is none', () => {
    expect(withDogName('Hola {name}', 'Luna', 'tu perro')).toBe('Hola Luna');
    expect(withDogName('Hola {name}', '', 'tu perro')).toBe('Hola tu perro');
  });

  it('capitalises the neutral text where it starts a sentence', () => {
    expect(withDogName('{name} tira. Esperas y {name} vuelve. ¿{name} te mira? Paso 2: {name} se sienta.', '', 'tu perro')).toBe(
      'Tu perro tira. Esperas y tu perro vuelve. ¿Tu perro te mira? Paso 2: Tu perro se sienta.',
    );
    expect(withDogName('{name} tira. ¿{name} te mira?', 'luna', 'tu perro')).toBe('luna tira. ¿luna te mira?');
  });

  it('fills every text of a named translator', () => {
    const t = namedTranslator(((key: string) => (key === 'dog.neutral' ? 'tu perro' : `{name} y {name}`)) as never, 'Luna');
    expect(t('x' as never)).toBe('Luna y Luna');
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

describe('the breed on the name-and-look screen', () => {
  it('stores the breed with the name and coat', () => {
    const r = saveNameAndLook(at('dog'), 'Luna', 'black', 'collie');
    expect(r).toMatchObject({ name: 'Luna', coat: 'black', breed: 'collie' });
    expect(r.onboarding.step).toBe('concern');
  });

  it('keeps the Mestizo when the breed is never touched', () => {
    expect(saveNameAndLook(at('dog'), 'Luna', 'black').breed).toBe('mestizo');
  });

  it('still needs a name, and a blank one leaves the breed alone', () => {
    const start = at('dog');
    expect(saveNameAndLook(start, ' ', 'black', 'teckel')).toBe(start);
    expect(start.breed).toBe('mestizo');
  });

  it('stores the age band when chosen on the name-and-look step', () => {
    const r = saveNameAndLook(at('dog'), 'Luna', 'black', 'collie', 'puppy');
    expect(r).toMatchObject({ name: 'Luna', coat: 'black', breed: 'collie', ageBand: 'puppy' });
    expect(r.onboarding.step).toBe('concern');
  });

  it('keeps ageBand null when unselected', () => {
    const r = saveNameAndLook(at('dog'), 'Luna', 'black', 'collie', null);
    expect(r.ageBand).toBeNull();
  });
});
