jest.mock('react-native', () => {
  const React = require('react');
  const flat = (style: any): any => (Array.isArray(style) ? Object.assign({}, ...style.map(flat)) : style ?? {});
  // styles are written out as JSON so a test can read the colours a view was drawn with
  const box = (tag: string) => ({ style, children, ...props }: any) => React.createElement(tag, { 'data-style': JSON.stringify(flat(style)), className: props.className }, typeof children === 'function' ? children({ pressed: false }) : children);
  return {
    View: box('div'),
    Text: box('span'),
    Pressable: box('button'),
    ScrollView: box('div'),
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, { fill: props.fill, stroke: props.stroke }, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Line: el('line'), Path: el('path'), Rect: el('rect'), G: el('g') };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: { View: (props: any) => React.createElement('div', { 'data-style': JSON.stringify(props.style ?? {}) }, props.children) },
    Easing: { bezier: () => () => 0, linear: () => 0 },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    cancelAnimation: () => {},
  };
});

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { ResumeOverlay } from '../Overlays';
import { BreedArt } from './BreedArt';
import { Panel } from './components';
import { colorNight, lightColor, PaletteProvider } from './theme';

const dark = (node: React.ReactElement) => renderToStaticMarkup(<PaletteProvider scheme="dark">{node}</PaletteProvider>);

describe('Appearance', () => {
  const t = createTranslator(es);

  it('draws UI chrome in the active palette', () => {
    const html = dark(<Panel>{t('pause.title')}</Panel>);
    expect(html).toContain(colorNight.surface);
    expect(html).toContain(colorNight.outline);
    expect(html).not.toContain(lightColor.surface);
  });

  it('keeps the pause overlay over a running Stage Light under the Dark Appearance', () => {
    const html = dark(<ResumeOverlay t={t} onResume={() => {}} onExit={() => {}} />);
    expect(html).toContain(lightColor.surface);
    expect(html).toContain(lightColor.brand);
    expect(html).not.toContain(colorNight.surface);
    // the NativeWind variables are reset to Light for the overlay's classes too
    expect(html).toContain('--c-surface');
    expect(html).toContain('255 251 241');
  });

  it('draws the dog illustration in the Light palette under the Dark Appearance', () => {
    const light = renderToStaticMarkup(<BreedArt breed="mestizo" coat="golden" />);
    expect(dark(<BreedArt breed="mestizo" coat="golden" />)).toBe(light);
  });
});
