const pressed: Record<string, () => void> = {};

jest.mock('react-native', () => {
  const React = require('react');
  const text = (children: any): string => (Array.isArray(children) ? children.map(text).join('') : typeof children === 'string' ? children : children?.props ? text(children.props.children) : '');
  return {
    View: (props: any) => React.createElement('div', null, props.children),
    Text: (props: any) => React.createElement('span', null, props.children),
    TextInput: () => null,
    ScrollView: ({ children }: any) => React.createElement('div', null, children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      pressed[text(body)] = props.onPress;
      return React.createElement('button', { 'aria-pressed': props.accessibilityState?.selected, role: props.accessibilityRole }, body);
    },
    Modal: () => null,
    AccessibilityInfo: {
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
      announceForAccessibility: jest.fn(),
    },
    Platform: { OS: 'web' },
  };
});

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

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
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createTranslator, es } from '../../i18n';
import { DEFAULT_UI_SETTINGS } from '../ui/uiSettings';
import { newDogRecord, type DogRecord } from '../dogRecord';
import { NEW_SYNC_STATE } from '../sync/state';
import type { Account } from '../sync/useAccount';
import { AppearanceSection, CHECKPOINT_OPTIONS, SETTINGS_TABS, SettingsScreen } from './SettingsScreen';

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

function makeAccount(): Account {
  return {
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
}

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

    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={record}
        update={update}
        onClose={() => {}}
        account={makeAccount()}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
        billingService={{ restorePurchases: jest.fn() } as any}
        initialTab="preferences"
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

describe('Settings: Area tabs navigation and section partitioning', () => {
  const t = createTranslator(es);

  it('renders title, lead line, and all three area tabs with accessibility attributes', () => {
    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={newDogRecord()}
        update={() => {}}
        onClose={() => {}}
        account={makeAccount()}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
      />,
    );

    expect(html).toContain(es['settings.title']);
    expect(html).toContain(es['settings.tab.dog']);
    expect(html).toContain(es['settings.tab.preferences']);
    expect(html).toContain(es['settings.tab.account']);

    // Check tab accessibility roles and selected state for default tab (Perro)
    const tabButtons = html.split('<button').filter((b: string) => b.includes('role="tab"'));
    expect(tabButtons).toHaveLength(3);

    const perroTab = tabButtons.find((b: string) => b.includes(es['settings.tab.dog']));
    expect(perroTab).toContain('aria-pressed="true"');

    const prefTab = tabButtons.find((b: string) => b.includes(es['settings.tab.preferences']));
    expect(prefTab).toContain('aria-pressed="false"');

    const cuentaTab = tabButtons.find((b: string) => b.includes(es['settings.tab.account']));
    expect(cuentaTab).toContain('aria-pressed="false"');
  });

  it('defaults to Perro tab: displays only dog sections and close button', () => {
    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={newDogRecord()}
        update={() => {}}
        onClose={() => {}}
        account={makeAccount()}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
      />,
    );

    // Visible on Perro tab
    expect(html).toContain(es['settings.equipment']);
    expect(html).toContain(es['settings.dogName']);
    expect(html).toContain(es['settings.coat']);
    expect(html).toContain(es['settings.about']);
    expect(html).toContain(es['settings.triggers']);
    expect(html).toContain(es['settings.close']);

    // Hidden from other tabs
    expect(html).not.toContain(es['settings.checkpoint']);
    expect(html).not.toContain(es['settings.feedback']);
    expect(html).not.toContain(es['settings.appearance']);
    expect(html).not.toContain(es['settings.subscription']);
  });

  it('renders Preferencias tab when initialTab is preferences', () => {
    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={newDogRecord()}
        update={() => {}}
        onClose={() => {}}
        account={makeAccount()}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
        initialTab="preferences"
      />,
    );

    // Visible on Preferencias tab
    expect(html).toContain(es['settings.checkpoint']);
    expect(html).toContain(es['settings.feedback']);
    expect(html).toContain(es['settings.appearance']);
    expect(html).toContain(es['settings.voicePack']);
    expect(html).toContain(es['settings.customCue']);
    expect(html).toContain(es['settings.close']);

    // Hidden from Perro and Cuenta tabs
    expect(html).not.toContain(es['settings.equipment']);
    expect(html).not.toContain(es['settings.triggers']);
    expect(html).not.toContain(es['settings.subscription']);

    // Selected state on tab button
    const tabButtons = html.split('<button').filter((b: string) => b.includes('role="tab"'));
    const prefTab = tabButtons.find((b: string) => b.includes(es['settings.tab.preferences']));
    expect(prefTab).toContain('aria-pressed="true"');
  });

  it('renders Cuenta tab when initialTab is account', () => {
    const html = renderToStaticMarkup(
      <SettingsScreen
        t={t}
        language="es"
        record={newDogRecord()}
        update={() => {}}
        onClose={() => {}}
        account={makeAccount()}
        onLogIn={() => {}}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
        onReset={() => {}}
        initialTab="account"
      />,
    );

    // Visible on Cuenta tab
    expect(html).toContain(es['settings.subscription']);
    expect(html).toContain(es['settings.close']);

    // Hidden from other tabs
    expect(html).not.toContain(es['settings.equipment']);
    expect(html).not.toContain(es['settings.checkpoint']);
    expect(html).not.toContain(es['settings.feedback']);

    // Selected state on tab button
    const tabButtons = html.split('<button').filter((b: string) => b.includes('role="tab"'));
    const cuentaTab = tabButtons.find((b: string) => b.includes(es['settings.tab.account']));
    expect(cuentaTab).toContain('aria-pressed="true"');
  });

  it('switches tabs interactively when tab buttons are pressed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          t={t}
          language="es"
          record={newDogRecord()}
          update={() => {}}
          onClose={() => {}}
          account={makeAccount()}
          onLogIn={() => {}}
          ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
          onReset={() => {}}
        />,
      );
    });

    const root = renderer!.root;

    // Check default tab is dog
    const dogTab = root.findByProps({ testID: 'settings-tab-dog' });
    expect(dogTab.props.selected).toBe(true);

    // Press Preferencias tab
    const prefTab = root.findByProps({ testID: 'settings-tab-preferences' });
    await act(async () => {
      prefTab.props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-tab-preferences' }).props.selected).toBe(true);
    expect(root.findByProps({ testID: 'settings-tab-dog' }).props.selected).toBe(false);

    // Press Cuenta tab
    const accountTab = root.findByProps({ testID: 'settings-tab-account' });
    await act(async () => {
      accountTab.props.onPress();
    });

    expect(root.findByProps({ testID: 'settings-tab-account' }).props.selected).toBe(true);
    expect(root.findByProps({ testID: 'settings-tab-preferences' }).props.selected).toBe(false);
  });
});
