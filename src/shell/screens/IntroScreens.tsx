import { useEffect, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogRecord } from '../dogRecord';
import type { Language } from '../voice';
import { AGE_BANDS, type AgeBand, type Concern } from '../concerns';
import { AGE_KEYS, payoffKeys } from '../concernText';
import { MainConcernChips } from '../ui/ConcernPickers';
import { Button } from '../Overlays';
import { BREEDS, BREEDS_COLLAPSED, breedOf, DEFAULT_BREED, type BreedId } from '../onboarding/breeds';
import { withDogName } from '../onboarding/intro';
import { DOG_COAT_NAMES, type DogCoat } from '../onboarding/look';
import { cleanDogName, DOG_NAME_MAX } from '../onboarding/name';
import { BreedArt } from '../ui/BreedArt';
import { LightRegion, Panel, Raised, TextField } from '../ui/components';
import { BreedTile, CoatSwatch, SelectChip, StepHeader } from '../ui/Pickers';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';
import { Screen } from './Screen';

/** The Dog in its breed and coat on a sky card, so each pick shows at once. */
function DogPreview({ t, breed, coat }: { t: Translate; breed: BreedId; coat: DogCoat }) {
  const color = usePalette();
  const label = t('dog.look.of').split('{breed}').join(t(`breed.${breed}`)).split('{coat}').join(t(`coat.${coat}`));
  return (
    <Raised fill={color.sky} radius={theme.radius.lg} offset={theme.depth.sm.x} className="mb-4" faceStyle={{ alignItems: 'center', paddingVertical: theme.space[3] }}>
      <BreedArt breed={breed} coat={coat} width={200} label={label} />
    </Raised>
  );
}

/** The Dog's breed, coat and name, in two parts ("1 of 2" breed and coat, "2 of 2" name and life stage); a blank name does not continue. */
export function DogLookScreen({
  t,
  record,
  onDone,
}: {
  t: Translate;
  record: DogRecord;
  onDone: (name: string, coat: DogCoat, breed: BreedId, ageBand: AgeBand | null) => void;
}) {
  const [part, setPart] = useState<'look' | 'name'>('look');

  useEffect(() => {
    if (part !== 'name') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setPart('look');
      return true;
    });
    return () => sub.remove();
  }, [part]);
  const [name, setName] = useState(record.name);
  const [breed, setBreed] = useState<BreedId>(record.breed);
  const [coat, setCoat] = useState<DogCoat>(record.coat);
  const [ageBand, setAgeBandState] = useState<AgeBand | null>(record.ageBand);
  // a coat the user picked is theirs: choosing another breed afterwards no longer replaces it
  const [coatTouched, setCoatTouched] = useState(false);
  // until a breed is picked the grid shows no selection (the Dog is a Mestizo) and stays at its first tiles
  const [picked, setPicked] = useState(record.breed !== DEFAULT_BREED);
  const [expanded, setExpanded] = useState(false);
  const [missing, setMissing] = useState(false);

  const pick = (id: BreedId) => {
    setBreed(id);
    setPicked(true);
    if (!coatTouched) setCoat(breedOf(id).defaultCoat);
  };
  const next = () => {
    if (cleanDogName(name) === null) return setMissing(true);
    onDone(name, coat, breed, ageBand);
  };
  // the collapsed grid always shows the chosen breed, even one that is further down the list
  const first = BREEDS.slice(0, BREEDS_COLLAPSED);
  const shown = expanded || !picked || first.some((b) => b.id === breed) ? (expanded ? BREEDS : first) : [...first, breedOf(breed)];

  return (
    <Screen>
      <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
        {part === 'look' ? t('dog.title') : t('dog.name.title')}
      </Text>
      <StepHeader t={t} step={part === 'look' ? 1 : 2} total={2} onBack={part === 'name' ? () => setPart('look') : undefined} />
      <DogPreview t={t} breed={breed} coat={coat} />

      {part === 'look' && (
        <Panel>
          <Text className="mb-1 font-display text-title text-ink">{t('dog.breed.title')}</Text>
          <Text className="mb-2 text-body text-inkMuted">{t('dog.breed.help')}</Text>
          <View className="flex-row flex-wrap" style={{ gap: theme.space[2] }}>
            {shown.map((b) => (
              <View key={b.id} style={{ flexBasis: '31%', flexGrow: 1, maxWidth: '33%' }}>
                <BreedTile breed={b.id} coat={coat} label={t(`breed.${b.id}`)} selected={picked && breed === b.id} onPress={() => pick(b.id)} />
              </View>
            ))}
          </View>
          <Button label={t(expanded ? 'dog.breed.less' : 'dog.breed.more')} tone="quiet" onPress={() => setExpanded(!expanded)} />
          <Text className="mb-1 mt-2 font-display text-title text-ink">{t('setup.look.title')}</Text>
          <Text className="mb-2 text-body text-inkMuted">{t('setup.look.help')}</Text>
          <View className="flex-row flex-wrap" style={{ gap: theme.space[3] }}>
            {DOG_COAT_NAMES.map((c) => (
              <CoatSwatch
                key={c}
                coat={c}
                label={t(`coat.${c}`)}
                selected={coat === c}
                onPress={() => {
                  setCoat(c);
                  setCoatTouched(true);
                }}
              />
            ))}
          </View>
          <Button label={t('setup.next')} onPress={() => setPart('name')} />
        </Panel>
      )}

      {part === 'name' && (
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
          <Text className="mt-4 font-display text-bodyL text-ink">{t('setup.age.label')}</Text>
          <View className="mb-4 flex-row flex-wrap">
            {AGE_BANDS.map((band: AgeBand) => (
              <SelectChip
                key={band}
                label={t(AGE_KEYS[band])}
                selected={ageBand === band}
                onPress={() => setAgeBandState(ageBand === band ? null : band)}
              />
            ))}
          </View>
          <Button label={t('setup.next')} onPress={next} />
        </Panel>
      )}
    </Screen>
  );
}

/** Before the taste Stage: what is about to happen and the goal, text only; the Stage starts when the button is pressed. */
export function TasteBriefScreen({ t, name, onStart }: { t: Translate; name: string; onStart: () => void }) {
  const neutral = t('dog.neutral');
  return (
    <Screen>
      <Panel>
        <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
          {withDogName(t('tasteBrief.title'), name, neutral)}
        </Text>
        <Text className="mb-2 text-bodyL text-ink">{withDogName(t('tasteBrief.walk'), name, neutral)}</Text>
        <Text className="mb-2 text-bodyL text-ink">{withDogName(t('tasteBrief.goal'), name, neutral)}</Text>
        <Text className="mb-4 text-bodyL text-inkMuted">{withDogName(t('tasteBrief.drag'), name, neutral)}</Text>
        <Button label={t('tasteBrief.start')} onPress={onStart} />
      </Panel>
    </Screen>
  );
}

/** Over the taste Stage once the Dog has reacted: the same text whatever the result, naming the Dog. The Stage stays visible above it. */
export function PayoffOverlay({ t, name, mainConcerns = [], onContinue }: { t: Translate; name: string; mainConcerns?: readonly Concern[]; onContinue: () => void }) {
  const neutral = t('dog.neutral');
  const keys = payoffKeys(mainConcerns);
  // drawn over the running Stage, so it stays Light whatever the Appearance
  return (
    <LightRegion className="absolute inset-0 justify-end p-4">
      <Panel className="w-full max-w-md self-center">
        <Text className="mb-2 font-display text-displayM text-ink" accessibilityRole="header">
          {withDogName(t('payoff.title'), name, neutral)}
        </Text>
        <Text className="mb-2 text-bodyL text-ink">{withDogName(t(keys.reacted), name, neutral)}</Text>
        <Text className="mb-4 text-bodyL text-inkMuted">{withDogName(t(keys.body), name, neutral)}</Text>
        <Button label={t('payoff.continue')} onPress={onContinue} />
      </Panel>
    </LightRegion>
  );
}

/** The main concern question: up to three choices, asked right after the Dog's name and look, and skippable. */
export function ConcernScreen({ t, record, onDone }: { t: Translate; record: DogRecord; onDone: (concerns: Concern[]) => void }) {
  const [picked, setPicked] = useState<Concern[]>(record.mainConcerns);
  return (
    <Screen>
      <Text className="mb-3 font-display text-displayM text-ink" accessibilityRole="header">
        {withDogName(t('concern.title'), record.name, t('dog.neutral'))}
      </Text>
      <Panel>
        <Text className="mb-1 text-body text-inkMuted">{t('concern.help')}</Text>
        <MainConcernChips t={t} value={picked} onToggle={(c) => setPicked((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]))} />
        <Button label={t('concern.continue')} onPress={() => onDone(picked)} />
        <Button label={t('concern.skip')} tone="quiet" onPress={() => onDone([])} />
      </Panel>
    </Screen>
  );
}

/** The language selection step in the funnel with Spanish and English options. */
export function LanguageScreen({
  t,
  selectedLanguage,
  onSelectLanguage,
  onDone,
  onBack,
}: {
  t: Translate;
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onDone: (lang: Language) => void;
  onBack: () => void;
}) {
  const [current, setCurrent] = useState<Language>(selectedLanguage);
  const color = usePalette();

  const choose = (lang: Language) => {
    setCurrent(lang);
    onSelectLanguage(lang);
  };

  return (
    <Screen>
      <View className="mb-3 flex-row items-center" style={{ gap: theme.space[2] }}>
        {onBack ? (
          <Pressable
            onPress={() => handlePress(onBack)}
            accessibilityRole="button"
            accessibilityLabel={t('step.back')}
            style={{ width: theme.size.touchMin, height: theme.size.touchMin, alignItems: 'center', justifyContent: 'center' }}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
              <Path d="M15 5l-7 7 7 7" fill="none" stroke={color.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        ) : null}
        <Text className="font-display text-displayM text-ink" accessibilityRole="header">
          {t('language.title')}
        </Text>
      </View>
      <Panel>
        <Text className="mb-4 text-body text-inkMuted">{t('language.subtitle')}</Text>
        <View className="mb-6 flex-row flex-wrap" style={{ gap: theme.space[2] }}>
          <SelectChip label={t('language.es')} selected={current === 'es'} onPress={() => choose('es')} />
          <SelectChip label={t('language.en')} selected={current === 'en'} onPress={() => choose('en')} />
        </View>
        <Button label={t('language.continue')} onPress={() => onDone(current)} />
      </Panel>
    </Screen>
  );
}
