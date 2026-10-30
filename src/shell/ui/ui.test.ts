import { badgeColors, buttonStyle, choiceStyle, padStyle, progressWidth, starSlots, touchTarget } from './styles';
import { lightColor as color, contrastRatio, MIN_CONTRAST, theme } from './theme';

describe('buttonStyle', () => {
  it('rests on a solid ink shadow with an ink outline', () => {
    const s = buttonStyle(color, 'primary');
    expect(s.shadowOffset).toBe(theme.depth.rest.x);
    expect(s.visibleShadow).toBe(theme.depth.rest.x);
    expect(s.travel).toBe(0);
    expect(s.fill).toBe(color.brand);
    expect(s.edge).toBe(color.outline);
    expect(s.borderWidth).toBe(theme.border.ink);
  });

  it('sinks 3 points toward the shadow when pressed, leaving 1', () => {
    const s = buttonStyle(color, 'primary', { pressed: true });
    expect(s.travel).toBe(theme.depth.pressed.translate);
    expect(s.visibleShadow).toBe(theme.depth.pressed.x);
    expect(s.fill).toBe(color.brand);
  });

  it('is flat, grey and outlined in grey when disabled, and ignores press', () => {
    const s = buttonStyle(color, 'primary', { disabled: true, pressed: true });
    expect(s.fill).toBe(color.disabled);
    expect(s.label).toBe(color.disabledText);
    expect(s.edge).toBe(color.disabledText);
    expect(s.shadowOffset).toBe(0);
    expect(s.travel).toBe(0);
  });

  it('draws the quiet variant as an underlined link with no face, outline or shadow', () => {
    const s = buttonStyle(color, 'quiet');
    expect(s.fill).toBeNull();
    expect(s.edge).toBe('transparent');
    expect(s.shadowOffset).toBe(0);
    expect(s.underline).toBe(true);
    expect(buttonStyle(color, 'quiet', { disabled: true }).underline).toBe(false);
  });

  it('keeps every label readable on its face, pressed or not', () => {
    for (const v of ['primary', 'secondary', 'accent', 'info', 'danger'] as const) {
      for (const pressed of [false, true]) {
        const s = buttonStyle(color, v, { pressed });
        expect(contrastRatio(s.label, s.fill as string)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    }
  });

  it('is at least 44 points in both directions for every variant, in every state', () => {
    for (const v of ['primary', 'secondary', 'quiet', 'accent', 'info', 'danger'] as const) {
      for (const state of [{}, { pressed: true }, { disabled: true }]) {
        const s = buttonStyle(color, v, state);
        expect(s.minHeight).toBeGreaterThanOrEqual(44);
        expect(s.minWidth).toBeGreaterThanOrEqual(44);
      }
    }
  });

  it('makes primary actions 56 points tall', () => {
    expect(buttonStyle(color, 'primary').minHeight).toBe(56);
  });
});

describe('focus ring', () => {
  it('is 3 points wide, offset 3 points, in a colour that holds 4.5:1 on the page and the paper', () => {
    expect(theme.depth.focusRing).toMatchObject({ width: 3, offset: 3 });
    expect(contrastRatio(color.focus, color.bg)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    expect(contrastRatio(color.focus, color.surface)).toBeGreaterThanOrEqual(MIN_CONTRAST);
  });
});

describe('choiceStyle and padStyle', () => {
  it('shows the chosen option in brand with a short shadow and the others flat', () => {
    expect(choiceStyle(color, true)).toMatchObject({ fill: color.brand, shadowOffset: 2 });
    expect(choiceStyle(color, false)).toMatchObject({ fill: color.surface, shadowOffset: 0 });
  });
  it('sinks the pad to its shadow when held', () => {
    expect(padStyle(color, 'brand', true).travel).toBe(theme.depth.md.x - theme.depth.pressed.x);
    expect(padStyle(color, 'brand', false).travel).toBe(0);
  });
  it('keeps pad labels readable', () => {
    for (const fill of ['brand', 'quiet'] as const) {
      for (const pressed of [false, true]) {
        const p = padStyle(color, fill, pressed);
        expect(contrastRatio(p.label, p.fill)).toBeGreaterThanOrEqual(MIN_CONTRAST);
      }
    }
  });
});

describe('touchTarget', () => {
  it('pads a small icon control up to 44 points', () => {
    expect(touchTarget(30)).toEqual({ size: 44, hitSlop: 7 });
  });
  it('leaves a large control alone', () => {
    expect(touchTarget(60)).toEqual({ size: 60, hitSlop: 0 });
  });
});

describe('small helpers', () => {
  it('clamps progress', () => {
    expect(progressWidth(5, 10)).toBe(50);
    expect(progressWidth(20, 10)).toBe(100);
    expect(progressWidth(-1, 10)).toBe(0);
    expect(progressWidth(1, 0)).toBe(0);
  });
  it('fills star slots up to the rating', () => {
    expect(starSlots(2)).toEqual([true, true, false]);
    expect(starSlots(0)).toEqual([false, false, false]);
    expect(starSlots(9)).toEqual([true, true, true]);
  });
  it('gives each badge tone readable label colours', () => {
    for (const tone of ['brand', 'accent', 'quiet', 'info', 'warn'] as const) {
      const c = badgeColors(color, tone);
      expect(contrastRatio(c.label, c.fill)).toBeGreaterThanOrEqual(MIN_CONTRAST);
    }
  });
});
