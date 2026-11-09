import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { PrimerScreen, DebriefScreen } from './NodeScreens';
import { MissionProblemScreen, FixScreen } from './MissionScreens';
import { getActiveContent, setActiveContent } from '../content/runtime';
import type { ResolvedShop } from '../content/resolver';
import type { NodeDef } from '../nodes/node';
import { startNode } from '../nodes/node';
import type { MissionDef, Fix } from '../missions/mission';

const mockPressables: any[] = [];

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      mockPressables.push(props);
      const { style, ...rest } = props;
      const resolvedStyle = typeof style === 'function' ? style({ pressed: false }) : style;
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      return React.createElement('button', { ...rest, style: resolvedStyle }, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Image: (props: any) => React.createElement('img', { alt: props.accessibilityLabel }),
    Platform: { OS: 'web' },
    AppState: {
      currentState: 'active',
      addEventListener: () => ({ remove: () => {} }),
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }),
}));

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo', () => ({ useEvent: () => ({ status: 'idle' }), useEventListener: () => {} }));
jest.mock('expo-video', () => ({ VideoView: () => null, useVideoPlayer: () => ({}) }));

jest.mock('../ui/useReveal', () => ({
  useReveal: (target: any) => ({
    state: {
      phase: 'done',
      elapsed: 2000,
      scoreShown: target.score,
      starsShown: target.stars,
      target,
    },
    skip: () => {},
  }),
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

describe('Node and Mission screens - ShopLinkCard recommendations (Task 7.1)', () => {
  const t = createTranslator(es);
  const sampleShop: ResolvedShop = {
    categories: [
      {
        id: 'collares',
        title: 'Collares',
        description: 'Collares',
        subcategories: [
          {
            id: 'arneses',
            title: 'Arneses',
            description: 'Arneses',
            products: [
              {
                id: 'arnes-ergonomico-y',
                name: 'Arnés ergonómico en Y',
                description: 'Arnés',
                url: 'https://example.com/arnes',
              },
            ],
          },
        ],
      },
    ],
    idToKind: {
      collares: 'category',
      arneses: 'subcategory',
      'arnes-ergonomico-y': 'product',
    },
  };

  const sampleNode: NodeDef = {
    id: 'test-node',
    title: 'node.intro.title',
    mode: 'stage',
    primerCards: [{ kind: 'real-world', text: 'node.intro.title' }],
    checkpoint: [{ question: 'node.intro.title', options: [{ text: 'node.intro.title', correct: true }], explanation: 'node.intro.title' }],
    exercises: [
      { metric: 'tension', key: 'node.intro.title' },
    ],
    prerequisites: [],
    simulation: {},
    recommendations: [
      {
        id: 'rec-node-view',
        target: 'arnes-ergonomico-y',
        targetKind: 'product',
        when: 'view',
        explanation: 'Recomendado para el paseo.',
      },
      {
        id: 'rec-node-unknown',
        target: 'missing-product',
        targetKind: 'product',
        when: 'view',
        explanation: 'No debe mostrarse.',
      },
    ],
  };

  beforeEach(() => {
    mockPressables.length = 0;
  });

  it('renders ShopLinkCard on PrimerScreen and handles tap', () => {
    const baseContent = getActiveContent();
    setActiveContent({
      ...baseContent,
      resolved: { ...baseContent.resolved, shop: sampleShop },
    });

    try {
      const onShop = jest.fn();
      const run = startNode(sampleNode);

      const markup = renderToStaticMarkup(
        <PrimerScreen
          t={t}
          run={run}
          onNext={() => {}}
          onExit={() => {}}
          onShop={onShop}
        />,
      );

      expect(markup).toContain('Recomendado para el paseo.');
      expect(markup).toContain(es['shop.seeInShop']);
      expect(markup).not.toContain('No debe mostrarse.');

      const btn = mockPressables.find((p) => p.testID === 'shop-link-card-action');
      expect(btn).toBeDefined();
      btn.onPress();
      expect(onShop).toHaveBeenCalledWith({ level: 'product', id: 'arnes-ergonomico-y' });
    } finally {
      setActiveContent(baseContent);
    }
  });

  it('renders ShopLinkCard on DebriefScreen and handles tap', () => {
    const baseContent = getActiveContent();
    setActiveContent({
      ...baseContent,
      resolved: { ...baseContent.resolved, shop: sampleShop },
    });

    try {
      const onShop = jest.fn();
      const run = {
        ...startNode(sampleNode),
        step: 'debrief' as const,
        result: {
          kind: 'stage' as const,
          payload: {
            score: 750,
            handlingScore: 750,
            harshStops: 0,
            posteSuccesses: 1,
            configVersion: 1,
          } as any,
        },
      };

      const markup = renderToStaticMarkup(
        <DebriefScreen
          t={t}
          run={run}
          showPosteLink={false}
          onPosteLink={() => {}}
          onDone={() => {}}
          onPlayAgain={() => {}}
          best={2}
          celebrations={[]}
          onShop={onShop}
        />,
      );

      expect(markup).toContain('Recomendado para el paseo.');
      expect(markup).toContain(es['shop.seeInShop']);

      const btn = mockPressables.find((p) => p.testID === 'shop-link-card-action');
      expect(btn).toBeDefined();
      btn.onPress();
      expect(onShop).toHaveBeenCalledWith({ level: 'product', id: 'arnes-ergonomico-y' });
    } finally {
      setActiveContent(baseContent);
    }
  });

  it('renders ShopLinkCard on MissionProblemScreen and FixScreen', () => {
    const baseContent = getActiveContent();
    setActiveContent({
      ...baseContent,
      resolved: { ...baseContent.resolved, shop: sampleShop },
    });

    try {
      const onShop = jest.fn();
      const sampleFix: Fix = {
        id: 'pulls-ahead',
        blocks: [],
        easierTarget: 'mission.label',
        practise: { kind: 'node', id: 'test-node' },
      };
      const sampleMission: MissionDef = {
        id: 'test-mission',
        title: 'mission.label',
        target: 'mission.label',
        reps: 3,
        successSign: 'mission.label',
        technique: 'test',
        trains: [],
        problems: [{ id: 'pulls-ahead', label: 'mission.label', fix: sampleFix }],
        generalFix: sampleFix,
        recommendations: [
          {
            id: 'rec-mission-view',
            target: 'arneses',
            targetKind: 'subcategory',
            when: 'view',
            explanation: 'Recomendación en la lista de problemas.',
          },
          {
            id: 'rec-mission-fix',
            target: 'arnes-ergonomico-y',
            targetKind: 'product',
            when: 'problem:pulls-ahead',
            explanation: 'Recomendación junto al fix de tirones.',
          },
        ],
      };

      // 1. MissionProblemScreen
      const problemMarkup = renderToStaticMarkup(
        <MissionProblemScreen
          t={t}
          mission={sampleMission}
          onPick={() => {}}
          onBack={() => {}}
          onShop={onShop}
        />,
      );
      expect(problemMarkup).toContain('Recomendación en la lista de problemas.');

      // 2. FixScreen
      const fixMarkup = renderToStaticMarkup(
        <FixScreen
          t={t}
          mission={sampleMission}
          fix={sampleFix}
          problem={'mission.label'}
          canMoveOn={false}
          onPractise={() => {}}
          onMoveOn={() => {}}
          onDone={() => {}}
          onShop={onShop}
        />,
      );
      expect(fixMarkup).toContain('Recomendación junto al fix de tirones.');
    } finally {
      setActiveContent(baseContent);
    }
  });
});
