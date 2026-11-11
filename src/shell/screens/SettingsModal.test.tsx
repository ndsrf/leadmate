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
    ScrollView: ({ children }: any) => React.createElement('div', null, children),
    Pressable: (props: any) => {
      const body = typeof props.children === 'function' ? props.children({ pressed: false }) : props.children;
      const t = text(body);
      if (t && props.onPress) pressed[t] = props.onPress;
      return React.createElement('button', { 'aria-pressed': props.accessibilityState?.selected, role: props.accessibilityRole }, body);
    },
    Modal: () => null,
    BackHandler: {
      addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    },
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
import { ResetConfirmText } from './SettingsScreen';
import { NEW_SYNC_STATE } from '../sync/state';

describe('SettingsModal', () => {
  const t = createTranslator(es);

  beforeEach(() => {
    for (const k of Object.keys(pressed)) delete pressed[k];
  });

  const fakeAccount = (signedIn = false, authApi: any = null, dogId: string | null = null) => ({
    configured: true,
    signedIn,
    auth: authApi,
    sync: { ...NEW_SYNC_STATE, dogId },
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
        initialTab="account"
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
        initialTab="account"
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

  describe('Reset progress', () => {
    const renderSettings = (account: ReturnType<typeof fakeAccount>) =>
      renderToStaticMarkup(
        <SettingsModal
          t={t}
          language="es"
          record={newDogRecord()}
          update={jest.fn()}
          onClose={jest.fn()}
          account={account}
          onLogIn={jest.fn()}
          ui={{ settings: DEFAULT_UI_SETTINGS, change: jest.fn() }}
          onReset={jest.fn()}
          billingService={new MockBillingService()}
          initialTab="account"
        />
      );

    it('is offered when signed out even while the device is still paired with an account Dog', () => {
      expect(renderSettings(fakeAccount(false, null, 'd1'))).toContain(es['settings.reset.desc']);
      expect(renderSettings(fakeAccount(false, null, null))).toContain(es['settings.reset.desc']);
    });

    it('is hidden while signed in', () => {
      const auth = { deleteAccount: jest.fn(), signOut: jest.fn() };
      expect(renderSettings(fakeAccount(true, auth, 'd1'))).not.toContain(es['settings.reset.desc']);
    });

    it('confirmation says the account Dog is kept only when the device is paired', () => {
      const paired = renderToStaticMarkup(<ResetConfirmText t={t} paired />);
      expect(paired).toContain(es['settings.reset.confirmBody']);
      expect(paired).toContain(es['settings.reset.confirmAccountNote']);
      const unpaired = renderToStaticMarkup(<ResetConfirmText t={t} paired={false} />);
      expect(unpaired).toContain(es['settings.reset.confirmBody']);
      expect(unpaired).not.toContain(es['settings.reset.confirmAccountNote']);
    });
  });

  describe('Account section while signed out', () => {
    const auth = { deleteAccount: jest.fn(), signOut: jest.fn() };
    const render = (dogId: string | null) =>
      renderToStaticMarkup(<AccountSection t={t} account={fakeAccount(false, auth, dogId)} onLogIn={jest.fn()} onForget={jest.fn()} />);

    it('says the progress is only on this device when never paired', () => {
      const html = render(null);
      expect(html).toContain(es['account.signedOut']);
      expect(html).not.toContain(es['account.signedOutPaired']);
    });

    it('says the Dog is still saved in the account when logged out but still paired', () => {
      const html = render('d1');
      expect(html).toContain(es['account.signedOutPaired']);
      expect(html).not.toContain(es['account.signedOut']);
    });
  });
});
