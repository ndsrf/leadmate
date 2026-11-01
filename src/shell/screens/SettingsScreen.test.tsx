const pressed: Record<string, () => void> = {};

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string => (Array.isArray(children) ? children.map(text).join('') : typeof children === 'string' ? children : children?.props ? text(children.props.children) : '');
  return {
    View: (props: any) => React.createElement('div', null, props.children),
    Text: (props: any) => React.createElement('span', null, props.children),
    TextInput: () => null,
    ScrollView: (props: any) => React.createElement('div', props, props.children),
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
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
  };
});

jest.mock('react-native-svg', () => ({ __esModule: true, default: () => null, Svg: () => null, Circle: () => null, Path: () => null, Rect: () => null }));
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('expo-audio', () => ({ RecordingPresets: {}, requestRecordingPermissionsAsync: jest.fn(), useAudioRecorder: jest.fn() }));
jest.mock('../audio', () => ({}));

import React from 'react';
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { DEFAULT_UI_SETTINGS } from '../ui/uiSettings';
import { newDogRecord, type DogRecord } from '../dogRecord';
import { NEW_SYNC_STATE } from '../sync/state';
import type { Account } from '../sync/useAccount';
import { AppearanceSection, CHECKPOINT_OPTIONS, SettingsScreen } from './SettingsScreen';

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

describe('Settings: Checkpoint timer', () => {
  const t = createTranslator(es);

  it('defines CHECKPOINT_OPTIONS in order: 20s, 15s, 10s, Sin límite', () => {
    expect(CHECKPOINT_OPTIONS).toEqual([
      { value: 20, key: 'settings.checkpoint.20' },
      { value: 15, key: 'settings.checkpoint.15' },
      { value: 10, key: 'settings.checkpoint.10' },
      { value: 0, key: 'settings.checkpoint.off' },
    ]);
  });

  it('lists options in Settings UI and updates record.checkpointSeconds on select', () => {
    let record = newDogRecord();
    const update = jest.fn((fn: (r: DogRecord) => DogRecord) => {
      record = fn(record);
    });
    const account: Account = {
      configured: false,
      signedIn: false,
      auth: null,
      sync: { ...NEW_SYNC_STATE },
      choice: null,
      chooseDog: jest.fn(),
      backup: null,
      restoreBackup: jest.fn(),
      configs: {},
      remind: false,
      markReminded: jest.fn(),
      countStage: jest.fn(),
      forgetAccount: jest.fn(),
      resetSync: jest.fn(),
    };

    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={record}
        update={update}
        onClose={() => {}}
        account={account}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
        billingService={{ restorePurchases: jest.fn() } as any}
      />,
    );

    expect(html).toContain(es['settings.checkpoint']);
    expect(html).toContain(es['settings.checkpoint.20']);
    expect(html).toContain(es['settings.checkpoint.15']);
    expect(html).toContain(es['settings.checkpoint.10']);
    expect(html).toContain(es['settings.checkpoint.off']);

    // Initially default is 15
    expect(record.checkpointSeconds).toBe(15);

    // Select 20s
    pressed[es['settings.checkpoint.20']]();
    expect(record.checkpointSeconds).toBe(20);

    // Select 10s
    pressed[es['settings.checkpoint.10']]();
    expect(record.checkpointSeconds).toBe(10);

    // Select Sin límite (0s)
    pressed[es['settings.checkpoint.off']]();
    expect(record.checkpointSeconds).toBe(0);

    // Select 15s
    pressed[es['settings.checkpoint.15']]();
    expect(record.checkpointSeconds).toBe(15);
  });
});
