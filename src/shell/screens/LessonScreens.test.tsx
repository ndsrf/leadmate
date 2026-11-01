jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      return React.createElement('button', props, body);
    },
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    Linking: { openURL: jest.fn().mockResolvedValue(true) },
    Platform: { OS: 'web' },
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
    Path: (props: any) => React.createElement('path', props, props.children),
    Rect: (props: any) => React.createElement('rect', props, props.children),
    G: (props: any) => React.createElement('g', props, props.children),
  };
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
  };
});

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo', () => ({ useEvent: () => ({ status: 'idle' }), useEventListener: () => {} }));
jest.mock('expo-video', () => ({ VideoView: () => null, useVideoPlayer: () => ({}) }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import type { LessonDef } from '../lessons/lesson';
import { LessonScreen } from './LessonScreens';

describe('LessonScreen video gating and text readability', () => {
  const t = createTranslator(es);
  const sampleLesson: LessonDef = {
    id: 'test-lesson',
    title: 'lesson.kind.theory',
    kind: 'theory',
    day: 1,
    blocks: [
      { type: 'heading', text: 'lesson.kind.theory' },
      { type: 'text', text: 'lesson.kind.theory' },
      { type: 'tip', text: 'lesson.kind.theory' },
      {
        type: 'video',
        source: { kind: 'youtube', id: 'vid-1' },
        alt: 'media.caption.poste',
        caption: 'media.caption.poste',
        poster: 'poster',
      },
      { type: 'takeaways', items: ['lesson.kind.theory'] },
    ],
  };

  it('renders all text, tips, and takeaways for free users while video remains gated', () => {
    let unlockCalled = false;
    const markup = renderToStaticMarkup(
      <LessonScreen
        t={t}
        lesson={sampleLesson}
        isPlus={false}
        trialState="unstarted"
        onUnlockVideo={() => {
          unlockCalled = true;
        }}
        onDone={() => {}}
        onBack={() => {}}
      />,
    );
    // Non-video text remains readable
    expect(markup).toContain(es['lesson.kind.theory']);
    expect(markup).toContain(es['lesson.tipLabel']);
    expect(markup).toContain(es['lesson.takeawaysLabel']);

    // Video block is gated with unlock CTA
    expect(markup).toContain('Desbloquear con 7 días gratis');
    expect(markup).not.toContain('Desbloqueado con Plus');
  });

  it('renders unlocked video badge for Plus users', () => {
    const markup = renderToStaticMarkup(
      <LessonScreen
        t={t}
        lesson={sampleLesson}
        isPlus={true}
        trialState="active"
        onDone={() => {}}
        onBack={() => {}}
      />,
    );
    expect(markup).toContain('Desbloqueado con Plus');
    expect(markup).not.toContain('Desbloquear con');
  });
});
