import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import type { Translate, TextKey } from '../../i18n';
import type { DistractorKind, Equipment } from '../../sim/learning';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { Choice } from '../ui/components';
import { ANSWERS, answerOf, applyAnswer, QUESTION_KINDS, type AnswerId } from '../onboarding/questionnaire';
import { finishSetup, setupStart, type SetupPart } from '../onboarding/setup';
import { DOG_COAT_NAMES } from '../onboarding/look';
import { isDogKg, isHandlerKg, parseKg } from '../onboarding/weights';
import { Screen } from './Screen';

const KIND_KEYS: Record<DistractorKind, TextKey> = {
  child: 'settings.kind.child',
  bicycle: 'settings.kind.bicycle',
  dog: 'settings.kind.dog',
  skateboard: 'settings.kind.skateboard',
  food: 'settings.kind.food',
  other: 'settings.kind.other',
};

const ANSWER_KEYS: Record<AnswerId, TextKey> = {
  never: 'setup.answer.never',
  little: 'setup.answer.little',
  often: 'setup.answer.often',
  alot: 'setup.answer.alot',
};

function WeightField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mt-3">
      <Text className="text-sm text-ink">{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" accessibilityLabel={label} className="mt-1 rounded-game-md bg-surfaceHigh px-3 py-2 text-ink" />
    </View>
  );
}

/** Dog setup: Equipment, weights (skippable) and the Trigger Profile questionnaire. Each answer is saved as it is entered. */
export function SetupScreen({ t, record, update }: { t: Translate; record: DogRecord; update: (fn: (r: DogRecord) => DogRecord) => void }) {
  const [part, setPart] = useState<SetupPart>(() => setupStart(record));
  const [dogText, setDogText] = useState(record.weights.dogKg?.toString() ?? '');
  const [handlerText, setHandlerText] = useState(record.weights.handlerKg?.toString() ?? '');
  const [error, setError] = useState<TextKey | null>(null);

  const saveWeights = () => {
    const dogKg = parseKg(dogText);
    const handlerKg = parseKg(handlerText);
    if (dogKg === null || !isDogKg(dogKg)) return setError('setup.weights.invalidDog');
    if (handlerKg === null || !isHandlerKg(handlerKg)) return setError('setup.weights.invalidHandler');
    setError(null);
    update((r) => ({ ...r, weights: { dogKg, handlerKg } }));
    setPart('look');
  };

  return (
    <Screen>
      <Text className="mb-4 text-2xl font-bold text-ink">{t('setup.title')}</Text>

      {part === 'equipment' && (
        <View className="rounded-game-lg bg-surface p-4">
          <Text className="mb-1 text-base font-bold text-ink">{t('settings.equipment')}</Text>
          <Text className="text-sm text-inkMuted">{t('setup.equipment.help')}</Text>
          <View className="flex-row flex-wrap">
            {(['collar', 'harness'] as Equipment[]).map((e) => (
              <Choice key={e} label={t(e === 'collar' ? 'settings.equipment.collar' : 'settings.equipment.harness')} selected={record.equipment === e} onPress={() => update((r) => ({ ...r, equipment: e }))} />
            ))}
          </View>
          <Text className="mt-2 text-sm text-inkMuted">{t(record.equipment === 'collar' ? 'settings.equipment.collarNote' : 'settings.equipment.harnessNote')}</Text>
          <Button label={t('setup.next')} onPress={() => setPart('weights')} />
        </View>
      )}

      {part === 'weights' && (
        <View className="rounded-game-lg bg-surface p-4">
          <Text className="mb-1 text-base font-bold text-ink">{t('setup.weights.title')}</Text>
          <Text className="text-sm text-inkMuted">{t('setup.weights.help')}</Text>
          <WeightField label={t('setup.weights.dog')} value={dogText} onChange={setDogText} />
          <WeightField label={t('setup.weights.handler')} value={handlerText} onChange={setHandlerText} />
          {error && <Text className="mt-2 text-sm text-accent">{t(error)}</Text>}
          <Button label={t('setup.next')} onPress={saveWeights} />
          <Button
            label={t('setup.skip')}
            tone="quiet"
            onPress={() => {
              setError(null);
              setPart('look');
            }}
          />
        </View>
      )}

      {part === 'look' && (
        <View className="rounded-game-lg bg-surface p-4">
          <Text className="mb-1 text-base font-bold text-ink">{t('setup.look.title')}</Text>
          <Text className="text-sm text-inkMuted">{t('setup.look.help')}</Text>
          <View className="flex-row flex-wrap">
            {DOG_COAT_NAMES.map((c) => (
              <Choice key={c} label={t(`coat.${c}`)} selected={record.coat === c} onPress={() => update((r) => ({ ...r, coat: c }))} />
            ))}
          </View>
          <Button label={t('setup.next')} onPress={() => setPart('questions')} />
        </View>
      )}

      {part === 'questions' && (
        <View className="rounded-game-lg bg-surface p-4">
          <Text className="mb-1 text-base font-bold text-ink">{t('setup.questions.title')}</Text>
          <Text className="mb-1 text-sm text-inkMuted">{t('setup.questions.help')}</Text>
          {QUESTION_KINDS.map((kind) => (
            <View key={kind} className="mt-2">
              <Text className="text-sm text-ink">{t(KIND_KEYS[kind])}</Text>
              <View className="flex-row flex-wrap">
                {ANSWERS.map((a) => (
                  <Choice key={a.id} label={t(ANSWER_KEYS[a.id])} selected={answerOf(record.triggerProfile[kind]) === a.id} onPress={() => update((r) => applyAnswer(r, kind, a.id))} />
                ))}
              </View>
            </View>
          ))}
          <Button label={t('setup.finish')} onPress={() => update(finishSetup)} />
        </View>
      )}
    </Screen>
  );
}
