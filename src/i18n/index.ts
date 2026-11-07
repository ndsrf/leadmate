import { es, type Catalog, type TextKey } from './es';
import { getContentCatalog, setContentCatalogProvider } from './catalogProvider';

export type { Catalog, TextKey } from './es';
export { es } from './es';
export { getContentCatalog, setContentCatalogProvider } from './catalogProvider';

export type Translate = (key: TextKey) => string;

/**
 * Builds a lookup for one language. A key missing from `catalog` falls back to Spanish;
 * a key missing from both yields an empty string, never the raw key.
 */
export function createTranslator(catalog: Catalog = es): Translate {
  return (key) => catalog[key] ?? getContentCatalog()[key] ?? (es as Record<string, string>)[key] ?? '';
}

/** Spanish lookup, used by the standalone simulation page. */
export const t: Translate = createTranslator(es);
