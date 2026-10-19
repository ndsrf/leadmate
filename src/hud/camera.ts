import type { Vec2 } from '../sim/vec';

import type { CameraConfig } from '../sim/config';
import { defaultScenario } from '../sim/config';

export const defaultCamera: CameraConfig = defaultScenario.camera;

/**
 * Target zoom from the Handler-Dog distance: zoomed in when close, out toward the leash limit,
 * never further than the zoom that keeps both inside the viewport (`handler`/`dog` are projected
 * screen positions).
 */
export function targetZoom(
  distance: number,
  leashLength: number,
  handler: Vec2,
  dog: Vec2,
  viewport: { width: number; height: number },
  baseZoom: number,
  cfg: CameraConfig = defaultCamera,
): number {
  const t = Math.min(1, Math.max(0, distance / leashLength));
  const desired = baseZoom * (cfg.closeZoom + (cfg.farZoom - cfg.closeZoom) * t);
  const spanX = Math.abs(handler.x - dog.x) + 2 * cfg.padding;
  const spanY = Math.abs(handler.y - dog.y) + 2 * cfg.padding;
  const fit = Math.min(viewport.width / spanX, viewport.height / spanY);
  return Math.min(desired, fit);
}

/** Moves `current` toward `target` over `deltaMs`, framerate independent. */
export function smoothZoom(current: number, target: number, deltaMs: number, cfg: CameraConfig = defaultCamera): number {
  return current + (target - current) * (1 - Math.exp((-cfg.smoothing * deltaMs) / 1000));
}
