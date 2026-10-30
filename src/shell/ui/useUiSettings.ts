import { useCallback, useEffect, useState } from 'react';
import type { KeyValueStore } from '../dogRecord';
import { setFeedbackSettings } from './feedback';
import { DEFAULT_UI_SETTINGS, loadUiSettings, saveUiSettings, type UiSettings } from './uiSettings';

/** Loads the device's sound, haptics and Appearance choices once, keeps the feedback service in step and saves each change. */
export function useUiSettings(store: KeyValueStore): { settings: UiSettings; change: (patch: Partial<UiSettings>) => void } {
  const [settings, setSettings] = useState<UiSettings>(DEFAULT_UI_SETTINGS);

  useEffect(() => {
    let alive = true;
    loadUiSettings(store).then((loaded) => {
      if (!alive) return;
      setFeedbackSettings(loaded);
      setSettings(loaded);
    });
    return () => {
      alive = false;
    };
  }, [store]);

  const change = useCallback(
    (patch: Partial<UiSettings>) => {
      setSettings((current) => {
        const next = { ...current, ...patch };
        setFeedbackSettings(next);
        void saveUiSettings(store, next);
        return next;
      });
    },
    [store],
  );

  return { settings, change };
}
