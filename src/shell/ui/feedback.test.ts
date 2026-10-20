import { createFeedback, DEFAULT_FEEDBACK_SETTINGS, type FeedbackBackends, type FeedbackSettings } from './feedback';

function setup(overrides: Partial<FeedbackBackends> = {}, settings: FeedbackSettings = DEFAULT_FEEDBACK_SETTINGS) {
  const haptic = jest.fn();
  const sound = jest.fn();
  const backends: FeedbackBackends = { haptic, sound, cueAudioActive: () => false, ...overrides };
  const feedback = createFeedback(() => backends, () => settings);
  return { feedback, haptic, sound };
}

describe('feedback service', () => {
  it('fires a haptic and a sound on press', () => {
    const { feedback, haptic, sound } = setup();
    feedback.press();
    expect(haptic).toHaveBeenCalledWith('light');
    expect(sound).toHaveBeenCalledWith('press');
  });

  it('maps success, star and unlock to their sounds', () => {
    const { feedback, sound } = setup();
    feedback.success();
    feedback.star(2);
    feedback.unlock();
    expect(sound.mock.calls.map((c) => c[0])).toEqual(['success', 'star', 'unlock']);
  });

  it('stays silent and does not throw when a sound fails to load', () => {
    const { feedback, haptic } = setup({
      sound: () => {
        throw new Error('no asset');
      },
    });
    expect(() => feedback.press()).not.toThrow();
    expect(haptic).toHaveBeenCalled();
  });

  it('does not throw when haptics are unsupported, and still plays the sound', () => {
    const { feedback, sound } = setup({
      haptic: () => {
        throw new Error('no haptics');
      },
    });
    expect(() => feedback.press()).not.toThrow();
    expect(sound).toHaveBeenCalled();
  });

  it('does not play over Cue or Dog audio', () => {
    const { feedback, sound, haptic } = setup({ cueAudioActive: () => true });
    feedback.press();
    expect(sound).not.toHaveBeenCalled();
    expect(haptic).toHaveBeenCalled();
  });

  it('plays nothing when both toggles are off', () => {
    const { feedback, sound, haptic } = setup({}, { sounds: false, haptics: false });
    feedback.press();
    feedback.success();
    expect(sound).not.toHaveBeenCalled();
    expect(haptic).not.toHaveBeenCalled();
  });

  it('turns sounds and haptics off separately', () => {
    const a = setup({}, { sounds: false, haptics: true });
    a.feedback.press();
    expect(a.sound).not.toHaveBeenCalled();
    expect(a.haptic).toHaveBeenCalled();
    const b = setup({}, { sounds: true, haptics: false });
    b.feedback.press();
    expect(b.sound).toHaveBeenCalled();
    expect(b.haptic).not.toHaveBeenCalled();
  });

  it('never awaits: the call returns synchronously even with slow backends', () => {
    const { feedback } = setup({ sound: () => void new Promise(() => {}) });
    expect(feedback.press()).toBeUndefined();
  });
});

describe('feedback never changes the simulation', () => {
  it('gives an identical telemetry payload for the same seed with feedback on and off', async () => {
    const { runScripted } = await import('../../sim/harness');
    const { defaultScenario } = await import('../../sim/config');
    const config = { ...defaultScenario, endCondition: { kind: 'time-limit' as const, seconds: 20 } };
    const play = (fb: ReturnType<typeof createFeedback>) => {
      let tick = 0;
      return runScripted(
        42,
        () => {
          tick++;
          // feedback fires on a press, in the middle of the Stage, exactly like the UI would
          if (tick % 50 === 0) fb.press();
          return { direction: { x: 0, y: 1 }, strength: 0.5, marker: tick % 90 === 0 };
        },
        config,
      ).payload;
    };
    const on = setup({}, { sounds: true, haptics: true });
    const off = setup({}, { sounds: false, haptics: false });
    const payloadOn = play(on.feedback);
    const payloadOff = play(off.feedback);
    expect(on.haptic).toHaveBeenCalled();
    expect(off.haptic).not.toHaveBeenCalled();
    expect(payloadOn).toEqual(payloadOff);
  });
});
