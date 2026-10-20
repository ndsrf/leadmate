import { contrastRatio, color, MIN_CONTRAST, TEXT_PAIRS, theme } from './theme';

describe('theme tokens', () => {
  it.each(TEXT_PAIRS.map(([t, b]) => [t, b]))('%s on %s has at least 4.5:1 contrast', (text, background) => {
    const ratio = contrastRatio(color[text as keyof typeof color], color[background as keyof typeof color]);
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('keeps the touch minimum at 44 points', () => {
    expect(theme.touchMin).toBe(44);
  });

  it('feeds Tailwind from the same file', () => {
    const config = require('../../../tailwind.config.js');
    expect(config.theme.extend.colors.brand).toBe(color.brand);
  });
});
