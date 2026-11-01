import { View, Text } from 'react-native';
import type { Translate } from '../../i18n';
import { AGE_BANDS, CONCERNS, HOME_CONCERNS, MAX_MAIN_CONCERNS, SEXES, type AgeBand, type Concern, type Sex } from '../concerns';
import { AGE_KEYS, CONCERN_KEYS, SEX_KEYS } from '../concernText';
import { setAgeBand, setSex, type DogRecord } from '../dogRecord';
import { homeChipsOf, INTENSITIES, selectHomeConcern, setHomeIntensity, type AnswerId, type IntensityId } from '../onboarding/questionnaire';
import { Segmented, SelectChip } from './Pickers';

const ANSWER_KEYS = {
  never: 'setup.answer.never',
  little: 'setup.answer.little',
  often: 'setup.answer.often',
  alot: 'setup.answer.alot',
} as const satisfies Record<AnswerId, string>;

type Update = (fn: (r: DogRecord) => DogRecord) => void;

/** The Main Concerns: up to three of all Concerns, in the order picked. Tapping a picked one drops it; once three are picked the rest wait. */
export function MainConcernChips({ t, value, onToggle }: { t: Translate; value: readonly Concern[]; onToggle: (concern: Concern) => void }) {
  return (
    <View className="flex-row flex-wrap">
      {CONCERNS.map((c) => (
        <SelectChip key={c} label={t(CONCERN_KEYS[c])} selected={value.includes(c)} onPress={() => (value.includes(c) || value.length < MAX_MAIN_CONCERNS) && onToggle(c)} />
      ))}
    </View>
  );
}

/** The home-behaviour concerns as chips, each selected one with its intensity. */
export function HomeConcernChips({ t, record, update }: { t: Translate; record: DogRecord; update: Update }) {
  const chips = homeChipsOf(record.homeConcerns);
  return (
    <>
      <View className="flex-row flex-wrap">
        {HOME_CONCERNS.map((c) => (
          <SelectChip key={c} label={t(CONCERN_KEYS[c])} selected={record.homeConcerns[c] !== undefined} onPress={() => update((r) => selectHomeConcern(r, c, r.homeConcerns[c] === undefined))} />
        ))}
      </View>
      {chips.map(({ concern, intensity }) => (
        <View key={concern} className="mt-3">
          <Text className="mb-1 text-body text-ink">{t(CONCERN_KEYS[concern])}</Text>
          <Segmented<IntensityId>
            label={t('setup.intensity.label').split('{kind}').join(t(CONCERN_KEYS[concern]))}
            options={INTENSITIES.map((a) => ({ id: a.id, label: t(ANSWER_KEYS[a.id]) }))}
            value={intensity}
            onChange={(id) => update((r) => setHomeIntensity(r, concern, id))}
          />
        </View>
      ))}
    </>
  );
}

/** The Dog's age band and sex, each skippable; tapping the chosen one clears it. */
export function AgeSexChips({ t, record, update }: { t: Translate; record: DogRecord; update: Update }) {
  return (
    <>
      <Text className="mt-2 font-display text-bodyL text-ink">{t('setup.age.label')}</Text>
      <View className="flex-row flex-wrap">
        {AGE_BANDS.map((band: AgeBand) => (
          <SelectChip key={band} label={t(AGE_KEYS[band])} selected={record.ageBand === band} onPress={() => update((r) => setAgeBand(r, r.ageBand === band ? null : band))} />
        ))}
      </View>
      <Text className="mt-4 font-display text-bodyL text-ink">{t('setup.sex.label')}</Text>
      <View className="flex-row flex-wrap">
        {SEXES.map((sex: Sex) => (
          <SelectChip key={sex} label={t(SEX_KEYS[sex])} selected={record.sex === sex} onPress={() => update((r) => setSex(r, r.sex === sex ? null : sex))} />
        ))}
      </View>
    </>
  );
}
