type ContentCatalogProvider = () => Record<string, string>;

let activeContentCatalogProvider: ContentCatalogProvider | null = null;

export function setContentCatalogProvider(provider: ContentCatalogProvider): void {
  activeContentCatalogProvider = provider;
}

export function getContentCatalog(): Record<string, string> {
  return activeContentCatalogProvider ? activeContentCatalogProvider() : {};
}
