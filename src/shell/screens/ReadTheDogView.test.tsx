import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { AccessibilityInfo } from 'react-native';
import { createTranslator, es } from '../../i18n';
import { feedback } from '../ui/feedback';
import { ReadTheDogView } from './ReadTheDogView';
import { SIGNALS } from '../nodes/readTheDog';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
(globalThis as any).requestAnimationFrame = (cb: any) => setTimeout(cb, 16);
(globalThis as any).cancelAnimationFrame = (id: any) => clearTimeout(id);

const mockPanConfig: { current: any } = { current: null };

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
    Svg: (props: any) => React.createElement('svg', props, props.children),
    Circle: (props: any) => React.createElement('circle', props, props.children),
    Ellipse: (props: any) => React.createElement('ellipse', props, props.children),
    Line: (props: any) => React.createElement('line', props, props.children),
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
  };
});

jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      const body =
        typeof props.children === 'function'
          ? props.children({ pressed: false })
          : props.children;
      return React.createElement('button', props, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Platform: { OS: 'web' },
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      announceForAccessibility: jest.fn(),
    },
    PanResponder: {
      create: (config: any) => {
        mockPanConfig.current = config;
        return { panHandlers: config };
      },
    },
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
  };
});

describe('ReadTheDogView (5.3, 5.4, 6.1)', () => {
  const t = createTranslator(es);
  const record = { name: 'Luna', breed: 'teckel' as const, coat: 'chocolate' as const };
  let stageSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    stageSpy = jest.spyOn(feedback, 'stage').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    stageSpy.mockRestore();
  });

  it('5.3: tap answer, swipe answer, and timeout each produce one event and one feedback.stage call', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReadTheDogView t={t} record={record} seed={1234} />,
      );
    });

    // Tap Start button
    const buttons = renderer!.root.findAllByType('button' as any);
    const startBtn = buttons.find((b) => b.props.accessibilityLabel === t('readTheDog.start'));
    expect(startBtn).toBeDefined();

    await act(async () => {
      startBtn!.props.onPress();
    });

    // Check that signal is showing. Tap answer button for Calm
    const calmBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.answer.calm'),
    );
    expect(calmBtn).toBeDefined();

    // 1. Tap answer
    await act(async () => {
      calmBtn!.props.onPressIn();
      jest.advanceTimersByTime(20);
    });

    expect(stageSpy).toHaveBeenCalledTimes(1);

    // Advance through pause (wrongPause or rightPause: max 1.2s = 1200ms)
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });

    // 2. Swipe answer via PanResponder release
    expect(mockPanConfig.current).toBeDefined();
    await act(async () => {
      mockPanConfig.current.onPanResponderRelease(null, { dx: -60, dy: 5 }); // swipe left -> calm
      jest.advanceTimersByTime(20);
    });

    expect(stageSpy).toHaveBeenCalledTimes(2);

    // Advance through pause
    await act(async () => {
      jest.advanceTimersByTime(1400);
    });

    // 3. Timeout: let timer run out (e.g. 2.4s + margin)
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });

    expect(stageSpy).toHaveBeenCalledTimes(3);
  });

  it('5.3: with screen reader on, the timer is 6 s', async () => {
    (AccessibilityInfo.isScreenReaderEnabled as jest.Mock).mockResolvedValue(true);

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReadTheDogView t={t} record={record} seed={4321} />,
      );
    });

    // Start
    const startBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.start'),
    );
    await act(async () => {
      startBtn!.props.onPress();
    });

    // After starting, timer total should be 6s
    // Check RtdTimerBar props in the rendered tree
    const timerBar = renderer!.root.findByProps({ total: 6 });
    expect(timerBar).toBeDefined();
    expect(timerBar.props.total).toBe(6);
  });

  it('5.4: replay starts a round at once at the carried level and result callback fires exactly once per round', async () => {
    const onRoundResult = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReadTheDogView t={t} record={record} seed={9999} onRoundResult={onRoundResult} />,
      );
    });

    // Start round 1
    const startBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.start'),
    );
    await act(async () => {
      startBtn!.props.onPress();
    });

    // Fast-forward 24.5 seconds to end round 1
    await act(async () => {
      jest.advanceTimersByTime(25000);
    });

    expect(onRoundResult).toHaveBeenCalledTimes(1);

    // Find replay button on result card
    const replayBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.result.replay'),
    );
    expect(replayBtn).toBeDefined();

    // Tap replay
    await act(async () => {
      replayBtn!.props.onPress();
    });

    // Replay starts at once: answer buttons are visible, no start button
    const calmBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.answer.calm'),
    );
    expect(calmBtn).toBeDefined();

    // Fast-forward 25 seconds to end round 2
    await act(async () => {
      jest.advanceTimersByTime(25000);
    });

    expect(onRoundResult).toHaveBeenCalledTimes(2);
  });

  it('6.1: onFinish is called once, on Continue, with the first round latency even after a faster replay', async () => {
    const onFinish = jest.fn();

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ReadTheDogView t={t} record={record} seed={1111} onFinish={onFinish} />,
      );
    });

    // Start round 1
    const startBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.start'),
    );
    await act(async () => {
      startBtn!.props.onPress();
    });

    // In round 1, let it time out (all missed -> latency 1.5)
    await act(async () => {
      jest.advanceTimersByTime(25000);
    });

    // Replay
    const replayBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.result.replay'),
    );
    await act(async () => {
      replayBtn!.props.onPress();
    });

    // In round 2, answer right quickly
    const calmBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.answer.calm'),
    );
    // Answer right if calm or tap button
    await act(async () => {
      calmBtn!.props.onPressIn();
      jest.advanceTimersByTime(20);
      jest.advanceTimersByTime(25000);
    });

    // Tap Continue
    const continueBtn = renderer!.root.findAllByType('button' as any).find(
      (b) => b.props.accessibilityLabel === t('readTheDog.result.continue'),
    );
    expect(continueBtn).toBeDefined();

    await act(async () => {
      continueBtn!.props.onPress();
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
    // Round 1 was all misses, so latency was 1.5!
    expect(onFinish).toHaveBeenCalledWith(1.5);
  });
});
