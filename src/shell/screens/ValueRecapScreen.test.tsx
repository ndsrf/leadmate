const pressed: Record<string, () => void> = {};

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
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const t = text(body);
      if (t && props.onPress) pressed[t] = props.onPress;
      return React.createElement('button', props, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Platform: { OS: 'web' },
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
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: { View: (props: any) => React.createElement('div', props, props.children) },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
  };
});

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { ValueRecapScreen } from './ValueRecapScreen';

describe('ValueRecapScreen', () => {
  const t = createTranslator(es);

  it('renders dog name, streak days, videos watched, day skips, tiers, and bypass button', () => {
    let continuedFree = false;
    let subscribedAnnual = false;
    const markup = renderToStaticMarkup(
      <ValueRecapScreen
        t={t}
        dogName="Kira"
        streakDays={6}
        videosWatched={3}
        skipsUsed={2}
        onSubscribeAnnual={() => {
          subscribedAnnual = true;
        }}
        onSubscribeMonthly={() => {}}
        onContinueFree={() => {
          continuedFree = true;
        }}
      />,
    );

    expect(markup).toContain('Kira');
    expect(markup).toContain('6 días de racha activa');
    expect(markup).toContain('3 vídeos de técnica vistos');
    expect(markup).toContain('2 saltos de día usados');
    expect(markup).toContain('39,99 €/año');
    expect(markup).toContain('6,99 €/mes');
    expect(markup).toContain('Continuar con la versión gratuita');
    expect(markup).toContain('Suscribirme');

    pressed['Continuar con la versión gratuita']?.();
    expect(continuedFree).toBe(true);

    pressed['Suscribirme']?.();
    expect(subscribedAnnual).toBe(true);
  });
});
