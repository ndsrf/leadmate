/**
 * Amazon Shop Product Import Utilities
 * Pure HTML extractor and URL helpers for content:shop-import CLI.
 */

export interface ExtractedProductData {
  title?: string;
  description?: string;
  price?: string;
  imageUrl?: string;
  isRobotCheck: boolean;
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  quot: '"',
  apos: "'",
  lt: '<',
  gt: '>',
  nbsp: ' ',
  iexcl: '¡',
  iquest: '¿',
  aacute: 'á',
  eacute: 'é',
  iacute: 'í',
  oacute: 'ó',
  uacute: 'ú',
  ntilde: 'ñ',
  uuml: 'ü',
  Aacute: 'Á',
  Eacute: 'É',
  Iacute: 'Í',
  Oacute: 'Ó',
  Uacute: 'Ú',
  Ntilde: 'Ñ',
  Uuml: 'Ü',
  euro: '€',
  pound: '£',
  copy: '©',
  reg: '®',
  trade: '™',
  bull: '•',
  mdash: '—',
  ndash: '–',
};

/**
 * Decodes standard and common named/numeric HTML entities into UTF-8 characters.
 */
export function decodeHtmlEntities(raw: string): string {
  return raw
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&([a-zA-Z]+);/g, (match, entity) => NAMED_ENTITIES[entity] ?? match);
}

/**
 * Strips HTML tags from a string.
 */
function stripHtmlTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Checks if a string contains Amazon robot-check / CAPTCHA challenge markers.
 */
export function isAmazonRobotCheck(html: string): boolean {
  if (/<title>[^<]*Robot Check[^<]*<\/title>/i.test(html)) {
    return true;
  }
  if (html.includes('api-services-support@amazon.com')) {
    return true;
  }
  if (html.includes('Type the characters you see in this image')) {
    return true;
  }
  if (html.includes('Enter the characters you see below')) {
    return true;
  }
  if (/<h4>\s*Enter the characters you see below\s*<\/h4>/i.test(html)) {
    return true;
  }
  return false;
}

/**
 * Extracts product metadata from an Amazon HTML page using JSON-LD, OpenGraph,
 * and standard Amazon DOM selectors.
 */
export function extractProductFromHtml(html: string): ExtractedProductData {
  if (isAmazonRobotCheck(html)) {
    return { isRobotCheck: true };
  }

  let title: string | undefined;
  let description: string | undefined;
  let price: string | undefined;
  let imageUrl: string | undefined;

  // 1. Try DOM: #productTitle
  const productTitleMatch = /<span[^>]*id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i.exec(html);
  if (productTitleMatch) {
    const raw = stripHtmlTags(productTitleMatch[1]);
    if (raw) {
      title = decodeHtmlEntities(raw);
    }
  }

  // 2. Try DOM: feature bullets
  const featureBulletsMatch = /<div[^>]*id=["']feature-bullets["'][^>]*>([\s\S]*?)<\/div>/i.exec(html);
  if (featureBulletsMatch) {
    const bullets: string[] = [];
    const itemRegex = /<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
    let m: RegExpExecArray | null;
    while ((m = itemRegex.exec(featureBulletsMatch[1])) !== null) {
      const text = decodeHtmlEntities(stripHtmlTags(m[1]));
      if (text && !text.toLowerCase().includes('make sure this fits')) {
        bullets.push(text);
      }
    }
    if (bullets.length > 0) {
      description = bullets.map((b) => `- ${b}`).join('\n');
    }
  }

  // 3. Try DOM: Price (.a-price .a-offscreen or priceblock)
  const offscreenPriceMatch = /<span[^>]*class=["'][^"']*a-price[^"']*["'][^>]*>[\s\S]*?<span[^>]*class=["']a-offscreen["'][^>]*>([^<]+)<\/span>/i.exec(html);
  if (offscreenPriceMatch) {
    price = decodeHtmlEntities(offscreenPriceMatch[1].trim());
  } else {
    const blockPriceMatch = /<span[^>]*id=["'](?:priceblock_ourprice|priceblock_dealprice|price_inside_buybox)["'][^>]*>([^<]+)<\/span>/i.exec(html);
    if (blockPriceMatch) {
      price = decodeHtmlEntities(blockPriceMatch[1].trim());
    }
  }

  // 4. Try DOM: Main Image
  const oldHiresMatch = /data-old-hires=["']([^"']+)["']/i.exec(html);
  if (oldHiresMatch && oldHiresMatch[1].trim()) {
    imageUrl = oldHiresMatch[1].trim();
  } else {
    const dynImageMatch = /data-a-dynamic-image=["'](\{[\s\S]*?\})["']/i.exec(html);
    if (dynImageMatch) {
      try {
        const decoded = decodeHtmlEntities(dynImageMatch[1]);
        const parsed = JSON.parse(decoded);
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          imageUrl = keys[0];
        }
      } catch {
        // ignore JSON parse failure
      }
    }
  }
  if (!imageUrl) {
    const landingImageMatch = /<img[^>]*id=["']landingImage["'][^>]*src=["']([^"']+)["']/i.exec(html);
    if (landingImageMatch && !landingImageMatch[1].includes('data:image')) {
      imageUrl = landingImageMatch[1].trim();
    }
  }

  // 5. JSON-LD Fallback / Augment
  const jsonLdRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jsonMatch: RegExpExecArray | null;
  while ((jsonMatch = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(jsonMatch[1]);
      const item = Array.isArray(data) ? data.find((d) => d['@type'] === 'Product') : data['@type'] === 'Product' ? data : null;
      if (item) {
        if (!title && item.name) {
          title = decodeHtmlEntities(String(item.name).trim());
        }
        if (!description && item.description) {
          description = decodeHtmlEntities(String(item.description).trim());
        }
        if (!imageUrl) {
          if (typeof item.image === 'string') {
            imageUrl = item.image;
          } else if (Array.isArray(item.image) && typeof item.image[0] === 'string') {
            imageUrl = item.image[0];
          } else if (item.image && typeof item.image.url === 'string') {
            imageUrl = item.image.url;
          }
        }
        if (!price && item.offers) {
          const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offer && offer.price) {
            const currency = offer.priceCurrency ? ` ${offer.priceCurrency}` : '';
            price = `${offer.price}${currency}`;
          }
        }
      }
    } catch {
      // ignore JSON-LD parse errors
    }
  }

  // 6. OpenGraph Fallback
  if (!title) {
    const ogTitleMatch = /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i.exec(html) ??
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i.exec(html);
    if (ogTitleMatch) {
      let t = decodeHtmlEntities(ogTitleMatch[1].trim());
      t = t.replace(/\s*:\s*Amazon\.[a-z.]+(?::.*)?$/i, '');
      title = t.trim();
    }
  }

  if (!description) {
    const ogDescMatch = /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i.exec(html) ??
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i.exec(html) ??
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html) ??
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i.exec(html);
    if (ogDescMatch) {
      description = decodeHtmlEntities(ogDescMatch[1].trim());
    }
  }

  if (!imageUrl) {
    const ogImageMatch = /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i.exec(html) ??
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:image["']/i.exec(html);
    if (ogImageMatch) {
      imageUrl = ogImageMatch[1].trim();
    }
  }

  return {
    isRobotCheck: false,
    title: title || undefined,
    description: description || undefined,
    price: price || undefined,
    imageUrl: imageUrl || undefined,
  };
}

/**
 * Checks whether a given URL is an Amazon marketplace URL or known short link.
 */
export function isAmazonUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    if (host === 'amzn.to' || host === 'a.co') {
      return true;
    }
    return /(^|\.)amazon\.[a-z]+(\.[a-z]+)?$/.test(host);
  } catch {
    return false;
  }
}

/**
 * Returns the uppercase environment variable suffix for a given marketplace domain.
 * e.g.:
 * - "https://www.amazon.es/dp/123" -> "ES"
 * - "https://amazon.co.uk/dp/123" -> "CO_UK"
 * - "https://amazon.com/dp/123" -> "COM"
 * - "https://amazon.com.mx/dp/123" -> "COM_MX"
 */
export function getMarketplaceSuffix(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    const match = /(?:^|\.)amazon\.([a-z]+(?:\.[a-z]+)?)$/.exec(host);
    if (!match) return null;
    return match[1].replace(/\./g, '_').toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Cleans tracking query parameters from an Amazon URL and optionally attaches an affiliate tag.
 */
export function cleanAmazonUrl(rawUrl: string, affiliateTag?: string): string {
  try {
    const u = new URL(rawUrl);
    const allowedParams = new URLSearchParams();
    if (affiliateTag) {
      allowedParams.set('tag', affiliateTag);
    }
    u.search = allowedParams.toString() ? `?${allowedParams.toString()}` : '';
    u.hash = '';
    return u.toString();
  } catch {
    return rawUrl;
  }
}
