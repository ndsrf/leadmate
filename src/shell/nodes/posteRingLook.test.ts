import { RING_FIXED, RING_OPEN } from '../../hud/telegraphLook';
import { posteRingDrawing, POSTE_RING_SCALE } from './posteRingLook';

describe('Poste practice ring look', () => {
  it('closes with the hold: open at no hold, smaller later', () => {
    const open = posteRingDrawing({ progress: 0, phase: 'open', snap: false }, { reducedMotion: false })!;
    const mid = posteRingDrawing({ progress: 0.5, phase: 'closing', snap: false }, { reducedMotion: false })!;
    expect(open.rx).toBeCloseTo(RING_OPEN * POSTE_RING_SCALE);
    expect(mid.rx).toBeLessThan(open.rx);
    expect(mid.ry).toBeCloseTo(mid.rx / 2);
  });

  it('lands as a solid disc on settling', () => {
    expect(posteRingDrawing({ progress: 1, phase: 'landed', snap: false }, { reducedMotion: false })!.look.disc).toBe(true);
  });

  it('flicks a ghost ring on release, and with reduced motion fills a fixed ring instead', () => {
    const snap = posteRingDrawing({ progress: 0, phase: 'open', snap: true }, { reducedMotion: false, snapAge: 0.05, snapFromProgress: 0.7 })!;
    expect(snap.look.ghost).not.toBeNull();
    const rm = posteRingDrawing({ progress: 0.4, phase: 'closing', snap: false }, { reducedMotion: true })!;
    expect(rm.rx).toBeCloseTo(RING_FIXED * POSTE_RING_SCALE);
    expect(rm.look.fill).toBeCloseTo(0.4);
  });
});
