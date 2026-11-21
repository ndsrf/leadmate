import {
  BUNDLE_MESSAGE_TYPES,
  createSignalGate,
  decode,
  encode,
  SHELL_MESSAGE_TYPES,
  type BundleMessage,
  type ShellMessage,
} from './messages';
import {
  buildCloseExercisePayload,
  createCloseExerciseState,
  tickCloseExercise,
} from './closeExercise';

describe('signal gate', () => {
  it('lets each signal through once per Stage', () => {
    const gate = createSignalGate();
    expect(gate('dog-approaching')).toBe(true);
    expect(gate('dog-approaching')).toBe(false);
    expect(gate('first-taut')).toBe(true);
  });

  it('lets control-used through once per control', () => {
    const gate = createSignalGate();
    expect(gate('control-used', 'move')).toBe(true);
    expect(gate('control-used', 'move')).toBe(false);
    expect(gate('control-used', 'mark')).toBe(true);
    expect(gate('control-used', 'mark')).toBe(false);
    expect(gate('control-used', 'close-mark')).toBe(true);
    expect(gate('control-used', 'close-mark')).toBe(false);
  });

  it('lets dog-sign through once per sign', () => {
    const gate = createSignalGate();
    expect(gate('dog-sign', 'eye')).toBe(true);
    expect(gate('dog-sign', 'eye')).toBe(false);
    expect(gate('dog-sign', 'bark')).toBe(true);
    expect(gate('dog-sign-gone', 'eye')).toBe(true);
  });

  it('starts fresh for a new Stage', () => {
    expect(createSignalGate()('control-used', 'move')).toBe(true);
  });
});

describe('close exercise message encoding and decoding (Task 3.4)', () => {
  it('encodes and decodes close_exercise start message', () => {
    const startMsg: ShellMessage = {
      type: 'start',
      seed: 42,
      scenario: {
        mode: 'close_exercise',
        leashMaxLength: 1.8,
      },
    };
    const encoded = encode(startMsg);
    const decoded = decode<ShellMessage>(encoded, SHELL_MESSAGE_TYPES);
    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('start');
    if (decoded?.type === 'start') {
      expect(decoded.scenario?.mode).toBe('close_exercise');
    }
  });

  it('encodes and decodes start message with seenKinds, isTasteStage, and reducedMotion', () => {
    const startMsg: ShellMessage = {
      type: 'start',
      seed: 123,
      seenKinds: ['marker-hit', 'check-in-hit'],
      isTasteStage: true,
      reducedMotion: true,
    };
    const encoded = encode(startMsg);
    const decoded = decode<ShellMessage>(encoded, SHELL_MESSAGE_TYPES);
    expect(decoded).toEqual(startMsg);
  });

  it('encodes and decodes debrief payload with close exercise metrics', () => {
    const state = createCloseExerciseState({ fixedStep: 0.1 });
    tickCloseExercise(state, { gather: true, shieldSide: 'right', poste: false, marker: false });
    const payload = buildCloseExercisePayload(state);
    const debriefMsg: BundleMessage = {
      type: 'debrief',
      payload,
    };
    const encoded = encode(debriefMsg);
    const decoded = decode<BundleMessage>(encoded, BUNDLE_MESSAGE_TYPES);
    expect(decoded).not.toBeNull();
    expect(decoded?.type).toBe('debrief');
    if (decoded?.type === 'debrief') {
      expect(decoded.payload.durationSeconds).toBe(payload.durationSeconds);
      expect(decoded.payload.handlingScore).toBe(payload.handlingScore);
    }
  });
});

describe('feedback bundle message', () => {
  const ok = { type: 'feedback', kind: 'marker-hit', tier: 'medium', polarity: 'right', combo: 3, firstTime: true };

  it('is a bundle message type and round-trips', () => {
    expect(BUNDLE_MESSAGE_TYPES).toContain('feedback');
    expect(decode<BundleMessage>(encode(ok as BundleMessage), BUNDLE_MESSAGE_TYPES)).toEqual(ok);
  });

  it('rejects an unknown kind, tier or polarity, or a polarity that does not match the kind', () => {
    for (const bad of [
      { ...ok, kind: 'nope' },
      { ...ok, tier: 'huge' },
      { ...ok, polarity: 'neutral' },
      { ...ok, polarity: 'wrong' },
      { ...ok, combo: -1 },
      { ...ok, combo: 1.5 },
      { ...ok, firstTime: 'yes' },
    ]) {
      expect(decode<BundleMessage>(bad, BUNDLE_MESSAGE_TYPES)).toBeNull();
    }
  });
});

describe('telegraph bridge messages', () => {
  const state = { level: 'ring', successRun: 1, failRun: 0 };

  it('round-trips telegraph-tick, marker-assist and a first-fixation signal with an assist level', () => {
    for (const m of [
      { type: 'telegraph-tick', beat: 2 },
      { type: 'marker-assist', state },
      { type: 'stage-signal', signal: 'first-fixation', time: 4, assist: 'full' },
    ]) {
      expect(BUNDLE_MESSAGE_TYPES).toContain(m.type);
      expect(decode<BundleMessage>(encode(m as BundleMessage), BUNDLE_MESSAGE_TYPES)).toEqual(m);
    }
  });

  it('rejects malformed telegraph-tick, marker-assist and assist shapes', () => {
    for (const bad of [
      { type: 'telegraph-tick', beat: 0 },
      { type: 'telegraph-tick', beat: 4 },
      { type: 'telegraph-tick', beat: '1' },
      { type: 'marker-assist' },
      { type: 'marker-assist', state: { ...state, level: 'max' } },
      { type: 'marker-assist', state: { ...state, successRun: -1 } },
      { type: 'marker-assist', state: { ...state, failRun: 1.5 } },
      { type: 'stage-signal', signal: 'first-fixation', time: 1, assist: 'huge' },
    ]) {
      expect(decode<BundleMessage>(bad, BUNDLE_MESSAGE_TYPES)).toBeNull();
    }
  });

  it('accepts and validates the optional perfectRun on feedback', () => {
    const ok = { type: 'feedback', kind: 'marker-hit', tier: 'medium', polarity: 'right', combo: 1, firstTime: false };
    expect(decode<BundleMessage>({ ...ok, perfectRun: 3 }, BUNDLE_MESSAGE_TYPES)).toEqual({ ...ok, perfectRun: 3 });
    for (const bad of [0, -1, 1.5, '2']) expect(decode<BundleMessage>({ ...ok, perfectRun: bad }, BUNDLE_MESSAGE_TYPES)).toBeNull();
  });

  it('validates the start fields markerAssist, alwaysTimingHelp and guidedFirstStage', () => {
    const start = { type: 'start', markerAssist: state, alwaysTimingHelp: true, guidedFirstStage: false };
    expect(decode<ShellMessage>(encode(start as ShellMessage), SHELL_MESSAGE_TYPES)).toEqual(start);
    expect(decode<ShellMessage>({ type: 'start', seed: 1 }, SHELL_MESSAGE_TYPES)).toEqual({ type: 'start', seed: 1 });
    for (const bad of [{ markerAssist: { level: 'x', successRun: 0, failRun: 0 } }, { alwaysTimingHelp: 'yes' }, { guidedFirstStage: 1 }]) {
      expect(decode<ShellMessage>({ type: 'start', ...bad }, SHELL_MESSAGE_TYPES)).toBeNull();
    }
  });
});

describe('dog-sign stage signals', () => {
  const read = (m: object) => decode<BundleMessage>(JSON.stringify({ type: 'stage-signal', time: 1, ...m }), BUNDLE_MESSAGE_TYPES);

  it('accepts a known sign on dog-sign and dog-sign-gone', () => {
    expect(read({ signal: 'dog-sign', sign: 'eye' })).not.toBeNull();
    expect(read({ signal: 'dog-sign-gone', sign: 'sintonia' })).not.toBeNull();
  });

  it('rejects a missing or unknown sign', () => {
    expect(read({ signal: 'dog-sign' })).toBeNull();
    expect(read({ signal: 'dog-sign', sign: 'tail' })).toBeNull();
    expect(read({ signal: 'dog-sign-gone', sign: 7 })).toBeNull();
  });

  it('rejects a sign on any other signal', () => {
    expect(read({ signal: 'first-taut', sign: 'eye' })).toBeNull();
    expect(read({ signal: 'first-taut' })).not.toBeNull();
  });
});
