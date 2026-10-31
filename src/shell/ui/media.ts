import type { VideoSource } from '../lessons/lesson';
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

/** An https media base with its trailing slashes trimmed; '' for anything else, so no clip address can be built from it. */
export function mediaBase(raw: string | undefined): string {
  const base = (raw ?? '').trim().replace(/\/+$/, '');
  try {
    return new URL(base).protocol === 'https:' ? base : '';
  } catch {
    return '';
  }
}

/** Where Lesson Animations are hosted (EXPO_PUBLIC_MEDIA_BASE, never derived from the Supabase URL); '' hides animation blocks. */
export const MEDIA_BASE = mediaBase(process.env.EXPO_PUBLIC_MEDIA_BASE);

const ANIMATION_KEY = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** A Lesson Animation key: lowercase letters and digits in "-"-separated runs, so it can never carry a path or an address. */
export function isAnimationKey(key: string): boolean {
  return ANIMATION_KEY.test(key);
}

/** The clip address of a Lesson Animation: the media base, `animations/`, the key and `.mp4`; null for a bad key or a missing or non-https base. */
export function animationUrl(key: string, base: string = MEDIA_BASE): string | null {
  const root = mediaBase(base);
  return root !== '' && isAnimationKey(key) ? `${root}/animations/${key}.mp4` : null;
}

/** The Animation Timeline address of a Lesson Animation, next to its clip (`.json`); same checks as `animationUrl`. */
export function animationTimelineUrl(key: string, base: string = MEDIA_BASE): string | null {
  const root = mediaBase(base);
  return root !== '' && isAnimationKey(key) ? `${root}/animations/${key}.json` : null;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const VIDEO_HOST = 'www.youtube-nocookie.com';

/**
 * The fixed https origin the native player embeds YouTube from, so YouTube receives an origin and a referrer (without
 * them it answers "Error 153"). It must be a domain we control, our Supabase project origin, never someone else's:
 * see docs/adr/0016-hosted-lesson-animations-and-youtube-origin.md. A constant, not read from the env, so local-only
 * and CI builds get it too. If YouTube refuses it, move it to a domain registered for this, never one we do not own.
 */
export const APP_ORIGIN = 'https://fmtcbwhmawhwvjxptjod.supabase.co';

/** The page the native WebView loads at `APP_ORIGIN`: one full-size iframe of the embed address, sending its referrer. */
export function videoEmbedPage(embedUrl: string): string {
  const src = embedUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head><body><iframe src="${src}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></body></html>`;
}

/** What the native player may navigate its top frame to: the embed page at `APP_ORIGIN` (or `about:blank`) and the YouTube host. */
export function isAllowedPlayerNavigation(url: string, origin: string = APP_ORIGIN): boolean {
  if (url === 'about:blank' || isAllowedVideoHost(url)) return true;
  if (origin === '') return false;
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

/** Only the privacy-enhanced YouTube host may be embedded. */
export function isAllowedVideoHost(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && u.hostname === VIDEO_HOST;
  } catch {
    return false;
  }
}

/** The embed address of a YouTube video id, built from the id, the app's fixed origin and fixed parameters only; null for anything but a bare 11-character id. */
export function videoEmbedUrl(id: string, origin: string = APP_ORIGIN): string | null {
  if (!VIDEO_ID.test(id)) return null;
  const url = `https://${VIDEO_HOST}/embed/${id}?rel=0&playsinline=1&modestbranding=1`;
  return origin === '' ? url : `${url}&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
}

/** The address "Open video" hands to the system browser; same id rule. */
export function videoWatchUrl(id: string): string | null {
  return VIDEO_ID.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

/** What a Lesson Video plays: the player address (null when it cannot be built) and, for YouTube only, the "Open video" address. */
export function videoPlayback(source: VideoSource, base: string = MEDIA_BASE): { uri: string | null; watch: string | null } {
  return source.kind === 'animation' ? { uri: animationUrl(source.key, base), watch: null } : { uri: videoEmbedUrl(source.id), watch: videoWatchUrl(source.id) };
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
 * frame only), in place, so it keeps its position and waits for the user to play it again. A YouTube embed in an
 * iframe (the native embed page) is asked to pause through its player API (`enablejsapi=1`).
 */
export const PAUSE_MEDIA_JS =
  "document.querySelectorAll('video,audio').forEach(function (m) { m.pause(); }); document.querySelectorAll('iframe').forEach(function (f) { f.contentWindow && f.contentWindow.postMessage('{\"event\":\"command\",\"func\":\"pauseVideo\",\"args\":\"\"}', '*'); }); true;";
