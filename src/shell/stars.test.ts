import { bestStars, isStars, starsFor } from './stars';

describe('starsFor', () => {
  it.each([
    [400, 1],
    [649, 1],
    [650, 2],
    [849, 2],
    [850, 3],
    [870, 3],
    [1000, 3],
    [0, 1],
  ])('score %d earns %d star(s)', (score, stars) => {
    expect(starsFor(score)).toBe(stars);
  });

  it('gives 1 star when there is no handling score', () => {
    expect(starsFor(undefined)).toBe(1);
    expect(starsFor(NaN)).toBe(1);
  });
});

describe('bestStars', () => {
  it('keeps the higher rating either way round', () => {
    expect(bestStars(3, 1)).toBe(3);
    expect(bestStars(1, 3)).toBe(3);
    expect(bestStars(undefined, 2)).toBe(2);
    expect(bestStars(2, undefined)).toBe(2);
    expect(bestStars(undefined, undefined)).toBeUndefined();
  });
  it('validates ratings', () => {
    expect([0, 1, 2, 3, 4, '2', null].map(isStars)).toEqual([false, true, true, true, false, false, false]);
  });
});
