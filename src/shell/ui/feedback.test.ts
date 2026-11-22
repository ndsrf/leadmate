import {
  comboSemitones,
  createFeedback,
  DEFAULT_FEEDBACK_SETTINGS,
  type FeedbackBackends,
  type FeedbackSettings,
  setFeedbackSettings,
  soundEnabled,
} from './feedback';

function setup(overrides: Partial<FeedbackBackends> = {}, settings: FeedbackSettings = DEFAULT_FEEDBACK_SETTINGS) {
  const haptic = jest.fn();
  const sound = jest.fn();
  const stageSound = jest.fn();
  const preload = jest.fn();
  const backends: FeedbackBackends = { haptic, sound, stageSound, preload, cueAudioActive: () => false, ...overrides };
  const feedback = createFeedback(() => backends, () => settings);
  return { feedback, haptic, sound, stageSound, preload };
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

describe('stage feedback', () => {
  const msg = (over: object = {}) => ({ polarity: 'right' as const, tier: 'small' as const, combo: 1, ...over });

  it('plays tick, chime, fanfare for right tiers and bonk for wrong ones', () => {
    const { feedback, stageSound } = setup();
    feedback.stage(msg());
    feedback.stage(msg({ tier: 'medium' }));
    feedback.stage(msg({ tier: 'big' }));
    feedback.stage(msg({ polarity: 'wrong' }));
    expect(stageSound.mock.calls.map((c) => c[0])).toEqual(['tick', 'chime', 'fanfare', 'bonk']);
  });

  it('raises the tick one semitone per Combo step up to +7', () => {
    expect(comboSemitones(1)).toBe(0);
    expect(comboSemitones(4)).toBe(3);
    expect(comboSemitones(8)).toBe(7);
    expect(comboSemitones(20)).toBe(7);
    const { feedback, stageSound } = setup();
    feedback.stage(msg({ combo: 13 }));
    expect(stageSound).toHaveBeenCalledWith('tick', { rate: Math.pow(2, 7 / 12), volume: 1 });
    feedback.stage(msg({ combo: 1 }));
    expect(stageSound).toHaveBeenLastCalledWith('tick', { rate: 1, volume: 1 });
  });

  it('keeps the pitch fixed for chime, fanfare and bonk', () => {
    const { feedback, stageSound } = setup();
    feedback.stage(msg({ tier: 'medium', combo: 5 }));
    expect(stageSound).toHaveBeenCalledWith('chime', { rate: 1, volume: 1 });
  });

  it('plays at 35% volume while a Cue or Dog sound is playing, instead of skipping', () => {
    const { feedback, stageSound } = setup({ cueAudioActive: () => true });
    feedback.stage(msg());
    expect(stageSound).toHaveBeenCalledWith('tick', { rate: 1, volume: 0.35 });
  });

  it('plays a light tick for right and a soft thud for wrong', () => {
    const { feedback, haptic } = setup();
    feedback.stage(msg());
    feedback.stage(msg({ polarity: 'wrong' }));
    expect(haptic.mock.calls.map((c) => c[0])).toEqual(['tick', 'thud']);
  });

  it('respects the sound and haptics settings', () => {
    const a = setup({}, { sounds: false, haptics: true });
    a.feedback.stage(msg());
    expect(a.stageSound).not.toHaveBeenCalled();
    expect(a.haptic).toHaveBeenCalled();
    const b = setup({}, { sounds: true, haptics: false });
    b.feedback.stage(msg());
    expect(b.stageSound).toHaveBeenCalled();
    expect(b.haptic).not.toHaveBeenCalled();
  });

  it('never throws when a backend fails', () => {
    const { feedback } = setup({
      stageSound: () => {
        throw new Error('x');
      },
      haptic: () => {
        throw new Error('y');
      },
      preload: () => {
        throw new Error('z');
      },
    });
    expect(() => feedback.stage(msg())).not.toThrow();
    expect(() => feedback.preloadStage()).not.toThrow();
  });

  it('preloads the players when a Stage starts, only when sounds are on', () => {
    const on = setup();
    on.feedback.preloadStage();
    expect(on.preload).toHaveBeenCalledTimes(1);
    const off = setup({}, { sounds: false, haptics: true });
    off.feedback.preloadStage();
    expect(off.preload).not.toHaveBeenCalled();
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

describe('telegraph feedback', () => {
  const msg = (over: object = {}) => ({ polarity: 'right' as const, tier: 'small' as const, combo: 1, ...over });

  it('plays the count-in tick five semitones down at lower volume with no haptic', () => {
    const { feedback, stageSound, haptic } = setup();
    feedback.telegraphTick();
    expect(stageSound).toHaveBeenCalledWith('tick', { rate: Math.pow(2, -5 / 12), volume: 0.5 });
    expect(haptic).not.toHaveBeenCalled();
  });

  it('is silent with sounds off, quieter over a Cue, and never throws', () => {
    const off = setup({}, { sounds: false, haptics: true });
    off.feedback.telegraphTick();
    expect(off.stageSound).not.toHaveBeenCalled();
    const cue = setup({ cueAudioActive: () => true });
    cue.feedback.telegraphTick();
    expect(cue.stageSound).toHaveBeenCalledWith('tick', { rate: Math.pow(2, -5 / 12), volume: 0.5 * 0.35 });
    const bad = setup({ stageSound: () => { throw new Error('x'); } });
    expect(() => bad.feedback.telegraphTick()).not.toThrow();
  });

  it('raises the pitch of the Perfect message sound by the Perfect run, whichever tier plays', () => {
    const { feedback, stageSound } = setup();
    feedback.stage(msg({ tier: 'medium', perfectRun: 4 }));
    expect(stageSound).toHaveBeenLastCalledWith('chime', { rate: Math.pow(2, 3 / 12), volume: 1 });
    feedback.stage(msg({ tier: 'big', perfectRun: 20 }));
    expect(stageSound).toHaveBeenLastCalledWith('fanfare', { rate: Math.pow(2, 7 / 12), volume: 1 });
    feedback.stage(msg({ tier: 'medium', perfectRun: 1 }));
    expect(stageSound).toHaveBeenLastCalledWith('chime', { rate: 1, volume: 1 });
  });

  it('leaves messages without a Perfect run on the existing Combo rule', () => {
    const { feedback, stageSound } = setup();
    feedback.stage(msg({ combo: 4 }));
    expect(stageSound).toHaveBeenLastCalledWith('tick', { rate: Math.pow(2, 3 / 12), volume: 1 });
    feedback.stage(msg({ tier: 'medium', combo: 4 }));
    expect(stageSound).toHaveBeenLastCalledWith('chime', { rate: 1, volume: 1 });
  });
});

describe('soundEnabled', () => {
  afterEach(() => {
    setFeedbackSettings(DEFAULT_FEEDBACK_SETTINGS);
  });

  it('reflects the global sound setting', () => {
    setFeedbackSettings({ sounds: true, haptics: true });
    expect(soundEnabled()).toBe(true);

    setFeedbackSettings({ sounds: false, haptics: true });
    expect(soundEnabled()).toBe(false);

    setFeedbackSettings({ sounds: true, haptics: false });
    expect(soundEnabled()).toBe(true);
  });
});
