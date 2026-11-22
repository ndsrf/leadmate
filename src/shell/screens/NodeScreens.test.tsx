import React from 'react';
import * as path from 'node:path';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createTranslator, es, type TextKey } from '../../i18n';
import { PrimerScreen, DebriefScreen, CheckpointScreen, ImageDuelQuestionView, DuelVerdictBadge } from './NodeScreens';
import { MissionProblemScreen, FixScreen } from './MissionScreens';
import { getActiveContent, setActiveContent } from '../content/runtime';
import { loadPackFromDisk } from '../content/loader';
import { resolvePack } from '../content/resolver';
import type { ResolvedShop } from '../content/resolver';
import type { NodeDef, NodeRun } from '../nodes/node';
import { advance, onDebrief, startNode } from '../nodes/node';
import type { ImageDuelQuestion } from '../nodes/content';
import { newDogRecord } from '../dogRecord';
import { payloadWith } from '../testPayload';
import type { SimulationDebriefPayload } from '../../sim/payload';
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
    AccessibilityInfo: {
      isReduceMotionEnabled: () => Promise.resolve(false),
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
    Ellipse: (props: any) => React.createElement('ellipse', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
    Line: (props: any) => React.createElement('line', props, props.children),
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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
    Easing: {
      linear: () => {},
      bezier: () => () => {},
    },
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
  };
});

const realConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args: unknown[]) => {
    const msg = String(args[0]);
    if (msg.includes('react-test-renderer is deprecated') || msg.includes('not wrapped in act')) return;
    realConsoleError(...args);
  });
});

afterAll(() => {
  (console.error as any).mockRestore?.();
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

  it('shows the picture of the guided first Stage overview card, not a placeholder', () => {
    const { INTRO_NODE } = require('../onboarding/introNode');
    const run = { ...startNode(INTRO_NODE), card: INTRO_NODE.primerCards.findIndex((c: any) => typeof c !== 'string' && c.media?.art === 'howto-walking-signs') };
    expect(run.card).toBeGreaterThanOrEqual(0);
    const markup = renderToStaticMarkup(<PrimerScreen t={t} run={run} onNext={() => {}} onExit={() => {}} />);
    expect(markup).toContain(es['node.intro.cardSigns.caption']);
    expect(markup).toContain('<img');
    expect(markup).not.toContain(es['media.pending']);
    expect(markup).not.toContain(es['media.unavailable']);
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

      // 2. FixScreen: Spec requires trouble triggers to NEVER show while reviewing the fix
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
      expect(fixMarkup).not.toContain('Recomendación junto al fix de tirones.');
    } finally {
      setActiveContent(baseContent);
    }
  });

  describe('CheckpointScreen - Image Duel (Tasks 1.4, 1.4a)', () => {
    const FIXTURE = path.join(__dirname, '..', 'content', '__fixtures__', 'duel-pack');
    const resolved = resolvePack(loadPackFromDisk(FIXTURE), 'es');
    const t = createTranslator({ ...es, ...resolved.catalog });
    const duelNode = resolved.nodes.find((n) => n.id === 'duel-walk')!;
    const duelQuestion = duelNode.checkpoint[1] as ImageDuelQuestion;

    beforeEach(() => {
      jest.useFakeTimers();
      mockPressables.length = 0;
    });

    afterEach(() => {
      jest.clearAllTimers();
      jest.useRealTimers();
    });

    it('renders duel question with prompt and stacked images without verdict hints before answering', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={() => {}}
            onTimeout={() => {}}
            random={() => 0.99}
          />,
        );
      });

      // Prompt is visible
      expect(renderer!.root.findByProps({ children: t(duelQuestion.question) })).toBeDefined();

      // Both images are visible and tappable
      const option0 = renderer!.root.findByProps({ testID: 'duel-option-0' });
      const option1 = renderer!.root.findByProps({ testID: 'duel-option-1' });
      expect(option0).toBeDefined();
      expect(option1).toBeDefined();
      expect(option0.props.accessibilityRole).toBe('button');
      expect(option1.props.accessibilityRole).toBe('button');

      // NO check, cross, or explanation before answering
      expect(renderer!.root.findAllByType(DuelVerdictBadge)).toHaveLength(0);
      expect(renderer!.root.findAll((el) => el.props?.testID === 'duel-explanation')).toHaveLength(0);
      expect(renderer!.root.findAll((el) => el.props?.testID === 'duel-next-button')).toHaveLength(0);
    });

    it('shuffles top/bottom order per presentation with controlled RNG', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };

      // With RNG returning 0.99 -> order is [0, 1] (autopilot top, turn-and-look bottom)
      let renderer1: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer1 = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={() => {}}
            onTimeout={() => {}}
            random={() => 0.99}
          />,
        );
      });
      const buttons1 = renderer1!.root.findAll((el) => el.type === 'button' && typeof el.props?.testID === 'string' && el.props.testID.startsWith('duel-option-'));
      expect(buttons1).toHaveLength(2);
      expect(buttons1[0].props.testID).toBe('duel-option-0');
      expect(buttons1[1].props.testID).toBe('duel-option-1');

      // With RNG returning 0 -> order is [1, 0] (turn-and-look top, autopilot bottom)
      let renderer2: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer2 = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={() => {}}
            onTimeout={() => {}}
            random={() => 0}
          />,
        );
      });
      const buttons2 = renderer2!.root.findAll((el) => el.type === 'button' && typeof el.props?.testID === 'string' && el.props.testID.startsWith('duel-option-'));
      expect(buttons2).toHaveLength(2);
      expect(buttons2[0].props.testID).toBe('duel-option-1');
      expect(buttons2[1].props.testID).toBe('duel-option-0');
    });

    it('handles correct choice: marks chosen correct image with check badge and shows explanation', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };
      const onAnswer = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={onAnswer}
            onTimeout={() => {}}
            random={() => 0.99}
          />,
        );
      });

      // Tap the correct image (authored index 1)
      const option1 = renderer!.root.findByProps({ testID: 'duel-option-1' });
      act(() => {
        option1.props.onPress();
      });

      // Correct image has check badge; no cross badge
      const checkBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'check');
      const crossBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'cross');
      expect(checkBadges).toHaveLength(1);
      expect(crossBadges).toHaveLength(0);

      // Explanation is displayed
      const explanation = renderer!.root.findByProps({ testID: 'duel-explanation' });
      expect(explanation).toBeDefined();
      expect(explanation.props.children).toBe(t(duelQuestion.explanation));

      // Next button advances and calls onAnswer with authored index 1
      const nextBtn = renderer!.root.findByProps({ testID: 'duel-next-button' });
      expect(nextBtn).toBeDefined();
      act(() => {
        nextBtn.props.onPress();
      });
      expect(onAnswer).toHaveBeenCalledWith(1);
    });

    it('handles wrong choice: marks chosen with cross, correct with check, and shows explanation', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };
      const onAnswer = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={onAnswer}
            onTimeout={() => {}}
            random={() => 0.99}
          />,
        );
      });

      // Tap the poorer image (authored index 0)
      const option0 = renderer!.root.findByProps({ testID: 'duel-option-0' });
      act(() => {
        option0.props.onPress();
      });

      // Chosen option 0 has cross badge, correct option 1 has check badge
      const checkBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'check');
      const crossBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'cross');
      expect(checkBadges).toHaveLength(1);
      expect(crossBadges).toHaveLength(1);

      // Explanation is displayed
      const explanation = renderer!.root.findByProps({ testID: 'duel-explanation' });
      expect(explanation.props.children).toBe(t(duelQuestion.explanation));

      // Next button advances with authored index 0
      const nextBtn = renderer!.root.findByProps({ testID: 'duel-next-button' });
      act(() => {
        nextBtn.props.onPress();
      });
      expect(onAnswer).toHaveBeenCalledWith(0);
    });

    it('handles timeout: marks question unanswered, reveals check on correct image and explanation', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };
      const onTimeout = jest.fn();
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={() => {}}
            onTimeout={onTimeout}
            random={() => 0.99}
          />,
        );
      });

      // Advance timers by 15.1 seconds to trigger timeout
      act(() => {
        jest.advanceTimersByTime(15100);
      });

      // Correct image has check badge; no cross badge
      const checkBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'check');
      const crossBadges = renderer!.root.findAllByType(DuelVerdictBadge).filter((b) => b.props.verdict === 'cross');
      expect(checkBadges).toHaveLength(1);
      expect(crossBadges).toHaveLength(0);

      // Explanation is displayed
      const explanation = renderer!.root.findByProps({ testID: 'duel-explanation' });
      expect(explanation.props.children).toBe(t(duelQuestion.explanation));

      // Next button advances and calls onTimeout
      const nextBtn = renderer!.root.findByProps({ testID: 'duel-next-button' });
      act(() => {
        nextBtn.props.onPress();
      });
      expect(onTimeout).toHaveBeenCalledTimes(1);
    });

    it('exposes localized alt text before answering and appends localized verdict after answering', () => {
      const run = { ...startNode(duelNode), step: 'checkpoint' as const, question: 1 };
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen
            t={t}
            run={run}
            setting={15}
            onAnswer={() => {}}
            onTimeout={() => {}}
            random={() => 0.99}
          />,
        );
      });

      const option0 = renderer!.root.findByProps({ testID: 'duel-option-0' });
      const option1 = renderer!.root.findByProps({ testID: 'duel-option-1' });

      expect(option0.props.accessibilityRole).toBe('button');
      expect(option1.props.accessibilityRole).toBe('button');
      // Before answering: alt text only, disabled is false, selected is undefined
      expect(option0.props.accessibilityLabel).toBe(t(duelQuestion.images[0].alt));
      expect(option1.props.accessibilityLabel).toBe(t(duelQuestion.images[1].alt));
      expect(option0.props.accessibilityState).toEqual({ disabled: false });
      expect(option1.props.accessibilityState).toEqual({ disabled: false });

      // Answering option 1 (correct): chosen gets selected: true, both get localized verdict
      act(() => {
        option1.props.onPress();
      });

      expect(option1.props.accessibilityState).toEqual({ disabled: true, selected: true });
      expect(option0.props.accessibilityState).toEqual({ disabled: true });
      expect(option1.props.accessibilityLabel).toBe(`${t(duelQuestion.images[1].alt)}. ${t('node.duel.correct')}`);
      expect(option0.props.accessibilityLabel).toBe(`${t(duelQuestion.images[0].alt)}. ${t('node.duel.incorrect')}`);
    });

    it('renders text and duel questions in authored order in a mixed Checkpoint', () => {
      const mixedNode: NodeDef = {
        ...duelNode,
        checkpoint: [
          duelNode.checkpoint[0], // text
          duelNode.checkpoint[1], // duel
          {
            question: 'node.intro.question' as any,
            options: [
              { text: 'node.intro.optionAnchor' as any, correct: true },
              { text: 'node.intro.optionPull' as any, correct: false },
            ],
            explanation: 'node.intro.why' as any,
          },
        ],
      };

      let run: NodeRun = { ...startNode(mixedNode), step: 'checkpoint' as const, question: 0 };

      // 1. First question is text
      let renderer: ReactTestRenderer.ReactTestRenderer;
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen t={t} run={run} setting={15} onAnswer={() => {}} onTimeout={() => {}} />,
        );
      });
      expect(renderer!.root.findByProps({ children: t(mixedNode.checkpoint[0].question) })).toBeDefined();
      expect(renderer!.root.findAll((el) => typeof el.props?.testID === 'string' && el.props.testID.startsWith('duel-option-'))).toHaveLength(0);

      // Answer question 0
      run = advance(run, { type: 'answer', option: 0 });
      expect(run.question).toBe(1);

      // 2. Second question is duel
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen t={t} run={run} setting={15} onAnswer={() => {}} onTimeout={() => {}} />,
        );
      });
      expect(renderer!.root.findByProps({ children: t(duelQuestion.question) })).toBeDefined();
      expect(renderer!.root.findAll((el) => el.type === 'button' && typeof el.props?.testID === 'string' && el.props.testID.startsWith('duel-option-'))).toHaveLength(2);

      // Answer duel question
      run = advance(run, { type: 'answer', option: 1 });
      expect(run.question).toBe(2);

      // 3. Third question is text
      act(() => {
        renderer = ReactTestRenderer.create(
          <CheckpointScreen t={t} run={run} setting={15} onAnswer={() => {}} onTimeout={() => {}} />,
        );
      });
      expect(renderer!.root.findByProps({ children: t(mixedNode.checkpoint[2].question) })).toBeDefined();
      expect(renderer!.root.findAll((el) => el.type === 'button' && typeof el.props?.testID === 'string' && el.props.testID.startsWith('duel-option-'))).toHaveLength(0);

      // Answer question 2
      run = advance(run, { type: 'answer', option: 0 });
      expect(run.step).toBe('simulation');
    });

    it('confirms the answer never blocks the simulation or changes the Dog for duel questions (Task 1.4a)', () => {
      const singleDuelNode: NodeDef = {
        ...duelNode,
        checkpoint: [duelQuestion],
        exercises: [{ metric: 'tension', key: 'node.intro.title' as any }],
      };

      const initialDog = newDogRecord();
      const now = new Date('2026-06-01T10:00:00Z');
      const standardSimResult = { kind: 'stage' as const, payload: payloadWith({ handlingScore: 400 }) };

      const run = startNode(singleDuelNode);
      const atCheckpoint = advance(run, { type: 'next' });
      expect(atCheckpoint.step).toBe('checkpoint');

      // Case 1: Correct choice advances to simulation and debrief
      const atSimCorrect = advance(atCheckpoint, { type: 'answer', option: 1 });
      expect(atSimCorrect.step).toBe('simulation');
      expect(atSimCorrect.checkpoint).toEqual(['correct']);
      const atDebriefCorrect = advance(atSimCorrect, { type: 'finish', result: standardSimResult });
      expect(atDebriefCorrect.step).toBe('debrief');
      const dogCorrect = onDebrief(initialDog, atDebriefCorrect, now);

      // Case 2: Wrong choice advances to simulation and debrief
      const atSimWrong = advance(atCheckpoint, { type: 'answer', option: 0 });
      expect(atSimWrong.step).toBe('simulation');
      expect(atSimWrong.checkpoint).toEqual(['wrong']);
      const atDebriefWrong = advance(atSimWrong, { type: 'finish', result: standardSimResult });
      expect(atDebriefWrong.step).toBe('debrief');
      const dogWrong = onDebrief(initialDog, atDebriefWrong, now);

      // Case 3: Timeout advances to simulation and debrief
      const atSimTimeout = advance(atCheckpoint, { type: 'timeout' });
      expect(atSimTimeout.step).toBe('simulation');
      expect(atSimTimeout.checkpoint).toEqual(['missed']);
      const atDebriefTimeout = advance(atSimTimeout, { type: 'finish', result: standardSimResult });
      expect(atDebriefTimeout.step).toBe('debrief');
      const dogTimeout = onDebrief(initialDog, atDebriefTimeout, now);

      // The duel answer (correct vs wrong vs missed) does not change the Dog record
      expect(dogCorrect).toEqual(dogWrong);
      expect(dogCorrect).toEqual(dogTimeout);

      // Sanity checks:
      // 1. onDebrief on a debriefed run actually updates the Dog record compared to initialDog
      expect(dogCorrect).not.toEqual(initialDog);
      expect(dogCorrect.completedNodes).toContain(singleDuelNode.id);

      // 2. A different simulation outcome does change the resulting Dog record
      const differentSimResult = { kind: 'stage' as const, payload: payloadWith({ handlingScore: 900 }) };
      const atDebriefDifferent = advance(atSimCorrect, { type: 'finish', result: differentSimResult });
      expect(atDebriefDifferent.step).toBe('debrief');
      const dogDifferent = onDebrief(initialDog, atDebriefDifferent, now);
      expect(dogDifferent).not.toEqual(dogCorrect);
      expect(dogDifferent.stars[singleDuelNode.id]).not.toEqual(dogCorrect.stars[singleDuelNode.id]);
    });
  });

  describe('Node Debrief - Scent Walk Timeline & Summary (Task 4.3)', () => {
    const scentPayload = payloadWith({
      durationSeconds: 45,
      scentWalk: {
        sniffsGranted: 2,
        sniffsEmpty: 0,
        scentsDraggedPast: 0,
        plantsWaited: 1,
        plantsDragged: 0,
        markingsWaited: 0,
        markingsInterrupted: 0,
        foodEaten: 1,
        foodLeft: 0,
        freshMoves: 1,
        repeatedMoves: 0,
        chains: 0,
        jackpotsSmart: 1,
        jackpotsWasted: 0,
      },
      timeline: [
        { t: 5.5, kind: 'granted-sniff', polarity: 'right' },
        { t: 15.0, kind: 'food-eaten', polarity: 'wrong' },
        { t: 32.2, kind: 'smart-jackpot', polarity: 'right' },
      ],
    });

    const standardPayload = payloadWith({
      durationSeconds: 45,
    });

    const runWithPayload = (p: SimulationDebriefPayload): NodeRun => ({
      ...startNode(sampleNode),
      step: 'debrief' as const,
      result: { kind: 'stage', payload: p },
    });

    it('renders the timeline strip and "done well / try next" summary when timeline is present', () => {
      const run = runWithPayload(scentPayload);

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
        />
      );

      // Shows timeline title
      expect(markup).toContain(t('debrief.timeline.title'));
      // Shows "done well" section
      expect(markup).toContain(t('debrief.summary.doneWell'));
      // Shows "try next" section
      expect(markup).toContain(t('debrief.summary.tryNext'));
      // Shows the summary items
      expect(markup).toContain(t('feedback.waited-plant.short'));
      expect(markup).toContain(t('feedback.smart-jackpot.short'));
      expect(markup).toContain(t('feedback.food-eaten.short'));
    });

    it('leaves every other Debrief unchanged when timeline is absent', () => {
      const run = runWithPayload(standardPayload);

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
        />
      );

      // Outside scent Stages, timeline and summary are NOT rendered
      expect(markup).not.toContain(t('debrief.timeline.title'));
      expect(markup).not.toContain(t('debrief.summary.doneWell'));
      expect(markup).not.toContain(t('debrief.summary.tryNext'));
      // Existing Debrief elements still render
      expect(markup).toContain(t('results.title'));
      expect(markup).toContain(t('results.duration'));
    });

    it('allows tapping a moment on the timeline to inspect feedback and time', () => {
      const run = runWithPayload(scentPayload);

      let root: any;
      act(() => {
        root = ReactTestRenderer.create(
          <DebriefScreen
            t={t}
            run={run}
            showPosteLink={false}
            onPosteLink={() => {}}
            onDone={() => {}}
            onPlayAgain={() => {}}
            best={2}
            celebrations={[]}
          />
        );
      });

      // Tap wrong moment button (index 1: food-eaten)
      const wrongBtn = root.root.find((node: any) => node.type === 'button' && node.props['data-moment-index'] === 1);
      act(() => {
        wrongBtn.props.onPress();
      });

      const messageNode = root.root.find((node: any) => node.type === 'span' && node.props.testID === 'timeline-selected-message');
      expect(messageNode.props.children).toBe(t('feedback.food-eaten.short'));
      const timeNode = root.root.find((node: any) => node.type === 'span' && node.props.testID === 'timeline-selected-time');
      expect(timeNode.props.children).toContain('15');
    });
  });

  describe('Node Debrief - Encounter list (encounters 6.1)', () => {
    const encounters = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, title: 'node.debrief.title' as TextKey, aim: 'check-in' as const, scenario: {} }));
    const seriesNode: NodeDef = { ...sampleNode, simulation: { encounters } };
    const t2 = createTranslator({});
    const runOf = (payload: SimulationDebriefPayload, skipped?: boolean): NodeRun => ({
      ...startNode(seriesNode),
      step: 'debrief' as const,
      result: { kind: 'stage', payload, ...(skipped ? { skipped: true } : {}) },
    });
    const render = (run: NodeRun) =>
      renderToStaticMarkup(<DebriefScreen t={t2} run={run} showPosteLink={false} onPosteLink={() => {}} onDone={() => {}} onPlayAgain={() => {}} best={2} celebrations={[]} />);

    it('lists each Encounter of a finished Series with Paws and attempts above the telemetry rows', () => {
      const markup = render(
        runOf(payloadWith({ encounters: [{ id: 'a', paws: 3, attempts: 1 }, { id: 'b', paws: 2, attempts: 3 }, { id: 'c', paws: 1, attempts: 2 }, { id: 'd', paws: 3, attempts: 1 }] })),
      );
      expect(markup).toContain(t2('encounter.list.title'));
      expect(markup).toContain('3 intentos');
      expect(markup).toContain('1 intento');
      expect(markup).not.toContain(t2('encounter.notPlayed'));
      expect(markup.indexOf(t2('encounter.list.title'))).toBeLessThan(markup.indexOf(t2('results.duration')));
      expect(markup.match(/debrief-encounter-row/g)).toHaveLength(4);
    });

    it('marks the Encounters of an exited Series that were not played', () => {
      const markup = render(
        runOf(payloadWith({ encounters: [{ id: 'a', paws: 3, attempts: 1 }, { id: 'b', paws: 2, attempts: 2 }, { id: 'c', paws: 0, attempts: 0 }, { id: 'd', paws: 0, attempts: 0 }] }), true),
      );
      expect(markup.split(t2('encounter.notPlayed'))).toHaveLength(3); // two "not played"
    });

    it('leaves a non-Series Debrief without an Encounter list', () => {
      const markup = render(runOf(payloadWith()));
      expect(markup).not.toContain(t2('encounter.list.title'));
      expect(markup).not.toContain('debrief-encounter');
      expect(markup).toContain(t2('results.duration'));
    });
  });
});
