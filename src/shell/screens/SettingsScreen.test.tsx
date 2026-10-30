const pressed: Record<string, () => void> = {};

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string => (Array.isArray(children) ? children.map(text).join('') : typeof children === 'string' ? children : children?.props ? text(children.props.children) : '');
  return {
    View: (props: any) => React.createElement('div', null, props.children),
    Text: (props: any) => React.createElement('span', null, props.children),
    TextInput: () => null,
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      pressed[text(body)] = props.onPress;
      return React.createElement('button', { 'aria-pressed': props.accessibilityState?.selected, role: props.accessibilityRole }, body);
    },
    Modal: () => null,
    Platform: { OS: 'web' },
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: { View: (props: any) => React.createElement('div', null, props.children) },
    Easing: { bezier: () => () => 0 },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
  };
});

jest.mock('react-native-svg', () => ({ __esModule: true, default: () => null, Svg: () => null, Circle: () => null, Path: () => null, Rect: () => null }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: (p: any) => p.children, SafeAreaView: (p: any) => p.children }));
jest.mock('expo-audio', () => ({ RecordingPresets: {}, requestRecordingPermissionsAsync: jest.fn(), useAudioRecorder: jest.fn() }));
jest.mock('../audio', () => ({}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { DEFAULT_UI_SETTINGS } from '../ui/uiSettings';
import { AppearanceSection } from './SettingsScreen';

describe('Settings: Appearance', () => {
  const t = createTranslator(es);

  it('offers System, Light and Dark from the catalog, with System chosen by default', () => {
    const html = renderToStaticMarkup(<AppearanceSection t={t} ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }} />);
    expect(html).toContain(es['settings.appearance']);
    expect(html).toContain(es['settings.appearance.help']);
    for (const key of ['settings.appearance.system', 'settings.appearance.light', 'settings.appearance.dark'] as const) expect(html).toContain(es[key]);
    const selected = html.split('<button').filter((b: string) => b.includes('aria-pressed="true"'));
    expect(selected).toHaveLength(1);
    expect(selected[0]).toContain(es['settings.appearance.system']);
  });

  it('picks Dark', () => {
    const change = jest.fn();
    renderToStaticMarkup(<AppearanceSection t={t} ui={{ settings: DEFAULT_UI_SETTINGS, change }} />);
    pressed[es['settings.appearance.dark']]();
    expect(change).toHaveBeenCalledWith({ appearance: 'dark' });
  });
});
