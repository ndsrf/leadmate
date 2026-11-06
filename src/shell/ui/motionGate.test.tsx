const mockApp = { state: 'active', listeners: new Set<(s: string) => void>() };
const mockReduce = { on: false };
const mockCalls = { repeat: 0, cancel: 0 };

jest.mock('react-native', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return {
    View: el('div'),
    Text: el('span'),
    Pressable: el('button'),
    ScrollView: el('div'),
    AppState: {
      get currentState() {
        return mockApp.state;
      },
      addEventListener: (_t: string, l: (s: string) => void) => {
        mockApp.listeners.add(l);
        return { remove: () => mockApp.listeners.delete(l) };
      },
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: () => Promise.resolve(mockReduce.on),
      addEventListener: () => ({ remove: () => {} }),
    },
    Dimensions: { get: () => ({ width: 390, height: 844 }) },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
  };
});

jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Line: el('line'), Path: el('path'), Rect: el('rect'), G: el('g') };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: { View: (props: any) => React.createElement('div', props, props.children), createAnimatedComponent: (c: any) => c },
    Easing: { inOut: () => ({}), ease: {} },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    useSharedValue: (v: any) => React.useRef({ value: v }).current,
    useAnimatedStyle: () => ({}),
    useAnimatedProps: (fn: () => object) => fn(),
    withTiming: (v: any) => v,
    withSequence: (...a: any[]) => a[0],
    withRepeat: (v: any) => {
      mockCalls.repeat++;
      return v;
    },
    cancelAnimation: () => {
      mockCalls.cancel++;
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { BellRipple } from './MinigameProps';
import { useWobble } from './CanineMinigameAvatar';
import { LoaderLead } from '../screens/SplashScreen';
import { useEndlessLoop } from './useMotionGate';
import { devPerfSnapshot, resetDevPerf, setDevPerfEnabled } from './devPerf';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

async function mount(node: React.ReactElement): Promise<TestRenderer.ReactTestRenderer> {
  let r!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    r = TestRenderer.create(node);
  });
  return r;
}

const setApp = async (state: string) => {
  mockApp.state = state;
  await act(async () => mockApp.listeners.forEach((l) => l(state)));
};

function Wobble({ posture }: { posture: Parameters<typeof useWobble>[0] }) {
  useWobble(posture);
  return null;
}

beforeEach(() => {
  mockApp.state = 'active';
  mockReduce.on = false;
  mockCalls.repeat = 0;
  mockCalls.cancel = 0;
  setDevPerfEnabled(true);
  resetDevPerf();
});
afterAll(() => setDevPerfEnabled(null));

describe('useEndlessLoop', () => {
  function Probe({ open, log }: { open: boolean; log: string[] }) {
    const start = React.useCallback(() => void log.push('start'), [log]);
    const stop = React.useCallback(() => void log.push('stop'), [log]);
    useEndlessLoop('probe', open, start, stop);
    return null;
  }

  it('starts only while open, stops when closed and on unmount', async () => {
    const log: string[] = [];
    const r = await mount(<Probe open={false} log={log} />);
    expect(log).toEqual([]);
    expect(devPerfSnapshot().loops).toEqual([]);
    await act(async () => r.update(<Probe open log={log} />));
    expect(log).toEqual(['start']);
    expect(devPerfSnapshot().loops).toEqual(['probe']);
    await act(async () => r.update(<Probe open={false} log={log} />));
    expect(log).toEqual(['start', 'stop']);
    expect(devPerfSnapshot().loops).toEqual([]);
    await act(async () => r.update(<Probe open log={log} />));
    await act(async () => r.unmount());
    expect(log).toEqual(['start', 'stop', 'start', 'stop']);
    expect(devPerfSnapshot().loops).toEqual([]);
  });
});

describe('the splash loader at rest', () => {
  const dashOffset = (r: TestRenderer.ReactTestRenderer) => r.root.findAll((n) => n.props.animatedProps !== undefined)[0].props.animatedProps.strokeDashoffset;

  it('is the fully drawn line when it mounts with the gate closed', async () => {
    mockApp.state = 'background';
    const r = await mount(<LoaderLead animate />);
    expect(mockCalls.repeat).toBe(0);
    expect(dashOffset(r)).toBe(0);
    await act(async () => r.unmount());
  });

  it('is the fully drawn line under reduced motion', async () => {
    mockReduce.on = true;
    const r = await mount(<LoaderLead animate />);
    expect(devPerfSnapshot().loops).toEqual([]);
    expect(dashOffset(r)).toBe(0);
    await act(async () => r.unmount());
  });
});

describe.each([
  ['the Dog wobble', (on: boolean) => <Wobble posture={on ? 'jumping' : 'calm_sphinx_on_mat'} />, 'avatar:jumping'],
  ['the bell ripple', (on: boolean) => <BellRipple ringing={on} x={10} y={10} />, 'bell-ripple'],
  ['the splash loader', (on: boolean) => <LoaderLead animate={on} />, 'splash-loader'],
] as const)('%s loop', (_name, view, id) => {
  it('does not start when the visual state needs no motion', async () => {
    const r = await mount(view(false));
    expect(mockCalls.repeat).toBe(0);
    expect(devPerfSnapshot().loops).toEqual([]);
    await act(async () => r.unmount());
  });

  it('starts when motion is needed and is cancelled when the app leaves the foreground', async () => {
    const r = await mount(view(true));
    expect(mockCalls.repeat).toBe(1);
    expect(devPerfSnapshot().loops).toEqual([id]);
    await setApp('background');
    expect(devPerfSnapshot().loops).toEqual([]);
    expect(mockCalls.cancel).toBeGreaterThan(0);
    await setApp('active');
    expect(mockCalls.repeat).toBe(2);
    expect(devPerfSnapshot().loops).toEqual([id]);
    await act(async () => r.unmount());
    expect(devPerfSnapshot().loops).toEqual([]);
  });

  it('is cancelled when motion is no longer needed', async () => {
    const r = await mount(view(true));
    await act(async () => r.update(view(false)));
    expect(devPerfSnapshot().loops).toEqual([]);
    await act(async () => r.unmount());
  });

  it('never starts under reduced motion', async () => {
    mockReduce.on = true;
    const r = await mount(view(true));
    expect(devPerfSnapshot().loops).toEqual([]);
    await act(async () => r.unmount());
  });
});
