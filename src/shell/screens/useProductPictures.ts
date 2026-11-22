import { useEffect, useMemo, useState } from 'react';
import type { ImageSourcePropType } from 'react-native';
import { MediaResolver } from '../content/mediaResolver';
import type { ResolvedShop } from '../content/resolver';

/**
 * Resolves every Shop product picture through the shared MediaResolver: `image` in product.yaml is a path relative to
 * the product folder, so it is looked up as `shop/products/<id>/media/<image>` in the installed pack, then in the
 * pictures bundled with this release, then downloaded in the background when a content host is configured.
 * Products whose picture cannot be resolved are absent from the result (the screen shows its placeholder).
 */
export function useProductPictures(shop: ResolvedShop, resolver?: MediaResolver): Record<string, ImageSourcePropType> {
  const res = resolver ?? MediaResolver.getInstance();
  const wanted = useMemo(() => {
    const seen = new Map<string, string>();
    for (const cat of shop.categories) {
      for (const sub of cat.subcategories) {
        for (const prod of sub.products) if (prod.image) seen.set(prod.id, prod.image);
      }
    }
    return [...seen.entries()];
  }, [shop]);
  const [pictures, setPictures] = useState<Record<string, ImageSourcePropType>>({});

  useEffect(() => {
    let active = true;
    const set = (id: string, source: ImageSourcePropType) => {
      if (active) setPictures((prev) => ({ ...prev, [id]: source }));
    };
    for (const [id, image] of wanted) {
      res
        .resolveImage(image, { itemPath: `shop/products/${id}`, onDownloaded: (uri) => set(id, { uri }) })
        .then((r) => {
          if ((r.kind === 'bundled' || r.kind === 'local') && r.source) set(id, r.source);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [wanted, res]);

  return pictures;
}
