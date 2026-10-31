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

describe('AdBanner Component', () => {
  it('renders banner container for Free Tier users (isPlus=false)', () => {
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
});
