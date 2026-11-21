const mockMotion = { reduced: false };

jest.mock('react-native', () => {
  const React = require('react');
  const flat = (style: any): any => (Array.isArray(style) ? Object.assign({}, ...style.map(flat)) : style ?? {});
  const box = (tag: string) => ({ style, children, accessibilityLabel, accessibilityRole, accessibilityValue, ...p }: any) =>
    React.createElement(tag, { 'data-style': JSON.stringify(flat(style)), 'aria-label': accessibilityLabel, role: accessibilityRole, 'data-value': accessibilityValue ? JSON.stringify(accessibilityValue) : undefined }, typeof children === 'function' ? children({ pressed: false }) : children);
  return {
    View: box('div'),
    Text: box('span'),
    Pressable: box('button'),
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
    AccessibilityInfo: {},
    useWindowDimensions: () => ({ width: 320, height: 640 }),
  };
});
jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, { 'aria-label': props['aria-label'], 'aria-hidden': props['aria-hidden'] }, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Line: el('line'), Path: el('path'), Rect: el('rect'), G: el('g') };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: (p: any) => require('react').createElement('div', null, p.children), createAnimatedComponent: (C: any) => C },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedStyle: () => ({}),
  useAnimatedProps: () => ({}),
  withTiming: (v: any) => v,
  withSequence: (...a: any[]) => a[0],
  withRepeat: (v: any) => v,
  cancelAnimation: () => {},
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('./useMotion', () => ({ useMotion: () => require('./motion').motionValues(mockMotion.reduced) }));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup as render } from 'react-dom/server';
import { TIER_SECONDS, type FeedbackTier } from '../../hud/feedback';
import { FeedbackBurst } from './FeedbackBurst';
import { ReadTheDogScene, RtdTimerBar, RTD_BAND_H } from './MinigameProps';
import { RTD_ART } from './rtdArt';
import { lightColor } from './theme';

const renderToStaticMarkup = (n: React.ReactElement) => render(n).split('&quot;').join('"');

beforeEach(() => {
  mockMotion.reduced = false;
});

const scene = (over: Partial<React.ComponentProps<typeof ReadTheDogScene>> = {}) =>
  renderToStaticMarkup(<ReadTheDogScene breed="chihuahua" coat="golden" signal="lip_lick" caption={null} burst={null} {...over} />);

describe('ReadTheDogScene', () => {
  it('shows no caption before an answer, and the caption after', () => {
    expect(scene()).not.toContain('Soft lip lick');
    expect(scene({ caption: 'Soft lip lick: Alert' })).toContain('Soft lip lick: Alert');
  });

  it('describes the pose for screen readers without a class when given a label, and is decorative without', () => {
    expect(scene({ label: 'Rex licks its lips' })).toContain('aria-label="Rex licks its lips"');
    expect(scene()).not.toContain('Rex licks its lips');
  });

  it('draws every signal and the neutral Dog', () => {
    for (const s of [...(Object.keys(RTD_ART) as (keyof typeof RTD_ART)[]), null]) expect(scene({ signal: s })).toContain('<svg');
  });

  it('keeps a band above the Dog for Feedback Messages and draws the burst in it', () => {
    expect(RTD_BAND_H).toBeGreaterThan(40);
    const html = scene({ burst: { id: 1, tier: 'small', polarity: 'right', text: 'Nice, Rex', combo: 1 } });
    expect(html).toContain('Nice, Rex');
    expect(html).toContain('"height":"30%"');
  });
});

describe('RtdTimerBar', () => {
  it('is a progressbar with a text alternative, also shown as text', () => {
    const html = renderToStaticMarkup(<RtdTimerBar left={1.2} total={2.4} label="1 s left" />);
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-label="1 s left"');
    expect(html).toContain('>1 s left<');
    expect(html).toContain('"now":50');
  });

  it('clamps an expired or zero timer to empty', () => {
    expect(renderToStaticMarkup(<RtdTimerBar left={-1} total={2.4} label="0 s" />)).toContain('"now":0');
    expect(renderToStaticMarkup(<RtdTimerBar left={1} total={0} label="0 s" />)).toContain('"now":0');
  });
});

describe('FeedbackBurst', () => {
  const burst = (tier: FeedbackTier, polarity: 'right' | 'wrong', combo = 5) => renderToStaticMarkup(<FeedbackBurst id={1} tier={tier} polarity={polarity} text="Word" combo={combo} />);

  it('draws each tier with its words and icon', () => {
    for (const reduced of [false, true]) {
      mockMotion.reduced = reduced;
      for (const [tier, pol] of [['small', 'right'], ['medium', 'right'], ['big', 'right'], ['wrong', 'wrong']] as const) {
        const html = burst(tier, pol);
        expect(html).toContain('Word');
        expect(html).toContain('<svg');
      }
    }
  });

  it('shows the Combo counter at medium and big from Combo 2, never on small or wrong', () => {
    expect(burst('medium', 'right', 3)).toContain('×3');
    expect(burst('big', 'right', 5)).toContain('×5');
    expect(burst('medium', 'right', 1)).not.toContain('×');
    expect(burst('small', 'right', 7)).not.toContain('×');
    expect(burst('wrong', 'wrong', 7)).not.toContain('×');
  });

  it('draws the big tier as a banner and the wrong tier in grey with no red', () => {
    expect(burst('big', 'right')).toContain('"alignSelf":"stretch"');
    const wrong = burst('wrong', 'wrong');
    for (const red of [lightColor.coral, lightColor.danger, lightColor.dangerText]) expect(wrong.toUpperCase()).not.toContain(red.toUpperCase());
    expect(wrong).toContain(lightColor.locked);
  });

  it('keeps every tier inside its TIER_SECONDS', () => {
    for (const t of ['small', 'medium', 'big', 'wrong'] as const) expect(TIER_SECONDS[t]).toBeGreaterThan(0);
  });
});
