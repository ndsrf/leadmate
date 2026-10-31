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
      const t = props.accessibilityLabel || text(body);
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
import { PaywallScreen } from './PaywallScreen';

describe('PaywallScreen', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    for (const k of Object.keys(pressed)) delete pressed[k];
  });

  it('renders trial mode with 7 days free and trial start CTA', () => {
    const onStartTrial = jest.fn();
    const onLater = jest.fn();

    const html = renderToStaticMarkup(
      <PaywallScreen
        t={t}
        mode="trial"
        onStartTrial={onStartTrial}
        onLater={onLater}
      />
    );

    expect(html).toContain('Prueba LeadMate a fondo');
    expect(html).toContain('7 días gratis');
    expect(html).toContain('Empezar prueba');
    expect(html).toContain('Quizá más tarde');

    pressed['Empezar prueba']?.();
    expect(onStartTrial).toHaveBeenCalledTimes(1);

    pressed['Quizá más tarde']?.();
    expect(onLater).toHaveBeenCalledTimes(1);
  });

  it('renders subscription conversion mode with annual and monthly tiers', () => {
    const onSubscribeAnnual = jest.fn();
    const onSubscribeMonthly = jest.fn();
    const onLater = jest.fn();

    const html = renderToStaticMarkup(
      <PaywallScreen
        t={t}
        mode="subscription"
        onSubscribeAnnual={onSubscribeAnnual}
        onSubscribeMonthly={onSubscribeMonthly}
        onLater={onLater}
      />
    );

    expect(html).toContain('Continúa con LeadMate Plus');
    expect(html).toContain('Plan Anual');
    expect(html).toContain('39,99 €/año');
    expect(html).toContain('Ahorra un 40% · 3,33 €/mes');
    expect(html).toContain('Plan Mensual');
    expect(html).toContain('6,99 €/mes');
    expect(html).toContain('Suscribirme');
    expect(html).toContain('Quizá más tarde');

    pressed['Suscribirme']?.();
    expect(onSubscribeAnnual).toHaveBeenCalledTimes(1);

    expect(typeof pressed['Plan Mensual - 6,99 €/mes']).toBe('function');
    pressed['Plan Mensual - 6,99 €/mes']?.();

    pressed['Quizá más tarde']?.();
    expect(onLater).toHaveBeenCalledTimes(1);
  });
});
