const pressed: Record<string, () => void> = {};

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string =>
    Array.isArray(children)
      ? children.map(text).join('')
      : typeof children === 'string'
      ? children
      : children?.props
      ? text(children.props.children)
      : '';
  return {
    View: (props: any) => React.createElement('div', props, props.children),
    Text: (props: any) => React.createElement('span', props, props.children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const t = text(body);
      if (t && props.onPress) pressed[t] = props.onPress;
      return React.createElement('button', props, body);
    },
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
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
  };
});

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { LessonVideoCard, type VideoBlock } from './LessonVideoCard';

describe('LessonVideoCard gating and perks', () => {
  const t = createTranslator(es);
  const block: VideoBlock = {
    type: 'video',
    videoId: 'dummy-video',
    alt: 'media.caption.poste',
    caption: 'media.caption.poste',
    poster: 'poster',
  };
  const renderPlayer = () => <div id="video-player" />;

  it('renders locked overlay with "Desbloquear con 7 días gratis" for unstarted trial free user', () => {
    let unlocked = false;
    const markup = renderToStaticMarkup(
      <LessonVideoCard
        t={t}
        block={block}
        renderPlayer={renderPlayer}
        isPlus={false}
        trialState="unstarted"
        onUnlock={() => {
          unlocked = true;
        }}
      />,
    );
    expect(markup).toContain('Desbloquear con 7 días gratis');
    expect(markup).not.toContain('Desbloqueado con Plus');
    expect(markup).not.toContain('video-player');

    pressed['Desbloquear con 7 días gratis']?.();
    expect(unlocked).toBe(true);
  });

  it('renders locked overlay with "Desbloquear con Plus" for expired trial free user', () => {
    const markup = renderToStaticMarkup(
      <LessonVideoCard
        t={t}
        block={block}
        renderPlayer={renderPlayer}
        isPlus={false}
        trialState="expired"
        onUnlock={() => {}}
      />,
    );
    expect(markup).toContain('Desbloquear con Plus');
    expect(markup).not.toContain('Desbloqueado con Plus');
    expect(markup).not.toContain('video-player');
  });

  it('renders "Desbloqueado con Plus" badge and play button for Plus user', () => {
    const markup = renderToStaticMarkup(
      <LessonVideoCard
        t={t}
        block={block}
        renderPlayer={renderPlayer}
        isPlus={true}
        trialState="active"
      />,
    );
    expect(markup).toContain('Desbloqueado con Plus');
    expect(markup).toContain(es['media.video.play']);
    expect(markup).not.toContain('Desbloquear con');
  });

  it('renders platform player when autoPlay is true for Plus user', () => {
    const markup = renderToStaticMarkup(
      <LessonVideoCard
        t={t}
        block={block}
        renderPlayer={renderPlayer}
        isPlus={true}
        trialState="active"
        autoPlay={true}
      />,
    );
    expect(markup).toContain('video-player');
    expect(markup).toContain('Desbloqueado con Plus');
  });
});
