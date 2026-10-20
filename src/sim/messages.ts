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
  | { type: 'resume' };

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
   */
  | { type: 'stage-signal'; signal: StageSignal; time: number }
  | { type: 'error'; message: string };

export const STAGE_SIGNALS = ['first-taut', 'first-fixation', 'leash-limit'] as const;
export type StageSignal = (typeof STAGE_SIGNALS)[number];

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

export const SHELL_MESSAGE_TYPES: readonly ShellMessage['type'][] = ['start', 'pause', 'resume'];
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
