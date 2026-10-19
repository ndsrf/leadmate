import { es, type Catalog, type TextKey } from './es';

export type { Catalog, TextKey } from './es';
export { es } from './es';

export type Translate = (key: TextKey) => string;

/**
 * Builds a lookup for one language. A key missing from `catalog` falls back to Spanish;
 * a key missing from both yields an empty string, never the raw key.
 */
export function createTranslator(catalog: Catalog = es): Translate {
  return (key) => catalog[key] ?? es[key] ?? '';
}

/** Spanish lookup, used by the standalone simulation page. */
export const t: Translate = createTranslator(es);
