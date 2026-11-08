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
    TextInput: () => null,
    ScrollView: (props: any) => React.createElement('div', props, props.children),
    TouchableOpacity: (props: any) => {
      pressed[props.testID ?? text(props.children)] = props.onPress;
      return React.createElement('button', { 'data-testid': props.testID, onClick: props.onPress }, props.children);
    },
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      pressed[props.testID ?? text(body)] = props.onPress;
      return React.createElement(
        'button',
        { 'data-testid': props.testID, 'aria-pressed': props.accessibilityState?.selected, onClick: props.onPress },
        body
      );
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

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.2.3', ios: { buildNumber: '42' } },
}));

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

jest.mock('react-native-svg', () => ({
  __esModule: true,
  default: () => null,
  Svg: () => null,
  Circle: () => null,
  Path: () => null,
  Rect: () => null,
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: (p: any) => p.children,
  SafeAreaView: (p: any) => p.children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-audio', () => ({
  RecordingPresets: {},
  requestRecordingPermissionsAsync: jest.fn(),
  useAudioRecorder: jest.fn(),
}));

jest.mock('../audio', () => ({}));

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { createTranslator, es } from '../../i18n';
import { DEFAULT_UI_SETTINGS } from '../ui/uiSettings';
import { newDogRecord } from '../dogRecord';
import { NEW_SYNC_STATE } from '../sync/state';
import type { Account } from '../sync/useAccount';
import { SettingsScreen } from './SettingsScreen';
import { BetaContentBadge } from '../ui/BetaContentBadge';
import { setActiveContent } from '../content/runtime';
import { BASELINE_PACK } from '../content/baseline.generated';
import { resolvePack } from '../content/resolver';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

const fakeAccount = {
  configured: true,
  signedIn: false,
  auth: null,
  sync: { ...NEW_SYNC_STATE, dogId: null },
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
} as unknown as Account;

describe('Settings content channel control & beta indicator (Task 5.3)', () => {
  const t = createTranslator(es);

  it('Locked state in production: displays version label, hides channel control', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          t={t}
          language="es"
          record={newDogRecord()}
          update={() => {}}
          onClose={() => {}}
          account={fakeAccount}
          onLogIn={() => {}}
          ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
          onReset={() => {}}
          isDev={false}
          initialTab="account"
        />
      );
    });

    const root = renderer!.root;

    // Version label is shown
    const versionLabels = root.findAllByProps({ testID: 'settings-version-label' });
    expect(versionLabels.length).toBe(1);

    // Channel control is hidden
    const channelChoices = root.findAllByProps({ testID: 'channel-choice-beta' });
    expect(channelChoices.length).toBe(0);
  });

  it('Seven-tap unlock in production reveals channel control and Hide button', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          t={t}
          language="es"
          record={newDogRecord()}
          update={() => {}}
          onClose={() => {}}
          account={fakeAccount}
          onLogIn={() => {}}
          ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
          onReset={() => {}}
          isDev={false}
          initialTab="account"
        />
      );
    });

    const root = renderer!.root;
    const versionLabel = root.findByProps({ testID: 'settings-version-label' });

    // Tap 7 times
    for (let i = 0; i < 7; i++) {
      await act(async () => {
        versionLabel.props.onPress();
      });
    }

    // Now channel control is visible!
    const betaChoice = root.findAllByProps({ testID: 'channel-choice-beta' });
    expect(betaChoice.length).toBeGreaterThan(0);

    // Since channel is stable, Hide button is also available
    const hideButtons = root.findAllByProps({ testID: 'channel-hide-button' });
    expect(hideButtons.length).toBeGreaterThan(0);

    // Tap Hide button to lock again
    await act(async () => {
      hideButtons[0].props.onPress();
      await Promise.resolve();
    });

    // Control is hidden again
    expect(root.findAllByProps({ testID: 'channel-choice-beta' }).length).toBe(0);
  });

  it('Development state (isDev = true): channel control is always shown without unlock', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <SettingsScreen
          t={t}
          language="es"
          record={newDogRecord()}
          update={() => {}}
          onClose={() => {}}
          account={fakeAccount}
          onLogIn={() => {}}
          ui={{ settings: DEFAULT_UI_SETTINGS, change: () => {} }}
          onReset={() => {}}
          isDev={true}
          initialTab="account"
        />
      );
      await Promise.resolve();
    });

    const root = renderer!.root;
    // Always visible in dev
    expect(root.findAllByProps({ testID: 'channel-choice-beta' }).length).toBeGreaterThan(0);
    expect(root.findAllByProps({ testID: 'channel-choice-stable' }).length).toBeGreaterThan(0);
  });

  it('BetaContentBadge shows indicator on beta channel and hides on stable', async () => {
    const { View } = require('react-native');
    // 1. Stable channel
    setActiveContent({
      channel: 'stable',
      isBaseline: true,
      contentVersion: 1,
      pack: BASELINE_PACK,
      resolved: resolvePack(BASELINE_PACK, 'es'),
    });

    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <View>
          <BetaContentBadge t={t} />
        </View>
      );
    });
    expect(renderer!.root.findAllByProps({ testID: 'beta-content-indicator' }).length).toBe(0);

    // 2. Beta channel
    setActiveContent({
      channel: 'beta',
      isBaseline: false,
      contentVersion: 1,
      pack: BASELINE_PACK,
      resolved: resolvePack(BASELINE_PACK, 'es'),
    });

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <View>
          <BetaContentBadge t={t} />
        </View>
      );
    });
    expect(renderer!.root.findAllByProps({ testID: 'beta-content-indicator' }).length).toBeGreaterThan(0);
  });
});
