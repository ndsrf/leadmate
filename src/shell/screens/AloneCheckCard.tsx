import { Text } from 'react-native';
import type { Translate } from '../../i18n';
import type { AloneAnswer } from '../dogRecord';
import { withDogName } from '../onboarding/intro';
import { Button } from '../Overlays';
import { Panel } from '../ui/components';

/** The answers in the order shown, each with the text that names it. */
const ANSWERS = [
  { answer: 'ok', label: 'alone.check.ok' },
  { answer: 'sometimes', label: 'alone.check.sometimes' },
  { answer: 'bad', label: 'alone.check.bad' },
  { answer: 'unknown', label: 'alone.check.unknown' },
] as const satisfies readonly { answer: AloneAnswer; label: string }[];

/**
 * The one-time question about how the Dog copes with being left alone. It is only a question: the map decides when
 * to show it (`shouldAskAlone`) and answering is not progress. Leaving it unanswered blocks nothing.
 */
export function AloneCheckCard({ t, dogName, onAnswer }: { t: Translate; dogName?: string; onAnswer: (answer: AloneAnswer) => void }) {
  const neutral = t('dog.neutral');
  const name = dogName || '';
  return (
    <Panel tone="info" className="mb-5">
      <Text accessibilityRole="header" className="font-display text-label text-inkMuted">
        {withDogName(t('alone.check.heading'), name, neutral)}
      </Text>
      <Text className="mt-1 font-display text-title text-ink">{withDogName(t('alone.check.question'), name, neutral)}</Text>
      <Text className="mb-3 mt-2 text-caption text-inkMuted">{t('alone.check.hint')}</Text>
      {ANSWERS.map(({ answer, label }) => (
        <Button key={answer} label={t(label)} tone={answer === 'unknown' ? 'quiet' : 'secondary'} onPress={() => onAnswer(answer)} />
      ))}
    </Panel>
  );
}
