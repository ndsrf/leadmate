const mockPressables: any[] = [];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      return React.createElement(
        'button',
        props,
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children,
      );
    },
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
import { BarkdokuChip, WorldMapScreen } from './WorldMapScreen';
import { NO_STREAK } from '../streak';
import { progressOf } from '../world';

describe('WorldMapScreen - Daily Barkdoku chip', () => {
  const t = createTranslator(es);
  const mockOnBarkdoku = jest.fn();
  const mockOnDaily = jest.fn();

  it('renders map header with the Guaudoku daily chip', () => {
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

describe('WorldMapScreen - Settings gear', () => {
  const t = createTranslator(es);

  it('shows Settings as a labelled gear button with no visible text, and opens Settings', () => {
    const onSettings = jest.fn();
    mockPressables.length = 0;
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
        onDaily={() => {}}
        onBarkdoku={() => {}}
        onOpenStop={() => {}}
        onSettings={onSettings}
      />
    );

    expect(markup).not.toContain(`>${es['map.settings']}<`);
    const gear = mockPressables.filter((p) => p.accessibilityLabel === es['map.settings']);
    expect(gear).toHaveLength(1);
    expect(gear[0].accessibilityRole).toBe('button');
    gear[0].onPress();
    expect(onSettings).toHaveBeenCalledTimes(1);
  });
});

describe('BarkdokuChip', () => {
  const t = createTranslator(es);
  const chip = (solve?: { seconds: number; at: string; targetSeconds?: number }) => renderToStaticMarkup(<BarkdokuChip t={t} solve={solve} onPress={() => {}} />);

  it('shows a highlighted new state before the first solve', () => {
    const html = chip();
    expect(html).toContain('Guaudoku');
    expect(html).toContain(es['map.dailyNew']);
  });

  it('shows the Daily Solve Time against the target, marked when met', () => {
    const html = chip({ seconds: 102, at: '2026-10-28T09:00:00.000Z', targetSeconds: 120 });
    expect(html).toContain('1:42 / 2:00 ✓');
    expect(html).toContain('Tiempo 1:42, objetivo 2:00. ¡Objetivo cumplido!');
  });

  it('leaves the mark off when over the target', () => {
    const html = chip({ seconds: 150, at: '2026-10-28T09:00:00.000Z', targetSeconds: 120 });
    expect(html).toContain('2:30 / 2:00');
    expect(html).not.toContain('✓');
    expect(html).not.toContain(es['map.dailyNew']);
  });
});
