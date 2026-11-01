jest.mock('react-native', () => {
  const React = require('react');
  return {
    View: (props: any) => React.createElement('div', null, props.children),
    Text: (props: any) => React.createElement('span', null, props.children),
    Linking: { openURL: jest.fn() },
  };
});
/** The last `onPress` rendered for each button label, so a test can tap it. */
const presses = new Map<string, () => void>();
jest.mock('../Overlays', () => {
  const React = require('react');
  return {
    Button: (props: any) => {
      presses.set(props.label, props.onPress);
      return React.createElement('button', null, props.label);
    },
  };
});
jest.mock('./components', () => {
  const React = require('react');
  const box = (props: any) => React.createElement('div', null, props.children);
  return { Raised: box, Panel: box, Badge: (props: any) => React.createElement('b', null, props.label) };
});
jest.mock('./LessonImage', () => {
  const React = require('react');
  return { LessonPicture: (props: any) => React.createElement('img', { alt: props.art }) };
});
jest.mock('./CanineMinigameAvatar', () => ({ CanineMinigameAvatar: () => null }));
jest.mock('./press', () => ({ handlePress: (f: () => void) => f() }));
jest.mock('./theme', () => ({ theme: { radius: { lg: 0, md: 0 }, depth: { sm: { x: 0 } }, space: { 1: 0, 3: 0 } }, usePalette: () => ({}) }));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { parseAnimationTimeline } from '../lessons/animationTimeline';
import { LessonVideoCard, loadAnimationTimeline, subtitleAt, type VideoBlock } from './LessonVideoCard';
import { videoEmbedUrl } from './media';

const t = createTranslator(es);
const youtube: VideoBlock = { type: 'video', source: { kind: 'youtube', id: 'WPWbgzAd6C0' }, poster: 'poster', alt: 'lesson.1.video.alt', caption: 'lesson.1.video.caption' };
const animation: VideoBlock = { type: 'video', source: { kind: 'animation', key: 'calm-leash' }, poster: 'calm-leash-anim', alt: 'lesson.1.animation.alt', caption: 'lesson.1.animation.caption' };

const base = 'https://media.example.com/lesson-media';
const marking: VideoBlock = { type: 'video', source: { kind: 'animation', key: 'marking-rewarding' }, poster: 'marking-rewarding-anim', alt: 'lesson.4.animation.alt', caption: 'lesson.4.animation.caption' };
const timeline = parseAnimationTimeline(JSON.stringify({ version: 1, duration: 8, beats: [{ id: 'mark', start: 3, end: 6 }], lines: [{ id: 'bien', start: 3.2, end: 4.4, voice: 'marker' }] }));

/**
 * Renders the card. `started` renders it as after the play tap; `played` also as loaded, holding `timeline` at
 * playback time `time`. The card's states, in order: started, load state, attempt, timeline, time.
 */
function render(block: VideoBlock, started = false, opts: { mediaBase?: string; played?: { timeline: unknown; time: number }; gating?: React.ComponentProps<typeof LessonVideoCard>['gating'] } = {}) {
  const renderPlayer = jest.fn(() => React.createElement('i', null, 'player'));
  const real = React.useState;
  const spy = jest.spyOn(React, 'useState');
  const values = opts.played ? [true, 'ready', 0, opts.played.timeline, opts.played.time] : started ? [true] : [];
  for (const v of values) spy.mockImplementationOnce(() => [v, () => {}] as never);
  spy.mockImplementation(real as never);
  try {
    return { html: renderToStaticMarkup(<LessonVideoCard t={t} block={block} renderPlayer={renderPlayer} mediaBase={opts.mediaBase} gating={opts.gating ?? { isPlus: true, trialState: 'active' }} />), renderPlayer };
  } finally {
    spy.mockRestore();
  }
}

describe('LessonVideoCard', () => {
  it('shows only its own poster before the tap, and renders no player', () => {
    for (const block of [youtube, animation]) {
      const { html, renderPlayer } = render(block);
      expect(renderPlayer).not.toHaveBeenCalled();
      expect(html).toContain(`alt="${block.poster}"`);
      expect(html).toContain(es['media.video.play']);
      expect(html).toContain(t(block.caption));
    }
  });

  it('labels a YouTube block "Se reproduce desde YouTube" and offers "Abrir vídeo" once started', () => {
    expect(render(youtube).html).toContain(es['media.video.source']);
    const { html, renderPlayer } = render(youtube, true);
    expect(renderPlayer).toHaveBeenCalledWith(expect.objectContaining({ kind: 'youtube', uri: videoEmbedUrl('WPWbgzAd6C0') }));
    expect(html).toContain(es['media.video.open']);
  });

  it('gives an animation block no YouTube label and no "Abrir vídeo"', () => {
    expect(render(animation).html).not.toContain(es['media.video.source']);
    const { html } = render(animation, true);
    expect(html).not.toContain(es['media.video.source']);
    expect(html).not.toContain(es['media.video.open']);
  });

  it('shows the themed placeholder with retry when no clip address can be built (no media base in tests)', () => {
    const { html, renderPlayer } = render(animation, true);
    expect(renderPlayer).not.toHaveBeenCalled();
    expect(html).toContain(es['media.unavailable']);
    expect(html).toContain(es['media.video.retry']);
  });
});

describe('LessonVideoCard subtitles', () => {
  const realFetch = global.fetch;
  afterEach(() => {
    global.fetch = realFetch;
  });

  it('fetches the timeline only on the play tap', () => {
    const get = jest.fn(() => new Promise(() => {}));
    global.fetch = get as never;
    render(marking, false, { mediaBase: base });
    expect(get).not.toHaveBeenCalled();
    presses.get(es['media.video.play'])!();
    expect(get).toHaveBeenCalledWith(`${base}/animations/marking-rewarding.json`);
  });

  it('never fetches a timeline for a YouTube block', () => {
    const get = jest.fn();
    global.fetch = get as never;
    render(youtube, false, { mediaBase: base });
    presses.get(es['media.video.play'])!();
    expect(get).not.toHaveBeenCalled();
  });

  it('passes the player an onTime callback', () => {
    const { renderPlayer } = render(marking, true, { mediaBase: base });
    expect(renderPlayer).toHaveBeenCalledWith(expect.objectContaining({ kind: 'animation', onTime: expect.any(Function) }));
  });

  it('shows the Line while the playback time is inside its range, and hides it outside', () => {
    const shown = (time: number) => render(marking, true, { mediaBase: base, played: { timeline, time } }).html.includes(`>${es['lesson.4.animation.line.bien']}<`);
    expect([3.1, 3.2, 4.3, 4.4, 7.9, 0.1, 3.5].map(shown)).toEqual([false, true, true, false, false, false, true]);
    expect(subtitleAt(t, marking.caption, timeline, 3.5)).toBe('bien');
  });

  it('plays with no subtitle when the timeline could not be loaded', async () => {
    expect(await loadAnimationTimeline(`${base}/animations/x.json`, t, marking.caption, (() => Promise.reject(new Error('offline'))) as never)).toBeNull();
    expect(await loadAnimationTimeline(`${base}/animations/x.json`, t, marking.caption, (() => Promise.resolve({ ok: false, text: async () => '' })) as never)).toBeNull();
    expect(await loadAnimationTimeline(`${base}/animations/x.json`, t, marking.caption, (() => Promise.resolve({ ok: true, text: async () => '{"version":9}' })) as never)).toBeNull();
    const { html, renderPlayer } = render(marking, true, { mediaBase: base, played: { timeline: null, time: 3.5 } });
    expect(renderPlayer).toHaveBeenCalled();
    expect(html).not.toContain(`>${es['lesson.4.animation.line.bien']}<`);
  });

  it('reads a fetched timeline, dropping Lines with no catalog text', async () => {
    const json = JSON.stringify({ version: 1, duration: 8, beats: [], lines: [{ id: 'hola', start: 1, end: 2 }, { id: 'bien', start: 3.2, end: 4.4, voice: 'marker' }] });
    const tl = await loadAnimationTimeline(`${base}/animations/x.json`, t, marking.caption, (() => Promise.resolve({ ok: true, text: async () => json })) as never);
    expect(tl?.lines.map((l) => l.id)).toEqual(['bien']);
  });
});

describe('LessonVideoCard Plus gating', () => {
  it('locks a free user out with "Desbloquear con 7 días gratis" before the trial, and the button unlocks', () => {
    for (const block of [youtube, animation]) {
      const onUnlock = jest.fn();
      presses.clear();
      const { html, renderPlayer } = render(block, false, { gating: { isPlus: false, trialState: 'unstarted', onUnlock } });
      expect(html).toContain(es['media.video.unlockTrial']);
      expect(html).toContain(es['media.video.locked']);
      expect(html).not.toContain(es['media.video.unlockedPlus']);
      expect(html).not.toContain(es['media.video.play']);
      expect(renderPlayer).not.toHaveBeenCalled();
      presses.get(es['media.video.unlockTrial'])!();
      expect(onUnlock).toHaveBeenCalled();
    }
  });

  it('offers "Desbloquear con Plus" once the trial has expired', () => {
    const { html } = render(youtube, false, { gating: { isPlus: false, trialState: 'expired', onUnlock: () => {} } });
    expect(html).toContain(es['media.video.unlockPlus']);
    expect(html).not.toContain(es['media.video.unlockedPlus']);
  });

  it('never renders the player for a free user, even with a held play action', () => {
    const { renderPlayer } = render(youtube, true, { gating: { isPlus: false, trialState: 'expired', autoPlay: true } });
    expect(renderPlayer).not.toHaveBeenCalled();
  });

  it('shows a Plus user the "Desbloqueado con Plus" badge and the play control', () => {
    const { html } = render(youtube);
    expect(html).toContain(es['media.video.unlockedPlus']);
    expect(html).toContain(es['media.video.play']);
    expect(html).not.toContain(es['media.video.unlockTrial']);
  });

  it('starts the player at once for a Plus user with a held play action', () => {
    const { renderPlayer } = render(youtube, false, { gating: { isPlus: true, trialState: 'active', autoPlay: true } });
    expect(renderPlayer).toHaveBeenCalledWith(expect.objectContaining({ kind: 'youtube' }));
  });
});
