import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { ShopLinkCard } from './ShopLinkCard';

const mockPressables: any[] = [];

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

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

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      return React.createElement(
        'button',
        { ...rest, style: resolvedStyle },
        typeof props.children === 'function' ? props.children({ pressed: false }) : props.children,
      );
    },
  };
});

describe('ShopLinkCard', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('renders explanation and action button with default label "Ver en la tienda"', () => {
    const onOpen = jest.fn();
    const markup = renderToStaticMarkup(
      <ShopLinkCard
        t={t}
        explanation="Con este arnés en Y tu perro paseará mejor."
        onOpen={onOpen}
      />,
    );
    expect(markup).toContain('Con este arnés en Y tu perro paseará mejor.');
    expect(markup).toContain(es['shop.seeInShop']);

    const btn = mockPressables.find((p) => p.testID === 'shop-link-card-action');
    expect(btn).toBeDefined();
    btn.onPress();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('allows custom action label', () => {
    const markup = renderToStaticMarkup(
      <ShopLinkCard
        t={t}
        explanation="Recomendación especial"
        onOpen={() => {}}
        actionLabel="Explorar catálogo"
      />,
    );
    expect(markup).toContain('Explorar catálogo');
  });
});
