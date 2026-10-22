import { useState } from 'react';
import { Text, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import { Button } from '../Overlays';
import type { DogRecord } from '../dogRecord';
import type { AuthApi, AuthError } from '../sync/auth';
import { validateCredentials } from '../sync/auth';
import type { Account } from '../sync/useAccount';
import { summarize, type Choice } from '../sync/sync';
import { Panel, TextField } from '../ui/components';
import { Screen } from './Screen';

const ERROR_KEYS: Record<AuthError, TextKey> = {
  'invalid-email': 'account.error.invalid-email',
  'weak-password': 'account.error.weak-password',
  'wrong-credentials': 'account.error.wrong-credentials',
  exists: 'account.error.exists',
  network: 'account.error.network',
  unknown: 'account.error.unknown',
};

type Mode = 'signup' | 'login' | 'reset';

/** After the first Stage: offer registration; "Not now" leaves the app fully playable. */
export function RegisterPrompt({ t, onCreate, onNotNow }: { t: Translate; onCreate: () => void; onNotNow: () => void }) {
  return (
    <Screen>
      <Text className="mb-2 font-display text-displayM text-ink">{t('account.register.title')}</Text>
      <Text className="mb-2 text-bodyL text-inkMuted">{t('account.register.body')}</Text>
      <Button label={t('account.register.create')} onPress={onCreate} />
      <Button label={t('account.register.notNow')} tone="quiet" onPress={onNotNow} />
    </Screen>
  );
}

/** Sign up, log in and reset with email and password. Signing in or up returns to the caller through `onDone`. */
export function AuthScreen({ t, auth, initial = 'signup', onDone, onBack }: { t: Translate; auth: AuthApi; initial?: Mode; onDone: () => void; onBack: () => void }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [notice, setNotice] = useState<TextKey | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const invalid = validateCredentials(email, mode === 'signup' ? password : null);
    setNotice(null);
    if (invalid) return setError(invalid);
    setError(null);
    setBusy(true);
    const result = mode === 'signup' ? await auth.signUp(email, password) : mode === 'login' ? await auth.signIn(email, password) : await auth.resetPassword(email);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    if (mode === 'reset') setNotice('account.reset.sent');
    else if (mode === 'signup') {
      setNotice('account.signUp.sent');
      onDone();
    } else onDone();
  };

  const title: TextKey = mode === 'signup' ? 'account.signUp' : mode === 'login' ? 'account.logIn' : 'account.reset';
  return (
    <Screen>
      <Text className="mb-4 font-display text-displayM text-ink">{t(title)}</Text>
      <Panel>
        <TextField label={t('account.email')} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        {mode !== 'reset' && (
          <>
            <View className="mt-3">
              <TextField label={t('account.password')} value={password} onChangeText={setPassword} secureTextEntry />
            </View>
          </>
        )}
        {error && <Text className="mt-2 text-body text-dangerText">{t(ERROR_KEYS[error])}</Text>}
        {notice && <Text className="mt-2 text-body text-brandText">{t(notice)}</Text>}
        <Button label={t(mode === 'reset' ? 'account.reset.send' : title)} onPress={() => !busy && submit()} />
        {mode === 'signup' && <Button label={t('account.haveAccount')} tone="quiet" onPress={() => setMode('login')} />}
        {mode === 'login' && <Button label={t('account.needAccount')} tone="quiet" onPress={() => setMode('signup')} />}
        {mode === 'login' && <Button label={t('account.forgot')} tone="quiet" onPress={() => setMode('reset')} />}
      </Panel>
      <Button label={t('account.back')} tone="quiet" onPress={onBack} />
    </Screen>
  );
}

/** Both Dogs side by side; nothing is merged or overwritten until the user picks. */
export function ChooseDogScreen({ t, local, cloud, onChoose }: { t: Translate; local: DogRecord; cloud: DogRecord; onChoose: (choice: Choice) => void }) {
  const side = (labelKey: TextKey, record: DogRecord) => {
    const s = summarize(record);
    return (
      <Panel className="mb-3">
        <Text className="font-display text-title text-ink">{t(labelKey)}</Text>
        <Text className="mt-1 text-body text-inkMuted">{`${t('account.choose.streak')}: ${s.streak}`}</Text>
        <Text className="text-body text-inkMuted">{`${t('account.choose.nodes')}: ${s.nodes}`}</Text>
      </Panel>
    );
  };
  return (
    <Screen>
      <Text className="mb-2 font-display text-displayM text-ink">{t('account.choose.title')}</Text>
      <Text className="mb-3 text-bodyL text-inkMuted">{t('account.choose.body')}</Text>
      {side('account.choose.device', local)}
      {side('account.choose.cloud', cloud)}
      <Button label={t('account.choose.keepCloud')} onPress={() => onChoose('cloud')} />
      <Button label={t('account.choose.keepDevice')} tone="secondary" onPress={() => onChoose('local')} />
    </Screen>
  );
}

/** A non-blocking card on the home screen: the verification pause or the registration reminder. */
export function AccountBanner({ t, kind, onAction, onDismiss }: { t: Translate; kind: 'verify' | 'remind'; onAction?: () => void; onDismiss?: () => void }) {
  return (
    <Panel tone="info" className="mb-4">
      {kind === 'verify' ? (
        <>
          <Text className="font-display text-title text-ink">{t('account.verify.title')}</Text>
          <Text className="mt-1 text-body text-ink">{t('account.verify.body')}</Text>
        </>
      ) : (
        <>
          <Text className="text-body text-ink">{t('account.reminder.body')}</Text>
          {onAction && <Button label={t('account.register.create')} onPress={onAction} />}
        </>
      )}
      {onDismiss && <Button label={t('account.register.notNow')} tone="quiet" onPress={onDismiss} />}
    </Panel>
  );
}

/** The Account section of settings: status, log in or out, restoring the backup, and in-app account deletion. */
export function AccountSection({ t, account, onLogIn, onForget }: { t: Translate; account: Account; onLogIn: () => void; onForget: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<TextKey | null>(null);
  const { auth } = account;
  return (
    <Panel className="mb-5">
      <Text className="mb-1 font-display text-title text-ink">{t('account.title')}</Text>
      {!auth ? (
        <Text className="text-body text-inkMuted">{t('account.unavailable')}</Text>
      ) : account.signedIn ? (
        <>
          <Text className="text-body text-inkMuted">{t('account.signedIn')}</Text>
          {account.sync.paused === 'verify' && <Text className="mt-2 text-body text-dangerText">{t('account.verify.body')}</Text>}
          <Button label={t('account.logOut')} tone="secondary" onPress={() => auth.signOut()} />
          {confirming ? (
            <View className="mt-2">
              <Text className="text-body text-dangerText">{t('account.delete.confirm')}</Text>
              <Button
                label={t('account.delete.yes')}
                onPress={async () => {
                  const result = await auth.deleteAccount();
                  setConfirming(false);
                  if (result.ok) {
                    onForget();
                    setMessage('account.delete.done');
                  } else setMessage(ERROR_KEYS[result.error]);
                }}
              />
              <Button label={t('account.delete.no')} tone="secondary" onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button label={t('account.delete')} tone="secondary" onPress={() => setConfirming(true)} />
          )}
        </>
      ) : (
        <>
          <Text className="text-body text-inkMuted">{t('account.signedOut')}</Text>
          <Button label={t('account.logIn')} onPress={onLogIn} />
        </>
      )}
      {message && <Text className="mt-2 text-body text-brandText">{t(message)}</Text>}
      {account.backup && (
        <View className="mt-3">
          <Text className="text-body text-inkMuted">{t('account.backup')}</Text>
          <Button label={t('account.backup.restore')} tone="secondary" onPress={account.restoreBackup} />
        </View>
      )}
    </Panel>
  );
}
