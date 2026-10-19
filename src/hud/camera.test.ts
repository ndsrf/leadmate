import { defaultCamera, smoothZoom, targetZoom } from './camera';
import { project } from './iso';
import { defaultScenario } from '../sim/config';

const view = { width: 800, height: 400 };
const L = defaultScenario.leashLength;
const zoomFor = (d: number, v = view) =>
  targetZoom(d, L, project({ x: 0, y: 0 }), project({ x: d, y: 0 }), v, 1);

describe('camera zoom', () => {
  it('zooms in more when close than at the leash limit', () => {
    expect(zoomFor(0.5)).toBeGreaterThan(zoomFor(L));
  });

  it('keeps the zoom within the limits', () => {
    expect(zoomFor(0)).toBeCloseTo(defaultCamera.closeZoom);
    expect(zoomFor(L)).toBeCloseTo(defaultCamera.farZoom);
    expect(zoomFor(L * 3)).toBeCloseTo(defaultCamera.farZoom);
  });

  it('keeps both inside the view at the leash limit, even on a small viewport', () => {
    for (const v of [view, { width: 320, height: 180 }]) {
      const z = zoomFor(L, v);
      const dx = Math.abs(project({ x: L, y: 0 }).x);
      const dy = Math.abs(project({ x: L, y: 0 }).y);
      expect(dx * z).toBeLessThanOrEqual(v.width);
      expect(dy * z).toBeLessThanOrEqual(v.height);
    }
  });

  it('smooths toward the target without overshoot', () => {
    const a = smoothZoom(1, 2, 16);
    expect(a).toBeGreaterThan(1);
    expect(a).toBeLessThan(2);
    expect(smoothZoom(1, 2, 100000)).toBeCloseTo(2);
  });
});
