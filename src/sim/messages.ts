import type { Catalog } from '../i18n';
import type { ScenarioConfig } from './config';
import type { SimulationDebriefPayload } from './payload';

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
  | { type: 'error'; message: string };

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
export const BUNDLE_MESSAGE_TYPES: readonly BundleMessage['type'][] = ['ready', 'paused', 'debrief', 'error'];

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
