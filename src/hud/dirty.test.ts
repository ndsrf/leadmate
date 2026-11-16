import { createChangeDetector, portraitDirtyKey, quantize, wagStep, WAG_HZ } from './dirty';
import type { DogPose } from './pose';
import { closeHudLayout } from './layout';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('createChangeDetector', () => {
  it('reports the first key and any different key, not a repeat', () => {
    const d = createChangeDetector();
    expect(d.changed('a')).toBe(true);
    expect(d.changed('a')).toBe(false);
    expect(d.changed('b')).toBe(true);
    expect(d.changed('b')).toBe(false);
    expect(d.changed('a')).toBe(true);
  });

  it('reports a change again after a reset', () => {
    const d = createChangeDetector();
    d.changed('a');
    d.reset();
    expect(d.changed('a')).toBe(true);
  });

  it('tells apart number keys that differ in the last digit', () => {
    const d = createChangeDetector();
    expect(d.changed(`${0.1 + 0.2},1`)).toBe(true);
    expect(d.changed(`${0.3},1`)).toBe(true);
  });
});

describe('quantize', () => {
  it('keeps a countdown ring key unchanged between visible steps', () => {
    const d = createChangeDetector();
    // a 6 s Go Sniff offer drawn at 30 frames/s: 180 frames, the key changes once per 1/48 of the ring
    let redraws = 0;
    for (let frame = 0; frame <= 180; frame++) if (d.changed(String(quantize(1 - frame / 180)))) redraws++;
    expect(redraws).toBe(49);
  });

  it('maps the ends of the range to 0 and the step count', () => {
    expect(quantize(0)).toBe(0);
    expect(quantize(1)).toBe(48);
    expect(quantize(0.5, 10)).toBe(5);
  });
});

describe('effect dirty tracking (Task 3.4)', () => {
  it('does no redraw work during a quiet period after an effect finishes', () => {
    const d = createChangeDetector();
    const effectKey = (active: boolean, progress: number) => (active ? `effect:${quantize(progress, 20)}` : 'effect:idle');

    // Quiet before: no redraws after initial frame
    expect(d.changed(effectKey(false, 0))).toBe(true);
    expect(d.changed(effectKey(false, 0))).toBe(false);
    expect(d.changed(effectKey(false, 0))).toBe(false);

    // Active effect playing
    let redrawsWhileActive = 0;
    for (let frame = 0; frame <= 20; frame++) {
      if (d.changed(effectKey(true, frame / 20))) redrawsWhileActive++;
    }
    expect(redrawsWhileActive).toBeGreaterThan(0);

    // Quiet walk after: finishes into idle
    expect(d.changed(effectKey(false, 0))).toBe(true); // final transition to idle
    // Subsequent quiet frames do 0 redraws!
    let quietRedraws = 0;
    for (let quietFrame = 0; quietFrame < 60; quietFrame++) {
      if (d.changed(effectKey(false, 0))) quietRedraws++;
    }
    expect(quietRedraws).toBe(0);
  });
});

describe('Dog portrait dirty tracking (readable-dog 4.3)', () => {
  const calm: Pick<DogPose, 'gaze' | 'head' | 'ears' | 'tail'> = {
    head: 'level',
    ears: 'neutral',
    tail: 'neutral',
    gaze: 'ahead',
  };

  it('keeps unchanged calm pose clean over time (0 redraws after initial draw)', () => {
    const d = createChangeDetector();
    let redraws = 0;
    // 30 frames over 1 second of calm walking
    for (let frame = 0; frame < 30; frame++) {
      const time = frame / 30;
      if (d.changed(portraitDirtyKey(calm, time))) redraws++;
    }
    expect(redraws).toBe(1); // Only the initial draw
  });

  it('redraws when the Canine Posture state changes', () => {
    const d = createChangeDetector();
    d.changed(portraitDirtyKey(calm, 0));

    const alert: typeof calm = { ...calm, head: 'up', ears: 'forward', tail: 'high' };
    expect(d.changed(portraitDirtyKey(alert, 0.05))).toBe(true);
    expect(d.changed(portraitDirtyKey(alert, 0.1))).toBe(false);

    const checkIn: typeof calm = { ...calm, gaze: 'handler', ears: 'forward', tail: 'wagging' };
    expect(d.changed(portraitDirtyKey(checkIn, 0.15))).toBe(true);
  });

  it('redraws only on a wag step at 4 Hz when tail is wagging', () => {
    const d = createChangeDetector();
    const wagging: typeof calm = { ...calm, gaze: 'handler', ears: 'forward', tail: 'wagging' };

    // In 1 second at 30 fps (30 frames), a 4 Hz wag has 4 step transitions
    let redraws = 0;
    for (let frame = 0; frame < 30; frame++) {
      const time = frame / 30;
      if (d.changed(portraitDirtyKey(wagging, time))) redraws++;
    }
    // Initial draw at frame 0, plus 3 subsequent step flips = 4 draws in 1 second
    expect(redraws).toBe(WAG_HZ);
  });

  it('never animates wag under reduced motion (0 redraws over time)', () => {
    const d = createChangeDetector();
    const wagging: typeof calm = { ...calm, gaze: 'handler', ears: 'forward', tail: 'wagging' };

    let redraws = 0;
    for (let frame = 0; frame < 30; frame++) {
      const time = frame / 30;
      if (d.changed(portraitDirtyKey(wagging, time, { reducedMotion: true }))) redraws++;
    }
    expect(redraws).toBe(1); // Only the initial draw
  });

  it('never shows a Dog portrait in close exercises (readable-dog 4.3)', () => {
    // 1. Close HUD layout must only contain gather, poste and marker buttons (no portrait)
    const layout = closeHudLayout(360, 740) as unknown as Record<string, unknown>;
    expect(layout.portrait).toBeUndefined();
    expect(layout.portraitHome).toBeUndefined();

    // 2. CloseExerciseScene source code must not import or load the portrait atlas or draw a portrait
    const closeSceneSrc = readFileSync(join(__dirname, '../../bundle/src/CloseExerciseScene.ts'), 'utf8');
    expect(closeSceneSrc).not.toContain('assets/portrait');
    expect(closeSceneSrc).not.toContain('PORTRAIT_ATLAS');
    expect(closeSceneSrc).not.toContain('portraitLayers');
    expect(closeSceneSrc).not.toContain('drawPortrait');
  });
});
