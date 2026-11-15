import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { cueAudioActive } from '../audio';
import { configureFeedback, type HapticKind, type StageSound, type StageSoundOptions, type UiSound } from './feedback';

const SOUNDS: Record<UiSound, number> = {
  press: require('../../../assets/ui/press.wav'),
  success: require('../../../assets/ui/success.wav'),
  star: require('../../../assets/ui/star.wav'),
  unlock: require('../../../assets/ui/unlock.wav'),
};

const STAGE_SOUNDS: Record<StageSound, number> = {
  tick: require('../../../assets/ui/tick.wav'),
  chime: require('../../../assets/ui/chime.wav'),
  fanfare: require('../../../assets/ui/fanfare.wav'),
  bonk: require('../../../assets/ui/bonk.wav'),
};

// a separate player from the Cue and Dog players, so a UI sound never replaces them
let player: AudioPlayer | null = null;
// one preloaded player per Feedback Message sound, reused for every play
const stagePlayers: Partial<Record<StageSound, AudioPlayer>> = {};

function haptic(kind: HapticKind): void {
  if (kind === 'light' || kind === 'tick') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else if (kind === 'thud') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
  else void Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

function sound(name: UiSound): void {
  player?.remove();
  player = createAudioPlayer(SOUNDS[name]);
  player.play();
}

function stagePlayer(name: StageSound): AudioPlayer {
  return (stagePlayers[name] ??= createAudioPlayer(STAGE_SOUNDS[name]));
}

function preload(): void {
  for (const name of Object.keys(STAGE_SOUNDS) as StageSound[]) stagePlayer(name);
}

function stageSound(name: StageSound, { rate, volume }: StageSoundOptions): void {
  const p = stagePlayer(name);
  p.volume = volume;
  // pitch follows the rate (no pitch correction); a platform that rejects the rate plays the sound at its own pitch
  try {
    (p as { shouldCorrectPitch?: boolean }).shouldCorrectPitch = false;
    p.setPlaybackRate(rate);
  } catch {
    // fixed pitch
  }
  void p.seekTo(0).catch(() => {});
  p.play();
}

/** Wires the service to expo-haptics (a no-op on web) and expo-audio; call once at start-up. */
export function installFeedback(): void {
  configureFeedback({ haptic, sound, cueAudioActive, stageSound, preload });
}
