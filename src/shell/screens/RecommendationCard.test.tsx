import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { RecommendationCard, RecommendationCardList } from './RecommendationCard';
import type { ResolvedShop } from '../content/resolver';

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

describe('RecommendationCard', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('renders explanation and action button with default label "Ver en la tienda"', () => {
    const onOpen = jest.fn();
    const markup = renderToStaticMarkup(
      <RecommendationCard
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
      <RecommendationCard
        t={t}
        explanation="Recomendación especial"
        onOpen={() => {}}
        actionLabel="Explorar catálogo"
      />,
    );
    expect(markup).toContain('Explorar catálogo');
  });

  describe('RecommendationCardList', () => {
    const activeShop: ResolvedShop = {
      categories: [],
      idToKind: {
        'arnes-y': 'product',
        'collar-fijo': 'product',
      },
    };

    it('renders view recommendations up to max 2', () => {
      const onOpenShop = jest.fn();
      const recs = [
        { id: 'rec-1', target: 'arnes-y', targetKind: 'product' as const, when: 'view', explanation: 'Explicación 1' },
        { id: 'rec-2', target: 'collar-fijo', targetKind: 'product' as const, when: 'view', explanation: 'Explicación 2' },
        { id: 'rec-3', target: 'arnes-y', targetKind: 'product' as const, when: 'view', explanation: 'Explicación 3' },
      ];

      const markup = renderToStaticMarkup(
        <RecommendationCardList
          t={t}
          recommendations={recs}
          activeShop={activeShop}
          onOpenShop={onOpenShop}
        />,
      );

      expect(markup).toContain('Explicación 1');
      expect(markup).toContain('Explicación 2');
      expect(markup).not.toContain('Explicación 3');
    });

    it('returns null when no active shop or empty recommendations', () => {
      const markup = renderToStaticMarkup(
        <RecommendationCardList
          t={t}
          recommendations={[]}
          activeShop={activeShop}
          onOpenShop={() => {}}
        />,
      );
      expect(markup).toBe('');
    });
  });
});
