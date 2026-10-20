import { createVocalizer, type DogSound } from './vocalize';

const mockPlay = jest.fn();
const mockRemove = jest.fn();
const mockCreateAudioPlayer = jest.fn((_source: any) => ({
  play: mockPlay,
  remove: mockRemove,
  playing: false,
}));
const mockSetAudioModeAsync = jest.fn();

jest.mock('expo-audio', () => ({
  createAudioPlayer: (src: any) => mockCreateAudioPlayer(src),
  setAudioModeAsync: (opts: any) => mockSetAudioModeAsync(opts),
}));

const mockCopy = jest.fn();
const mockDelete = jest.fn();
const mockDirCreate = jest.fn();

jest.mock('expo-file-system', () => {
  class MockFile {
    uri: string;
    exists = true;
    constructor(dirOrUri: any, name?: string) {
      this.uri = name ? `${dirOrUri.uri ?? dirOrUri}/${name}` : String(dirOrUri);
    }
    copy = mockCopy;
    delete = mockDelete;
  }
  class MockDirectory {
    uri: string;
    exists = true;
    constructor(base: string, name: string) {
      this.uri = `${base}/${name}`;
    }
    create = mockDirCreate;
  }
  return {
    Directory: MockDirectory,
    File: MockFile,
    Paths: { document: 'file:///data/user/0/leadmate' },
  };
});

jest.mock('./dogSounds', () => ({
  DOG_SOUNDS: {
    bark: 1,
    whine: 2,
    growl: 3,
  },
}));

jest.mock('./voiceAssets', () => ({
  VOICE_ASSETS: {
    'lets-go.es': 10,
    'aqui.es': 11,
  },
}));

import { deleteRecording, keepRecording, playResolvedCue, prepareAudio } from './audio';

function setup() {
  let clock = 0;
  const played: DogSound[] = [];
  const vocalizer = createVocalizer((s) => played.push(s), () => clock);
  return { vocalizer, played, at: (ms: number) => (clock = ms) };
}

describe('dog vocalizations', () => {
  it('is silent when the Dog calms down', () => {
    const { vocalizer, played } = setup();
    expect(vocalizer.onTier('calm')).toBeNull();
    expect(played).toEqual([]);
  });

  it('whines or growls on Alert and barks on Reactive', () => {
    const { vocalizer, played, at } = setup();
    at(0);
    expect(['whine', 'growl']).toContain(vocalizer.onTier('alert'));
    at(100);
    expect(vocalizer.onTier('reactive')).toBe('bark');
    expect(played).toHaveLength(2);
    expect(played[1]).toBe('bark');
  });

  it('does not repeat the same tier within 2.0 s', () => {
    const { vocalizer, played, at } = setup();
    at(1000);
    vocalizer.onTier('reactive');
    at(2900);
    expect(vocalizer.onTier('reactive')).toBeNull();
    expect(played).toHaveLength(1);
  });

  it('repeats the same tier once 2.0 s have passed', () => {
    const { vocalizer, played, at } = setup();
    at(1000);
    vocalizer.onTier('reactive');
    at(3000);
    expect(vocalizer.onTier('reactive')).toBe('bark');
    expect(played).toHaveLength(2);
  });

  it('keeps a separate cooldown for each tier', () => {
    const { vocalizer, at } = setup();
    at(0);
    vocalizer.onTier('alert');
    at(500);
    expect(vocalizer.onTier('reactive')).toBe('bark'); // Reactive is not held back by the Alert sound
  });

  it('alternates the Alert whine and growl', () => {
    const { vocalizer, at } = setup();
    at(0);
    const first = vocalizer.onTier('alert');
    at(2500);
    const second = vocalizer.onTier('alert');
    expect(first).not.toBe(second);
  });

  it('survives a sound that cannot play', () => {
    const v = createVocalizer(() => {
      throw new Error('no audio device');
    });
    expect(() => v.onTier('reactive')).not.toThrow();
  });
});

describe('Cue audio playback and recording', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('plays a pack Cue through expo-audio', () => {
    playResolvedCue({ kind: 'pack', assetId: 'lets-go.es' });
    expect(mockCreateAudioPlayer).toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('plays a custom recorded Cue through expo-audio', () => {
    playResolvedCue({ kind: 'custom', uri: 'file:///mine.m4a' });
    expect(mockCreateAudioPlayer).toHaveBeenCalledWith({ uri: 'file:///mine.m4a' });
    expect(mockPlay).toHaveBeenCalled();
  });

  it('sets up audio recording mode with prepareAudio', async () => {
    await prepareAudio(true);
    expect(mockSetAudioModeAsync).toHaveBeenCalledWith({ playsInSilentMode: true, allowsRecording: true });
  });

  it('keeps a custom Cue recording in document storage', () => {
    const uri = keepRecording('file:///cache/cue.m4a', 'es');
    expect(uri).toContain('cue.es.m4a');
    expect(mockCopy).toHaveBeenCalled();
  });

  it('deletes an existing custom Cue recording', () => {
    expect(() => deleteRecording('file:///data/user/0/leadmate/cues/cue.es.m4a')).not.toThrow();
    expect(mockDelete).toHaveBeenCalled();
  });
});

