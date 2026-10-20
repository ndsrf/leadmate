import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { Directory, File, Paths } from 'expo-file-system';
import type { ResolvedCue } from './voice';
import { DOG_SOUNDS } from './dogSounds';
import type { DogSound } from './vocalize';
import { VOICE_ASSETS } from './voiceAssets';

let player: AudioPlayer | null = null;

/** Plays the resolved Cue and returns at once; the Cue's effect never waits for the audio. */
export function playResolvedCue(cue: ResolvedCue): void {
  try {
    const source = cue.kind === 'custom' ? { uri: cue.uri } : VOICE_ASSETS[cue.assetId];
    if (source === undefined) return;
    player?.remove();
    player = createAudioPlayer(source);
    player.play();
  } catch {
    // a Cue that cannot play is silent; the Stage goes on
  }
}

let dogPlayer: AudioPlayer | null = null;

/** Plays a dog vocalization and returns at once; the simulation never waits for it. A new one replaces the last. */
export function playDogSound(sound: DogSound): void {
  try {
    dogPlayer?.remove();
    dogPlayer = createAudioPlayer(DOG_SOUNDS[sound]);
    dogPlayer.play();
  } catch {
    // a sound that cannot play is silent; the Stage goes on
  }
}

/** Lets the Cue sound even when a phone is on silent, and lets the microphone record. */
export async function prepareAudio(recording: boolean): Promise<void> {
  try {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: recording });
  } catch {
    // keep the default audio mode
  }
}

/** Moves a fresh recording to the app's own storage so the system cannot clear it from the cache. */
export function keepRecording(cacheUri: string, language: string): string {
  const dir = new Directory(Paths.document, 'cues');
  if (!dir.exists) dir.create();
  const target = new File(dir, `cue.${language}.m4a`);
  if (target.exists) target.delete();
  new File(cacheUri).copy(target);
  return target.uri;
}

export function deleteRecording(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // already gone
  }
}
