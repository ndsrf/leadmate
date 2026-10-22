import { useState } from 'react';
import { Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { DogRecord } from '../dogRecord';
import { Button } from '../Overlays';
import { withDogName } from '../onboarding/intro';
import { DOG_COAT_NAMES, type DogCoat } from '../onboarding/look';
import { cleanDogName, DOG_NAME_MAX } from '../onboarding/name';
import { Choice, Panel, TextField } from '../ui/components';
import { Screen } from './Screen';

/** The Dog's name and coat; a blank name does not continue. */
export function DogLookScreen({ t, record, onDone }: { t: Translate; record: DogRecord; onDone: (name: string, coat: DogCoat) => void }) {
  const [name, setName] = useState(record.name);
  const [coat, setCoat] = useState<DogCoat>(record.coat);
  const [missing, setMissing] = useState(false);

  const next = () => {
    if (cleanDogName(name) === null) return setMissing(true);
    onDone(name, coat);
  };

  return (
    <Screen>
      <Text className="mb-4 font-display text-displayM text-ink" accessibilityRole="header">
        {t('dog.title')}
      </Text>
      <Panel>
        <TextField
          label={t('dog.name')}
          value={name}
          onChangeText={(v) => {
            setName(v);
            setMissing(false);
          }}
          maxLength={DOG_NAME_MAX}
          autoCapitalize="words"
          returnKeyType="done"
          onSubmitEditing={next}
        />
        {missing && <Text className="mt-2 text-body text-dangerText">{t('dog.nameMissing')}</Text>}
        <Text className="mb-1 mt-4 font-display text-title text-ink">{t('setup.look.title')}</Text>
        <Text className="text-body text-inkMuted">{t('setup.look.help')}</Text>
        <View className="flex-row flex-wrap">
          {DOG_COAT_NAMES.map((c) => (
            <Choice key={c} label={t(`coat.${c}`)} selected={coat === c} onPress={() => setCoat(c)} />
          ))}
        </View>
        <Button label={t('setup.next')} onPress={next} />
      </Panel>
    </Screen>
  );
}

/** Over the taste Stage once the Dog has reacted: the same text whatever the result, naming the Dog. The Stage stays visible above it. */
export function PayoffOverlay({ t, name, onContinue }: { t: Translate; name: string; onContinue: () => void }) {
  const neutral = t('dog.neutral');
  return (
    <View className="absolute inset-0 justify-end p-4">
      <Panel className="w-full max-w-md self-center">
        <Text className="mb-2 font-display text-displayM text-ink" accessibilityRole="header">
          {withDogName(t('payoff.title'), name, neutral)}
        </Text>
        <Text className="mb-2 text-bodyL text-ink">{withDogName(t('payoff.reacted'), name, neutral)}</Text>
        <Text className="mb-4 text-bodyL text-inkMuted">{withDogName(t('payoff.body'), name, neutral)}</Text>
        <Button label={t('payoff.continue')} onPress={onContinue} />
      </Panel>
    </View>
  );
}
