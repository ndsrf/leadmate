import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createTranslator, en, es } from '../i18n';
import { EncounterResultOverlay, HintOverlay, SeriesProgressStrip, WalkCountdown } from './Overlays';

jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 40, bottom: 20, left: 0, right: 0 }) }));
jest.mock('react-native-svg', () => {
  const React = require('react');
  const el = (name: string) => (props: any) => React.createElement(name, props, props.children);
  return { __esModule: true, default: el('svg'), Svg: el('svg'), Path: el('path'), Rect: el('rect'), Circle: el('circle') };
});
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return { __esModule: true, default: { View: (props: any) => React.createElement('div', props, props.children) }, useSharedValue: (v: any) => ({ value: v }), useAnimatedStyle: () => ({}), withTiming: (v: any) => v, withRepeat: (v: any) => v, withSequence: (v: any) => v, cancelAnimation: () => {}, Easing: { out: (f: any) => f, inOut: (f: any) => f, quad: 0, ease: 0, bezier: () => 0 } };
});
jest.mock('react-native', () => {
  const React = require('react');
  const host = (name: string) => (props: any) => React.createElement(name, props, props.children);
  return {
    View: host('div'),
    Text: host('span'),
    Pressable: (props: any) => {
      const { style, ...rest } = props;
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      return React.createElement('button', { ...rest, style: typeof style === 'function' ? style({ pressed: false }) : style }, body);
    },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    Platform: { OS: 'web', select: (o: any) => o.web ?? o.default },
    AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false), addEventListener: () => ({ remove: () => {} }) },
    StyleSheet: { create: (s: any) => s, flatten: (s: any) => s, hairlineWidth: 1 },
    AppState: { currentState: 'active', addEventListener: () => ({ remove: () => {} }) },
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
const t = createTranslator({});

function render(el: React.ReactElement) {
  let r!: ReactTestRenderer.ReactTestRenderer;
  act(() => {
    r = ReactTestRenderer.create(el);
  });
  return r;
}
const byId = (r: ReactTestRenderer.ReactTestRenderer, id: string) => r.root.findAll((n) => n.props.testID === id && typeof n.type === 'string');
const text = (r: ReactTestRenderer.ReactTestRenderer) => JSON.stringify(r.toJSON());

describe('EncounterResultOverlay', () => {
  it.each([1, 2, 3] as const)('shows %i earned Paws out of three and the hint', (paws) => {
    const r = render(<EncounterResultOverlay t={t} title="Poste y marca" paws={paws} hint="Marca justo cuando afloje." onRetry={() => {}} onNext={() => {}} />);
    const earned = r.root.findAll((n) => n.type === 'svg' && n.props['data-earned'] === 'true');
    const all = r.root.findAll((n) => n.type === 'svg' && n.props['data-earned'] !== undefined);
    expect(all).toHaveLength(3);
    expect(earned).toHaveLength(paws);
    expect(text(r)).toContain(`${paws} de 3 huellas`);
    expect(text(r)).toContain('Poste y marca');
    if (paws === 3) {
      expect(text(r)).toContain(es['encounter.perfect']);
      expect(text(r)).not.toContain('Marca justo cuando afloje.');
    } else expect(text(r)).toContain('Marca justo cuando afloje.');
  });

  it('fires Retry and Next, and Next is enabled at 1 Paw', () => {
    const onRetry = jest.fn();
    const onNext = jest.fn();
    const r = render(<EncounterResultOverlay t={t} title="x" paws={1} hint="h" onRetry={onRetry} onNext={onNext} />);
    const next = byId(r, 'encounter-next')[0];
    expect(next.props.disabled).toBeFalsy();
    act(() => next.props.onPress());
    act(() => byId(r, 'encounter-retry')[0].props.onPress());
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe('SeriesProgressStrip', () => {
  it('says which Encounter it is on and shows the kept Paws and pending dots', () => {
    const r = render(<SeriesProgressStrip t={t} index={3} total={4} kept={[3, 1]} />);
    expect(text(r)).toContain('Encuentro 3 de 4');
    expect(byId(r, 'series-kept')).toHaveLength(2);
    expect(byId(r, 'series-pending')).toHaveLength(2);
  });
});

describe('WalkCountdown', () => {
  it.each([
    ['Spanish', es, '40 s', 'Tiempo restante: 40 s'],
    ['English', en, '40 s', 'Time left: 40 s'],
  ] as const)('shows the seconds left in %s and says what they are', (_name, catalog, shown, spoken) => {
    const r = render(<WalkCountdown t={createTranslator(catalog)} secondsLeft={40} />);
    const pill = byId(r, 'walk-countdown')[0];
    expect(pill.props.accessibilityLabel).toBe(spoken);
    expect(r.root.findByType('span' as any).props.children).toBe(shown);
  });

  it('sits in the top row below the safe-area inset, right of the back button', () => {
    const r = render(<WalkCountdown t={t} secondsLeft={7} />);
    expect(byId(r, 'walk-countdown')[0].props.style).toMatchObject({ top: 40, left: 66, minHeight: 44 });
  });
});

describe('HintOverlay', () => {
  it('starts below the Stage top row on a device with a tall top inset', () => {
    const r = render(<HintOverlay text="x" />);
    expect(JSON.stringify(r.toJSON())).toContain('"top":92');
  });
});
