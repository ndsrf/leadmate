import type { NodeMedia } from '../nodes/node';
import { browserNext, isWebUrl, mediaDisplay, placeholderReason } from './media';

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
