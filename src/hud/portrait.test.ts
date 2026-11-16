import type { DogPose } from './pose';
import { portraitLayers, PORTRAIT_LAYER_NAMES, type PortraitLayers } from './portrait';

function mockPose(overrides: Partial<DogPose> = {}): DogPose {
  return {
    tier: 'calm',
    headUp: false,
    headDown: false,
    barking: false,
    lunging: false,
    trotting: false,
    flowGlow: false,
    gaze: 'ahead',
    head: 'level',
    ears: 'neutral',
    tail: 'neutral',
    action: 'walk',
    ...overrides,
  };
}

describe('Dog portrait layer mapping (readable-dog 4.2, 4.3)', () => {
  it('stacks in the order tail, body, head, ears, eyes (design Decision 5)', () => {
    const p = portraitLayers(mockPose());
    expect(p.ordered).toEqual([p.tail, p.body, p.head, p.ears, p.eyes]);
    expect(p.body).toBe('portrait_body');
  });

  describe('Canine Posture situations', () => {
    it('calm walking: level head, neutral ears, neutral tail, forward-facing eyes', () => {
      const p = portraitLayers(mockPose({ head: 'level', ears: 'neutral', tail: 'neutral', gaze: 'ahead' }));
      expect(p).toMatchObject({
        body: 'portrait_body',
        head: 'portrait_head_level',
        ears: 'portrait_ears_neutral',
        eyes: 'portrait_eyes_right',
        tail: 'portrait_tail_neutral',
      });
    });

    it('Check-in: viewer head, forward ears, wagging tail, handler eyes', () => {
      const p0 = portraitLayers(mockPose({ head: 'level', ears: 'forward', tail: 'wagging', gaze: 'handler' }), 0);
      expect(p0).toMatchObject({
        head: 'portrait_head_viewer',
        ears: 'portrait_ears_forward',
        eyes: 'portrait_eyes_handler',
        tail: 'portrait_tail_wag_a',
      });

      const p1 = portraitLayers(mockPose({ head: 'level', ears: 'forward', tail: 'wagging', gaze: 'handler' }), 1);
      expect(p1.tail).toBe('portrait_tail_wag_b');
    });

    it('Check-in with reduced motion: still high tail, no wag animation', () => {
      const p0 = portraitLayers(mockPose({ head: 'level', ears: 'forward', tail: 'wagging', gaze: 'handler' }), 0, { reducedMotion: true });
      const p1 = portraitLayers(mockPose({ head: 'level', ears: 'forward', tail: 'wagging', gaze: 'handler' }), 1, { reducedMotion: true });
      expect(p0.tail).toBe('portrait_tail_high');
      expect(p1.tail).toBe('portrait_tail_high');
    });

    it('Alert: head up, ears forward, tail high', () => {
      const p = portraitLayers(mockPose({ head: 'up', ears: 'forward', tail: 'high', gaze: 'ahead' }));
      expect(p).toMatchObject({
        head: 'portrait_head_up',
        ears: 'portrait_ears_forward',
        tail: 'portrait_tail_high',
        eyes: 'portrait_eyes_right',
      });
    });

    it('Reactive and fixated / lunging: head up, ears forward, tail high', () => {
      const p = portraitLayers(mockPose({ head: 'up', ears: 'forward', tail: 'high', gaze: 'distractor', action: 'lunging' }));
      expect(p).toMatchObject({
        head: 'portrait_head_up',
        ears: 'portrait_ears_forward',
        tail: 'portrait_tail_high',
        eyes: 'portrait_eyes_right',
      });
    });

    it('Rigid Pull without fixation: ears back', () => {
      const p = portraitLayers(mockPose({ head: 'level', ears: 'back', tail: 'neutral' }));
      expect(p.ears).toBe('portrait_ears_back');
    });

    it('sniffing: head down, eyes down, neutral tail', () => {
      const p = portraitLayers(mockPose({ head: 'down', gaze: 'ground', tail: 'neutral' }));
      expect(p).toMatchObject({
        head: 'portrait_head_down',
        eyes: 'portrait_eyes_down',
        tail: 'portrait_tail_neutral',
      });
    });

    it('looking away left: head turned left, eyes left', () => {
      const p = portraitLayers(mockPose({ gaze: 'away-left' }));
      expect(p.head).toBe('portrait_head_left');
      expect(p.eyes).toBe('portrait_eyes_left');
    });

    it('looking away right: head turned right, eyes right', () => {
      const p = portraitLayers(mockPose({ gaze: 'away-right' }));
      expect(p.head).toBe('portrait_head_right');
      expect(p.eyes).toBe('portrait_eyes_right');
    });

    it('tucked tail: portrait_tail_tucked', () => {
      const p = portraitLayers(mockPose({ tail: 'tucked' }));
      expect(p.tail).toBe('portrait_tail_tucked');
    });
  });

  describe('wag step', () => {
    it('alternates tail frames on wag step only when tail is wagging', () => {
      const wagging = mockPose({ tail: 'wagging' });
      expect(portraitLayers(wagging, 0).tail).toBe('portrait_tail_wag_a');
      expect(portraitLayers(wagging, 1).tail).toBe('portrait_tail_wag_b');
      expect(portraitLayers(wagging, 2).tail).toBe('portrait_tail_wag_a');
      expect(portraitLayers(wagging, 3).tail).toBe('portrait_tail_wag_b');

      const neutral = mockPose({ tail: 'neutral' });
      expect(portraitLayers(neutral, 0).tail).toBe('portrait_tail_neutral');
      expect(portraitLayers(neutral, 1).tail).toBe('portrait_tail_neutral');
    });
  });

  describe('atlas completeness', () => {
    it('reaches every one of the 19 frames in the portrait atlas', () => {
      const reached = new Set<string>();
      const poses: DogPose[] = [
        mockPose({ head: 'level', gaze: 'ahead', ears: 'neutral', tail: 'neutral' }),
        mockPose({ head: 'up', gaze: 'distractor', ears: 'forward', tail: 'high' }),
        mockPose({ head: 'down', gaze: 'ground', ears: 'neutral', tail: 'tucked' }),
        mockPose({ head: 'level', gaze: 'handler', ears: 'back', tail: 'wagging' }),
        mockPose({ head: 'level', gaze: 'away-left', ears: 'forward', tail: 'neutral' }),
        mockPose({ head: 'level', gaze: 'away-right', ears: 'forward', tail: 'neutral' }),
      ];

      for (const pose of poses) {
        for (const step of [0, 1]) {
          const l = portraitLayers(pose, step);
          for (const f of l.ordered) reached.add(f);
        }
      }

      for (const name of PORTRAIT_LAYER_NAMES) {
        expect(reached.has(name)).toBe(true);
      }
      expect(reached.size).toBe(19);
    });
  });
});
