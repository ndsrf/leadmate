import { contrastRatio, color, colorNight, MIN_CONTRAST, MIN_CONTRAST_LARGE, NIGHT_TEXT_PAIRS, TEXT_PAIRS, theme } from './theme';

describe('theme tokens', () => {
  it.each(TEXT_PAIRS.map(([t, b]) => [t, b]))('%s on %s has at least 4.5:1 contrast', (text, background) => {
    const ratio = contrastRatio(color[text as keyof typeof color], color[background as keyof typeof color]);
    expect(ratio).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it.each(NIGHT_TEXT_PAIRS.map(([t, b]) => [t, b]))('night: %s on %s has at least 4.5:1 contrast', (text, background) => {
    expect(contrastRatio(colorNight[text], colorNight[background])).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });

  it('defines a night value for every surface and ink token the shell draws on', () => {
    for (const name of ['bg', 'surface', 'surfaceSunken', 'edge', 'ink', 'inkMuted'] as const) {
      expect(colorNight[name]).toMatch(/^#[0-9a-f]{6}$/i);
      expect(color[name]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('keeps the ink outline readable against the page and the paper', () => {
    expect(contrastRatio(color.ink, color.bg)).toBeGreaterThanOrEqual(MIN_CONTRAST_LARGE);
    expect(contrastRatio(color.ink, color.surface)).toBeGreaterThanOrEqual(MIN_CONTRAST_LARGE);
  });

  it('keeps the brand fill distinct enough from the page to read as a control (3:1 with its ink outline)', () => {
    expect(contrastRatio(color.brand, color.ink)).toBeGreaterThanOrEqual(MIN_CONTRAST_LARGE);
  });

  it('computes known ratios', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1, 5);
  });

  it('keeps the touch minimum at 44 points and the ink border at 2.5', () => {
    expect(theme.size.touchMin).toBe(44);
    expect(theme.border.ink).toBe(2.5);
  });

  it('uses Fredoka as the only display face', () => {
    expect(theme.type.family.display).toBe('Fredoka_600SemiBold');
  });

  it('feeds Tailwind from the same file', () => {
    const config = require('../../../tailwind.config.js');
    expect(config.theme.extend.colors.brand).toBe(color.brand);
    expect(config.theme.extend.borderRadius['game-md']).toBe(`${theme.radius.md}px`);
    expect(config.theme.extend.fontFamily.display).toEqual([theme.type.family.display]);
  });
});
