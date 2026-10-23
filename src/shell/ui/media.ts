import type { NodeMedia } from '../nodes/node';

export type MediaDisplay = 'media' | 'placeholder';

/** Whether to draw the media itself or its placeholder: a placeholder flag, an empty URL or a load error all fall back. */
export function mediaDisplay(media: NodeMedia, failed: boolean): MediaDisplay {
  return media.placeholder || media.url.trim() === '' || failed ? 'placeholder' : 'media';
}

/** Why the placeholder is showing: still pending content, or content that failed to load. */
export function placeholderReason(media: NodeMedia, failed: boolean): 'pending' | 'unavailable' {
  return !media.placeholder && media.url.trim() !== '' && failed ? 'unavailable' : 'pending';
}

export type BrowserState = 'loading' | 'ready' | 'offline';

export function browserNext(state: BrowserState, event: 'loaded' | 'error' | 'retry'): BrowserState {
  if (event === 'retry') return 'loading';
  if (event === 'error') return 'offline';
  return state === 'offline' ? state : 'ready';
}

/** Only an http(s) address opens in the in-app browser. */
export function isWebUrl(url: string): boolean {
  return /^https?:\/\/\S+$/i.test(url);
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_HOST = 'www.youtube-nocookie.com';

/** Only the privacy-enhanced YouTube host may be embedded. */
export function isAllowedVideoHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === VIDEO_HOST;
  } catch {
    return false;
  }
}

/** The embed address of a YouTube video id, built from the id and fixed parameters only; null for anything but a bare 11-character id. */
export function videoEmbedUrl(id: string): string | null {
  return VIDEO_ID.test(id) ? `https://${VIDEO_HOST}/embed/${id}?rel=0&playsinline=1&modestbranding=1` : null;
}

/** The address "Open video" hands to the system browser; same id rule. */
export function videoWatchUrl(id: string): string | null {
  return VIDEO_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

export type LessonImageKind = 'art' | 'remote' | 'placeholder';

/** How a Lesson image draws: bundled art by name, a remote web address, or the themed placeholder (unknown source or a load error). */
export function lessonImageKind(source: string, isArt: boolean, failed: boolean): LessonImageKind {
  if (isArt) return 'art';
  return !failed && isWebUrl(source) ? 'remote' : 'placeholder';
}
