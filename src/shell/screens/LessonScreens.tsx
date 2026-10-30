import { useState } from 'react';
import { Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import type { Translate } from '../../i18n';
import { libraryEntries, type LessonDef } from '../lessons/lesson';
import { lessonItems, readingProgress, type LessonItem } from '../lessons/lessonRun';
import { fixEntries, fixEntryLabel, lessonKindLabel, lessonPlaceLabel, libraryEntryLabel, readingMinutes, type FixEntry } from '../lessons/libraryText';
import type { SeenFix } from '../missions/mission';
import { Button } from '../Overlays';
import { Badge, Panel, ProgressBar } from '../ui/components';
import { LessonBlockView } from '../ui/LessonBlocks';
import { handlePress } from '../ui/press';
import { theme } from '../ui/theme';
import { Screen } from './Screen';

/**
 * The Theory Library: every Lesson in order with its place (day or trail Stretch), kind, reading time and read
 * state; the one for today comes first. "Tus ajustes" lists the Fixes the user has been shown, once there are any.
 */
export function LibraryScreen({
  t,
  lessons,
  readIds,
  day,
  seenFixes = [],
  onOpen,
  onOpenFix,
  onBack,
}: {
  t: Translate;
  lessons: readonly LessonDef[];
  readIds: readonly string[];
  day: number | null;
  seenFixes?: readonly SeenFix[];
  onOpen: (lesson: LessonDef) => void;
  onOpenFix?: (entry: FixEntry) => void;
  onBack: () => void;
}) {
  const fixes = fixEntries(seenFixes);
  const header = (
    <View>
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <Text className="shrink font-display text-title text-ink" accessibilityRole="header">{t('library.title')}</Text>
        <Button label={t('library.back')} tone="secondary" onPress={onBack} />
      </View>
    </View>
  );
  return (
    <Screen header={header}>
      {fixes.length > 0 && (
        <View className="mb-4">
          <Text className="font-display text-title text-ink" accessibilityRole="header">{t('library.fixes')}</Text>
          <Text className="mb-3 text-body text-inkMuted">{t('library.fixes.subtitle')}</Text>
          {fixes.map((entry) => (
            <Pressable
              key={entry.fix.id}
              onPress={() => handlePress(() => onOpenFix?.(entry))}
              accessibilityRole="button"
              accessibilityLabel={`${t('fix.title')}. ${fixEntryLabel(entry, t)}.`}
              style={{ marginBottom: theme.space[3], minHeight: theme.size.touchMin }}
            >
              <Panel>
                <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
                  <Badge label={t('fix.title')} tone="accent" />
                  {entry.fix.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
                </View>
                <Text className="mt-2 font-display text-body text-ink">{fixEntryLabel(entry, t)}</Text>
              </Panel>
            </Pressable>
          ))}
        </View>
      )}
      <Text className="mb-3 text-body text-inkMuted">{t('library.subtitle')}</Text>
      {libraryEntries(lessons, readIds, day).map((entry) => {
        const { lesson, read, today } = entry;
        const state = t(read ? 'library.read' : 'library.unread');
        const place = lessonPlaceLabel(lesson, t);
        return (
          <Pressable
            key={lesson.id}
            onPress={() => handlePress(() => onOpen(lesson))}
            accessibilityRole="button"
            accessibilityLabel={libraryEntryLabel(entry, t)}
            style={{ marginBottom: theme.space[4], minHeight: theme.size.touchMin }}
          >
            <Panel tone={today ? 'warn' : 'surface'}>
              <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
                {place !== '' && <Badge label={place} tone="info" />}
                <Badge label={lessonKindLabel(lesson, t)} />
                {today && <Badge label={t('library.today')} tone="accent" />}
                {lesson.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
              </View>
              <Text className="mt-2 font-display text-title text-ink">{t(lesson.title)}</Text>
              <View className="mt-1 flex-row items-center" style={{ gap: theme.space[3] }}>
                <Text className="text-caption text-inkMuted">{`${readingMinutes(lesson, t)} ${t('lesson.minutes')}`}</Text>
                <Text className="font-display text-caption text-ink">{`${read ? '✓' : '○'} ${state}`}</Text>
              </View>
            </Panel>
          </Pressable>
        );
      })}
    </Screen>
  );
}

function Item({ t, item, onDone }: { t: Translate; item: LessonItem; onDone: () => void }) {
  if (item.type !== 'done') return <LessonBlockView t={t} block={item} />;
  return (
    <View className="mt-8">
      <Button label={t('lesson.done')} onPress={onDone} />
    </View>
  );
}

/**
 * One Lesson as a single scrollable column. "Done" is the last item (not a fixed control), so it can only be
 * reached by reading to the end; tapping it marks the Lesson read. Leaving earlier leaves it unread. `backLabel`
 * names where Back goes: the Library, or the map for a Lesson opened from its Stop.
 */
export function LessonScreen({ t, lesson, onDone, onBack, backLabel = t('lesson.back') }: { t: Translate; lesson: LessonDef; onDone: () => void; onBack: () => void; backLabel?: string }) {
  const [progress, setProgress] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setProgress(readingProgress(contentOffset.y, contentSize.height, layoutMeasurement.height));
  };
  const place = lessonPlaceLabel(lesson, t);
  const header = (
    <View>
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <Button label={backLabel} tone="secondary" onPress={onBack} />
        {lesson.placeholder && <Badge label={t('lesson.placeholder')} tone="warn" />}
      </View>
      <View className="mt-2" accessibilityLabel={t('lesson.progress')}>
        <ProgressBar value={progress} max={100} />
      </View>
    </View>
  );
  return (
    <Screen header={header} onScroll={onScroll}>
      <View className="mb-2 flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
        <Badge label={lessonKindLabel(lesson, t)} />
        {place !== '' && <Badge label={place} tone="info" />}
      </View>
      <Text className="font-display text-displayM text-ink" accessibilityRole="header">{t(lesson.title)}</Text>
      {lessonItems(lesson).map((item, i) => (
        <Item key={i} t={t} item={item} onDone={onDone} />
      ))}
    </Screen>
  );
}
