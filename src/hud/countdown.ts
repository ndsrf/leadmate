import type { ScenarioConfig } from '../sim/config';

/** Swallows the rounding left by adding up fixed steps, so a whole second is not shown one tick late. */
const TIME_EPSILON = 1e-6;

/**
 * Whole seconds left on a Stage's countdown after `time` seconds of simulation, down to 0 when the time is up;
 * null for a Stage that shows none. It follows the simulation clock, so it stands still while the Stage does.
 */
export function countdownSeconds(config: Pick<ScenarioConfig, 'countdown' | 'endCondition'>, time: number): number | null {
  if (!config.countdown || config.endCondition.kind !== 'time-limit') return null;
  const { seconds } = config.endCondition;
  // 0 only on the same test that ends the Stage: the rounding below must not get there a step early
  if (time >= seconds) return 0;
  return Math.max(1, Math.ceil(seconds - time - TIME_EPSILON));
}
