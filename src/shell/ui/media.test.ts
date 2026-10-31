import { theoryLesson } from '../lessons/content';
import type { NodeMedia } from '../nodes/node';
import { animationTimelineUrl, animationUrl, APP_ORIGIN, browserNext, isAllowedPlayerNavigation, PAUSE_MEDIA_JS, isAllowedVideoHost, isAnimationKey, isWebUrl, MEDIA_BASE, mediaBase, mediaDisplay, lessonImageKind, placeholderReason, videoEmbedPage, videoEmbedUrl, videoPlayback, videoWatchUrl } from './media';

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

  it('carries the app origin, and only fixed parameters, when one is set', () => {
    expect(videoEmbedUrl('dQw4w9WgXcQ', 'https://abc.supabase.co')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1&modestbranding=1&enablejsapi=1&origin=https%3A%2F%2Fabc.supabase.co');
    expect(videoEmbedUrl('dQw4w9WgXcQ', '')).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&playsinline=1&modestbranding=1');
    expect(videoEmbedUrl('dQw4w9WgXcQ')).toBe(videoEmbedUrl('dQw4w9WgXcQ', APP_ORIGIN));
    expect(isAllowedVideoHost(videoEmbedUrl('dQw4w9WgXcQ', 'https://abc.supabase.co')!)).toBe(true);
  });

  it('embeds from our Supabase project origin: a bare https origin, so the native player loads its page there', () => {
    expect(APP_ORIGIN).toBe('https://fmtcbwhmawhwvjxptjod.supabase.co');
    expect(new URL(APP_ORIGIN).origin).toBe(APP_ORIGIN);
    expect(videoEmbedUrl('dQw4w9WgXcQ')).toContain(`&origin=${encodeURIComponent(APP_ORIGIN)}`);
    expect(isAllowedPlayerNavigation(`${APP_ORIGIN}/`)).toBe(true);
  });

  it('wraps the embed in a page with one iframe that sends its referrer', () => {
    const page = videoEmbedPage('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&origin=x');
    expect(page.match(/<iframe /g)).toHaveLength(1);
    expect(page).toContain('src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&amp;origin=x"');
    expect(page).toContain('referrerpolicy="strict-origin-when-cross-origin"');
    expect(page).not.toMatch(/<script/i);
  });

  it('lets the native player navigate only to its page and the YouTube host', () => {
    const origin = 'https://abc.supabase.co';
    for (const ok of ['about:blank', 'https://abc.supabase.co/', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ']) expect(isAllowedPlayerNavigation(ok, origin)).toBe(true);
    for (const bad of ['https://abc.supabase.co.evil.com/', 'http://abc.supabase.co/', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://evil.com/', 'javascript:alert(1)', '']) expect(isAllowedPlayerNavigation(bad, origin)).toBe(false);
    expect(isAllowedPlayerNavigation('https://abc.supabase.co/', '')).toBe(false);
  });

  it('allows only the nocookie host over https', () => {
    expect(isAllowedVideoHost('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')).toBe(true);
    for (const bad of ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'http://www.youtube-nocookie.com/embed/x', 'https://evil.com/?www.youtube-nocookie.com', 'https://www.youtube-nocookie.com.evil.com/x', 'javascript:alert(1)', '']) {
      expect(isAllowedVideoHost(bad)).toBe(false);
    }
  });
});

describe('Lesson Animation addresses', () => {
  const base = 'https://media.example.com/lesson-media';

  it('builds the clip address from the base, the animations folder and the key', () => {
    expect(animationUrl('calm-leash', base)).toBe('https://media.example.com/lesson-media/animations/calm-leash.mp4');
    expect(animationUrl('calm-leash', `${base}//`)).toBe('https://media.example.com/lesson-media/animations/calm-leash.mp4');
  });

  it('builds the timeline address next to the clip', () => {
    expect(animationTimelineUrl('calm-leash', base)).toBe('https://media.example.com/lesson-media/animations/calm-leash.json');
  });

  it('builds nothing from a malformed key or a full address', () => {
    for (const bad of ['a/b', 'a.b', 'A', '-a', 'a-', 'a--b', '', 'a b', 'https://evil.com/x.mp4', '../x']) {
      expect(isAnimationKey(bad)).toBe(false);
      expect(animationUrl(bad, base)).toBeNull();
      expect(animationTimelineUrl(bad, base)).toBeNull();
    }
  });

  it('builds nothing without an https base', () => {
    for (const bad of ['', '  ', 'http://media.example.com', 'media.example.com', 'javascript:alert(1)']) {
      expect(mediaBase(bad)).toBe('');
      expect(animationUrl('calm-leash', bad)).toBeNull();
      expect(animationTimelineUrl('calm-leash', bad)).toBeNull();
    }
  });

  it('has no base in tests, so a Lesson built with the default leaves its animation out', () => {
    expect(MEDIA_BASE).toBe('');
    const lesson = theoryLesson('t', { keys: 'x', images: ['a'], steps: 3, takeaways: 2, animation: 't', video: 'WPWbgzAd6C0' });
    expect(lesson.blocks.filter((b) => b.type === 'video').map((b) => b.type === 'video' && b.source.kind)).toEqual(['youtube']);
    expect(theoryLesson('t', { keys: 'x', images: ['a'], steps: 3, takeaways: 2, animation: 't', mediaBase: base }).blocks.some((b) => b.type === 'video')).toBe(true);
  });

  it('gives an animation no "Open video" address, and a YouTube video both', () => {
    expect(videoPlayback({ kind: 'animation', key: 'calm-leash' }, base)).toEqual({ uri: `${base}/animations/calm-leash.mp4`, watch: null });
    expect(videoPlayback({ kind: 'animation', key: 'calm-leash' }, '')).toEqual({ uri: null, watch: null });
    expect(videoPlayback({ kind: 'youtube', id: 'dQw4w9WgXcQ' })).toEqual({ uri: videoEmbedUrl('dQw4w9WgXcQ'), watch: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
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
    const posted: string[] = [];
    const frames = [{ contentWindow: { postMessage: (m: string) => posted.push(m) } }];
    const document = { querySelectorAll: (selector: string) => (selector === 'video,audio' ? media : selector === 'iframe' ? frames : []) };
    const result = new Function('document', 'script', 'return eval(script);')(document, PAUSE_MEDIA_JS); // the injected script's last value
    expect(result).toBe(true);
    expect(media.every((m) => m.paused)).toBe(true);
    expect(media.map((m) => m.currentTime)).toEqual([42, 7]);
    expect(posted.map((m) => JSON.parse(m))).toEqual([{ event: 'command', func: 'pauseVideo', args: '' }]);
  });
});
