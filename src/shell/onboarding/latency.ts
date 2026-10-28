export const BAND_LIMITS = { quick: 0.35, slow: 0.55 } as const;

export type LatencyBand = 'quick' | 'steady' | 'slow';

export function latencyBand(latency: number): LatencyBand {
  return latency < BAND_LIMITS.quick ? 'quick' : latency < BAND_LIMITS.slow ? 'steady' : 'slow';
}
