jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    StyleSheet: {
      create: (styles: any) => styles,
      hairlineWidth: 1,
    },
    Platform: { OS: 'web' },
  };
});

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { AdBanner } from './AdBanner';
import * as admobModule from './admob';

describe('AdBanner Component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders fallback banner container for Free Tier users in non-native environments', () => {
    const html = renderToStaticMarkup(<AdBanner isPlus={false} />);
    expect(html).toContain('leadmate-ad-banner');
  });

  it('renders null immediately for Plus members (isPlus=true)', () => {
    const html = renderToStaticMarkup(<AdBanner isPlus={true} />);
    expect(html).toBe('');
  });

  it('defaults isPlus to false if not passed', () => {
    const html = renderToStaticMarkup(<AdBanner />);
    expect(html).toContain('leadmate-ad-banner');
  });

  it('renders native BannerAd component when native ads are available', () => {
    jest.spyOn(admobModule, 'isNativeGoogleMobileAdsAvailable').mockReturnValue(true);
    jest.spyOn(admobModule, 'getGoogleMobileAdsModule').mockReturnValue({
      BannerAd: (props: any) =>
        React.createElement('div', { 'data-testid': 'native-banner-ad', ...props }),
      BannerAdSize: { ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER' },
    });
    const html = renderToStaticMarkup(<AdBanner isPlus={false} />);
    expect(html).toContain('native-banner-ad');
  });
});
