/**
 * Configuration and URL resolver for Remote Content Packs.
 *
 * Rules:
 * - Production builds ONLY accept HTTPS addresses from EXPO_PUBLIC_CONTENT_BASE.
 * - EXPO_PUBLIC_CONTENT_DEV_URL is strictly ignored in production.
 * - In development (__DEV__), EXPO_PUBLIC_CONTENT_DEV_URL may be used (allowing http:// localhost/dev server).
 * - If unset or invalid, the content base is '' (meaning baseline only, no network requests made).
 * - Escaping paths ('..', protocol prefixes) are rejected.
 */

export interface ContentBaseOptions {
  contentBase?: string;
  contentDevUrl?: string;
  isDev?: boolean;
}

/**
 * Validates and trims an HTTPS content base URL.
 * Returns trimmed URL without trailing slashes, or '' if invalid or not HTTPS.
 */
export function cleanHttpsContentBase(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : '';
  } catch {
    return '';
  }
}

/**
 * Validates and trims a development content URL (allowing http or https).
 */
export function cleanDevContentUrl(raw: string | undefined | null): string {
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? trimmed : '';
  } catch {
    return '';
  }
}

/**
 * Resolves the active Content Base URL according to environment and flags.
 */
export function resolveContentBase(options: ContentBaseOptions = {}): string {
  const isDev =
    options.isDev ?? (typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production');

  // In development, dev URL takes precedence if provided
  if (isDev) {
    const devUrl = options.contentDevUrl ?? process.env.EXPO_PUBLIC_CONTENT_DEV_URL;
    const cleanedDev = cleanDevContentUrl(devUrl);
    if (cleanedDev) {
      return cleanedDev;
    }
  }

  // Otherwise (or in production), strictly use HTTPS content base
  const base = options.contentBase ?? process.env.EXPO_PUBLIC_CONTENT_BASE;
  return cleanHttpsContentBase(base);
}

/**
 * Whether remote content downloading is configured and enabled.
 */
export function hasRemoteContent(base?: string): boolean {
  const resolved = base !== undefined ? base : resolveContentBase();
  return resolved !== '';
}

/**
 * Builds the URL for a channel's latest.json pointer.
 */
export function channelLatestUrl(channel: 'beta' | 'stable', base?: string): string | null {
  const root = base !== undefined ? base : resolveContentBase();
  if (!root) return null;
  return `${root}/${channel}/latest.json`;
}

/**
 * Builds the URL for a channel's manifest JSON file.
 */
export function channelManifestUrl(
  channel: 'beta' | 'stable',
  manifestPath: string,
  base?: string
): string | null {
  const root = base !== undefined ? base : resolveContentBase();
  if (!root || !manifestPath) return null;
  // Security: reject escaping paths or protocols
  if (manifestPath.includes('..') || manifestPath.includes('://')) {
    return null;
  }
  const cleanPath = manifestPath.startsWith('/') ? manifestPath.slice(1) : manifestPath;
  return `${root}/${channel}/${cleanPath}`;
}

/**
 * Builds the URL for a content file in a channel (e.g. files/<sha256>.<ext>).
 */
export function channelFileUrl(
  channel: 'beta' | 'stable',
  storageKeyOrPath: string,
  base?: string
): string | null {
  const root = base !== undefined ? base : resolveContentBase();
  if (!root || !storageKeyOrPath) return null;
  // Security: reject escaping paths or protocols
  if (storageKeyOrPath.includes('..') || storageKeyOrPath.includes('://')) {
    return null;
  }
  const cleanKey = storageKeyOrPath.startsWith('/') ? storageKeyOrPath.slice(1) : storageKeyOrPath;
  const path = cleanKey.startsWith('files/') ? cleanKey : `files/${cleanKey}`;
  return `${root}/${channel}/${path}`;
}
