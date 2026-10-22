import { cleanDogName } from './name';

describe('Dog name', () => {
  it('rejects a blank name', () => {
    expect(cleanDogName('')).toBeNull();
    expect(cleanDogName('   ')).toBeNull();
  });

  it('trims a padded name', () => {
    expect(cleanDogName('  Luna ')).toBe('Luna');
  });

  it('allows 20 characters and rejects 21', () => {
    expect(cleanDogName('a'.repeat(20))).toBe('a'.repeat(20));
    expect(cleanDogName('a'.repeat(21))).toBeNull();
    expect(cleanDogName(` ${'a'.repeat(20)} `)).toBe('a'.repeat(20));
  });

  it('rejects anything that is not text', () => {
    expect(cleanDogName(undefined)).toBeNull();
    expect(cleanDogName(7)).toBeNull();
  });
});
