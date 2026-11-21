import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import type { ResolvedGame } from '../content/resolver';
import { GameDetailScreen } from './GameDetailScreen';

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
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
  };
});

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      return React.createElement(
        'button',
        { ...rest, style: resolvedStyle },
        typeof props.children === 'function' ? props.children({ pressed: false }) : props.children
      );
    },
    Platform: { OS: 'web' },
  };
});

jest.mock('../ui/ContentPicture', () => {
  const React = require('react');
  return {
    ContentPicture: (props: any) =>
      React.createElement('img', { 'data-testid': 'content-picture', alt: props.art, src: props.art }),
  };
});

const sampleLockedGame: ResolvedGame = {
  id: 'snuffle-game',
  order: 2,
  free: false,
  title: 'Snuffle Mat Adventure',
  intro: 'Learn scent search with your dog at home.',
  minutes: 10,
  difficulty: 'easy',
  materials: ['Trozos de tela suave', 'Premios secos'],
  safety: 'Supervisa a tu perro mientras busca premios en la tela.',
  steps: ['Coloca la manta en el suelo', 'Esparce los premios en los pliegues', 'Di la señal de buscar'],
  tips: ['Empieza con pliegues sencillos', 'Felicita cuando encuentre el primer premio'],
  images: [
    { file: 'snuffle-1.png', path: 'games/snuffle-game/media/snuffle-1.png', alt: 'Perro buscando en manta' },
    { file: 'snuffle-2.png', path: 'games/snuffle-game/media/snuffle-2.png', alt: 'Detalle de los pliegues', caption: 'Pliegues de tela' },
  ],
  needs: [
    {
      target: 'mantas-olfativas',
      targetKind: 'subcategory',
      note: 'Una manta olfativa facilita este juego.',
    },
  ],
};

const sampleFreeGame: ResolvedGame = {
  id: 'hand-game',
  order: 1,
  free: true,
  title: 'Elige mano (Free)',
  intro: 'El clásico juego de adivinar en qué mano está el premio.',
  minutes: 5,
  difficulty: 'easy',
  materials: ['Premios de alto valor'],
  steps: ['Muestra las dos manos cerradas', 'Deja que huela y toque con la pata'],
  images: [
    { file: 'hand-1.png', path: 'games/hand-game/media/hand-1.png', alt: 'Manos frente al perro' },
  ],
};

describe('GameDetailScreen (Task 4.3 & 4.4)', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    mockPressables.length = 0;
  });

  describe('Free user on locked game', () => {
    it('shows title, first illustration, and intro always', () => {
      const markup = renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={false}
          onBack={() => {}}
        />
      );

      expect(markup).toContain('Snuffle Mat Adventure');
      expect(markup).toContain('Learn scent search with your dog at home.');
      expect(markup).toContain('snuffle-1.png');
    });

    it('locked text is ABSENT from the render tree and hidden from accessibility', () => {
      const markup = renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={false}
          onBack={() => {}}
        />
      );

      // Gated sections must not exist
      expect(markup).not.toContain('game-unlocked-content');
      expect(markup).not.toContain('Trozos de tela suave');
      expect(markup).not.toContain('Supervisa a tu perro mientras busca premios');
      expect(markup).not.toContain('Coloca la manta en el suelo');
      expect(markup).not.toContain('Empieza con pliegues sencillos');
      expect(markup).not.toContain('snuffle-2.png');
      expect(markup).not.toContain('Una manta olfativa facilita este juego');

      // Locked bars must be present and hidden from screen readers
      expect(markup).toContain('game-locked-section');
      expect(markup).toContain('game-locked-bars');
      expect(markup).toContain('aria-hidden="true"');
      expect(markup).toContain('importantForAccessibility="no-hide-descendants"');

      // Plus button is the only gated element announced
      expect(markup).toContain(es['games.plusLockLabel']);
    });

    it('pressing Plus button opens paywall', () => {
      const onOpenPaywall = jest.fn();
      renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={false}
          onBack={() => {}}
          onOpenPaywall={onOpenPaywall}
        />
      );

      const plusBtn = mockPressables.find((p) => p.testID === 'game-plus-button');
      expect(plusBtn).toBeDefined();
      plusBtn.onPress();
      expect(onOpenPaywall).toHaveBeenCalledTimes(1);
    });
  });

  describe('Plus user on locked game', () => {
    it('shows full content with no placeholder bars and no Plus button', () => {
      const markup = renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={true}
          onBack={() => {}}
        />
      );

      // Full content visible
      expect(markup).toContain('game-unlocked-content');
      expect(markup).toContain('Trozos de tela suave');
      expect(markup).toContain('Supervisa a tu perro mientras busca premios');
      expect(markup).toContain('Coloca la manta en el suelo');
      expect(markup).toContain('Empieza con pliegues sencillos');
      expect(markup).toContain('snuffle-2.png');

      // No placeholder bars or Plus button
      expect(markup).not.toContain('game-locked-section');
      expect(markup).not.toContain('game-plus-button');
    });

    it('shows safety note in the materials block', () => {
      const markup = renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={true}
          onBack={() => {}}
        />
      );

      expect(markup).toContain('game-materials-section');
      expect(markup).toContain('game-safety-note');
      expect(markup).toContain('Supervisa a tu perro mientras busca premios en la tela.');
    });
  });

  describe('Free-flag game', () => {
    it('is open to everyone even without Plus membership', () => {
      const markup = renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleFreeGame}
          isPlus={false}
          onBack={() => {}}
        />
      );

      expect(markup).toContain('game-unlocked-content');
      expect(markup).toContain('Premios de alto valor');
      expect(markup).toContain('Muestra las dos manos cerradas');
      expect(markup).not.toContain('game-locked-section');
      expect(markup).not.toContain('game-plus-button');
    });
  });

  describe('Task 4.4: ShopLinkCard / RecommendationCard for needs targets', () => {
    it('reuses RecommendationCard/ShopLinkCard and its action opens the Shop at target level and id', () => {
      const onOpenShop = jest.fn();
      renderToStaticMarkup(
        <GameDetailScreen
          t={t}
          game={sampleLockedGame}
          isPlus={true}
          onBack={() => {}}
          onOpenShop={onOpenShop}
        />
      );

      // Shop link button is rendered
      const shopBtn = mockPressables.find(
        (p) => p.testID === 'game-shop-link-mantas-olfativas-action'
      );
      expect(shopBtn).toBeDefined();

      shopBtn.onPress();
      expect(onOpenShop).toHaveBeenCalledTimes(1);
      expect(onOpenShop).toHaveBeenCalledWith({
        level: 'subcategory',
        id: 'mantas-olfativas',
      });
    });
  });
});
