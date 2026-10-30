import type { NodeMedia } from '../nodes/node';

export type MediaDisplay = 'bundled' | 'media' | 'placeholder';

/**
 * Whether to draw the media or its placeholder: media naming bundled Lesson art draws it whenever it is bundled
 * (`bundled`), offline included; otherwise a placeholder flag, an empty URL or a load error all fall back.
 */
export function mediaDisplay(media: NodeMedia, failed: boolean, bundled = false): MediaDisplay {
  if (media.art !== undefined) return bundled ? 'bundled' : 'placeholder';
  return media.placeholder || media.url.trim() === '' || failed ? 'placeholder' : 'media';
}

/** Why the placeholder is showing: still pending content, or content that failed to load. */
export function placeholderReason(media: NodeMedia, failed: boolean): 'pending' | 'unavailable' {
  return media.art === undefined && !media.placeholder && media.url.trim() !== '' && failed ? 'unavailable' : 'pending';
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

export type LessonImageKind = 'bundled' | 'art' | 'remote' | 'placeholder';

/**
 * How a Lesson image draws: a bundled illustration from the registry by name, then an inline scene by name, then a
 * remote web address, else the themed placeholder (unknown name or a load error).
 */
export function lessonImageKind(source: string, known: { bundled: boolean; inline: boolean }, failed: boolean): LessonImageKind {
  if (known.bundled) return 'bundled';
  if (known.inline) return 'art';
  return !failed && isWebUrl(source) ? 'remote' : 'placeholder';
}

/**
 * Injected into a WebView when the app leaves the foreground: pauses every video and audio element of the page (main
 * frame only), in place, so it keeps its position and waits for the user to play it again.
 */
export const PAUSE_MEDIA_JS = "document.querySelectorAll('video,audio').forEach(function (m) { m.pause(); }); true;";
