import {
  createEffectsTracker,
  iconForKind,
  MAX_EFFECT_PARTICLES,
  meterBadgeFrame,
  particleBurst,
  wobbleOffset,
  bounceOffset,
  alphaFade,
} from './effectsPool';

describe('effectsPool constants & icons (Task 3.2)', () => {
  it('caps total particles at 40', () => {
    expect(MAX_EFFECT_PARTICLES).toBe(40);
  });

  it('maps wrong kinds to icon_puff and never a red icon', () => {
    expect(iconForKind('missed-reward-window', 'wrong')).toBe('icon_puff');
    expect(iconForKind('late-marker-press', 'wrong')).toBe('icon_puff');
    expect(iconForKind('reactive-marker', 'wrong')).toBe('icon_puff');
    expect(iconForKind('rigid-pull', 'wrong')).toBe('icon_puff');
  });

  it('maps right actions to their distinct spec icons', () => {
    expect(iconForKind('followed-turn', 'right')).toBe('icon_paw');
    expect(iconForKind('check-in-hit', 'right')).toBe('icon_eye');
    expect(iconForKind('go-sniff', 'right')).toBe('icon_nose');
    expect(iconForKind('poste', 'right')).toBe('icon_hourglass');
    expect(iconForKind('sintonia', 'right')).toBe('icon_sparkle');
    expect(iconForKind('disengagement', 'right')).toBe('icon_star');
    expect(iconForKind('marker-hit', 'right')).toBe('icon_mark');
  });

  it('maps content meter icon names to HUD atlas frames', () => {
    // Content nodes declare icon: nose or icon: eye
    expect(meterBadgeFrame('nose', 'nose')).toBe('meter_nose');
    expect(meterBadgeFrame('eye', 'connection')).toBe('meter_connection');
    expect(meterBadgeFrame(undefined, 'nose')).toBe('meter_nose');
    expect(meterBadgeFrame(undefined, 'connection')).toBe('meter_connection');
    // Direct frames
    expect(meterBadgeFrame('meter_nose')).toBe('meter_nose');
    expect(meterBadgeFrame('meter_connection')).toBe('meter_connection');
    expect(meterBadgeFrame('icon_nose')).toBe('icon_nose');
    expect(meterBadgeFrame('icon_eye')).toBe('icon_eye');
  });
});

describe('animations & curves (Task 3.2)', () => {
  it('computes wobble offset for wrong tier with decay and zero screen shake', () => {
    // Starts with non-zero wobble
    const mid = wobbleOffset(0.1, 0.6);
    expect(Math.abs(mid)).toBeGreaterThan(0);
    // Decays to 0 at the end of the duration
    expect(wobbleOffset(0.6, 0.6)).toBe(0);
    expect(wobbleOffset(0.7, 0.6)).toBe(0);
  });

  it('computes bounce offset for medium tier', () => {
    // Moves upward (negative y offset) then settles to 0
    const peak = bounceOffset(0.1, 0.8);
    expect(peak).toBeLessThan(0);
    expect(bounceOffset(0.8, 0.8)).toBe(0);
  });

  it('computes smooth alpha fade for reduced motion', () => {
    expect(alphaFade(0, 0.6)).toBeCloseTo(0);
    expect(alphaFade(0.1, 0.6)).toBeCloseTo(1);
    expect(alphaFade(0.3, 0.6)).toBeCloseTo(1);
    expect(alphaFade(0.6, 0.6)).toBeCloseTo(0);
  });

  it('generates particle bursts bounded by pool size', () => {
    const smallBurst = particleBurst('small', 100, 100);
    expect(smallBurst.length).toBeLessThanOrEqual(MAX_EFFECT_PARTICLES);
    expect(smallBurst.length).toBeGreaterThan(0);

    const mediumBurst = particleBurst('medium', 100, 100);
    expect(mediumBurst.length).toBeLessThanOrEqual(MAX_EFFECT_PARTICLES);
    expect(mediumBurst.length).toBeGreaterThan(smallBurst.length);
  });
});

describe('createEffectsTracker (Tasks 3.2, 3.3, 3.4)', () => {
  it('starts inactive', () => {
    const tracker = createEffectsTracker();
    expect(tracker.isActive(0)).toBe(false);
  });

  it('becomes active when an effect is triggered, then inactive when finished', () => {
    const tracker = createEffectsTracker();
    tracker.triggerFeedback({
      kind: 'followed-turn',
      tier: 'small',
      polarity: 'right',
      textKey: 'feedback.followed-turn.short' as never,
      firstTime: false,
      combo: 1,
    }, 1.0);

    expect(tracker.isActive(1.0)).toBe(true);
    expect(tracker.isActive(1.3)).toBe(true);
    // small tier lasts 0.6 s
    expect(tracker.isActive(1.7)).toBe(false);
  });

  it('tracks flying meter points and completes them', () => {
    const tracker = createEffectsTracker();
    tracker.triggerMeterPoints({
      meterId: 'nose',
      points: 10,
      kind: 'go-sniff',
      value: 10,
      full: false,
      from: { x: 100, y: 100 },
      to: { x: 20, y: 20 },
    }, 2.0);

    expect(tracker.isActive(2.0)).toBe(true);
    expect(tracker.getFlyingPoints(2.25)).toHaveLength(1);
    const flying = tracker.getFlyingPoints(2.25)[0];
    expect(flying.pos.x).toBeLessThan(100);
    expect(flying.pos.x).toBeGreaterThan(20);

    // After arrival (~0.5s), flying points complete
    expect(tracker.getFlyingPoints(2.6)).toHaveLength(0);
    expect(tracker.isActive(2.6)).toBe(false);
  });
});
