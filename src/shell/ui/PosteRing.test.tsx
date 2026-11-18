// eslint-disable-next-line @typescript-eslint/no-require-imports
const { renderToStaticMarkup } = require('react-dom/server') as { renderToStaticMarkup: (el: unknown) => string };

jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (name: string) => (props: any) => React.createElement(name, { ...props, children: props.children });
  return { __esModule: true, default: el('svg'), Ellipse: el('ellipse'), Path: el('path'), Circle: el('circle') };
});
jest.mock('./theme', () => ({ lightColor: { ink: '#1', accent: '#2', surfaceSunken: '#3' } }));

import { PosteRing } from './PosteRing';

const html = (props: object) => renderToStaticMarkup(<PosteRing ring={{ progress: 0, phase: 'open', snap: false }} reducedMotion={false} {...props} />);

describe('PosteRing', () => {
  it('draws a stroked ring while closing and a solid disc once landed', () => {
    expect(html({ ring: { progress: 0.5, phase: 'closing', snap: false } })).toContain('<path');
    const landed = html({ ring: { progress: 1, phase: 'landed', snap: false } });
    expect(landed).toContain('<ellipse');
    expect(landed).not.toContain('<path');
  });

  it('adds a ghost ring on a snap, and a fill-ring with reduced motion', () => {
    const snap = html({ ring: { progress: 0, phase: 'open', snap: true }, snapAge: 0.05, snapFromProgress: 0.7 });
    expect((snap.match(/<ellipse/g) ?? []).length).toBeGreaterThanOrEqual(2);
    const rm = html({ ring: { progress: 0.4, phase: 'closing', snap: false }, reducedMotion: true });
    expect(rm).toContain('<ellipse'); // the empty track
    expect(rm).toContain('<path');
  });
});
