import { badgeColors, buttonStyle, desaturate, progressWidth, starSlots, touchTarget } from './styles';
import { color, theme } from './theme';

describe('buttonStyle', () => {
  it('raises the face with an edge when idle', () => {
    const s = buttonStyle('primary');
    expect(s.edgeHeight).toBe(theme.depth.edge);
    expect(s.offsetY).toBe(0);
    expect(s.fill).toBe(color.brand);
  });

  it('sinks by the edge height when pressed', () => {
    const s = buttonStyle('primary', { pressed: true });
    expect(s.offsetY).toBe(theme.depth.edge);
    expect(s.edgeHeight).toBe(0);
  });

  it('desaturates and ignores press when disabled', () => {
    const s = buttonStyle('primary', { disabled: true, pressed: true });
    expect(s.fill).not.toBe(color.brand);
    expect(s.fill).toBe(desaturate(color.brand));
    expect(s.offsetY).toBe(0);
    expect(s.opacity).toBeLessThan(1);
  });

  it('is at least 44 points in both directions for every variant', () => {
    for (const v of ['primary', 'quiet', 'accent', 'info'] as const) {
      const s = buttonStyle(v);
      expect(s.minHeight).toBeGreaterThanOrEqual(44);
      expect(s.minWidth).toBeGreaterThanOrEqual(44);
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
    expect(badgeColors('warn').label).toBe(color.onWarn);
  });
});
