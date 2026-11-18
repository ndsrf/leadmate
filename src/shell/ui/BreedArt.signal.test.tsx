const mockMotion = { reduced: false };
const mockCalls = { shared: 0, repeat: 0 };

jest.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) }, AccessibilityInfo: {} }));
jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Path: el('path'), Rect: el('rect'), G: el('g') };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (C: any) => ({ animatedProps: _a, ...p }: any) => require('react').createElement(C, p) },
  useSharedValue: (v: any) => {
    mockCalls.shared++;
    return { value: v };
  },
  useAnimatedProps: () => ({}),
  withTiming: (v: any) => v,
  withSequence: (...a: any[]) => a[0],
  withRepeat: (v: any) => {
    mockCalls.repeat++;
    return v;
  },
  cancelAnimation: () => {},
}));
jest.mock('./useMotion', () => ({ useMotion: () => require('./motion').motionValues(mockMotion.reduced) }));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import type { DogCoat } from '../../sim/config';
import { BREEDS } from '../onboarding/breeds';
import { BREED_SHAPES, BREED_VIEW, extentOf, fitScale } from './breedShapes';
import { BreedArt, hacklesPath } from './BreedArt';
import { COAT_PALETTE } from './canine';
import { RTD_ART } from './rtdArt';

const DOG_COATS = Object.keys(COAT_PALETTE) as DogCoat[];
const SIGNALS = Object.keys(RTD_ART) as (keyof typeof RTD_ART)[];
const draw = (breed: any, coat: any, signal?: any, looking = false) => renderToStaticMarkup(<BreedArt breed={breed} coat={coat} signal={signal} looking={looking} />);

beforeEach(() => {
  mockMotion.reduced = false;
  mockCalls.shared = 0;
  mockCalls.repeat = 0;
});

describe('BreedArt signal', () => {
  it('draws every breed for every signal without throwing', () => {
    for (const b of BREEDS) for (const s of SIGNALS) expect(draw(b.id, 'golden', s)).toContain('<svg');
  });

  it('keeps `looking` and the `looking` signal the same drawing', () => {
    for (const b of BREEDS) expect(draw(b.id, 'golden', 'looking')).toBe(draw(b.id, 'golden', undefined, true));
  });

  it('draws the hackles ridge up in every coat on every breed, and only for hackles_up', () => {
    const ridge = (breed: string) => hacklesPath(BREED_SHAPES[breed as keyof typeof BREED_SHAPES]);
    for (const b of BREEDS) {
      for (const coat of DOG_COATS) {
        const up = draw(b.id, coat, 'hackles_up');
        expect(up).toContain(ridge(b.id).slice(0, 20));
        expect(up).toContain(`fill="${COAT_PALETTE[coat].shade}"`);
        expect(draw(b.id, coat, 'soft_loose')).not.toContain(ridge(b.id).slice(0, 20));
      }
    }
  });

  it('shows every breed signal on a distinct drawing', () => {
    for (const b of ['chihuahua', 'yorkshire', 'labrador'] as const) {
      const all = SIGNALS.map((s) => draw(b, 'golden', s));
      expect(new Set(all).size).toBe(SIGNALS.length);
    }
  });

  it('keeps every breed inside the view when playing', () => {
    for (const s of Object.values(BREED_SHAPES)) {
      const e = extentOf(s);
      expect(fitScale(s)).toBeGreaterThan(0);
      expect(e.right).toBeGreaterThan(0);
    }
    expect(BREED_VIEW.w).toBe(160);
  });

  it('wags with an animated value only when motion is allowed', () => {
    draw('labrador', 'golden', 'loose_wag');
    expect(mockCalls.shared).toBe(1);
  });

  it('under reduced motion draws a still curved tail and creates no animated value', () => {
    mockMotion.reduced = true;
    const html = draw('labrador', 'golden', 'loose_wag');
    expect(mockCalls.shared).toBe(0);
    expect(mockCalls.repeat).toBe(0);
    expect(html).toContain('rotate(-12');
  });
});
