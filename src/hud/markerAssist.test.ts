import {
  applyOutcome,
  assistOutcomeOf,
  DEFAULT_ASSIST,
  effectiveLevel,
  type AssistLevel,
  type AssistOutcome,
  type AssistState,
} from './markerAssist';

describe('applyOutcome', () => {
  it('steps down from Full -> Ring -> Late -> Off on three successes in a row', () => {
    let state: AssistState = { level: 'full', successRun: 0, failRun: 0 };

    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'full', successRun: 1, failRun: 0 });
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'full', successRun: 2, failRun: 0 });
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'ring', successRun: 0, failRun: 0 });

    state = applyOutcome(state, 'success');
    state = applyOutcome(state, 'success');
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'late', successRun: 0, failRun: 0 });

    state = applyOutcome(state, 'success');
    state = applyOutcome(state, 'success');
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'off', successRun: 0, failRun: 0 });
  });

  it('steps up from Off -> Late -> Ring -> Full on two failures in a row', () => {
    let state: AssistState = { level: 'off', successRun: 0, failRun: 0 };

    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'off', successRun: 0, failRun: 1 });
    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'late', successRun: 0, failRun: 0 });

    state = applyOutcome(state, 'failure');
    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'ring', successRun: 0, failRun: 0 });

    state = applyOutcome(state, 'failure');
    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'full', successRun: 0, failRun: 0 });
  });

  it('clamps at Off and resets runs on three successes', () => {
    let state: AssistState = { level: 'off', successRun: 0, failRun: 0 };

    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'off', successRun: 1, failRun: 0 });
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'off', successRun: 2, failRun: 0 });
    state = applyOutcome(state, 'success');
    expect(state).toEqual({ level: 'off', successRun: 0, failRun: 0 });
  });

  it('clamps at Full and resets runs on two failures', () => {
    let state: AssistState = { level: 'full', successRun: 0, failRun: 0 };

    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'full', successRun: 0, failRun: 1 });
    state = applyOutcome(state, 'failure');
    expect(state).toEqual({ level: 'full', successRun: 0, failRun: 0 });
  });

  it('clears failure run on a success', () => {
    const state: AssistState = { level: 'ring', successRun: 0, failRun: 1 };
    const next = applyOutcome(state, 'success');
    expect(next).toEqual({ level: 'ring', successRun: 1, failRun: 0 });
  });

  it('clears success run on a failure', () => {
    const state: AssistState = { level: 'ring', successRun: 2, failRun: 0 };
    const next = applyOutcome(state, 'failure');
    expect(next).toEqual({ level: 'ring', successRun: 0, failRun: 1 });
  });

  it('neither counts nor breaks a run on neutral outcome', () => {
    const state1: AssistState = { level: 'ring', successRun: 2, failRun: 0 };
    expect(applyOutcome(state1, 'neutral')).toEqual(state1);

    const state2: AssistState = { level: 'late', successRun: 0, failRun: 1 };
    expect(applyOutcome(state2, 'neutral')).toEqual(state2);
  });
});

describe('effectiveLevel', () => {
  it('returns stored level when neither flag is set', () => {
    expect(effectiveLevel({ level: 'late', successRun: 0, failRun: 0 })).toBe('late');
    expect(effectiveLevel({ level: 'off', successRun: 1, failRun: 0 }, {})).toBe('off');
    expect(effectiveLevel({ level: 'ring', successRun: 0, failRun: 1 }, { alwaysFull: false, guidedFirstStage: false })).toBe('ring');
  });

  it('returns full when alwaysFull is true', () => {
    expect(effectiveLevel({ level: 'off', successRun: 0, failRun: 0 }, { alwaysFull: true })).toBe('full');
    expect(effectiveLevel({ level: 'late', successRun: 0, failRun: 0 }, { alwaysFull: true, guidedFirstStage: false })).toBe('full');
  });

  it('returns full when guidedFirstStage is true', () => {
    expect(effectiveLevel({ level: 'off', successRun: 0, failRun: 0 }, { guidedFirstStage: true })).toBe('full');
    expect(effectiveLevel({ level: 'ring', successRun: 0, failRun: 0 }, { alwaysFull: false, guidedFirstStage: true })).toBe('full');
  });

  it('returns full when both flags are true', () => {
    expect(effectiveLevel({ level: 'off', successRun: 0, failRun: 0 }, { alwaysFull: true, guidedFirstStage: true })).toBe('full');
  });
});

describe('assistOutcomeOf', () => {
  it('counts hits of any grade as success', () => {
    expect(assistOutcomeOf({ type: 'marker-hit', grade: 'perfect', time: 0, accuracyMs: 100 })).toBe('success');
    expect(assistOutcomeOf({ type: 'marker-hit', grade: 'good', time: 0, accuracyMs: 400 })).toBe('success');
    expect(assistOutcomeOf({ type: 'check-in-hit', grade: 'perfect', time: 0 })).toBe('success');
    expect(assistOutcomeOf({ type: 'check-in-hit', grade: 'good', time: 0 })).toBe('success');
  });

  it('treats change-check-in as neutral: it is paired with check-in-hit on one press', () => {
    expect(assistOutcomeOf({ type: 'change-check-in', grade: 'perfect', time: 0, change: 'left-turn' })).toBe('neutral');
  });

  it('counts marker-miss and marker-late as failure when budget is not spent', () => {
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 })).toBe('failure');
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 }, { markBudgetSpent: false })).toBe('failure');
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 }, { marksUsed: 2, markBudget: 5 })).toBe('failure');
    expect(assistOutcomeOf({ type: 'marker-late', time: 0 })).toBe('failure');
  });

  it('counts marker-miss as neutral when Mark budget is spent', () => {
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 }, { markBudgetSpent: true })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 }, { marksUsed: 5, markBudget: 5 })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'marker-miss', time: 0 }, { marksUsed: 6, markBudget: 5 })).toBe('neutral');
  });

  it('counts marker-reactive as failure only while calm period is under way', () => {
    // Under way: dogMode === 'fixated' and calmElapsed > 0
    expect(
      assistOutcomeOf({ type: 'marker-reactive', time: 0 }, { dogMode: 'fixated', calmElapsed: 1.0 })
    ).toBe('failure');

    // Not under way: calmElapsed === 0
    expect(
      assistOutcomeOf({ type: 'marker-reactive', time: 0 }, { dogMode: 'fixated', calmElapsed: 0 })
    ).toBe('neutral');

    // Not fixated
    expect(
      assistOutcomeOf({ type: 'marker-reactive', time: 0 }, { dogMode: 'goal', calmElapsed: 1.0 })
    ).toBe('neutral');

    // No context
    expect(assistOutcomeOf({ type: 'marker-reactive', time: 0 })).toBe('neutral');
  });

  it('counts everything else as neutral', () => {
    expect(assistOutcomeOf({ type: 'missed-opportunity', time: 0 })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'marker-wasted', time: 0 })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'check-in-glance', time: 0 })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'cue', time: 0, strength: 1, cueType: 'lets-go' })).toBe('neutral');
    expect(assistOutcomeOf({ type: 'disengagement', time: 0, poste: false })).toBe('neutral');
  });
});


