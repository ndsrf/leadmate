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
        { disabled: props.disabled },
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
import { AloneCheckCard } from './AloneCheckCard';

const t = createTranslator(es);

function buttons(markup: string) {
  const labels = [...markup.matchAll(/<button[^>]*>[\s\S]*?<\/button>/g)].map((m) => m[0]);
  return labels.map((html, i) => ({ text: html.replace(/<[^>]*>/g, ''), press: () => mockPressables[mockPressables.length - labels.length + i].onPress() }));
}

describe('AloneCheckCard', () => {
  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('asks the question with the Dog\'s name and offers the four answers in order', () => {
    const markup = renderToStaticMarkup(<AloneCheckCard t={t} dogName="Luna" onAnswer={() => {}} />);
    expect(markup).toContain('¿Cómo lleva Luna quedarse solo en casa?');
    expect(buttons(markup).map((b) => b.text)).toEqual(['Muy bien', 'A veces llora o se inquieta', 'Mal: llora, rompe cosas, ladra', 'Aún no lo sé']);
  });

  it('uses the neutral name when the Dog has none', () => {
    const markup = renderToStaticMarkup(<AloneCheckCard t={t} onAnswer={() => {}} />);
    expect(markup).not.toContain('{name}');
  });

  it('calls onAnswer with the matching value for each button', () => {
    const onAnswer = jest.fn();
    const markup = renderToStaticMarkup(<AloneCheckCard t={t} dogName="Luna" onAnswer={onAnswer} />);
    buttons(markup).forEach((b) => b.press());
    expect(onAnswer.mock.calls.map((c) => c[0])).toEqual(['ok', 'sometimes', 'bad', 'unknown']);
  });
});
