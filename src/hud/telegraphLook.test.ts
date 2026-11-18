import { arcLook, ringLook, RING_CLOSED, RING_FIXED, RING_OPEN, SNAP_SECONDS } from './telegraphLook';

const ring = (over = {}) => ({ shown: true, progress: 0.5, phase: 'closing' as const, snap: false, ...over });
const rm = { reducedMotion: true };
const full = { reducedMotion: false };

describe('ringLook', () => {
  it('draws nothing when no ring is shown', () => {
    expect(ringLook(null, full)).toBeNull();
    expect(ringLook(ring({ shown: false }), full)).toBeNull();
  });

  it('closes the radius from open to closed with progress', () => {
    expect(ringLook(ring({ progress: 0, phase: 'open' }), full)!.radius).toBe(RING_OPEN);
    expect(ringLook(ring({ progress: 1 }), full)!.radius).toBe(RING_CLOSED);
    expect(ringLook(ring({ progress: 0.5 }), full)!.radius).toBeCloseTo((RING_OPEN + RING_CLOSED) / 2);
  });

  it('draws landed as a solid disc and Good as a dashed ring: different shapes, not colours', () => {
    const landed = ringLook(ring({ phase: 'landed', progress: 1 }), full)!;
    const good = ringLook(ring({ phase: 'good', progress: 1 }), { ...full, goodLeft: 0.4 })!;
    expect(landed.disc).toBe(true);
    expect(landed.dashed).toBe(false);
    expect(good.disc).toBe(false);
    expect(good.dashed).toBe(true);
    expect(good.fill).toBeCloseTo(0.4);
  });

  it('pulses the landed disc, but not with reduced motion', () => {
    const start = ringLook(ring({ phase: 'landed', progress: 1 }), { ...full, landedAge: 0 })!;
    const end = ringLook(ring({ phase: 'landed', progress: 1 }), { ...full, landedAge: 0.3 })!;
    expect(start.radius).toBeGreaterThan(end.radius);
    const a = ringLook(ring({ phase: 'landed', progress: 1 }), { ...rm, landedAge: 0 })!;
    const b = ringLook(ring({ phase: 'landed', progress: 1 }), { ...rm, landedAge: 0.3 })!;
    expect(a.radius).toBe(b.radius);
    expect(a.key).toBe(b.key);
  });

  it('flicks the open ring away on a snap, and fades the old fill to empty with reduced motion', () => {
    const snapped = ringLook(ring({ progress: 0, phase: 'open', snap: true }), { ...full, snapAge: 0.05, snapFromProgress: 0.8 })!;
    expect(snapped.ghost).not.toBeNull();
    expect(snapped.ghost!.radius).toBeLessThan(snapped.radius);
    expect(ringLook(ring({ progress: 0, phase: 'open' }), { ...full, snapAge: SNAP_SECONDS + 0.01, snapFromProgress: 0.8 })!.ghost).toBeNull();
    const early = ringLook(ring({ progress: 0, phase: 'open', snap: true }), { ...rm, snapAge: 0, snapFromProgress: 0.8 })!;
    const late = ringLook(ring({ progress: 0, phase: 'open', snap: true }), { ...rm, snapAge: 0.14, snapFromProgress: 0.8 })!;
    expect(early.alpha).toBeGreaterThan(late.alpha);
    expect(early.fill).toBeCloseTo(0.8);
  });

  it('reduced motion keeps one fixed radius and fills the arc with progress', () => {
    const a = ringLook(ring({ progress: 0.25 }), rm)!;
    const b = ringLook(ring({ progress: 0.75 }), rm)!;
    expect(a.radius).toBe(RING_FIXED);
    expect(b.radius).toBe(RING_FIXED);
    expect(a.fill).toBeCloseTo(0.25);
    expect(b.fill).toBeCloseTo(0.75);
  });

  it('keeps the change key steady inside one progress step, so idle frames do not redraw', () => {
    const a = ringLook(ring({ progress: 0.5 }), full)!.key;
    const b = ringLook(ring({ progress: 0.5 + 0.001 }), full)!.key;
    const c = ringLook(ring({ progress: 0.6 }), full)!.key;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
  });

  it('draws a fading ring dimmer', () => {
    expect(ringLook(ring({ phase: 'fading' }), full)!.alpha).toBeLessThan(1);
  });
});

describe('arcLook', () => {
  it('draws nothing without an arc, fills while building and closes to a disc on landing', () => {
    expect(arcLook(null)).toBeNull();
    const building = arcLook({ shown: true, progress: 0.4, phase: 'building' })!;
    expect(building.fill).toBeCloseTo(0.4);
    expect(building.disc).toBe(false);
    expect(arcLook({ shown: true, progress: 1, phase: 'landed' })!.disc).toBe(true);
    expect(arcLook({ shown: true, progress: 0.7, phase: 'fading' })!.alpha).toBeLessThan(1);
  });
});
