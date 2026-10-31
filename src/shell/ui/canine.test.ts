import { es } from '../../i18n';
import { correctAction, type DogState } from '../nodes/readDog';
import { atDoor, livingRoomSpot, sendsAway, CANINE_POSTURES, DOG_VIEW, emotePoint, holdPosture, COAT_PALETTE, COLLAR_POINT, handlerHand, leashPath, postureSpec, quantizeTension, READABLE_POSTURES, tensionTone, wrongReaction } from './canine';

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

describe('readable Dog states', () => {
  it('gives every posture a spoken label, an on-screen cue, a collar point and an emote point', () => {
    for (const posture of CANINE_POSTURES) {
      const spec = postureSpec(posture);
      expect(es[spec.label]).toBeTruthy();
      expect(es[spec.cue]).toBeTruthy();
      expect(COLLAR_POINT[posture]).toBeDefined();
      expect(emotePoint(posture).y).toBeGreaterThanOrEqual(0);
    }
  });

  it('tells any two readable states apart by pose and by at least one other feature', () => {
    for (const a of READABLE_POSTURES) {
      for (const b of READABLE_POSTURES) {
        if (a >= b) continue;
        const x = postureSpec(a);
        const y = postureSpec(b);
        expect(x.leanDeg !== y.leanDeg || x.height !== y.height).toBe(true);
        // the emote bubble does not count: the body must tell them apart
        const other = x.tail !== y.tail || x.earsUp !== y.earsUp || x.mouthOpen !== y.mouthOpen || x.eyes !== y.eyes;
        expect(other).toBe(true);
      }
    }
  });

  it('draws the readable states that name an emotion with an emote', () => {
    expect(postureSpec('jumping').emote).toBe('alert');
    expect(postureSpec('sniffing').emote).toBe('distracted');
    expect(postureSpec('sitting_attentive').emote).toBe('love');
    expect(postureSpec('relaxed_lying').emote).toBe('sleepy');
  });

  it('keeps the emote bubble inside the drawing', () => {
    for (const posture of CANINE_POSTURES) {
      const p = emotePoint(posture);
      expect(p.x).toBeLessThanOrEqual(DOG_VIEW.w - 14);
      expect(p.y).toBeGreaterThanOrEqual(14);
    }
  });

  it('has a different correct action for the aroused, distracted, attentive and relaxed Dog', () => {
    const right = (s: DogState) => correctAction('harness', s);
    expect(new Set([right('jumping'), right('sniffing'), right('sitting_attentive'), right('relaxed_lying')]).size).toBe(4);
  });
});

describe('wrong action reactions', () => {
  it('refuses a harness by backing away', () => {
    expect(wrongReaction('sitting_attentive', 'harness')).toBe('standing_waiting');
  });

  it('leaves an aroused Dog aroused', () => {
    expect(wrongReaction('jumping', 'marker')).toBe('jumping');
    expect(wrongReaction('alert_barking', 'wait')).toBe('alert_barking');
    expect(wrongReaction('staring_door', 'cue')).toBe('staring_door');
  });

  it('makes a calmer Dog jump up', () => {
    expect(wrongReaction('relaxed_lying', 'cue')).toBe('jumping');
    expect(wrongReaction('sniffing', 'marker')).toBe('jumping');
  });

  it('keeps the Dog at the door only for the door postures, so a reaction on the mat stays there', () => {
    expect(atDoor('alert_barking')).toBe(true);
    expect(atDoor('staring_door')).toBe(true);
    expect(atDoor('relaxed_lying')).toBe(false);
    expect(atDoor(wrongReaction('unsettled_on_mat', 'marker'))).toBe(false);
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

describe('Basics Dog states', () => {
  it('reads every state of every scene, each with its own caption', () => {
    for (const state of ['begging_lift', 'on_furniture', 'nudging_attention', 'toy_indoors', 'resting', 'barking_nonstop', 'zoomies'] as const) {
      expect(READABLE_POSTURES).toContain(state);
      expect(es[postureSpec(state).cue]).toBeTruthy();
      expect(es[postureSpec(state).label]).toBeTruthy();
    }
    expect(new Set(READABLE_POSTURES.map((p) => postureSpec(p).cue)).size).toBe(READABLE_POSTURES.length);
  });

  it('draws resting curled up asleep, unlike lying relaxed', () => {
    expect(postureSpec('resting').height).toBeLessThan(postureSpec('relaxed_lying').height);
    expect(postureSpec('resting').tail).toBe('curled');
    expect(postureSpec('resting').eyes).toBe('closed');
  });

  it('draws barking nonstop facing the user with its own emote, unlike barking at the door', () => {
    expect(postureSpec('barking_nonstop').leanDeg).not.toBe(postureSpec('alert_barking').leanDeg);
    expect(postureSpec('barking_nonstop').eyes).not.toBe(postureSpec('alert_barking').eyes);
    expect(postureSpec('barking_nonstop').emote).toBe('bark');
  });

  it('places the Dog on the sofa, in its bed or on the floor of the living room', () => {
    expect(livingRoomSpot('on_furniture')).toBe('sofa');
    expect(livingRoomSpot('relaxed_lying')).toBe('bed');
    expect(livingRoomSpot('resting')).toBe('bed');
    expect(livingRoomSpot('nudging_attention')).toBe('floor');
  });

  it('sends the Dog off only with Send away and Send to bed', () => {
    expect(sendsAway('send-away')).toBe(true);
    expect(sendsAway('send-bed')).toBe(true);
    expect(sendsAway('cuddle')).toBe(false);
    expect(sendsAway(null)).toBe(false);
  });

  it('gets more excited after a Cuddle, and ignores a Cue while barking nonstop or racing around', () => {
    expect(wrongReaction('begging_lift', 'cuddle')).toBe('jumping');
    expect(wrongReaction('on_furniture', 'cuddle')).toBe('jumping');
    expect(wrongReaction('barking_nonstop', 'cue')).toBe('barking_nonstop');
    expect(wrongReaction('zoomies', 'cue')).toBe('zoomies');
  });
});
