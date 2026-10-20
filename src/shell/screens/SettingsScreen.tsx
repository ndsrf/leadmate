import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { RecordingPresets, requestRecordingPermissionsAsync, useAudioRecorder } from 'expo-audio';
import type { Translate } from '../../i18n';
import { DISTRACTOR_KINDS, type DistractorKind, type Equipment, type TriggerLevel } from '../../sim/learning';
import { deleteRecording, keepRecording, playResolvedCue, prepareAudio } from '../audio';
import { setTriggerLevel, type CheckpointSeconds, type DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { CUSTOM_CUE_MS, resolveCue, VOICE_PACKS, type Language } from '../voice';
import type { Account } from '../sync/useAccount';
import { AccountSection } from './AccountScreens';
import { Screen } from './Screen';

const CHECKPOINT_OPTIONS: { value: CheckpointSeconds; key: 'settings.checkpoint.5' | 'settings.checkpoint.10' | 'settings.checkpoint.off' }[] = [
  { value: 5, key: 'settings.checkpoint.5' },
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

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mr-2 mt-2 rounded-lg px-4 py-2 ${selected ? 'bg-green-500' : 'bg-slate-700'}`}
    >
      <Text className={selected ? 'font-semibold text-green-950' : 'text-white'}>{label}</Text>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mb-5 rounded-xl bg-slate-800 p-4">
      <Text className="mb-1 text-base font-bold text-white">{title}</Text>
      {children}
    </View>
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
}: {
  t: Translate;
  language: Language;
  record: DogRecord;
  update: (fn: (r: DogRecord) => DogRecord) => void;
  onClose: () => void;
  account: Account;
  onLogIn: () => void;
}) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [recording, setRecording] = useState<RecordState>('idle');
  const hasCustom = Boolean(record.customCues[language]);
  const canRecord = Platform.OS !== 'web';

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
      <Text className="mb-4 text-2xl font-bold text-white">{t('settings.title')}</Text>

      <Section title={t('settings.equipment')}>
        <View className="flex-row flex-wrap">
          {(['collar', 'harness'] as Equipment[]).map((e) => (
            <Choice key={e} label={t(e === 'collar' ? 'settings.equipment.collar' : 'settings.equipment.harness')} selected={record.equipment === e} onPress={() => update((r) => ({ ...r, equipment: e }))} />
          ))}
        </View>
        <Text className="mt-2 text-sm text-slate-300">{t(record.equipment === 'collar' ? 'settings.equipment.collarNote' : 'settings.equipment.harnessNote')}</Text>
      </Section>

      <Section title={t('settings.triggers')}>
        <Text className="mb-1 text-xs text-slate-400">{t('settings.triggers.help')}</Text>
        {DISTRACTOR_KINDS.map((kind: DistractorKind) => (
          <View key={kind} className="mt-2">
            <Text className="text-sm text-white">{t(KIND_KEYS[kind])}</Text>
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
        <Text className="text-sm text-slate-300">{t('settings.customCue.help')}</Text>
        {!canRecord && <Text className="mt-2 text-sm text-amber-200">{t('settings.customCue.webUnavailable')}</Text>}
        <Text className="mt-2 text-sm text-white">{hasCustom ? t('settings.customCue.saved') : t('settings.customCue.none')}</Text>
        {recording === 'denied' && <Text className="mt-2 text-sm text-amber-200">{t('settings.customCue.denied')}</Text>}
        {canRecord && <Button label={recording === 'recording' ? t('settings.customCue.recording') : t('settings.customCue.record')} onPress={() => recording !== 'recording' && recordCue()} />}
        {hasCustom && <Button label={t('settings.customCue.play')} tone="quiet" onPress={() => playResolvedCue(resolveCue(record, language))} />}
        {hasCustom && <Button label={t('settings.customCue.remove')} tone="quiet" onPress={removeCue} />}
      </Section>

      <AccountSection t={t} account={account} onLogIn={onLogIn} onForget={account.forgetAccount} />

      <Button label={t('settings.close')} onPress={onClose} />
    </Screen>
  );
}
