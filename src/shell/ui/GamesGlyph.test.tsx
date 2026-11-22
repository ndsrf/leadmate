import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    TextInput: (props: any) => React.createElement('input', props),
    Pressable: (props: any) => React.createElement('button', props, props.children),
    Platform: { OS: 'web' },
    Appearance: { getColorScheme: () => 'light', addChangeListener: () => ({ remove: () => {} }) },
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
    },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    cancelAnimation: () => {},
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    Circle: (props: any) => React.createElement('circle', props, props.children),
  };
});

import { GamesGlyph } from './components';
import { palettes } from './theme';

describe('GamesGlyph (Task 4.1)', () => {
  it('draws with the ink outline at 20 points by default', () => {
    const markup = renderToStaticMarkup(<GamesGlyph />);
    expect(markup).toContain('width="20"');
    expect(markup).toContain('height="20"');
    expect(markup).toContain(`stroke="${palettes.light.ink}"`); // the active (light) palette's ink
    expect(markup).toContain('stroke-width="2"');
    expect(markup).toContain('aria-hidden="true"');
  });

  it('allows customizing the glyph size while keeping the ink outline', () => {
    const markup = renderToStaticMarkup(<GamesGlyph size={28} />);
    expect(markup).toContain('width="28"');
    expect(markup).toContain('height="28"');
    expect(markup).toContain(`stroke="${palettes.light.ink}"`);
  });
});
