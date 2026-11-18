import { TIER_SECONDS, type FeedbackTier } from '../../hud/feedback';
import { alphaFade, bounceOffset, wobbleOffset } from '../../hud/effectsPool';

/** One frame of a burst: how it is drawn at `elapsed` seconds. Pure, so shell and bundle effects share their easing. */
export interface BurstFrame {
  /** 0 to 1; the fade in and out, the only thing that moves under reduced motion. */
  opacity: number;
  /** Offsets in points; 0 under reduced motion. */
  dx: number;
  dy: number;
  scale: number;
  /** How far the sparks or stars have spread, 0 to 1 (drawn fully spread and still under reduced motion). */
  spread: number;
  done: boolean;
}

/** What each tier shows, so a render test and the drawing agree. */
export const BURST_PARTS: Record<FeedbackTier, { word: boolean; icon: boolean; sparks: number; banner: boolean; comboCounter: boolean; puff: boolean }> = {
  small: { word: true, icon: true, sparks: 4, banner: false, comboCounter: false, puff: false },
  medium: { word: true, icon: true, sparks: 8, banner: false, comboCounter: true, puff: false },
  big: { word: true, icon: true, sparks: 10, banner: true, comboCounter: true, puff: false },
  wrong: { word: true, icon: true, sparks: 0, banner: false, comboCounter: false, puff: true },
};

export function burstFrame(tier: FeedbackTier, elapsed: number, reduced: boolean): BurstFrame {
  const seconds = TIER_SECONDS[tier];
  const opacity = alphaFade(elapsed, seconds);
  const done = elapsed >= seconds;
  if (reduced) return { opacity, dx: 0, dy: 0, scale: 1, spread: 1, done };
  const p = Math.min(1, Math.max(0, elapsed / seconds));
  switch (tier) {
    case 'small':
      return { opacity, dx: 0, dy: -6 * p, scale: 1 + 0.12 * Math.sin(p * Math.PI), spread: Math.min(1, elapsed / 0.2), done };
    case 'medium':
      return { opacity, dx: 0, dy: bounceOffset(elapsed, seconds), scale: 1, spread: Math.min(1, elapsed / 0.25), done };
    case 'big':
      return { opacity, dx: 0, dy: 0, scale: 1 + 0.1 * Math.sin(Math.min(1, elapsed / 0.3) * Math.PI), spread: Math.min(1, elapsed / 0.3), done };
    case 'wrong':
      // the word wobbles sideways a little and a grey puff drifts up; nothing shakes the screen and nothing flashes red
      return { opacity, dx: wobbleOffset(elapsed, seconds) * 0.6, dy: 0, scale: 1, spread: p, done };
  }
}
