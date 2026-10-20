import { es } from '../i18n';
import { applyDetents, keyboardInput, screenToWorldDirection } from './input';
import { project, unproject } from './iso';
import { CUE_LABEL_WIDTH, CUE_RADIUS, fitFontSize, hudLayout, MARKER_RADIUS, SNIFF_RADIUS, textWidth, visibleCues } from './layout';

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

describe('HUD layout', () => {
  it.each([
    ['phone portrait', 360, 740],
    ['phone landscape', 740, 360],
    ['desktop', 1280, 720],
  ])('puts the joystick left and the Marker and Cue right on a %s', (_name, w, h) => {
    const l = hudLayout(w, h);
    expect(l.joyHome.x).toBeLessThan(w / 2);
    expect(l.markerHome.x).toBeGreaterThan(w / 2);
    expect(l.cueHome.x).toBeGreaterThan(w / 2);
  });

  it.each([
    [360, 740],
    [740, 360],
    [568, 320],
  ])('keeps the Cue and Marker buttons apart and on screen at %ix%i', (w, h) => {
    const l = hudLayout(w, h);
    expect(Math.hypot(l.cueHome.x - l.markerHome.x, l.cueHome.y - l.markerHome.y)).toBeGreaterThan(MARKER_RADIUS + CUE_RADIUS);
    expect(l.cueHome.y - CUE_RADIUS).toBeGreaterThanOrEqual(24); // room for its label above
    expect(l.markerHome.y + MARKER_RADIUS).toBeLessThanOrEqual(h);
    expect(l.markerHome.x + MARKER_RADIUS).toBeLessThanOrEqual(w);
  });
});

describe('Cue and Go Sniff buttons', () => {
  const sizes: [number, number][] = [[360, 740], [740, 360], [568, 320], [1280, 720]];
  const apart = (a: { x: number; y: number }, b: { x: number; y: number }, ra: number, rb: number) => Math.hypot(a.x - b.x, a.y - b.y) >= ra + rb;

  it('shows one Cue in the main slot, single-Cue mode', () => {
    const l = hudLayout(740, 360, ['lets-go']);
    expect(l.cueHome).toEqual(hudLayout(740, 360).cueHome);
    expect(l.leaveItHome).toEqual(l.cueHome);
    expect(visibleCues(['lets-go'])).toEqual(['lets-go']);
  });

  it('puts a lone "Leave It" in the main slot, as in the introductory food Node', () => {
    const l = hudLayout(740, 360, ['leave-it']);
    expect(l.leaveItHome).toEqual(l.cueHome);
    expect(visibleCues(['leave-it'])).toEqual(['leave-it']);
  });

  it('shows both Cues side by side, "Leave It" on the left, in dual-Cue mode', () => {
    const l = hudLayout(740, 360, ['lets-go', 'leave-it']);
    expect(l.leaveItHome.y).toBe(l.cueHome.y);
    expect(l.leaveItHome.x).toBeLessThan(l.cueHome.x);
    expect(visibleCues(['leave-it', 'lets-go'])).toEqual(['lets-go', 'leave-it']);
  });

  it.each(sizes)('keeps every button apart, on screen and on the right half at %ix%i', (w, h) => {
    const l = hudLayout(w, h, ['lets-go', 'leave-it']);
    expect(apart(l.cueHome, l.leaveItHome, CUE_RADIUS, CUE_RADIUS)).toBe(true);
    expect(apart(l.cueHome, l.markerHome, CUE_RADIUS, MARKER_RADIUS)).toBe(true);
    expect(apart(l.sniffHome, l.markerHome, SNIFF_RADIUS, MARKER_RADIUS)).toBe(true);
    expect(apart(l.sniffHome, l.leaveItHome, SNIFF_RADIUS, CUE_RADIUS)).toBe(true);
    expect(l.leaveItHome.x).toBeGreaterThan(w * 0.5); // centers stay under the right thumb; a rim may cross the middle
    expect(l.sniffHome.x).toBeGreaterThan(w * 0.5);
    expect(l.leaveItHome.y - CUE_RADIUS).toBeGreaterThanOrEqual(24);
  });

  it('has labels that fit the room between neighboring buttons even 40% longer', () => {
    for (const key of ['hud.letsGo', 'hud.leaveIt', 'hud.sniff'] as const) {
      const longer = es[key] + es[key].slice(0, Math.ceil(es[key].length * 0.4));
      expect(textWidth(longer, fitFontSize(longer, CUE_LABEL_WIDTH, 14))).toBeLessThanOrEqual(CUE_LABEL_WIDTH + 1e-9);
    }
  });
});
