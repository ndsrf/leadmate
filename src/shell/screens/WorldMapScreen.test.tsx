jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) =>
      React.createElement(
        'button',
        props,
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children,
      ),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    AppState: {
      currentState: 'active',
      addEventListener: () => ({ remove: () => {} }),
    },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Circle: (props: any) => React.createElement('circle', props, props.children),
    Ellipse: (props: any) => React.createElement('ellipse', props, props.children),
    Line: (props: any) => React.createElement('line', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
    withRepeat: (v: any) => v,
    withSequence: (...args: any[]) => args[0],
    cancelAnimation: () => {},
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { WorldMapScreen } from './WorldMapScreen';
import { NO_STREAK } from '../streak';
import { progressOf } from '../world';

describe('WorldMapScreen - Zona de Calma Integration (Task 4.1)', () => {
  const t = createTranslator(es);
  const mockOnBarkdoku = jest.fn();
  const mockOnDaily = jest.fn();

  it('renders map header with Zona de Calma daily chip', () => {
    const markup = renderToStaticMarkup(
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={mockOnDaily}
        onBarkdoku={mockOnBarkdoku}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    expect(markup).toBeDefined();
    expect(markup).toContain(es['map.barkdoku.daily']);
    expect(markup).toContain(es['map.barkdoku.dailyHelp']);
  });

  it('wires onBarkdoku callback for navigation', () => {
    const element = (
      <WorldMapScreen
        t={t}
        progress={progressOf([])}
        stars={{}}
        now={new Date('2026-10-28T09:00:00')}
        streak={NO_STREAK}
        today="2026-10-28"
        dailyBest={undefined}
        rustyPrompt={false}
        rusty={false}
        skippedWarmup={false}
        onWarmup={() => {}}
        onSkipWarmup={() => {}}
        onDaily={mockOnDaily}
        onBarkdoku={mockOnBarkdoku}
        onOpenStop={() => {}}
        onSettings={() => {}}
      />
    );

    expect(element.props.onBarkdoku).toBe(mockOnBarkdoku);
    element.props.onBarkdoku();
    expect(mockOnBarkdoku).toHaveBeenCalled();
  });
});
