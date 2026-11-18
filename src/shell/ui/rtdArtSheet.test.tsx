// Writes a contact sheet of every Body Signal on chosen breeds and coats as one HTML file, for the visual checks of
// add-read-the-dog-game 3.4 and for the Claude Design boards. It does nothing unless RTD_SHEET is set to the output path:
//   RTD_SHEET=/tmp/sheet.html npx jest rtdArtSheet   (scripts/shot-rtd-art.mjs does this, then screenshots it at 320 points)
import { writeFileSync } from 'fs';

jest.mock('react-native', () => ({ AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) }, AccessibilityInfo: {} }));
jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (tag: string) => (props: any) => React.createElement(tag, props, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Circle: el('circle'), Ellipse: el('ellipse'), Path: el('path'), Rect: el('rect'), G: el('g') };
});
jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { createAnimatedComponent: (C: any) => ({ animatedProps: _a, ...p }: any) => require('react').createElement(C, p) },
  useSharedValue: (v: any) => ({ value: v }),
  useAnimatedProps: () => ({}),
  withTiming: (v: any) => v,
  withSequence: (...a: any[]) => a[0],
  withRepeat: (v: any) => v,
  cancelAnimation: () => {},
}));
jest.mock('./useMotion', () => ({ useMotion: () => require('./motion').motionValues(true) }));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import type { DogCoat } from '../../sim/config';
import type { BreedId } from '../onboarding/breeds';
import { BreedArt } from './BreedArt';
import { RTD_ART } from './rtdArt';
import { lightColor } from './theme';

const out = process.env.RTD_SHEET;
const BREEDS = (process.env.RTD_BREEDS ?? 'chihuahua,yorkshire,labrador').split(',') as BreedId[];
const COATS = (process.env.RTD_COATS ?? 'golden,black').split(',') as DogCoat[];
const NAMES: Record<string, string> = { soft_loose: 'soft and loose', play_bow: 'play bow', loose_wag: 'loose wag', ears_up_still: 'ears up, still', lip_lick: 'lip lick', whale_eye: 'whale eye', freeze_stare: 'freeze and stare', hackles_up: 'hackles up', stiff_closed_mouth: 'stiff closed mouth' };

(out ? describe : describe.skip)('rtd art sheet', () => {
  it('writes the sheet', () => {
    const cells = BREEDS.flatMap((breed) =>
      COATS.map((coat) => {
        const dogs = (Object.keys(RTD_ART) as (keyof typeof RTD_ART)[])
          .map((s) => `<figure><div class="scene">${renderToStaticMarkup(<BreedArt breed={breed} coat={coat} width={190} signal={s} />)}</div><figcaption>${NAMES[s]}</figcaption></figure>`)
          .join('');
        return `<section><h2>${breed} · ${coat}</h2><div class="grid">${dogs}</div></section>`;
      }),
    ).join('');
    const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:12px;background:${lightColor.bg};color:${lightColor.ink};font:13px system-ui}h2{margin:14px 0 6px;font-size:15px}
.grid{display:grid;grid-template-columns:repeat(3,320px);gap:10px}figure{margin:0}
.scene{width:320px;height:190px;position:relative;background:linear-gradient(${lightColor.sky} 0 62%,${lightColor.brand} 62% 100%);border:2.5px solid ${lightColor.ink};border-radius:20px;overflow:hidden;box-sizing:border-box;display:flex;justify-content:center;align-items:flex-end}
.scene svg{margin-bottom:10px}figcaption{text-align:center;margin-top:3px}</style>${cells}`;
    writeFileSync(out as string, html);
    expect(html).toContain('<svg');
  });
});
