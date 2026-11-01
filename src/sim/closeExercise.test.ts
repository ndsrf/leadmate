import {
  buildCloseExercisePayload,
  calculateCloseLeashCurve,
  createCloseExerciseState,
  defaultCloseExerciseConfig,
  isLineOfSightOccludedByHandler,
  tickCloseExercise,
  type CaninePosture,
  type CloseExerciseConfig,
  type CloseExerciseInput,
  type CloseExerciseState,
} from './closeExercise';
import { mapCloseKeyboardEvent } from '../hud/input';

describe('closeExercise simulation state and types (Task 1.1)', () => {
  it('creates initial close exercise state with default configuration', () => {
    const state: CloseExerciseState = createCloseExerciseState();

    expect(state.config.controls).toBe('leash_drill');
    expect(state.time).toBe(0);
    expect(state.effectiveLeashLength).toBe(state.config.leashMaxLength);
    expect(state.dogPosture).toBe('neutral');
    expect(state.tier).toBe('calm');
    expect(state.shieldSide).toBe('none');
    expect(state.isGathering).toBe(false);
    expect(state.isPoste).toBe(false);
    expect(state.distractor.active).toBe(true);
    expect(state.completed).toBe(false);
    expect(state.success).toBe(false);
  });

  it('allows overriding partial configuration options', () => {
    const customConfig: Partial<CloseExerciseConfig> = {
      leashMaxLength: 1.8,
      leashMinLength: 0.4,
      markBudget: 3,
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        speed: 2.0,
      },
    };

    const state = createCloseExerciseState(customConfig, 123);
    expect(state.config.leashMaxLength).toBe(1.8);
    expect(state.config.leashMinLength).toBe(0.4);
    expect(state.config.markBudget).toBe(3);
    expect(state.config.distractor.speed).toBe(2.0);
    expect(state.seed).toBe(123);
    expect(state.effectiveLeashLength).toBe(1.8);
  });

  it('supports all defined canine postures', () => {
    const postures: CaninePosture[] = ['neutral', 'alert', 'strained', 'relaxed', 'head_turn'];
    for (const posture of postures) {
      const state = createCloseExerciseState();
      state.dogPosture = posture;
      expect(state.dogPosture).toBe(posture);
    }
  });

  it('detects handler body occlusion when handler stands between dog and distractor', () => {
    const dog = { x: 0, y: 0 };
    const distractor = { x: 2, y: 0 };

    // Handler in direct line of sight between dog and distractor
    const handlerBetween = { x: 1, y: 0 };
    expect(isLineOfSightOccludedByHandler(handlerBetween, dog, distractor, 0.65)).toBe(true);

    // Handler far away from line of sight
    const handlerAside = { x: 1, y: 3 };
    expect(isLineOfSightOccludedByHandler(handlerAside, dog, distractor, 0.65)).toBe(false);
  });
});

describe('deterministic leash gathering and slack dynamics (Task 1.2)', () => {
  it('shortens effective leash length on gather input down to minimum length', () => {
    const state = createCloseExerciseState({
      leashMaxLength: 2.0,
      leashMinLength: 0.5,
      gatherRate: 1.0,
      fixedStep: 0.1,
    });

    const initialLength = state.effectiveLeashLength;
    expect(initialLength).toBe(2.0);

    // 5 ticks of gathering: length should decrease by 0.5m
    for (let i = 0; i < 5; i++) {
      tickCloseExercise(state, {
        gather: true,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    expect(state.effectiveLeashLength).toBeCloseTo(1.5, 4);
    expect(state.isGathering).toBe(true);

    // 20 more ticks: should clamp at leashMinLength (0.5m)
    for (let i = 0; i < 20; i++) {
      tickCloseExercise(state, {
        gather: true,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    expect(state.effectiveLeashLength).toBe(0.5);
  });

  it('releases leash slack smoothly up to maximum length when gather is released', () => {
    const state = createCloseExerciseState({
      leashMaxLength: 2.0,
      leashMinLength: 0.5,
      releaseRate: 1.0,
      fixedStep: 0.1,
    });

    // Start gathered
    state.effectiveLeashLength = 0.5;

    // 5 ticks of release: length should increase by 0.5m
    for (let i = 0; i < 5; i++) {
      tickCloseExercise(state, {
        gather: false,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    expect(state.effectiveLeashLength).toBeCloseTo(1.0, 4);
    expect(state.isGathering).toBe(false);

    // 20 more ticks: should clamp at leashMaxLength (2.0m)
    for (let i = 0; i < 20; i++) {
      tickCloseExercise(state, {
        gather: false,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    expect(state.effectiveLeashLength).toBe(2.0);
  });

  it('draws dog closer to handler without abrupt rigid pull when gathered', () => {
    const state = createCloseExerciseState({
      handlerBase: { x: 0, y: 0 },
      dogOffset: { x: 1.5, y: 0 },
      leashMaxLength: 2.0,
      leashMinLength: 0.5,
      gatherRate: 2.0,
      fixedStep: 0.1,
    });

    // Initially dog is at 1.5m, leash is 2.0m (slack)
    expect(state.tension).toBe('slack');

    // Run gathering until effective leash is 0.8m
    while (state.effectiveLeashLength > 0.8) {
      tickCloseExercise(state, {
        gather: true,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    // Dog should have been drawn inwards
    expect(state.dog.x).toBeLessThan(1.5);
    expect(state.dog.x).toBeGreaterThan(0);
    expect(state.tension).not.toBe('rigid');
    expect(state.telemetry.peakTensionRatio).toBeGreaterThan(0);
  });
});

describe('handler shielding stance and arousal mitigation (Task 1.3)', () => {
  it('mitigates dog arousal rise when handler maintains shielding position against oncoming distractor', () => {
    // Distractor passes on the right at x = 1.8
    // Dog is at x = 0.9
    // Handler at base is at x = 0.0
    // Shifting right moves handler to x = 0.8 (between dog and distractor)
    const shieldedState = createCloseExerciseState({
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        startPos: { x: 1.8, y: 5.0 },
        endPos: { x: 1.8, y: -5.0 },
        speed: 2.0,
        triggerRadius: 6.0,
      },
      fixedStep: 0.1,
    });

    const exposedState = createCloseExerciseState({
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        startPos: { x: 1.8, y: 5.0 },
        endPos: { x: 1.8, y: -5.0 },
        speed: 2.0,
        triggerRadius: 6.0,
      },
      fixedStep: 0.1,
    });

    // Run both simulations as distractor approaches and passes (50 ticks = 5.0s)
    for (let i = 0; i < 50; i++) {
      tickCloseExercise(shieldedState, {
        gather: true,
        shieldSide: 'right',
        poste: false,
        marker: false,
      });

      tickCloseExercise(exposedState, {
        gather: true,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
    }

    // Shielded state should have line of sight occlusion during the encounter
    expect(shieldedState.telemetry.shieldDuration).toBeGreaterThan(0);
    expect(shieldedState.telemetry.shieldCoverageScore).toBeGreaterThan(0.5);

    // Shielded dog arousal should be significantly lower than exposed dog
    expect(shieldedState.arousal).toBeLessThan(exposedState.arousal);
    expect(shieldedState.tier).not.toBe('reactive');
    expect(exposedState.tier).toBe('reactive');
  });

  it('records distractor encounter lifecycle events', () => {
    const state = createCloseExerciseState({
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        startPos: { x: 1.8, y: 3.0 },
        endPos: { x: 1.8, y: -3.0 },
        speed: 2.0,
        triggerRadius: 5.0,
      },
      fixedStep: 0.1,
    });

    let passSeen = false;
    for (let i = 0; i < 40; i++) {
      const events = tickCloseExercise(state, {
        gather: false,
        shieldSide: 'right',
        poste: false,
        marker: false,
      });
      if (events.some((e) => e.type === 'distractor-pass')) {
        passSeen = true;
      }
    }

    expect(passSeen).toBe(true);
    expect(state.distractor.finished).toBe(true);
  });

  it('triggers failure lunge when handling is mistimed or unshielded during distractor pass', () => {
    // Handler does not shield and does not anchor or gather
    const failState = createCloseExerciseState({
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        startPos: { x: 1.8, y: 4.0 },
        endPos: { x: 1.8, y: -4.0 },
        speed: 2.0,
        triggerRadius: 6.0,
      },
      fixedStep: 0.1,
    });

    let lungeStarted = false;
    while (!failState.distractor.finished) {
      const events = tickCloseExercise(failState, {
        gather: false,
        shieldSide: 'none',
        poste: false,
        marker: false,
      });
      if (events.some((e) => e.type === 'fixation-start')) {
        lungeStarted = true;
      }
    }

    expect(lungeStarted).toBe(true);
    expect(failState.tier).toBe('reactive');
    expect(failState.dogPosture).toBe('strained');
    expect(failState.completed).toBe(true);
    expect(failState.success).toBe(false); // Failed pass due to reactive flare
  });
});

describe('tension poste mechanics and telemetry generation (Task 1.4)', () => {
  it('poste hold absorbs strain and prevents rigid pull during lunge', () => {
    const posteState = createCloseExerciseState({
      leashMaxLength: 1.0,
      leashMinLength: 0.5,
      posteDamping: 0.4,
      fixedStep: 0.1,
    });
    // Force lunging mode
    posteState.tier = 'reactive';
    posteState.dogMode = 'lunging';
    posteState.dog = { x: 1.2, y: 0 }; // past leash length

    const unanchoredState = createCloseExerciseState({
      leashMaxLength: 1.0,
      leashMinLength: 0.5,
      posteDamping: 0.4,
      fixedStep: 0.1,
    });
    unanchoredState.tier = 'reactive';
    unanchoredState.dogMode = 'lunging';
    unanchoredState.dog = { x: 1.2, y: 0 };

    // Tick poste
    tickCloseExercise(posteState, {
      gather: false,
      shieldSide: 'none',
      poste: true,
      marker: false,
    });

    // Tick without poste
    tickCloseExercise(unanchoredState, {
      gather: false,
      shieldSide: 'none',
      poste: false,
      marker: false,
    });

    expect(posteState.tensionRatio).toBeLessThan(unanchoredState.tensionRatio);
    expect(posteState.tension).not.toBe('rigid');
    expect(unanchoredState.tension).toBe('rigid');
    expect(posteState.telemetry.lungesPrevented).toBe(1);
  });

  it('generates valid debrief payload conforming to SimulationDebriefPayload with close metrics', () => {
    const state = createCloseExerciseState({
      fixedStep: 0.1,
    });

    // Run a few ticks with some inputs
    for (let i = 0; i < 10; i++) {
      tickCloseExercise(state, {
        gather: true,
        shieldSide: 'right',
        poste: false,
        marker: false,
      });
    }

    // Call cue to open reward window
    tickCloseExercise(state, {
      gather: true,
      shieldSide: 'right',
      poste: false,
      marker: false,
      cue: true,
      cueType: 'lets-go',
    });

    // Hit marker during reward window
    tickCloseExercise(state, {
      gather: true,
      shieldSide: 'right',
      poste: false,
      marker: true,
    });

    const payload = buildCloseExercisePayload(state);

    expect(payload.durationSeconds).toBeGreaterThan(0);
    expect(payload.slackPercentage + payload.tautPercentage + payload.pullPercentage).toBe(100);
    expect(payload.markerHits).toBe(1);
    expect(payload.markerAccuracyMs).toBeDefined();
    expect(payload.handlingScore).toBeGreaterThanOrEqual(0);
    expect(payload.handlingScore).toBeLessThanOrEqual(1000);
    expect(payload.configVersion).toBe(state.config.configVersion);
    expect(payload.peakTensionRatio).toBeDefined();
    expect(payload.shieldCoverageScore).toBeDefined();
    expect(payload.leashHandlingAccuracy).toBeDefined();
  });

  it('triggers natural calm disengagement when distractor passes without requiring a cue', () => {
    const state = createCloseExerciseState({
      distractor: {
        ...defaultCloseExerciseConfig.distractor,
        startPos: { x: 1.8, y: 1.0 },
        endPos: { x: 1.8, y: -2.0 },
        speed: 2.0,
        triggerRadius: 5.0,
      },
      fixedStep: 0.1,
    });

    let disengagementSeen = false;
    let windowOpenAtDisengagement = false;
    // Step until distractor passes
    for (let i = 0; i < 20; i++) {
      const events = tickCloseExercise(state, {
        gather: true,
        shieldSide: 'right',
        poste: false,
        marker: false,
      });
      if (events.some((e) => e.type === 'disengagement')) {
        disengagementSeen = true;
        windowOpenAtDisengagement = state.rewardWindow !== null;
      }
    }

    expect(disengagementSeen).toBe(true);
    expect(windowOpenAtDisengagement).toBe(true);
  });
});

describe('close leash Bézier curve dynamics and sag clamping (Task 2.3)', () => {
  it('computes curve endpoints from hand height and collar height', () => {
    const handler = { x: 0, y: 0 };
    const dog = { x: 1.0, y: 0 };
    const curve = calculateCloseLeashCurve(handler, dog, 1.5);

    expect(curve.start.x).toBe(0);
    expect(curve.start.y).toBe(0);
    expect(curve.start.z).toBe(1.0); // Hand height

    expect(curve.end.x).toBe(1.0);
    expect(curve.end.y).toBe(0);
    expect(curve.end.z).toBe(0.4); // Collar height
  });

  it('clamps sag control point strictly above ground plane even when leash is very slack', () => {
    const handler = { x: 0, y: 0 };
    const dog = { x: 0.5, y: 0 }; // Close together
    const leashLength = 2.0; // Lots of slack: unmitigated sag would dip through ground
    const minGroundZ = 0.15;

    const curve = calculateCloseLeashCurve(handler, dog, leashLength, minGroundZ);

    expect(curve.sag).toBeGreaterThan(0.5);
    expect(curve.control.z).toBe(minGroundZ);
    expect(curve.control.z).toBeGreaterThanOrEqual(minGroundZ);
  });

  it('flattens sag as leash reaches full extension', () => {
    const handler = { x: 0, y: 0 };
    const dog = { x: 2.0, y: 0 };
    const leashLength = 2.0;

    const curve = calculateCloseLeashCurve(handler, dog, leashLength);
    expect(curve.sag).toBe(0);
    expect(curve.control.z).toBeCloseTo(0.7, 4);
  });
});

describe('close exercise input mapping and controls dispatch (Task 3.2)', () => {
  const baseInput: CloseExerciseInput = {
    gather: false,
    shieldSide: 'none',
    poste: false,
    marker: false,
  };

  it('maps gather key events correctly', () => {
    const down = mapCloseKeyboardEvent('Space', true, baseInput);
    expect(down.gather).toBe(true);

    const up = mapCloseKeyboardEvent('Space', false, down);
    expect(up.gather).toBe(false);

    const downG = mapCloseKeyboardEvent('KeyG', true, baseInput);
    expect(downG.gather).toBe(true);
  });

  it('toggles shield stance keys between left, right, and none', () => {
    // Press KeyA: none -> left
    const left = mapCloseKeyboardEvent('KeyA', true, baseInput);
    expect(left.shieldSide).toBe('left');

    // Press KeyA again: left -> none
    const backToNone = mapCloseKeyboardEvent('KeyA', true, left);
    expect(backToNone.shieldSide).toBe('none');

    // Press KeyD: none -> right
    const right = mapCloseKeyboardEvent('KeyD', true, baseInput);
    expect(right.shieldSide).toBe('right');

    // Press KeyA while right: right -> left
    const switchLeft = mapCloseKeyboardEvent('KeyA', true, right);
    expect(switchLeft.shieldSide).toBe('left');
  });

  it('maps poste, cue, and marker keys', () => {
    const posteDown = mapCloseKeyboardEvent('KeyW', true, baseInput);
    expect(posteDown.poste).toBe(true);

    const cueDown = mapCloseKeyboardEvent('KeyC', true, baseInput);
    expect(cueDown.cue).toBe(true);
    expect(cueDown.cueType).toBe('lets-go');

    const markerDown = mapCloseKeyboardEvent('KeyM', true, baseInput);
    expect(markerDown.marker).toBe(true);
  });
});
