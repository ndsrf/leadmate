import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate, TextKey } from '../../i18n';
import type { DistractorKind } from '../../sim/learning';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { breedOf, breedWeightMid } from '../onboarding/breeds';
import { withDogName } from '../onboarding/intro';
import { chipsOf, INTENSITIES, QUESTION_KINDS, selectKind, setIntensity, type AnswerId, type IntensityId } from '../onboarding/questionnaire';
import { finishSetup, setupStart, SETUP_PARTS, type SetupPart } from '../onboarding/setup';
import { DOG_KG_RANGE, HANDLER_KG_RANGE, isDogKg, isHandlerKg, kgFromText, kgText, parseKg } from '../onboarding/weights';
import { Panel, TextField } from '../ui/components';
import { EquipmentCard, SelectChip, Segmented, StepHeader } from '../ui/Pickers';
import { WeightSlider } from '../ui/WeightSlider';
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

/** Where the Dog slider rests and a first step counts from when there is neither a weight nor a breed range. */
const DOG_START_KG = 20;
const HANDLER_START_KG = 70;

/** A weight slider with the typed field next to it; both write the same text. */
function WeightRow({
  t,
  label,
  text,
  onText,
  range,
  start,
  hint,
}: {
  t: Translate;
  label: string;
  text: string;
  onText: (v: string) => void;
  range: { min: number; max: number };
  start: number;
  hint?: readonly [number, number] | null;
}) {
  return (
    <View className="mt-2">
      <WeightSlider t={t} label={label} value={kgFromText(text, range)} range={range} start={start} hint={hint} onChange={(kg) => onText(kgText(kg))} />
      <TextField label={t('setup.weights.type')} value={text} onChangeText={onText} keyboardType="decimal-pad" />
    </View>
  );
}

/** Dog setup: Equipment, weights (skippable) and the Trigger Profile chips. Equipment and triggers are saved as they are chosen. */
export function SetupScreen({ t, record, update }: { t: Translate; record: DogRecord; update: (fn: (r: DogRecord) => DogRecord) => void }) {
  const [part, setPart] = useState<SetupPart>(() => setupStart(record));
  // the breed's typical weight only fills the Dog's field while no weight was ever entered
  const [dogText, setDogText] = useState(() => {
    if (record.weights.dogKg !== null) return kgText(record.weights.dogKg);
    const mid = breedWeightMid(record.breed);
    return mid === null ? '' : kgText(mid);
  });
  const [handlerText, setHandlerText] = useState(record.weights.handlerKg !== null ? kgText(record.weights.handlerKg) : '');
  const [error, setError] = useState<TextKey | null>(null);
  const breedKg = breedOf(record.breed).kg;
  const neutral = t('dog.neutral');

  const saveWeights = () => {
    const dogKg = parseKg(dogText);
    const handlerKg = parseKg(handlerText);
    if (dogKg === null || !isDogKg(dogKg)) return setError('setup.weights.invalidDog');
    if (handlerKg === null || !isHandlerKg(handlerKg)) return setError('setup.weights.invalidHandler');
    setError(null);
    update((r) => ({ ...r, weights: { dogKg, handlerKg } }));
    setPart('questions');
  };

  const back = part === 'equipment' ? undefined : () => setPart(SETUP_PARTS[SETUP_PARTS.indexOf(part) - 1]);
  const chips = chipsOf(record.triggerProfile);
  const hint = breedKg ? t('setup.weights.breedHint').split('{breed}').join(t(`breed.${record.breed}`)).split('{min}').join(kgText(breedKg[0])).split('{max}').join(kgText(breedKg[1])) : null;

  return (
    <Screen>
      <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
        {t('setup.title')}
      </Text>
      <StepHeader t={t} step={SETUP_PARTS.indexOf(part) + 1} total={SETUP_PARTS.length} onBack={back} />

      {part === 'equipment' && (
        <Panel>
          <Text className="mb-1 font-display text-title text-ink">{t('settings.equipment')}</Text>
          <Text className="mb-3 text-body text-inkMuted">{t('setup.equipment.help')}</Text>
          <View className="flex-row" style={{ gap: 12 }}>
            <EquipmentCard kind="collar" label={t('settings.equipment.collar')} note={t('setup.equipment.collarNote')} selected={record.equipment === 'collar'} onPress={() => update((r) => ({ ...r, equipment: 'collar' }))} />
            <EquipmentCard kind="harness" label={t('settings.equipment.harness')} note={t('setup.equipment.harnessNote')} selected={record.equipment === 'harness'} onPress={() => update((r) => ({ ...r, equipment: 'harness' }))} />
          </View>
          <Button label={t('setup.next')} onPress={() => setPart('weights')} />
        </Panel>
      )}

      {part === 'weights' && (
        <Panel>
          <Text className="mb-1 font-display text-title text-ink">{t('setup.weights.title')}</Text>
          <Text className="text-body text-inkMuted">{t('setup.weights.help')}</Text>
          <WeightRow t={t} label={t('setup.weights.dog')} text={dogText} onText={setDogText} range={DOG_KG_RANGE} start={breedWeightMid(record.breed) ?? DOG_START_KG} hint={breedKg} />
          {hint && <Text className="mt-1 text-caption text-inkMuted">{hint}</Text>}
          <WeightRow t={t} label={t('setup.weights.handler')} text={handlerText} onText={setHandlerText} range={HANDLER_KG_RANGE} start={HANDLER_START_KG} />
          {error && <Text className="mt-2 text-body text-dangerText">{t(error)}</Text>}
          <Button label={t('setup.next')} onPress={saveWeights} />
          <Button
            label={t('setup.skip')}
            tone="quiet"
            onPress={() => {
              setError(null);
              setPart('questions');
            }}
          />
        </Panel>
      )}

      {part === 'questions' && (
        <Panel>
          <Text className="mb-1 font-display text-title text-ink">{withDogName(t('setup.triggers.title'), record.name, neutral)}</Text>
          <Text className="mb-1 text-body text-inkMuted">{t('setup.triggers.help')}</Text>
          <View className="flex-row flex-wrap">
            {QUESTION_KINDS.map((kind) => (
              <SelectChip key={kind} label={t(KIND_KEYS[kind])} selected={record.triggerProfile[kind] > 0} onPress={() => update((r) => selectKind(r, kind, r.triggerProfile[kind] === 0))} />
            ))}
          </View>
          {chips.map(({ kind, intensity }) => (
            <View key={kind} className="mt-3">
              <Text className="mb-1 text-body text-ink">{t(KIND_KEYS[kind])}</Text>
              <Segmented<IntensityId>
                label={t('setup.intensity.label').split('{kind}').join(t(KIND_KEYS[kind]))}
                options={INTENSITIES.map((a) => ({ id: a.id, label: t(ANSWER_KEYS[a.id]) }))}
                value={intensity}
                onChange={(id) => update((r) => setIntensity(r, kind, id))}
              />
            </View>
          ))}
          <Button label={t('setup.finish')} onPress={() => update(finishSetup)} />
        </Panel>
      )}
    </Screen>
  );
}
