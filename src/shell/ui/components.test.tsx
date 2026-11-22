import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    TextInput: (props: any) => React.createElement('input', props),
    Pressable: (props: any) => {
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      return React.createElement(
        'button',
        { ...rest, style: resolvedStyle },
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children,
      );
    },
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

import { BookGlyph, Chip, IconChip } from './components';
import { palettes } from './theme';

describe('BookGlyph (Task 1.1)', () => {
  it('renders an open book SVG with theme palette ink styling at 20pt by default', () => {
    const markup = renderToStaticMarkup(<BookGlyph />);
    expect(markup).toContain('width="20"');
    expect(markup).toContain('height="20"');
    expect(markup).toContain(palettes.light.ink);
    // Verifies the two curved page paths
    expect(markup).toContain('M3 5c3-1.5 6-1.5 9 0v14c-3-1.5-6-1.5-9 0z');
    expect(markup).toContain('M21 5c-3-1.5-6-1.5-9 0v14c3-1.5 6-1.5 9 0z');
  });

  it('allows custom sizing', () => {
    const markup = renderToStaticMarkup(<BookGlyph size={24} />);
    expect(markup).toContain('width="24"');
    expect(markup).toContain('height="24"');
  });
});

describe('IconChip (Task 1.2)', () => {
  it('renders icon and optional badge indicator', () => {
    const badge = <span data-testid="test-badge">●</span>;
    const markup = renderToStaticMarkup(
      <IconChip
        icon={<BookGlyph />}
        badge={badge}
        onPress={() => {}}
        accessibilityLabel="Biblioteca"
        testID="library-chip"
      />
    );
    expect(markup).toContain('data-testid="test-badge"');
    expect(markup).toContain('accessibilityLabel="Biblioteca"');
  });

  it('renders without badge when none provided', () => {
    const markup = renderToStaticMarkup(
      <IconChip
        icon={<BookGlyph />}
        onPress={() => {}}
        accessibilityLabel="Biblioteca"
      />
    );
    expect(markup).not.toContain('test-badge');
    expect(markup).toContain('accessibilityLabel="Biblioteca"');
  });
});

describe('Chip (Task 1.3)', () => {
  it('uses text-button typography for value by default (compact=false)', () => {
    const markup = renderToStaticMarkup(<Chip label="Walk" value="1000" />);
    expect(markup).toContain('text-button');
    expect(markup).not.toContain('text-body');
  });

  it('scales typography to text-body when compact=true', () => {
    const markup = renderToStaticMarkup(<Chip compact label="Walk" value="1000" />);
    expect(markup).toContain('text-body');
    expect(markup).not.toContain('text-button');
  });
});
