import { migrateRecord, newDogRecord } from '../dogRecord';
import { dogScaleFromKg, isCoat, lookOf } from './look';

describe('Dog look', () => {
  it('draws small dogs smaller and large dogs bigger, and a Dog without a weight medium', () => {
    expect(dogScaleFromKg(null)).toBe(1);
    expect(dogScaleFromKg(4)).toBeLessThan(dogScaleFromKg(12));
    expect(dogScaleFromKg(12)).toBeLessThan(dogScaleFromKg(25));
    expect(dogScaleFromKg(25)).toBeLessThan(dogScaleFromKg(40));
  });

  it('starts golden, and an unknown stored coat falls back to golden', () => {
    expect(newDogRecord().coat).toBe('golden');
    expect(migrateRecord({ coat: 'plaid' }).coat).toBe('golden');
    expect(migrateRecord({ coat: 'black' }).coat).toBe('black');
    expect(isCoat('black')).toBe(true);
    expect(isCoat('plaid')).toBe(false);
  });

  it('gives the Stage the coat and a size from the weight', () => {
    const r = { ...newDogRecord(), coat: 'grey' as const, weights: { dogKg: 5, handlerKg: 70 } };
    expect(lookOf(r)).toEqual({ dogCoat: 'grey', dogScale: dogScaleFromKg(5) });
  });
});
