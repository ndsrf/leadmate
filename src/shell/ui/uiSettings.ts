import type { KeyValueStore } from '../dogRecord';
import { DEFAULT_FEEDBACK_SETTINGS, type FeedbackSettings } from './feedback';

/** Device-local: UI sounds, haptics and the Appearance describe this phone, not the Dog, so they are not in the synced record. */
export const UI_SETTINGS_KEY = 'leadmate.ui';

/** System follows the phone's (or browser's) light/dark setting. */
export type Appearance = 'system' | 'light' | 'dark';
export const APPEARANCES: readonly Appearance[] = ['system', 'light', 'dark'];

export type UiSettings = FeedbackSettings & { appearance: Appearance };

export const DEFAULT_UI_SETTINGS: UiSettings = { ...DEFAULT_FEEDBACK_SETTINGS, appearance: 'system' };

export function readUiSettings(raw: unknown): UiSettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Partial<Record<keyof UiSettings, unknown>>;
  return {
    sounds: typeof r.sounds === 'boolean' ? r.sounds : DEFAULT_FEEDBACK_SETTINGS.sounds,
    haptics: typeof r.haptics === 'boolean' ? r.haptics : DEFAULT_FEEDBACK_SETTINGS.haptics,
    appearance: APPEARANCES.includes(r.appearance as Appearance) ? (r.appearance as Appearance) : DEFAULT_UI_SETTINGS.appearance,
  };
}

export async function loadUiSettings(store: KeyValueStore): Promise<UiSettings> {
  try {
    const raw = await store.getItem(UI_SETTINGS_KEY);
    return readUiSettings(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_UI_SETTINGS };
  }
}

export async function saveUiSettings(store: KeyValueStore, settings: UiSettings): Promise<void> {
  try {
    await store.setItem(UI_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // the choice holds for this session; the next change tries again
  }
}
