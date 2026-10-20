import { es } from '../../i18n';
import { DOORBELL_MAT, newDoorbell, stepDoorbell } from '../nodes/doorbellMat';
import { agitatesDog, CANINE_POSTURES, doorbellPosture, holdPosture, LEASH_SEGMENTS, leashSegments, postureSpec, quantizeTension } from './canine';

describe('canine postures', () => {
  it('describes every posture with a spoken label from the catalog', () => {
    for (const posture of CANINE_POSTURES) expect(es[postureSpec(posture).label]).toBeTruthy();
  });

  it('leans forward harder when straining than when alert, and not at all when calm', () => {
    expect(postureSpec('straining').leanDeg).toBeGreaterThan(postureSpec('alert_barking').leanDeg);
    expect(postureSpec('calm_sphinx_on_mat').leanDeg).toBe(0);
    expect(postureSpec('calm_sphinx_on_mat').height).toBeLessThan(postureSpec('standing_waiting').height);
  });
});

describe('Doorbell Mat posture cycle', () => {
  it('goes standing, barking, settling, calm over a round', () => {
    let s = newDoorbell(7);
    const seen: string[] = [];
    for (let i = 0; i < 400 && s.round === 0 && !s.done; i++) {
      s = stepDoorbell(s, 0.05, false);
      if (s.round !== 0) break;
      const p = doorbellPosture(s, false);
      if (seen[seen.length - 1] !== p) seen.push(p);
    }
    expect(seen).toEqual(['standing_waiting', 'alert_barking', 'settling_towards_mat', 'calm_sphinx_on_mat']);
  });

  it('keeps the Dog barking after an early Mark', () => {
    const s = stepDoorbell(newDoorbell(7), 0.05, true);
    expect(s.outcomes).toEqual(['early']);
    expect(agitatesDog('early')).toBe(true);
    expect(doorbellPosture(s, agitatesDog('early'))).toBe('alert_barking');
  });

  it('does not agitate the Dog for a hit or a late Mark', () => {
    expect(agitatesDog('hit')).toBe(false);
    expect(agitatesDog('late')).toBe(false);
  });

  it('shows the calm posture when marking during the window', () => {
    let s = newDoorbell(3);
    while (s.phase !== 'calm') s = stepDoorbell(s, 0.05, false);
    expect(doorbellPosture(s, false)).toBe('calm_sphinx_on_mat');
    expect(stepDoorbell(s, 0.05, true).outcomes).toEqual(['hit']);
    expect(DOORBELL_MAT.markWindow).toBeGreaterThan(0);
  });
});

describe('hold minigame posture and leash', () => {
  it('strains under tension and goes slack as it eases', () => {
    expect(holdPosture(0.9, false)).toBe('straining');
    expect(holdPosture(0.2, false)).toBe('slack');
  });

  it('lunges again after a premature release', () => {
    expect(holdPosture(0, true)).toBe('straining');
  });

  it('quantizes tension to steps in range', () => {
    expect(quantizeTension(0.34)).toBe(0.3);
    expect(quantizeTension(-1)).toBe(0);
    expect(quantizeTension(3)).toBe(1);
  });

  const from = { x: 0, y: 0 };
  const to = { x: 200, y: 0 };
  const lowest = (t: number) => Math.max(...leashSegments(t, from, to, 40).map((s) => s.y));

  it('sags when slack and runs straight when rigid', () => {
    expect(leashSegments(1, from, to, 40)).toHaveLength(LEASH_SEGMENTS);
    expect(lowest(1)).toBeCloseTo(0);
    expect(lowest(0)).toBeGreaterThan(15);
    expect(lowest(0.5)).toBeLessThan(lowest(0));
  });

  it('spans the handler to the dog', () => {
    const total = leashSegments(1, from, to, 40).reduce((sum, s) => sum + s.length, 0);
    expect(total).toBeCloseTo(200);
    expect(leashSegments(0, from, to, 40).reduce((sum, s) => sum + s.length, 0)).toBeGreaterThan(200);
  });
});
