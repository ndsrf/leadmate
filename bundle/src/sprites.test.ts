import {
  caninePostureFrame,
  closePivotOf,
  distractorCloseFrame,
  handlerStanceFrame,
  hasCloseFrame,
} from './sprites';
import type { CaninePosture, ShieldSide } from '../../src/sim/closeExercise';

describe('close exercise sprite loader and frame mapping (Task 2.2)', () => {
  it('identifies and verifies presence of all close-up canine posture frames', () => {
    const postures: CaninePosture[] = ['neutral', 'alert', 'strained', 'relaxed', 'head_turn'];
    for (const posture of postures) {
      const frameName = caninePostureFrame(posture);
      expect(hasCloseFrame(frameName)).toBe(true);

      const pivot = closePivotOf(frameName);
      expect(pivot.x).toBeCloseTo(0.5);
      expect(pivot.y).toBeCloseTo(0.9);
    }
  });

  it('maps handler stance states to dedicated close-up frames', () => {
    expect(hasCloseFrame(handlerStanceFrame('none', false, false))).toBe(true);
    expect(handlerStanceFrame('none', false, false)).toBe('handler_close_torso');

    expect(hasCloseFrame(handlerStanceFrame('none', false, true))).toBe(true);
    expect(handlerStanceFrame('none', false, true)).toBe('handler_close_hands_gather');

    expect(hasCloseFrame(handlerStanceFrame('left', false, false))).toBe(true);
    expect(handlerStanceFrame('left', false, false)).toBe('handler_close_shield_left');

    expect(hasCloseFrame(handlerStanceFrame('right', false, false))).toBe(true);
    expect(handlerStanceFrame('right', false, false)).toBe('handler_close_shield_right');

    expect(hasCloseFrame(handlerStanceFrame('right', true, false))).toBe(true);
    expect(handlerStanceFrame('right', true, false)).toBe('handler_close_anchor');
  });

  it('maps distractor dog postures and animation cycles', () => {
    const walk0 = distractorCloseFrame('calm', 0);
    const walk1 = distractorCloseFrame('calm', 15);
    expect(hasCloseFrame(walk0)).toBe(true);
    expect(hasCloseFrame(walk1)).toBe(true);
    expect(walk0).toBe('distractor_close_walk0');
    expect(walk1).toBe('distractor_close_walk1');

    const alert = distractorCloseFrame('alert', 0);
    expect(hasCloseFrame(alert)).toBe(true);
    expect(alert).toBe('distractor_close_alert');

    const lunge = distractorCloseFrame('reactive', 0);
    expect(hasCloseFrame(lunge)).toBe(true);
    expect(lunge).toBe('distractor_close_lunge');
  });

  it('verifies environment scenery frames exist in atlas', () => {
    expect(hasCloseFrame('pavement_narrow_path')).toBe(true);
    expect(hasCloseFrame('street_curb')).toBe(true);
  });
});

describe('control scheme offers (task 2.1)', () => {
  it('hides the shield and cue controls for the hand drill, and keeps the three drill controls', () => {
    const { closeControlsOffered } = require('./sprites');
    expect(closeControlsOffered('hand_drill')).toEqual({ gather: true, poste: true, marker: true, shield: false, cue: false });
    expect(closeControlsOffered('leash_drill').shield).toBe(true);
  });
});
