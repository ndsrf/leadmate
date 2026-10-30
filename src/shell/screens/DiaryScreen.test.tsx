jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => React.createElement('button', props, typeof props.children === 'function' ? props.children({ pressed: false }) : props.children),
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
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
    default: { View: (props: any) => React.createElement('div', props, props.children) },
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
import { newDogRecord, recordDailyBarkdoku } from '../dogRecord';
import { BARKDOKU_INTRO_NODE } from '../nodes/content';
import { onDebrief, startNode, type NodeRun } from '../nodes/node';
import { DiaryScreen } from './DiaryScreen';

describe('DiaryScreen: Daily Barkdoku', () => {
  const t = createTranslator(es);
  const today = '2026-10-28';
  const morning = new Date(2026, 9, 28, 9, 30);
  const summary = { size: 5, difficulty: 'easy' as const, durationSeconds: 102, targetSeconds: 120, mistakes: 1 };

  it("shows the solve, the day's Daily Solve Time, the legend and the total", () => {
    const record = recordDailyBarkdoku(newDogRecord(), 'b-5', summary, 2, today, morning);
    const html = renderToStaticMarkup(<DiaryScreen t={t} record={record} today={today} onBack={() => {}} />);
    expect(html).toContain('Guaudoku 5×5');
    expect(html).toContain('1:42 / 2:00 ✓');
    expect(html).toContain(es['diary.event.dailySolveTime']);
    expect(html).toContain('2 de 3 estrellas');
    expect(html).toContain(es['diary.event.mistakes']);
    expect(html).toContain(es['diary.mark.barkdoku']);
    expect(html).toContain(es['diary.totals.barkdokuSolves']);
  });

  it('shows the Solve Time of a Barkdoku Node run', () => {
    const run: NodeRun = {
      ...startNode(BARKDOKU_INTRO_NODE),
      step: 'debrief',
      result: { kind: 'minigame', metrics: { timing: 1 }, handlingScore: 1000, puzzle: { size: 4, difficulty: 'tutorial', durationSeconds: 190, mistakes: 0 } },
    };
    const record = onDebrief(newDogRecord(), run, morning);
    const html = renderToStaticMarkup(<DiaryScreen t={t} record={record} today={today} onBack={() => {}} />);
    expect(html).toContain('Mundo 3 · Guaudoku');
    expect(html).toContain('3:10');
  });
});
