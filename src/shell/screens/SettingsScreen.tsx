import { useState } from 'react';
import { Modal, Platform, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';
import type { Translate } from '../../i18n';
import { DISTRACTOR_KINDS, type DistractorKind, type Equipment, type TriggerLevel } from '../../sim/learning';
import { deleteRecording, keepRecording, playResolvedCue, prepareAudio } from '../audio';
import { setTriggerLevel, type CheckpointSeconds, type DogRecord } from '../dogRecord';
import { shouldShowResetSection } from '../reset';
import { Button } from '../Overlays';
import { LeadLine } from '../ui/art';
import { Badge, Choice, Panel, PaletteRoot, TextField, Toggle } from '../ui/components';
import { CUSTOM_CUE_MS, resolveCue, VOICE_PACKS, type Language } from '../voice';
import type { Account } from '../sync/useAccount';
import { AccountSection } from './AccountScreens';
import { APPEARANCES, type UiSettings } from '../ui/uiSettings';
import { renameDog } from '../onboarding/intro';
import { DOG_COAT_NAMES } from '../onboarding/look';
import { cleanDogName, DOG_NAME_MAX } from '../onboarding/name';
import { Screen } from './Screen';
import { isPlus, applyBillingSubscription } from '../plus';
import { getBillingService, type BillingService } from '../billing';

export const CHECKPOINT_OPTIONS: { value: CheckpointSeconds; key: 'settings.checkpoint.20' | 'settings.checkpoint.15' | 'settings.checkpoint.10' | 'settings.checkpoint.off' }[] = [
  { value: 20, key: 'settings.checkpoint.20' },
  { value: 15, key: 'settings.checkpoint.15' },
  { value: 10, key: 'settings.checkpoint.10' },
  { value: 0, key: 'settings.checkpoint.off' },
];

const KIND_KEYS = {
  child: 'settings.kind.child',
  bicycle: 'settings.kind.bicycle',
  dog: 'settings.kind.dog',
  skateboard: 'settings.kind.skateboard',
  food: 'settings.kind.food',
  other: 'settings.kind.other',
} as const;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Panel className="mb-5">
      <Text className="mb-1 font-display text-title text-ink">{title}</Text>
      {children}
    </Panel>
  );
}

/** The Appearance choice: System, Light or Dark, kept on this device only. */
export function AppearanceSection({ t, ui }: { t: Translate; ui: { settings: UiSettings; change: (patch: Partial<UiSettings>) => void } }) {
  return (
    <Section title={t('settings.appearance')}>
      <View className="flex-row flex-wrap">
        {APPEARANCES.map((appearance) => (
          <Choice key={appearance} label={t(`settings.appearance.${appearance}`)} selected={ui.settings.appearance === appearance} onPress={() => ui.change({ appearance })} />
        ))}
      </View>
      <Text className="mt-2 text-caption text-inkMuted">{t('settings.appearance.help')}</Text>
    </Section>
  );
}

/** Edits the Dog's name and keeps it when the field is left; a blank name puts the old one back. */
function DogNameField({ label, value, onCommit }: { label: string; value: string; onCommit: (name: string) => void }) {
  const [text, setText] = useState(value);
  const commit = () => {
    const clean = cleanDogName(text);
    if (clean === null) setText(value);
    else {
      setText(clean);
      onCommit(clean);
    }
  };
  return <TextField accessibilityLabel={label} value={text} onChangeText={setText} onBlur={commit} onSubmitEditing={commit} maxLength={DOG_NAME_MAX} autoCapitalize="words" returnKeyType="done" />;
}

/** The Reset confirmation's wording; a device still paired with an account's Dog is told the account copy is kept. */
export function ResetConfirmText({ t, paired }: { t: Translate; paired: boolean }) {
  return (
    <>
      <Text className="font-display text-title text-dangerText">{t('settings.reset.confirmTitle')}</Text>
      <Text className="mt-3 text-body text-inkMuted">{t('settings.reset.confirmBody')}</Text>
      {paired && <Text className="mt-2 text-body text-inkMuted">{t('settings.reset.confirmAccountNote')}</Text>}
    </>
  );
}

type RecordState = 'idle' | 'recording' | 'denied';

export function SettingsScreen({
  t,
  language,
  record,
  update,
  onClose,
  account,
  onLogIn,
  ui,
  onReset,
  billingService,
}: {
  t: Translate;
  language: Language;
  record: DogRecord;
  update: (fn: (r: DogRecord) => DogRecord) => void;
  onClose: () => void;
  account: Account;
  onLogIn: () => void;
  /** This device's UI sounds and haptics (never part of the Dog's record). */
  ui: { settings: UiSettings; change: (patch: Partial<UiSettings>) => void };
  onReset: () => void;
  billingService?: BillingService;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState<RecordState>('idle');
  const [showResetModal, setShowResetModal] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreFeedback, setRestoreFeedback] = useState<string | null>(null);
  const hasCustom = Boolean(record.customCues[language]);
  const canRecord = Platform.OS !== 'web';

  const billing = billingService ?? getBillingService();
  const plus = isPlus(record, new Date());

  const handleRestorePurchases = async () => {
    setRestoring(true);
    setRestoreFeedback(null);
    try {
      const res = await billing.restorePurchases();
      if (res.success && res.isPlus) {
        update((r) => applyBillingSubscription(r, { isPlus: true, expiresAt: null }, new Date()));
        setRestoreFeedback(t('paywall.restoreSuccess'));
      } else {
        setRestoreFeedback(t('paywall.restoreNotFound'));
      }
    } catch (err: any) {
      setRestoreFeedback(err?.message ?? t('paywall.error'));
    } finally {
      setRestoring(false);
    }
  };

  const recordCue = async () => {
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      // keep the current Voice Pack and explain
      setRecording('denied');
      return;
    }
    setRecording('recording');
    try {
      await prepareAudio(true);
      await recorder.prepareToRecordAsync();
      recorder.record();
      await new Promise((resolve) => setTimeout(resolve, CUSTOM_CUE_MS));
      await recorder.stop();
      if (recorder.uri) {
        const kept = keepRecording(recorder.uri, language);
        const previous = record.customCues[language];
        if (previous && previous !== kept) deleteRecording(previous);
        update((r) => ({ ...r, customCues: { ...r.customCues, [language]: kept } }));
      }
    } finally {
      await prepareAudio(false);
      setRecording('idle');
    }
  };

  const removeCue = () => {
    const uri = record.customCues[language];
    if (uri) deleteRecording(uri);
    update((r) => {
      const { [language]: _gone, ...rest } = r.customCues;
      return { ...r, customCues: rest };
    });
  };

  return (
    <Screen>
      <Text className="font-display text-displayM text-ink">{t('settings.title')}</Text>
      <LeadLine className="mb-4 mt-1" />

      <Section title={t('settings.equipment')}>
        <View className="flex-row flex-wrap">
          {(['collar', 'harness'] as Equipment[]).map((e) => (
            <Choice key={e} label={t(e === 'collar' ? 'settings.equipment.collar' : 'settings.equipment.harness')} selected={record.equipment === e} onPress={() => update((r) => ({ ...r, equipment: e }))} />
          ))}
        </View>
        <Text className="mt-2 text-body text-inkMuted">{t(record.equipment === 'collar' ? 'settings.equipment.collarNote' : 'settings.equipment.harnessNote')}</Text>
      </Section>

      <Section title={t('settings.dogName')}>
        <DogNameField label={t('settings.dogName')} value={record.name} onCommit={(name) => update((r) => renameDog(r, name))} />
      </Section>

      <Section title={t('settings.coat')}>
        <View className="flex-row flex-wrap">
          {DOG_COAT_NAMES.map((c) => (
            <Choice key={c} label={t(`coat.${c}`)} selected={record.coat === c} onPress={() => update((r) => ({ ...r, coat: c }))} />
          ))}
        </View>
      </Section>

      <Section title={t('settings.triggers')}>
        <Text className="mb-1 text-caption text-inkMuted">{t('settings.triggers.help')}</Text>
        {DISTRACTOR_KINDS.map((kind: DistractorKind) => (
          <View key={kind} className="mt-2">
            <Text className="text-body text-ink">{t(KIND_KEYS[kind])}</Text>
            <View className="flex-row">
              {([0, 1, 2, 3] as TriggerLevel[]).map((level) => (
                <Choice key={level} label={String(level)} selected={record.triggerProfile[kind] === level} onPress={() => update((r) => setTriggerLevel(r, kind, level))} />
              ))}
            </View>
          </View>
        ))}
      </Section>

      <Section title={t('settings.checkpoint')}>
        <View className="flex-row flex-wrap">
          {CHECKPOINT_OPTIONS.map((o) => (
            <Choice key={o.value} label={t(o.key)} selected={record.checkpointSeconds === o.value} onPress={() => update((r) => ({ ...r, checkpointSeconds: o.value }))} />
          ))}
        </View>
      </Section>

      <Section title={t('settings.feedback')}>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="shrink text-body text-ink">{t('settings.feedback.sounds')}</Text>
          <Toggle label={t('settings.feedback.sounds')} value={ui.settings.sounds} onChange={(sounds) => ui.change({ sounds })} />
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="shrink text-body text-ink">{t('settings.feedback.haptics')}</Text>
          <Toggle label={t('settings.feedback.haptics')} value={ui.settings.haptics} onChange={(haptics) => ui.change({ haptics })} />
        </View>
        <Text className="mt-2 text-caption text-inkMuted">{t('settings.feedback.help')}</Text>
      </Section>

      <AppearanceSection t={t} ui={ui} />

      <Section title={t('settings.voicePack')}>
        <View className="flex-row flex-wrap">
          {VOICE_PACKS.map((pack) => (
            <Choice
              key={pack.id}
              label={t(pack.name)}
              selected={record.voicePack === pack.id}
              onPress={() => {
                update((r) => ({ ...r, voicePack: pack.id }));
                // let the user hear the pack they just picked
                playResolvedCue(resolveCue({ voicePack: pack.id, customCues: {} }, language));
              }}
            />
          ))}
        </View>
      </Section>

      <Section title={t('settings.customCue')}>
        <Text className="text-body text-inkMuted">{t('settings.customCue.help')}</Text>
        {!canRecord && <Text className="mt-2 text-body text-dangerText">{t('settings.customCue.webUnavailable')}</Text>}
        <Text className="mt-2 text-body text-ink">{hasCustom ? t('settings.customCue.saved') : t('settings.customCue.none')}</Text>
        {recording === 'denied' && <Text className="mt-2 text-body text-dangerText">{t('settings.customCue.denied')}</Text>}
        {canRecord && <Button label={recording === 'recording' ? t('settings.customCue.recording') : t('settings.customCue.record')} onPress={() => recording !== 'recording' && recordCue()} />}
        {hasCustom && <Button label={t('settings.customCue.play')} tone="secondary" onPress={() => playResolvedCue(resolveCue(record, language))} />}
        {hasCustom && <Button label={t('settings.customCue.remove')} tone="secondary" onPress={removeCue} />}
      </Section>

      <Section title={t('settings.subscription')}>
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-body text-ink">{t('settings.subscription.status')}</Text>
          <Badge label={plus ? t('settings.subscription.active') : t('settings.subscription.free')} tone={plus ? 'accent' : 'quiet'} />
        </View>
        {restoreFeedback && (
          <Panel tone="info" className="mb-2">
            <Text className="text-body text-ink">{restoreFeedback}</Text>
          </Panel>
        )}
        <Button label={t('settings.subscription.restore')} tone="secondary" onPress={handleRestorePurchases} disabled={restoring} />
      </Section>

      <AccountSection t={t} account={account} onLogIn={onLogIn} onForget={account.forgetAccount} />

      {shouldShowResetSection(account.signedIn) && (
        <Panel className="mb-5">
          <Text className="mb-1 font-display text-title text-dangerText">{t('settings.reset.title')}</Text>
          <Text className="mb-3 text-body text-inkMuted">{t('settings.reset.desc')}</Text>
          <Button label={t('settings.reset.button')} tone="danger" onPress={() => setShowResetModal(true)} />
        </Panel>
      )}

      {showResetModal && (
        <Modal
          visible
          transparent
          animationType="fade"
          onRequestClose={() => setShowResetModal(false)}
        >
          <SafeAreaProvider>
          <PaletteRoot className="flex-1">
          <SafeAreaView className="flex-1 items-center justify-center bg-outline/70 p-4">
            <Panel className="w-full max-w-sm">
              <ResetConfirmText t={t} paired={account.sync.dogId !== null} />
              <View className="mt-4 gap-3">
                <Button label={t('settings.reset.cancelButton')} tone="secondary" onPress={() => setShowResetModal(false)} />
                <Button
                  label={t('settings.reset.confirmButton')}
                  tone="danger"
                  onPress={() => {
                    setShowResetModal(false);
                    onReset();
                  }}
                />
              </View>
            </Panel>
          </SafeAreaView>
          </PaletteRoot>
          </SafeAreaProvider>
        </Modal>
      )}

      <Button label={t('settings.close')} onPress={onClose} />
    </Screen>
  );
}
