import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import type { ResolvedGame } from '../content/resolver';
import { GamesScreen } from './GamesScreen';

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
    ContentPicture: (props: any) => React.createElement('img', { alt: props.art, src: props.art }),
  };
});

const sampleGames: ResolvedGame[] = [
  {
    id: 'game-b',
    order: 2,
    title: 'Game Two Title',
    intro: 'Intro for game two',
    minutes: 10,
    difficulty: 'medium',
    steps: ['Step 1'],
    images: [{ file: 'game-b.png', path: 'games/game-b/media/game-b.png', alt: 'Alt B' }],
  },
  {
    id: 'game-a',
    order: 1,
    free: true,
    title: 'Game One Title (Free)',
    intro: 'Intro for game one',
    minutes: 5,
    difficulty: 'easy',
    steps: ['Step 1'],
    images: [{ file: 'game-a.png', path: 'games/game-a/media/game-a.png', alt: 'Alt A' }],
  },
  {
    id: 'game-c',
    order: 3,
    title: 'Game Three Title',
    intro: 'Intro for game three',
    minutes: 15,
    difficulty: 'hard',
    steps: ['Step 1'],
    images: [{ file: 'game-c.png', path: 'games/game-c/media/game-c.png', alt: 'Alt C' }],
  },
];

describe('GamesScreen (Task 4.2)', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('renders random button first and lists games following `order`', () => {
    const markup = renderToStaticMarkup(
      <GamesScreen
        t={t}
        games={sampleGames}
        isPlus={false}
        onOpenGame={() => {}}
        onBack={() => {}}
      />
    );

    // Random button is present
    expect(markup).toContain(es['games.randomButton']);

    // Order should be game-a (order 1), game-b (order 2), game-c (order 3)
    const posA = markup.indexOf('Game One Title (Free)');
    const posB = markup.indexOf('Game Two Title');
    const posC = markup.indexOf('Game Three Title');

    expect(posA).toBeGreaterThan(-1);
    expect(posB).toBeGreaterThan(posA);
    expect(posC).toBeGreaterThan(posB);
  });

  it('row press opens the selected game', () => {
    const onOpenGame = jest.fn();
    renderToStaticMarkup(
      <GamesScreen
        t={t}
        games={sampleGames}
        isPlus={false}
        onOpenGame={onOpenGame}
        onBack={() => {}}
      />
    );

    // rows carry a fixed test id (tap capture never sees game ids); they follow content order: a, b, c
    const rowB = mockPressables.filter((p) => p.testID === 'game-row')[1];
    expect(rowB).toBeDefined();
    rowB.onPress();
    expect(onOpenGame).toHaveBeenCalledWith('game-b', { from: 'list' });
  });

  it('random press picks and opens a game', () => {
    const onOpenRandom = jest.fn();
    renderToStaticMarkup(
      <GamesScreen
        t={t}
        games={sampleGames}
        isPlus={false}
        onOpenGame={() => {}}
        onOpenRandom={onOpenRandom}
        onBack={() => {}}
      />
    );

    const randomBtn = mockPressables.find((p) => p.testID === 'games-random-button');
    expect(randomBtn).toBeDefined();
    randomBtn.onPress();

    expect(onOpenRandom).toHaveBeenCalledTimes(1);
    expect(['game-a', 'game-b', 'game-c']).toContain(onOpenRandom.mock.calls[0][0]);
  });

  it('shows Plus marker only for non-Plus user on a non-Free game', () => {
    // 1. Free user (isPlus = false)
    const markupFree = renderToStaticMarkup(
      <GamesScreen
        t={t}
        games={sampleGames}
        isPlus={false}
        onOpenGame={() => {}}
        onBack={() => {}}
      />
    );

    // rows in content order (a, b, c), each with the fixed test ids
    const rowsFree = markupFree.split('"game-row"').slice(1);
    expect(rowsFree).toHaveLength(3);
    // game-a is Free -> no Plus badge
    expect(rowsFree[0]).not.toContain('game-plus-badge');
    // game-b and game-c are gated -> Plus badge shown
    expect(rowsFree[1]).toContain('game-plus-badge');
    expect(rowsFree[2]).toContain('game-plus-badge');

    // 2. Plus user (isPlus = true)
    const markupPlus = renderToStaticMarkup(
      <GamesScreen
        t={t}
        games={sampleGames}
        isPlus={true}
        onOpenGame={() => {}}
        onBack={() => {}}
      />
    );

    // No Plus markers for Plus users on any game
    expect(markupPlus).not.toContain('game-plus-badge');
  });
});
