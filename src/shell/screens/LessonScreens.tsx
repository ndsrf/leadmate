import { useState } from 'react';
import { Pressable, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import type { Translate } from '../../i18n';
import { libraryEntries, type LessonDef } from '../lessons/lesson';
import { lessonItems, readingProgress, type LessonItem } from '../lessons/lessonRun';
import { Button } from '../Overlays';
import { Badge, Panel, ProgressBar } from '../ui/components';
import { LessonImage } from '../ui/LessonImage';
import { LessonVideo } from '../ui/LessonVideo';
import { handlePress } from '../ui/press';
import { theme } from '../ui/theme';
import { Screen } from './Screen';

/** The Theory Library: every Lesson in order with its day, reading time and read state; the one for today comes first. */
export function LibraryScreen({ t, lessons, readIds, day, onOpen, onBack }: { t: Translate; lessons: readonly LessonDef[]; readIds: readonly string[]; day: number | null; onOpen: (lesson: LessonDef) => void; onBack: () => void }) {
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
      <Text className="mb-3 text-body text-inkMuted">{t('library.subtitle')}</Text>
      {libraryEntries(lessons, readIds, day).map(({ lesson, read, today }) => {
        const state = t(read ? 'library.read' : 'library.unread');
        const title = t(lesson.title);
        return (
          <Pressable
            key={lesson.id}
            onPress={() => handlePress(() => onOpen(lesson))}
            accessibilityRole="button"
            accessibilityLabel={`${t('library.day')} ${lesson.day}. ${title}. ${lesson.minutes} ${t('lesson.minutes')}. ${state}.${today ? ` ${t('library.today')}.` : ''}`}
            style={{ marginBottom: theme.space[4], minHeight: theme.size.touchMin }}
          >
            <Panel tone={today ? 'warn' : 'surface'}>
              <View className="flex-row flex-wrap items-center" style={{ gap: theme.space[2] }}>
                <Badge label={`${t('library.day')} ${lesson.day}`} tone="info" />
                {today && <Badge label={t('library.today')} tone="accent" />}
                {lesson.placeholder && <Badge label={t('media.badge.placeholder')} tone="warn" />}
              </View>
              <Text className="mt-2 font-display text-title text-ink">{title}</Text>
              <View className="mt-1 flex-row items-center" style={{ gap: theme.space[3] }}>
                <Text className="text-caption text-inkMuted">{`${lesson.minutes} ${t('lesson.minutes')}`}</Text>
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
  switch (item.type) {
    case 'heading':
      return <Text className="mt-6 font-display text-title text-ink" accessibilityRole="header">{t(item.text)}</Text>;
    case 'text':
      return <Text className="mt-4 text-bodyL text-ink">{t(item.text)}</Text>;
    case 'tip':
      return (
        <Panel tone="info" className="mt-6">
          <Text className="font-display text-caption text-infoText">{t('lesson.tipLabel')}</Text>
          <Text className="mt-1 text-body text-ink">{t(item.text)}</Text>
        </Panel>
      );
    case 'image':
      return <LessonImage t={t} block={item} />;
    case 'video':
      return <LessonVideo t={t} block={item} />;
    case 'done':
      return (
        <View className="mt-8">
          <Button label={t('lesson.done')} onPress={onDone} />
        </View>
      );
  }
}

/**
 * One Lesson as a single scrollable column. "Done" is the last item (not a fixed control), so it can only be
 * reached by reading to the end; tapping it marks the Lesson read. Leaving earlier leaves it unread.
 */
export function LessonScreen({ t, lesson, onDone, onBack }: { t: Translate; lesson: LessonDef; onDone: () => void; onBack: () => void }) {
  const [progress, setProgress] = useState(0);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    setProgress(readingProgress(contentOffset.y, contentSize.height, layoutMeasurement.height));
  };
  const header = (
    <View>
      <View className="flex-row items-center justify-between" style={{ gap: theme.space[2] }}>
        <Button label={t('lesson.back')} tone="secondary" onPress={onBack} />
        {lesson.placeholder && <Badge label={t('lesson.placeholder')} tone="warn" />}
      </View>
      <View className="mt-2" accessibilityLabel={t('lesson.progress')}>
        <ProgressBar value={progress} max={100} />
      </View>
    </View>
  );
  return (
    <Screen header={header} onScroll={onScroll}>
      <Text className="font-display text-displayM text-ink" accessibilityRole="header">{t(lesson.title)}</Text>
      {lessonItems(lesson).map((item, i) => (
        <Item key={i} t={t} item={item} onDone={onDone} />
      ))}
    </Screen>
  );
}
