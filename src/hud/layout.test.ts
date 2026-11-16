import { coachMarks } from './coach';
import {
  CUE_RADIUS,
  hudLayout,
  isPointInPortrait,
  JOY_RADIUS,
  MARKER_RADIUS,
  PORTRAIT_MARGIN,
  PORTRAIT_MAX_SIZE,
  PORTRAIT_MIN_SIZE,
  SNIFF_RADIUS,
  type Insets,
} from './layout';

describe('Dog portrait layout (readable-dog 4.2)', () => {
  const widths = [320, 375, 768] as const;
  // Typical heights for 320 (iPhone SE 1), 375 (iPhone 8/X), 768 (iPad)
  const screens: Record<(typeof widths)[number], number> = {
    320: 568,
    375: 667,
    768: 1024,
  };

  function portraitBounds(l: ReturnType<typeof hudLayout>) {
    const { x, y, size } = l.portrait;
    return {
      left: x - size / 2,
      right: x + size / 2,
      top: y - size / 2,
      bottom: y + size / 2,
      size,
    };
  }

  function rectsOverlap(
    r1: { left: number; right: number; top: number; bottom: number },
    r2: { left: number; right: number; top: number; bottom: number },
  ): boolean {
    return !(r1.right <= r2.left || r1.left >= r2.right || r1.bottom <= r2.top || r1.top >= r2.bottom);
  }

  function circleRectOverlap(c: { x: number; y: number; r: number }, r: { left: number; right: number; top: number; bottom: number }): boolean {
    const closestX = Math.max(r.left, Math.min(c.x, r.right));
    const closestY = Math.max(r.top, Math.min(c.y, r.bottom));
    const dx = c.x - closestX;
    const dy = c.y - closestY;
    return dx * dx + dy * dy < c.r * c.r;
  }

  it.each(widths)('sizes portrait from the screen short side between 96 and 120 px at width %i', (w) => {
    const h = screens[w];
    const l = hudLayout(w, h);
    expect(l.portrait.size).toBeGreaterThanOrEqual(PORTRAIT_MIN_SIZE);
    expect(l.portrait.size).toBeLessThanOrEqual(PORTRAIT_MAX_SIZE);
    expect(l.portraitSize).toBe(l.portrait.size);
    expect(l.portraitHome).toEqual({ x: l.portrait.x, y: l.portrait.y });
  });

  it('sets minimum size 96 px at 320 px wide and maximum 120 px at 768 px wide', () => {
    expect(hudLayout(320, 568).portrait.size).toBe(96);
    expect(hudLayout(768, 1024).portrait.size).toBe(120);
  });

  it.each(widths)('places portrait in the top-right corner away from the back button at width %i', (w) => {
    const h = screens[w];
    const l = hudLayout(w, h);
    const box = portraitBounds(l);

    // Top-right: right edge near width - margin, top edge near margin
    expect(box.right).toBeCloseTo(w - PORTRAIT_MARGIN);
    expect(box.top).toBeCloseTo(PORTRAIT_MARGIN);
    // Back button in the shell sits at top-left: left=12, top=12, w=44, h=44
    const backBtn = { left: 12, right: 56, top: 12, bottom: 56 };
    expect(rectsOverlap(box, backBtn)).toBe(false);
  });

  it.each(widths)('respects safe-area insets at width %i', (w) => {
    const h = screens[w];
    const insets: Insets = { top: 44, right: 16, bottom: 34, left: 16 };
    const l = hudLayout(w, h, ['lets-go', 'leave-it'], insets);
    const box = portraitBounds(l);

    // Top edge must clear insets.top + margin
    expect(box.top).toBeGreaterThanOrEqual((insets.top ?? 0) + PORTRAIT_MARGIN);
    // Right edge must clear within width - (insets.right + margin)
    expect(box.right).toBeLessThanOrEqual(w - (insets.right ?? 0) - PORTRAIT_MARGIN + 0.001);
  });

  it.each(widths)('overlaps no HUD control (joystick, marker, cues, sniff) at width %i', (w) => {
    const h = screens[w];
    const l = hudLayout(w, h, ['lets-go', 'leave-it']);
    const box = portraitBounds(l);

    const controls = [
      { name: 'joy', x: l.joyHome.x, y: l.joyHome.y, r: JOY_RADIUS },
      { name: 'marker', x: l.markerHome.x, y: l.markerHome.y, r: MARKER_RADIUS },
      { name: 'cueHome', x: l.cueHome.x, y: l.cueHome.y, r: CUE_RADIUS },
      { name: 'leaveItHome', x: l.leaveItHome.x, y: l.leaveItHome.y, r: CUE_RADIUS },
      { name: 'sniffHome', x: l.sniffHome.x, y: l.sniffHome.y, r: SNIFF_RADIUS },
    ];

    for (const ctrl of controls) {
      expect(circleRectOverlap(ctrl, box)).toBe(false);
    }
  });

  it.each(widths)('overlaps no Coach mark (move, mark) at width %i', (w) => {
    const h = screens[w];
    const l = hudLayout(w, h, ['lets-go', 'leave-it']);
    const box = portraitBounds(l);
    const coach = coachMarks(w, h, ['lets-go', 'leave-it']);

    const moveLabel = {
      left: coach.move.label.x,
      right: coach.move.label.x + coach.move.label.width,
      top: coach.move.label.y,
      bottom: coach.move.label.y + coach.move.label.height,
    };
    const markLabel = {
      left: coach.mark.label.x,
      right: coach.mark.label.x + coach.mark.label.width,
      top: coach.mark.label.y,
      bottom: coach.mark.label.y + coach.mark.label.height,
    };

    expect(rectsOverlap(box, moveLabel)).toBe(false);
    expect(rectsOverlap(box, markLabel)).toBe(false);
  });

  describe('touch isolation (readable-dog 4.4)', () => {
    it.each(widths)('identifies touches inside the portrait bounds at width %i', (w) => {
      const h = screens[w];
      const l = hudLayout(w, h);

      // Center of portrait
      expect(isPointInPortrait({ x: l.portrait.x, y: l.portrait.y }, l.portrait)).toBe(true);
      // Edge of portrait
      expect(isPointInPortrait({ x: l.portrait.x + l.portrait.size * 0.45, y: l.portrait.y }, l.portrait)).toBe(true);
      // Clearly outside portrait (e.g. at controls)
      expect(isPointInPortrait({ x: l.markerHome.x, y: l.markerHome.y }, l.portrait)).toBe(false);
      expect(isPointInPortrait({ x: l.joyHome.x, y: l.joyHome.y }, l.portrait)).toBe(false);
      expect(isPointInPortrait({ x: 20, y: 20 }, l.portrait)).toBe(false);
    });
  });
});
