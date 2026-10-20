import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import type { Translate, TextKey } from '../../i18n';
import type { DistractorKind, Equipment } from '../../sim/learning';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { ANSWERS, answerOf, applyAnswer, QUESTION_KINDS, type AnswerId } from '../onboarding/questionnaire';
import { finishSetup, setupStart, type SetupPart } from '../onboarding/setup';
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

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} className={`mr-2 mt-2 rounded-lg px-4 py-2 ${selected ? 'bg-green-500' : 'bg-slate-700'}`}>
      <Text className={selected ? 'font-semibold text-green-950' : 'text-white'}>{label}</Text>
    </Pressable>
  );
}

function WeightField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View className="mt-3">
      <Text className="text-sm text-white">{label}</Text>
      <TextInput value={value} onChangeText={onChange} keyboardType="decimal-pad" accessibilityLabel={label} className="mt-1 rounded-lg bg-slate-700 px-3 py-2 text-white" />
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
    setPart('questions');
  };

  return (
    <Screen>
      <Text className="mb-4 text-2xl font-bold text-white">{t('setup.title')}</Text>

      {part === 'equipment' && (
        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="mb-1 text-base font-bold text-white">{t('settings.equipment')}</Text>
          <Text className="text-sm text-slate-300">{t('setup.equipment.help')}</Text>
          <View className="flex-row flex-wrap">
            {(['collar', 'harness'] as Equipment[]).map((e) => (
              <Choice key={e} label={t(e === 'collar' ? 'settings.equipment.collar' : 'settings.equipment.harness')} selected={record.equipment === e} onPress={() => update((r) => ({ ...r, equipment: e }))} />
            ))}
          </View>
          <Text className="mt-2 text-sm text-slate-300">{t(record.equipment === 'collar' ? 'settings.equipment.collarNote' : 'settings.equipment.harnessNote')}</Text>
          <Button label={t('setup.next')} onPress={() => setPart('weights')} />
        </View>
      )}

      {part === 'weights' && (
        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="mb-1 text-base font-bold text-white">{t('setup.weights.title')}</Text>
          <Text className="text-sm text-slate-300">{t('setup.weights.help')}</Text>
          <WeightField label={t('setup.weights.dog')} value={dogText} onChange={setDogText} />
          <WeightField label={t('setup.weights.handler')} value={handlerText} onChange={setHandlerText} />
          {error && <Text className="mt-2 text-sm text-amber-200">{t(error)}</Text>}
          <Button label={t('setup.next')} onPress={saveWeights} />
          <Button
            label={t('setup.skip')}
            tone="quiet"
            onPress={() => {
              setError(null);
              setPart('questions');
            }}
          />
        </View>
      )}

      {part === 'questions' && (
        <View className="rounded-xl bg-slate-800 p-4">
          <Text className="mb-1 text-base font-bold text-white">{t('setup.questions.title')}</Text>
          <Text className="mb-1 text-sm text-slate-300">{t('setup.questions.help')}</Text>
          {QUESTION_KINDS.map((kind) => (
            <View key={kind} className="mt-2">
              <Text className="text-sm text-white">{t(KIND_KEYS[kind])}</Text>
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
