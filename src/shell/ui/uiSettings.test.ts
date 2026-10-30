import type { KeyValueStore } from '../dogRecord';
import { createFeedback, setFeedbackSettings } from './feedback';
import { loadUiSettings, saveUiSettings } from './uiSettings';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) };
}

describe('device-local UI settings', () => {
  it('defaults both on', async () => {
    expect(await loadUiSettings(memoryStore())).toEqual({ sounds: true, haptics: true, appearance: 'system' });
  });

  it('persists across a reload', async () => {
    const store = memoryStore();
    await saveUiSettings(store, { sounds: false, haptics: true, appearance: 'dark' });
    expect(await loadUiSettings(store)).toEqual({ sounds: false, haptics: true, appearance: 'dark' });
  });

  it('ignores garbage and falls back to defaults', async () => {
    const store = memoryStore();
    store.data.set('leadmate.ui', '{"sounds":"no","haptics":3}');
    expect(await loadUiSettings(store)).toEqual({ sounds: true, haptics: true, appearance: 'system' });
    store.data.set('leadmate.ui', 'not json');
    expect(await loadUiSettings(store)).toEqual({ sounds: true, haptics: true, appearance: 'system' });
  });

  it('reads a missing Appearance as System', async () => {
    const store = memoryStore();
    store.data.set('leadmate.ui', '{"sounds":false,"haptics":true}');
    expect(await loadUiSettings(store)).toEqual({ sounds: false, haptics: true, appearance: 'system' });
  });

  it('reads an unknown Appearance as System and keeps the sounds and haptics', async () => {
    const store = memoryStore();
    store.data.set('leadmate.ui', '{"sounds":false,"haptics":false,"appearance":"sepia"}');
    expect(await loadUiSettings(store)).toEqual({ sounds: false, haptics: false, appearance: 'system' });
  });

  it('survives a failing store', async () => {
    const broken: KeyValueStore = { getItem: async () => Promise.reject(new Error('x')), setItem: async () => Promise.reject(new Error('x')) };
    expect(await loadUiSettings(broken)).toEqual({ sounds: true, haptics: true, appearance: 'system' });
    await expect(saveUiSettings(broken, { sounds: false, haptics: false, appearance: 'system' })).resolves.toBeUndefined();
  });

  it('off after a reload means press() plays nothing', async () => {
    const store = memoryStore();
    await saveUiSettings(store, { sounds: false, haptics: false, appearance: 'system' });
    const sound = jest.fn();
    const haptic = jest.fn();
    const feedback = createFeedback(
      () => ({ sound, haptic, cueAudioActive: () => false }),
      () => loaded,
    );
    const loaded = await loadUiSettings(store);
    setFeedbackSettings(loaded);
    feedback.press();
    expect(sound).not.toHaveBeenCalled();
    expect(haptic).not.toHaveBeenCalled();
  });
});
