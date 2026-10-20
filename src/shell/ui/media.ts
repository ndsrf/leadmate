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
