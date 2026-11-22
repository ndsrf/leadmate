jest.mock('react-native', () => {
  const React = require('react');
  const box = (tag: string) => ({ children, accessibilityLabel, accessibilityRole }: any) =>
    React.createElement(tag, { 'aria-label': accessibilityLabel, role: accessibilityRole }, typeof children === 'function' ? children({ pressed: false }) : children);
  return {
    View: box('div'),
    Text: box('span'),
    Pressable: box('button'),
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
    AccessibilityInfo: {},
    useWindowDimensions: () => ({ width: 320, height: 640 }),
  };
});
jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, { 'aria-hidden': props['aria-hidden'], 'aria-label': props.accessibilityLabel }, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Line: el('line'), Path: el('path'), Rect: el('rect'), G: el('g') };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: (p: any) => require('react').createElement('div', { 'data-testid': p.testID }, p.children), createAnimatedComponent: (C: any) => C },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  useAnimatedProps: () => ({}),
  withTiming: (v: any) => v,
  withSequence: (...a: any[]) => a[0],
  withRepeat: (v: any) => v,
  cancelAnimation: () => {},
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createTranslator, en, es } from '../../i18n';
import { ActionButtonRow, TerraceScene } from './MinigameProps';

const t = createTranslator(en);
const scene = (props: Partial<React.ComponentProps<typeof TerraceScene>> = {}) =>
  render(<TerraceScene t={t} posture="relaxed_lying" waiter={false} treat={false} coat="golden" {...props} />);

describe('TerraceScene render', () => {
  it('draws the labelled terrace without the waiter or the treat at rest', () => {
    const html = scene();
    expect(html).toContain(`aria-label="${en['minigame.terrace']}"`);
    expect(html).not.toContain('terrace-waiter');
    expect(html).not.toContain('terrace-treat');
  });

  it('shows a waiter crossing while the Dog stares at the waiter', () => {
    expect(scene({ posture: 'staring_waiter', waiter: true })).toContain('terrace-waiter');
  });

  it('drops a treat on a correct Marker', () => {
    expect(scene({ treat: true })).toContain('terrace-treat');
  });

  it('has a label in both languages', () => {
    expect(es['minigame.terrace']).toBeTruthy();
  });
});

describe('Feed button icon', () => {
  it('draws the feed icon, different from the fallback paw icon', () => {
    const row = (action: 'feed' | 'tidy') => render(<ActionButtonRow actions={[{ action, label: 'x', effect: 'y' }]} onPress={() => {}} />);
    expect(row('feed')).not.toBe(row('tidy'));
  });
});
