import type { NodeMedia } from '../nodes/node';
import { browserNext, PAUSE_MEDIA_JS, isAllowedVideoHost, isWebUrl, mediaDisplay, lessonImageKind, placeholderReason, videoEmbedUrl, videoWatchUrl } from './media';

const image: NodeMedia = { type: 'image', url: 'https://example.com/a.png', caption: 'media.caption.poste' };

describe('media fallback', () => {
  it('shows the media when it has a URL and loaded', () => {
    expect(mediaDisplay(image, false)).toBe('media');
  });

  it('shows the placeholder for a flagged item, an empty URL or a load error', () => {
    expect(mediaDisplay({ ...image, placeholder: true }, false)).toBe('placeholder');
    expect(mediaDisplay({ ...image, url: '  ' }, false)).toBe('placeholder');
    expect(mediaDisplay(image, true)).toBe('placeholder');
  });

  it('draws Primer media naming bundled Lesson art from the bundle, offline too, and the placeholder for an unknown name', () => {
    const art: NodeMedia = { type: 'image', url: '', art: 'theory-poste-1', caption: 'media.caption.poste' };
    expect(mediaDisplay(art, false, true)).toBe('bundled');
    expect(mediaDisplay(art, true, true)).toBe('bundled'); // a failed network load never matters for bundled art
    expect(mediaDisplay({ ...art, art: 'nope' }, false, false)).toBe('placeholder');
    expect(placeholderReason({ ...art, art: 'nope' }, false)).toBe('pending');
  });

  it('tells pending content from content that failed to load', () => {
    expect(placeholderReason({ ...image, placeholder: true }, false)).toBe('pending');
    expect(placeholderReason(image, true)).toBe('unavailable');
  });
});

describe('in-app browser state', () => {
  it('loads, then is ready', () => {
    expect(browserNext('loading', 'loaded')).toBe('ready');
  });

  it('goes offline on error and stays so until retried', () => {
    expect(browserNext('loading', 'error')).toBe('offline');
    expect(browserNext('offline', 'loaded')).toBe('offline');
    expect(browserNext('offline', 'retry')).toBe('loading');
  });

  it('opens only web addresses', () => {
    expect(isWebUrl('https://example.com/x')).toBe(true);
    expect(isWebUrl('javascript:alert(1)')).toBe(false);
    expect(isWebUrl('')).toBe(false);
  });
});

describe('video embedding', () => {
  it('builds a nocookie embed from a valid id', () => {
    const url = videoEmbedUrl('dQw4w9WgXcQ');
    expect(url).toMatch(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/);
    expect(isAllowedVideoHost(url!)).toBe(true);
    expect(videoWatchUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  });

  it('rejects bad ids and injection characters', () => {
    for (const bad of ['', 'short', 'dQw4w9WgXcQx', 'dQw4w9WgX/Q', 'dQw4w9WgX?Q', 'dQw4w9WgX&Q', 'dQw4w9Wg Xc', '../../etc/x', 'javascript:1;']) {
      expect(videoEmbedUrl(bad)).toBeNull();
      expect(videoWatchUrl(bad)).toBeNull();
    }
  });

  it('allows only the nocookie host over https', () => {
    expect(isAllowedVideoHost('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
    for (const bad of ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'http://www.youtube-nocookie.com/embed/x', 'https://evil.com/?www.youtube-nocookie.com', 'https://www.youtube-nocookie.com.evil.com/x', 'javascript:alert(1)', '']) {
      expect(isAllowedVideoHost(bad)).toBe(false);
    }
  });
});

describe('lesson image display', () => {
  const none = { bundled: false, inline: false };

  it('prefers a registry hit, then an inline scene, then a loading remote address, else the placeholder', () => {
    expect(lessonImageKind('theory-poste-1', { bundled: true, inline: false }, false)).toBe('bundled');
    expect(lessonImageKind('leash', { bundled: true, inline: true }, false)).toBe('bundled');
    expect(lessonImageKind('leash', { bundled: false, inline: true }, false)).toBe('art');
    expect(lessonImageKind('https://example.com/a.png', none, false)).toBe('remote');
    expect(lessonImageKind('unknown-art', none, false)).toBe('placeholder');
    expect(lessonImageKind('javascript:1', none, false)).toBe('placeholder');
  });

  it('draws a registry hit offline, and falls back to the placeholder for a remote image that cannot load', () => {
    expect(lessonImageKind('theory-poste-1', { bundled: true, inline: false }, true)).toBe('bundled');
    expect(lessonImageKind('https://example.com/a.png', none, true)).toBe('placeholder');
  });
});

describe('PAUSE_MEDIA_JS', () => {
  it('pauses every video and audio element in place', () => {
    const media = [{ paused: false, currentTime: 42, pause() { this.paused = true; } }, { paused: false, currentTime: 7, pause() { this.paused = true; } }];
    const document = { querySelectorAll: (selector: string) => (selector === 'video,audio' ? media : []) };
    const result = new Function('document', `return ${PAUSE_MEDIA_JS.replace(/; true;$/, '')}, true;`)(document);
    expect(result).toBe(true);
    expect(media.every((m) => m.paused)).toBe(true);
    expect(media.map((m) => m.currentTime)).toEqual([42, 7]);
  });
});
