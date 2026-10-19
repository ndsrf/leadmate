import { es } from '../i18n';
import { applyDetents, keyboardInput, screenToWorldDirection } from './input';
import { project, unproject } from './iso';
import { fitFontSize, textWidth } from './layout';

describe('isometric projection', () => {
  it('round-trips ground points', () => {
    const p = unproject(project({ x: 12, y: -3 }));
    expect(p.x).toBeCloseTo(12);
    expect(p.y).toBeCloseTo(-3);
  });

  it('runs the route (+x) toward the upper right of the screen', () => {
    const a = project({ x: 0, y: 0 });
    const b = project({ x: 10, y: 0 });
    expect(b.x).toBeGreaterThan(a.x);
    expect(b.y).toBeLessThan(a.y);
  });
});

describe('joystick detents', () => {
  it('stands still inside the dead zone', () => expect(applyDetents(0.1, 0.6)).toBe(0));
  it('snaps near walk strength to walk', () => {
    expect(applyDetents(0.5, 0.6)).toBe(0.6);
    expect(applyDetents(0.72, 0.6)).toBe(0.6);
  });
  it('snaps the rim to quick', () => expect(applyDetents(0.95, 0.6)).toBe(1));
  it('passes other deflections through', () => {
    expect(applyDetents(0.78, 0.6)).toBeCloseTo(0.78);
    expect(applyDetents(0.3, 0.6)).toBeCloseTo(0.3);
  });
});

describe('keyboard input', () => {
  const none = { w: false, a: false, s: false, d: false, quick: false };

  it('does not move without keys', () => expect(keyboardInput(none, 0.6).strength).toBe(0));
  it('moves at walk strength with W', () => expect(keyboardInput({ ...none, w: true }, 0.6).strength).toBe(0.6));
  it('moves at quick strength with 2 in place of W', () => expect(keyboardInput({ ...none, quick: true }, 0.6).strength).toBe(1));
  it('moves forward along the route with W, up-right on screen', () => {
    const d = keyboardInput({ ...none, w: true }, 0.6).direction;
    expect(d).toEqual({ x: 1, y: 0 });
    const screen = project(d);
    expect(screen.x).toBeGreaterThan(0);
    expect(screen.y).toBeLessThan(0);
  });
  it('moves down-right with D and up-left with A', () => {
    expect(keyboardInput({ ...none, d: true }, 0.6).direction).toEqual({ x: 0, y: 1 });
    expect(keyboardInput({ ...none, a: true }, 0.6).direction).toEqual({ x: 0, y: -1 });
  });
  it('turns the joystick direction from screen space to the ground', () => {
    const d = screenToWorldDirection({ x: 25, y: -12.5 });
    expect(d.x).toBeCloseTo(1);
    expect(d.y).toBeCloseTo(0);
  });
});

describe('long strings', () => {
  const marker = es['hud.marker'];

  it.each(Object.entries(es).filter(([key]) => key.startsWith('hud.')))('HUD label %s fits 40%% longer', (_key, text) => {
    const longer = text + text.slice(0, Math.ceil(text.length * 0.4));
    const maxWidth = 120;
    expect(textWidth(longer, fitFontSize(longer, maxWidth, 16))).toBeLessThanOrEqual(maxWidth + 1e-9);
  });

  it('keeps the base size when the text already fits', () => {
    expect(fitFontSize(marker, 200, 16)).toBe(16);
  });
});
