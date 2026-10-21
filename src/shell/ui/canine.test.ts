import { es } from '../../i18n';
import { DOORBELL_MAT, newDoorbell, stepDoorbell } from '../nodes/doorbellMat';
import { agitatesDog, CANINE_POSTURES, doorbellPosture, holdPosture, COAT_PALETTE, COLLAR_POINT, handlerHand, leashPath, postureSpec, quantizeTension, tensionTone } from './canine';

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

  const from = { x: 0, y: 40 };
  const to = { x: 200, y: 40 };
  const controlY = (tension: number) => Number(/Q[\d.-]+ ([\d.-]+)/.exec(leashPath(tension, from, to, 40))?.[1]);

  it('sags when slack and runs straight when rigid', () => {
    expect(controlY(1)).toBe(40);
    expect(controlY(0)).toBe(80);
    expect(controlY(0.5)).toBeLessThan(controlY(0));
  });

  it('starts at the hand and ends at the collar', () => {
    expect(leashPath(0.3, from, to, 40)).toMatch(/^M0 40 Q100 [\d.]+ 200 40$/);
  });

  it('reads calm, warm and high tension', () => {
    expect(tensionTone(0)).toBe('calm');
    expect(tensionTone(0.5)).toBe('warn');
    expect(tensionTone(0.9)).toBe('high');
  });

  it('moves the hand back as the Handler leans against a pull', () => {
    expect(handlerHand(1).x).toBeLessThan(handlerHand(0).x);
    expect(handlerHand(0)).toEqual({ x: 62, y: 98 });
  });
});

describe('canine drawing data', () => {
  it('gives every posture a collar point inside the drawing', () => {
    for (const posture of CANINE_POSTURES) {
      const c = COLLAR_POINT[posture];
      expect(c.x).toBeGreaterThan(0);
      expect(c.x).toBeLessThan(160);
      expect(c.y).toBeLessThan(110);
    }
  });

  it('has a coat palette for every Dog coat', () => {
    expect(Object.keys(COAT_PALETTE).sort()).toEqual(['black', 'chocolate', 'cream', 'golden', 'grey', 'red', 'white']);
  });
});
