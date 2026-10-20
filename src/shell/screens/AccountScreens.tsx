import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { TextKey, Translate } from '../../i18n';
import { Button } from '../Overlays';
import type { DogRecord } from '../dogRecord';
import type { AuthApi, AuthError } from '../sync/auth';
import { validateCredentials } from '../sync/auth';
import type { Account } from '../sync/useAccount';
import { summarize, type Choice } from '../sync/sync';
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
      <Text className="mb-2 text-2xl font-bold text-white">{t('account.register.title')}</Text>
      <Text className="mb-2 text-base text-slate-200">{t('account.register.body')}</Text>
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
      <Text className="mb-4 text-2xl font-bold text-white">{t(title)}</Text>
      <View className="rounded-xl bg-slate-800 p-4">
        <Text className="text-sm text-white">{t('account.email')}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" accessibilityLabel={t('account.email')} className="mt-1 rounded-lg bg-slate-700 px-3 py-2 text-white" />
        {mode !== 'reset' && (
          <>
            <Text className="mt-3 text-sm text-white">{t('account.password')}</Text>
            <TextInput value={password} onChangeText={setPassword} secureTextEntry accessibilityLabel={t('account.password')} className="mt-1 rounded-lg bg-slate-700 px-3 py-2 text-white" />
          </>
        )}
        {error && <Text className="mt-2 text-sm text-amber-200">{t(ERROR_KEYS[error])}</Text>}
        {notice && <Text className="mt-2 text-sm text-green-300">{t(notice)}</Text>}
        <Button label={t(mode === 'reset' ? 'account.reset.send' : title)} onPress={() => !busy && submit()} />
        {mode === 'signup' && <Button label={t('account.haveAccount')} tone="quiet" onPress={() => setMode('login')} />}
        {mode === 'login' && <Button label={t('account.needAccount')} tone="quiet" onPress={() => setMode('signup')} />}
        {mode === 'login' && <Button label={t('account.forgot')} tone="quiet" onPress={() => setMode('reset')} />}
      </View>
      <Button label={t('account.back')} tone="quiet" onPress={onBack} />
    </Screen>
  );
}

/** Both Dogs side by side; nothing is merged or overwritten until the user picks. */
export function ChooseDogScreen({ t, local, cloud, onChoose }: { t: Translate; local: DogRecord; cloud: DogRecord; onChoose: (choice: Choice) => void }) {
  const side = (labelKey: TextKey, record: DogRecord) => {
    const s = summarize(record);
    return (
      <View className="mb-3 rounded-xl bg-slate-800 p-4">
        <Text className="text-base font-bold text-white">{t(labelKey)}</Text>
        <Text className="mt-1 text-sm text-slate-200">{`${t('account.choose.streak')}: ${s.streak}`}</Text>
        <Text className="text-sm text-slate-200">{`${t('account.choose.nodes')}: ${s.nodes}`}</Text>
      </View>
    );
  };
  return (
    <Screen>
      <Text className="mb-2 text-2xl font-bold text-white">{t('account.choose.title')}</Text>
      <Text className="mb-3 text-base text-slate-200">{t('account.choose.body')}</Text>
      {side('account.choose.device', local)}
      {side('account.choose.cloud', cloud)}
      <Button label={t('account.choose.keepCloud')} onPress={() => onChoose('cloud')} />
      <Button label={t('account.choose.keepDevice')} tone="quiet" onPress={() => onChoose('local')} />
    </Screen>
  );
}

/** A non-blocking card on the home screen: the verification pause or the registration reminder. */
export function AccountBanner({ t, kind, onAction, onDismiss }: { t: Translate; kind: 'verify' | 'remind'; onAction?: () => void; onDismiss?: () => void }) {
  return (
    <View className="mb-4 rounded-xl bg-sky-900/60 p-4">
      {kind === 'verify' ? (
        <>
          <Text className="text-lg font-bold text-sky-100">{t('account.verify.title')}</Text>
          <Text className="mt-1 text-sm text-sky-50">{t('account.verify.body')}</Text>
        </>
      ) : (
        <>
          <Text className="text-sm text-sky-50">{t('account.reminder.body')}</Text>
          {onAction && <Button label={t('account.register.create')} onPress={onAction} />}
        </>
      )}
      {onDismiss && <Button label={t('account.register.notNow')} tone="quiet" onPress={onDismiss} />}
    </View>
  );
}

/** The Account section of settings: status, log in or out, restoring the backup, and in-app account deletion. */
export function AccountSection({ t, account, onLogIn, onForget }: { t: Translate; account: Account; onLogIn: () => void; onForget: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<TextKey | null>(null);
  const { auth } = account;
  return (
    <View className="mb-5 rounded-xl bg-slate-800 p-4">
      <Text className="mb-1 text-base font-bold text-white">{t('account.title')}</Text>
      {!auth ? (
        <Text className="text-sm text-slate-300">{t('account.unavailable')}</Text>
      ) : account.signedIn ? (
        <>
          <Text className="text-sm text-slate-300">{t('account.signedIn')}</Text>
          {account.sync.paused === 'verify' && <Text className="mt-2 text-sm text-amber-200">{t('account.verify.body')}</Text>}
          <Button label={t('account.logOut')} tone="quiet" onPress={() => auth.signOut()} />
          {confirming ? (
            <View className="mt-2">
              <Text className="text-sm text-amber-200">{t('account.delete.confirm')}</Text>
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
              <Button label={t('account.delete.no')} tone="quiet" onPress={() => setConfirming(false)} />
            </View>
          ) : (
            <Button label={t('account.delete')} tone="quiet" onPress={() => setConfirming(true)} />
          )}
        </>
      ) : (
        <>
          <Text className="text-sm text-slate-300">{t('account.signedOut')}</Text>
          <Button label={t('account.logIn')} onPress={onLogIn} />
        </>
      )}
      {message && <Text className="mt-2 text-sm text-green-300">{t(message)}</Text>}
      {account.backup && (
        <View className="mt-3">
          <Text className="text-sm text-slate-300">{t('account.backup')}</Text>
          <Button label={t('account.backup.restore')} tone="quiet" onPress={account.restoreBackup} />
        </View>
      )}
    </View>
  );
}
