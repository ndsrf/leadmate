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
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const t = text(body);
      if (t && props.onPress) pressed[t] = props.onPress;
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
    FadeIn: { duration: () => ({}) },
    FadeInDown: { duration: () => ({}) },
    useSharedValue: (v: any) => ({ value: v }),
    useAnimatedStyle: () => ({}),
    withTiming: (v: any) => v,
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
// @ts-ignore
import { renderToStaticMarkup } from 'react-dom/server';
import { createTranslator, es } from '../../i18n';
import { newDogRecord } from '../dogRecord';
import { DEFAULT_UI_SETTINGS } from '../ui/uiSettings';
import { MockBillingService } from '../billing';
import { SettingsModal } from './SettingsModal';
import { AccountSection } from './AccountScreens';
import { NEW_SYNC_STATE } from '../sync/state';

describe('SettingsModal', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    for (const k of Object.keys(pressed)) delete pressed[k];
  });

  const fakeAccount = (signedIn = false, authApi: any = null) => ({
    configured: true,
    signedIn,
    auth: authApi,
    sync: NEW_SYNC_STATE,
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
  });

  it('displays free subscription status for non-plus user and supports restore action', async () => {
    const record = newDogRecord();
    const mockBilling = new MockBillingService();
    const restoreSpy = jest.spyOn(mockBilling, 'restorePurchases');

    const markup = renderToStaticMarkup(
      <SettingsModal
        t={t}
        language="es"
        record={record}
        update={jest.fn()}
        onClose={jest.fn()}
        account={fakeAccount()}
        onLogIn={jest.fn()}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: jest.fn() }}
        onReset={jest.fn()}
        billingService={mockBilling}
      />
    );

    expect(markup).toContain('Suscripción LeadMate Plus');
    expect(markup).toContain('Estado de la suscripción');
    expect(markup).toContain('Versión gratuita');
    expect(markup).toContain('Restaurar compras');

    await pressed['Restaurar compras']?.();
    expect(restoreSpy).toHaveBeenCalled();
  });

  it('displays active subscription status for plus user', () => {
    const record = newDogRecord();
    record.onboarding.mockSubscribed = true;
    const mockBilling = new MockBillingService();

    const markup = renderToStaticMarkup(
      <SettingsModal
        t={t}
        language="es"
        record={record}
        update={jest.fn()}
        onClose={jest.fn()}
        account={fakeAccount()}
        onLogIn={jest.fn()}
        ui={{ settings: DEFAULT_UI_SETTINGS, change: jest.fn() }}
        onReset={jest.fn()}
        billingService={mockBilling}
      />
    );

    expect(markup).toContain('LeadMate Plus activo');
  });

  it('displays subscription cancellation advisory when account deletion is initiated', () => {
    const mockAuth = {
      deleteAccount: jest.fn(),
      signOut: jest.fn(),
    };
    const account = fakeAccount(true, mockAuth);

    const initialMarkup = renderToStaticMarkup(
      <AccountSection
        t={t}
        account={account}
        onLogIn={jest.fn()}
        onForget={jest.fn()}
      />
    );

    expect(initialMarkup).toContain('Eliminar cuenta');
    expect(initialMarkup).not.toContain('Nota importante: Eliminar tu cuenta no cancela tu suscripción');

    const confirmingMarkup = renderToStaticMarkup(
      <AccountSection
        t={t}
        account={account}
        onLogIn={jest.fn()}
        onForget={jest.fn()}
        initialConfirming={true}
      />
    );

    expect(confirmingMarkup).toContain('¿Eliminar la cuenta?');
    expect(confirmingMarkup).toContain('Nota importante: Eliminar tu cuenta no cancela tu suscripción');
  });
});
