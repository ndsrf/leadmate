import { BREEDS, BREEDS_COLLAPSED, breedOf, breedWeightMid, isBreed } from './breeds';
import { isCoat } from './look';
import { isDogKg } from './weights';

describe('breed catalog', () => {
  it('has the 15 named breeds, Mestizo and Otra raza, each once', () => {
    expect(BREEDS).toHaveLength(17);
    expect(new Set(BREEDS.map((b) => b.id)).size).toBe(17);
    expect(isBreed('mestizo') && isBreed('otra') && isBreed('teckel')).toBe(true);
  });

  it('keeps the first six for the collapsed grid', () => {
    expect(BREEDS_COLLAPSED).toBe(6);
    expect(BREEDS.slice(0, BREEDS_COLLAPSED).map((b) => b.id)).toEqual(['labrador', 'golden', 'pastor', 'collie', 'frances', 'chihuahua']);
  });

  it('keeps every range inside the Dog weight range and every default coat real', () => {
    for (const b of BREEDS) {
      expect(isCoat(b.defaultCoat)).toBe(true);
      if (b.kg === null) continue;
      expect(b.kg[0]).toBeLessThan(b.kg[1]);
      expect(isDogKg(b.kg[0]) && isDogKg(b.kg[1])).toBe(true);
    }
  });

  it('gives Otra raza no range, so it never pre-fills a weight', () => {
    expect(breedOf('otra').kg).toBeNull();
    expect(breedWeightMid('otra')).toBeNull();
  });

  it('takes the midpoint of the range', () => {
    expect(breedWeightMid('labrador')).toBe(30.5);
    expect(breedWeightMid('chihuahua')).toBe(2.3);
  });

  it('rejects anything that is not a breed id', () => {
    expect(isBreed('poodle')).toBe(false);
    expect(isBreed(3)).toBe(false);
    expect(isBreed(undefined)).toBe(false);
  });
});
