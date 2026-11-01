import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { HomeConcern, HomeConcerns } from '../concerns';
import { CONCERN_KEYS } from '../concernText';
import { homeBehaviourEntries, type HomeBehaviourEntry } from '../homeBehaviours';
import { Button } from '../Overlays';
import { Badge, Panel, Raised } from '../ui/components';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';

function behaviourLabel(t: Translate, key: 'home.notConcern' | 'home.concern', concern: HomeConcern): string {
  return t(key).split('{behaviour}').join(t(CONCERN_KEYS[concern]));
}

/** One Home Behaviour: a folded header row while it is not a Concern, tappable to open; a "coming soon" body when it has no Lesson. */
function BehaviourRow({ t, entry, open, onToggle, onBecomeConcern }: { t: Translate; entry: HomeBehaviourEntry; open: boolean; onToggle: () => void; onBecomeConcern: () => void }) {
  const color = usePalette();
  const label = behaviourLabel(t, entry.isConcern ? 'home.concern' : 'home.notConcern', entry.concern);
  return (
    <View className="mb-2">
      <Pressable onPress={() => handlePress(onToggle)} accessibilityRole="button" accessibilityLabel={`${label}. ${t(open ? 'home.close' : 'home.open')}`} accessibilityState={{ expanded: open }}>
        <Raised fill={entry.isConcern ? color.surface : color.surfaceSunken} radius={theme.radius.lg} offset={theme.depth.rest.x} faceStyle={{ flexDirection: 'row', alignItems: 'center', gap: theme.space[3], paddingHorizontal: 14, paddingVertical: 12 }}>
          <View className="shrink flex-1">
            <Text className={`font-display text-body ${entry.isConcern ? 'text-ink' : 'text-inkMuted'}`}>{label}</Text>
          </View>
          {entry.isConcern && <Badge label={t(`setup.answer.${entry.level === 1 ? 'little' : entry.level === 2 ? 'often' : 'alot'}`)} tone="accent" />}
          <Text className="font-display text-body text-inkMuted">{open ? '▲' : '▼'}</Text>
        </Raised>
      </Pressable>
      {open && (
        <View className="mt-2 px-2">
          {entry.comingSoon && <Text className="text-body text-inkMuted">{t('home.comingSoon')}</Text>}
          {!entry.isConcern && <Button label={t('home.becomeConcern')} tone="quiet" onPress={onBecomeConcern} />}
        </View>
      )}
    </View>
  );
}

/** The Home Behaviours section of the World Map: one Stretch per Home Behaviour, none of them gating or counting in the trail. */
export function HomeBehavioursSection({ t, concerns, onBecomeConcern }: { t: Translate; concerns: HomeConcerns; onBecomeConcern: (concern: HomeConcern) => void }) {
  const [open, setOpen] = useState<Partial<Record<HomeConcern, boolean>>>({});
  return (
    <Panel className="mb-5">
      <Text className="mb-1 font-display text-title text-ink">{t('home.title')}</Text>
      <Text className="mb-3 text-caption text-inkMuted">{t('home.help')}</Text>
      {homeBehaviourEntries(concerns).map((entry) => (
        <BehaviourRow key={entry.concern} t={t} entry={entry} open={!!open[entry.concern]} onToggle={() => setOpen((o) => ({ ...o, [entry.concern]: !o[entry.concern] }))} onBecomeConcern={() => onBecomeConcern(entry.concern)} />
      ))}
    </Panel>
  );
}
