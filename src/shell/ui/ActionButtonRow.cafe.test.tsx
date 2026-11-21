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
  const el = (tag: string) => (props: any) => React.createElement(tag, { 'aria-hidden': props['aria-hidden'] }, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Line: el('line'), Path: el('path'), Rect: el('rect'), G: el('g') };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: (p: any) => require('react').createElement('div', null, p.children), createAnimatedComponent: (C: any) => C },
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
import { createTranslator, en, es, type TextKey } from '../../i18n';
import { SCENE_ACTIONS } from '../nodes/readDog';
import { ActionButtonRow } from './MinigameProps';

const labelsOf = (html: string) => [...html.matchAll(/<button[^>]*aria-label="([^"]*)"/g)].map((m) => m[1].replace(/&#x27;/g, "'").replace(/&quot;/g, '"'));

describe('Terrace action row for screen readers', () => {
  it.each([['es', es], ['en', en]] as const)('labels every button with its name and effect (%s)', (_, catalog) => {
    const t = createTranslator(catalog);
    const actions = SCENE_ACTIONS.cafe.map((action) => ({ action, label: t(`minigame.action.${action}` as TextKey), effect: t(`minigame.actionHint.${action}` as TextKey) }));
    const labels = labelsOf(render(<ActionButtonRow actions={actions} onPress={() => {}} />));
    expect(labels).toEqual(actions.map(({ label, effect }) => `${label}. ${effect}`));
    for (const { label, effect } of actions) {
      expect(label).toBeTruthy();
      expect(effect).toBeTruthy();
    }
  });

  it('names Feed from the table as the design labels it', () => {
    expect(es['minigame.action.feed']).toBe('Dar de la mesa');
    expect(en['minigame.action.feed']).toBe('Feed from the table');
  });
});
