import { LANGUAGE_STORAGE_KEY, loadStoredLanguage, saveStoredLanguage } from './storage';

describe('device language storage', () => {
  it('loads null when no language is stored', async () => {
    const store = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
    };
    const lang = await loadStoredLanguage(store);
    expect(lang).toBeNull();
    expect(store.getItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY);
  });

  it('loads valid language when stored', async () => {
    const store = {
      getItem: jest.fn().mockResolvedValue('en'),
      setItem: jest.fn().mockResolvedValue(undefined),
    };
    expect(await loadStoredLanguage(store)).toBe('en');

    store.getItem.mockResolvedValue('es');
    expect(await loadStoredLanguage(store)).toBe('es');
  });

  it('ignores invalid language values in storage', async () => {
    const store = {
      getItem: jest.fn().mockResolvedValue('fr'),
      setItem: jest.fn().mockResolvedValue(undefined),
    };
    expect(await loadStoredLanguage(store)).toBeNull();
  });

  it('saves language to the store', async () => {
    const store = {
      getItem: jest.fn().mockResolvedValue(null),
      setItem: jest.fn().mockResolvedValue(undefined),
    };
    await saveStoredLanguage('en', store);
    expect(store.setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'en');

    await saveStoredLanguage('es', store);
    expect(store.setItem).toHaveBeenCalledWith(LANGUAGE_STORAGE_KEY, 'es');
  });
});
