import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Translate } from '../../i18n';
import type { HomeConcern, HomeConcerns } from '../concerns';
import { CONCERN_KEYS } from '../concernText';
import { behaviourActions, homeBehaviourEntries, type BehaviourAction, type HomeBehaviourDone, type HomeBehaviourEntry } from '../homeBehaviours';
import { Button } from '../Overlays';
import { Badge, Panel, Raised } from '../ui/components';
import { handlePress } from '../ui/press';
import { theme, usePalette } from '../ui/theme';
import type { Stop } from '../world';

function behaviourLabel(t: Translate, key: 'home.notConcern' | 'home.concern', concern: HomeConcern): string {
  return t(key).split('{behaviour}').join(t(CONCERN_KEYS[concern]));
}

const PART_KEYS = { lesson: 'home.part.lesson', node: 'home.part.exercise', mission: 'home.part.mission' } as const;
const PART_KIND = { lesson: 'lesson', node: 'node', mission: 'mission' } as const;

/** The buttons of an opened Home Behaviour: Lesson, Exercise and Mission, only for the parts that exist, all enabled. */
export function BehaviourActions({ t, entry, done, onOpen, onBecomeConcern }: { t: Translate; entry: HomeBehaviourEntry; done: HomeBehaviourDone; onOpen: (stop: Stop) => void; onBecomeConcern: () => void }) {
  const actions: BehaviourAction[] = behaviourActions(entry, done);
  return (
    <View>
      {actions.map((a) => (
        <Button
          key={a.part}
          label={a.done ? `${t(PART_KEYS[a.part])} · ${t('home.part.done')}` : t(PART_KEYS[a.part])}
          tone={a.part === 'lesson' ? 'secondary' : 'primary'}
          disabled={!a.enabled}
          onPress={() => onOpen({ kind: PART_KIND[a.part], id: a.id })}
        />
      ))}
      {!entry.isConcern && <Button label={t('home.becomeConcern')} tone="quiet" onPress={onBecomeConcern} />}
    </View>
  );
}

/** One Home Behaviour: a folded header row while it is not a Concern, tappable to open; a "coming soon" body when it has no Lesson. */
function BehaviourRow({ t, entry, done, open, onToggle, onOpen, onBecomeConcern }: { t: Translate; entry: HomeBehaviourEntry; done: HomeBehaviourDone; open: boolean; onToggle: () => void; onOpen: (stop: Stop) => void; onBecomeConcern: () => void }) {
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
          {entry.comingSoon ? (
            <>
              <Text className="text-body text-inkMuted">{t('home.comingSoon')}</Text>
              {!entry.isConcern && <Button label={t('home.becomeConcern')} tone="quiet" onPress={onBecomeConcern} />}
            </>
          ) : (
            <BehaviourActions t={t} entry={entry} done={done} onOpen={onOpen} onBecomeConcern={onBecomeConcern} />
          )}
        </View>
      )}
    </View>
  );
}

/**
 * Other Home Behaviours (ADR 0021): the Home Stretches that are not Stretches of World 1 for this Dog, between World 1 and
 * World 2. It gates and counts nothing, is folded by default and is hidden when empty.
 */
export function HomeBehavioursSection({ t, concerns, inWorld, done, defaultExpanded = false, onOpen, onBecomeConcern }: { t: Translate; defaultExpanded?: boolean; concerns: HomeConcerns; inWorld?: (concern: HomeConcern) => boolean; done: HomeBehaviourDone; onOpen: (stop: Stop) => void; onBecomeConcern: (concern: HomeConcern) => void }) {
  const [open, setOpen] = useState<Partial<Record<HomeConcern, boolean>>>({});
  const [expanded, setExpanded] = useState(defaultExpanded);
  const entries = homeBehaviourEntries(concerns, inWorld);
  if (entries.length === 0) return null;
  return (
    <Panel className="mb-5">
      <Pressable onPress={() => handlePress(() => setExpanded((e) => !e))} accessibilityRole="button" accessibilityLabel={`${t('home.title')}. ${t(expanded ? 'home.close' : 'home.open')}`} accessibilityState={{ expanded }}>
        <View className="flex-row items-center">
          <Text className="flex-1 font-display text-title text-ink">{t('home.title')}</Text>
          <Text className="font-display text-body text-inkMuted">{expanded ? '▲' : '▼'}</Text>
        </View>
      </Pressable>
      {expanded && (
        <View className="mt-2">
          <Text className="mb-3 text-caption text-inkMuted">{t('home.help')}</Text>
          {entries.map((entry) => (
            <BehaviourRow key={entry.concern} t={t} entry={entry} done={done} onOpen={onOpen} open={!!open[entry.concern]} onToggle={() => setOpen((o) => ({ ...o, [entry.concern]: !o[entry.concern] }))} onBecomeConcern={() => onBecomeConcern(entry.concern)} />
          ))}
        </View>
      )}
    </Panel>
  );
}
