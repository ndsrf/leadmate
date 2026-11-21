import { TIER_SECONDS, type FeedbackTier } from '../../hud/feedback';
import { BURST_PARTS, burstFrame } from './feedbackBurstFrame';

const TIERS: FeedbackTier[] = ['small', 'medium', 'big', 'wrong'];

describe('burstFrame', () => {
  it('lasts TIER_SECONDS for each tier and then is done and invisible', () => {
    for (const t of TIERS) {
      expect(burstFrame(t, TIER_SECONDS[t] - 0.01, false).done).toBe(false);
      const end = burstFrame(t, TIER_SECONDS[t], false);
      expect(end.done).toBe(true);
      expect(end.opacity).toBe(0);
    }
  });

  it('fades in and out under reduced motion with no movement, scale or travel', () => {
    for (const t of TIERS) {
      for (const e of [0.05, TIER_SECONDS[t] / 2, TIER_SECONDS[t] - 0.05]) {
        const f = burstFrame(t, e, true);
        expect([f.dx, f.dy, f.scale, f.spread]).toEqual([0, 0, 1, 1]);
      }
      expect(burstFrame(t, 0.05, true).opacity).toBeLessThan(1);
      expect(burstFrame(t, TIER_SECONDS[t] / 2, true).opacity).toBe(1);
    }
  });

  it('moves only the wrong word sideways, and only a little', () => {
    for (const t of TIERS) {
      const dxs = [0.1, 0.2, 0.3, 0.4, 0.5].map((e) => Math.abs(burstFrame(t, e, false).dx));
      if (t === 'wrong') expect(Math.max(...dxs)).toBeGreaterThan(0);
      else expect(Math.max(...dxs)).toBe(0);
      expect(Math.max(...dxs)).toBeLessThanOrEqual(8);
    }
  });

  it('gives each tier its parts: banner and Combo counter only at big, Combo counter from medium, puff only for wrong', () => {
    expect(BURST_PARTS.small).toMatchObject({ banner: false, comboCounter: false, puff: false });
    expect(BURST_PARTS.medium).toMatchObject({ banner: false, comboCounter: true });
    expect(BURST_PARTS.big).toMatchObject({ banner: true, comboCounter: true });
    expect(BURST_PARTS.wrong).toMatchObject({ puff: true, sparks: 0 });
    for (const t of TIERS) expect(BURST_PARTS[t]).toMatchObject({ word: true, icon: true });
  });
});
