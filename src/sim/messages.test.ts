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
