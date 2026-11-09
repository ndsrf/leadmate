import type { Language } from '../shell/voice';

/**
 * Resolves the app language from a system locale string or the environment's system language.
 * Defaults to 'es' for Spanish, and 'en' for all other languages.
 */
export function detectDeviceLanguage(deviceLocaleOrLanguage?: string): Language {
  let lang = deviceLocaleOrLanguage;
  if (!lang) {
    try {
      if (typeof Intl !== 'undefined' && typeof Intl.DateTimeFormat === 'function') {
        lang = Intl.DateTimeFormat().resolvedOptions().locale;
      }
    } catch {
      lang = 'en';
    }
  }

  if (lang && lang.trim().toLowerCase().startsWith('es')) {
    return 'es';
  }
  return 'en';
}
