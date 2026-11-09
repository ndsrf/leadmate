import { detectDeviceLanguage } from './language';

describe('device language detection', () => {
  const originalIntl = global.Intl;

  afterEach(() => {
    global.Intl = originalIntl;
  });

  it('defaults to Spanish for Spanish locales', () => {
    expect(detectDeviceLanguage('es')).toBe('es');
    expect(detectDeviceLanguage('es-ES')).toBe('es');
    expect(detectDeviceLanguage('es-MX')).toBe('es');
    expect(detectDeviceLanguage('es-AR')).toBe('es');
    expect(detectDeviceLanguage('ES')).toBe('es');
    expect(detectDeviceLanguage('  es-CO  ')).toBe('es');
  });

  it('defaults to English for English and all non-Spanish locales', () => {
    expect(detectDeviceLanguage('en')).toBe('en');
    expect(detectDeviceLanguage('en-US')).toBe('en');
    expect(detectDeviceLanguage('en-GB')).toBe('en');
    expect(detectDeviceLanguage('fr-FR')).toBe('en');
    expect(detectDeviceLanguage('de-DE')).toBe('en');
    expect(detectDeviceLanguage('ja-JP')).toBe('en');
    expect(detectDeviceLanguage('')).toBe('en');
  });

  it('inspects Intl.DateTimeFormat().resolvedOptions().locale when no locale is provided', () => {
    global.Intl = {
      ...originalIntl,
      DateTimeFormat: (() => ({
        resolvedOptions: () => ({ locale: 'es-ES' }),
      })) as unknown as typeof Intl.DateTimeFormat,
    };
    expect(detectDeviceLanguage()).toBe('es');

    global.Intl = {
      ...originalIntl,
      DateTimeFormat: (() => ({
        resolvedOptions: () => ({ locale: 'en-US' }),
      })) as unknown as typeof Intl.DateTimeFormat,
    };
    expect(detectDeviceLanguage()).toBe('en');

    global.Intl = {
      ...originalIntl,
      DateTimeFormat: (() => ({
        resolvedOptions: () => ({ locale: 'it-IT' }),
      })) as unknown as typeof Intl.DateTimeFormat,
    };
    expect(detectDeviceLanguage()).toBe('en');
  });

  it('handles exceptions gracefully when accessing Intl', () => {
    global.Intl = {
      ...originalIntl,
      DateTimeFormat: (() => {
        throw new Error('Not supported');
      }) as unknown as typeof Intl.DateTimeFormat,
    };
    expect(detectDeviceLanguage()).toBe('en');
  });
});
