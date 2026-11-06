import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { MethodOverviewScreen } from './MethodOverviewScreen';
import { t } from '../../i18n';

const pressed: Record<string, () => void> = {};

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: {
      View: (props: any) => React.createElement('div', props, props.children),
      Text: (props: any) => React.createElement('span', props, props.children),
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (init: any) => ({ value: init }),
    useAnimatedStyle: () => ({}),
    withTiming: (to: any) => to,
    withSpring: (to: any) => to,
    cancelAnimation: jest.fn(),
    Easing: { bezier: () => ({}), inOut: () => ({}), ease: {} },
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props: any) => React.createElement('svg', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
  };
});

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string =>
    Array.isArray(children)
      ? children.map(text).join('')
      : typeof children === 'string'
      ? children
      : children?.props
      ? text(children.props.children)
      : '';
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    ScrollView: ({ scrollEventThrottle, contentContainerStyle, ...props }: any) => React.createElement('div', props, props.children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const label = props.accessibilityLabel || text(body);
      if (label && props.onPress) pressed[label.trim()] = props.onPress;
      return React.createElement('button', props, body);
    },
    Platform: { OS: 'web' },
  };
});

describe('MethodOverviewScreen', () => {
  beforeEach(() => {
    for (const key of Object.keys(pressed)) delete pressed[key];
  });

  it('renders the 3 core pillars', () => {
    const html = renderToStaticMarkup(
      <MethodOverviewScreen
        t={t}
        dog={{ name: 'Toby', homeConcerns: {} }}
        onContinue={() => {}}
      />
    );

    expect(html).toContain(t('method.title'));
    expect(html).toContain(t('method.pillar.loop.title'));
    expect(html).toContain(t('method.pillar.walk.title'));
    expect(html).toContain(t('method.pillar.barkdoku.title'));
  });

  it('renders adaptive reassurance note for dog with home concerns', () => {
    const html = renderToStaticMarkup(
      <MethodOverviewScreen
        t={t}
        dog={{ name: 'Luna', homeConcerns: { 'bite-owner': 2, 'bark-home': 1 } }}
        onContinue={() => {}}
      />
    );

    expect(html).toContain('Luna');
    expect(html).toContain(t('concern.bite-owner'));
    expect(html).toContain(t('concern.bark-home'));
  });

  it('drops the name from the title when the Dog has none, and lists only Concerns that sit in World 2', () => {
    const html = renderToStaticMarkup(
      <MethodOverviewScreen t={t} dog={{ name: ' ', homeConcerns: { 'bite-owner': 2 }, worldHome: [] }} onContinue={() => {}} />
    );

    expect(html).toContain(t('method.reassurance.default.title'));
    const named = renderToStaticMarkup(
      <MethodOverviewScreen t={t} dog={{ name: ' ', homeConcerns: { 'bite-owner': 2 } }} onContinue={() => {}} />
    );
    expect(named).toContain(t('method.reassurance.concerns.titleNoName'));
  });

  it('renders default reassurance note for dog with no home concerns', () => {
    const html = renderToStaticMarkup(
      <MethodOverviewScreen
        t={t}
        dog={{ name: 'Max', homeConcerns: {} }}
        onContinue={() => {}}
      />
    );

    expect(html).toContain(t('method.reassurance.default.title'));
    expect(html).toContain(t('method.reassurance.default.desc'));
  });

  it('wires onContinue and onBack actions', () => {
    const onContinue = jest.fn();
    const onBack = jest.fn();

    renderToStaticMarkup(
      <MethodOverviewScreen
        t={t}
        dog={{ name: 'Luna', homeConcerns: {} }}
        onContinue={onContinue}
        onBack={onBack}
      />
    );

    const continueLabel = t('method.continue').trim();
    const backLabel = t('method.back').trim();

    expect(pressed[continueLabel]).toBeDefined();
    expect(pressed[backLabel]).toBeDefined();

    pressed[continueLabel]();
    expect(onContinue).toHaveBeenCalledTimes(1);

    pressed[backLabel]();
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
