import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { cueAudioActive } from '../audio';
import { configureFeedback, type HapticKind, type UiSound } from './feedback';

const SOUNDS: Record<UiSound, number> = {
  press: require('../../../assets/ui/press.wav'),
  success: require('../../../assets/ui/success.wav'),
  star: require('../../../assets/ui/star.wav'),
  unlock: require('../../../assets/ui/unlock.wav'),
};

// a separate player from the Cue and Dog players, so a UI sound never replaces them
let player: AudioPlayer | null = null;

function haptic(kind: HapticKind): void {
  if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  else void Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

function sound(name: UiSound): void {
  player?.remove();
  player = createAudioPlayer(SOUNDS[name]);
  player.play();
}

/** Wires the service to expo-haptics (a no-op on web) and expo-audio; call once at start-up. */
export function installFeedback(): void {
  configureFeedback({ haptic, sound, cueAudioActive });
}
