import type { Catalog } from '../i18n';
import type { CueType, ScenarioConfig } from './config';
import type { SimulationDebriefPayload } from './payload';
import type { ReactionTier } from './sim';

/** Shell -> bundle. */
export type ShellMessage =
  | {
      type: 'start';
      /** Seed for the new Stage; the bundle picks one when absent. */
      seed?: number;
      /** Text for the active language; keys it lacks fall back to Spanish. */
      catalog?: Catalog;
      scenario?: Partial<ScenarioConfig>;
    }
  | { type: 'pause' }
  | { type: 'resume' }
  /** Zoom the camera in on the Handler and the Dog; the Stage keeps running. */
  | { type: 'focus' }
  /** No Stage is on screen (World Map, menus, screen off): stop drawing frames. */
  | { type: 'suspend' }
  /** A Stage is on screen again: restart the render loop. */
  | { type: 'wake' };

/** Bundle -> shell. */
export type BundleMessage =
  | { type: 'ready' }
  | { type: 'paused' }
  | { type: 'debrief'; payload: SimulationDebriefPayload }
  /** A Cue took effect in the simulation; the shell picks and plays the audio (fire and forget). */
  | { type: 'playCue'; cueType?: CueType }
  /** The Dog crossed a Reaction Tier threshold; the shell plays a vocalization (fire and forget). */
  | { type: 'reaction-tier-change'; tier: ReactionTier; time: number }
  /**
   * A moment the shell may explain to a new user, sent at most once per Stage and signal: the leash first gets
   * Taut, the Dog first fixates (a Reward Window follows its calming), the leash first reaches its limit.
   * `first-input` is not a hint: the Handler first moves or presses a button. `control-used` says which
   * control (`control`), and `dog-approaching` where the dog comes from on screen (`bearing`, radians).
   */
  | { type: 'stage-signal'; signal: StageSignal; time: number; control?: StageControl; bearing?: number }
  | { type: 'error'; message: string };

export const STAGE_SIGNALS = ['first-taut', 'first-fixation', 'leash-limit', 'first-input', 'dog-approaching', 'control-used'] as const;
export type StageSignal = (typeof STAGE_SIGNALS)[number];

/** The controls a Coach mark can point at: the joystick (`move`) and the Marker button (`mark`). */
export type StageControl = 'move' | 'mark';

/** Lets each signal through once per Stage; `control-used` once per control. */
export function createSignalGate(): (signal: StageSignal, control?: StageControl) => boolean {
  const sent = new Set<string>();
  return (signal, control) => {
    const key = control ? `${signal}:${control}` : signal;
    if (sent.has(key)) return false;
    sent.add(key);
    return true;
  };
}

export function encode(message: ShellMessage | BundleMessage): string {
  return JSON.stringify(message);
}

/** Parses a raw message (string or object), returning null for anything that is not ours. */
export function decode<T extends { type: string }>(raw: unknown, types: readonly T['type'][]): T | null {
  try {
    const value = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (value && typeof value === 'object' && types.includes((value as { type: string }).type)) return value as T;
  } catch {
    // not ours
  }
  return null;
}

export const SHELL_MESSAGE_TYPES: readonly ShellMessage['type'][] = ['start', 'pause', 'resume', 'focus', 'suspend', 'wake'];
export const BUNDLE_MESSAGE_TYPES: readonly BundleMessage['type'][] = ['ready', 'paused', 'debrief', 'playCue', 'reaction-tier-change', 'stage-signal', 'error'];

/** Where the bundle sends its messages: the native WebView bridge, the parent window, or nowhere. */
export type Outbox = (message: BundleMessage) => void;

export function createOutbox(
  win: {
    ReactNativeWebView?: { postMessage(data: string): void };
    parent?: { postMessage(data: string, origin: string): void };
    self?: unknown;
  },
): Outbox {
  return (message) => {
    const data = encode(message);
    if (win.ReactNativeWebView) win.ReactNativeWebView.postMessage(data);
    else if (win.parent && win.parent !== win.self) win.parent.postMessage(data, '*');
  };
}
