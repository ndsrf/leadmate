import { Text } from 'react-native';
import type { Translate } from '../../i18n';
import type { LessonBlock } from '../lessons/lesson';
import { LessonImage } from './LessonImage';
import { LessonVideo } from './LessonVideo';
import { Panel } from './components';

/** One Lesson-style block: a heading, text, a tip, an image or a video. Lessons and Fixes are drawn with it. */
export function LessonBlockView({ t, block }: { t: Translate; block: LessonBlock }) {
  switch (block.type) {
    case 'heading':
      return <Text className="mt-6 font-display text-title text-ink" accessibilityRole="header">{t(block.text)}</Text>;
    case 'text':
      return <Text className="mt-4 text-bodyL text-ink">{t(block.text)}</Text>;
    case 'tip':
      return (
        <Panel tone="info" className="mt-6">
          <Text className="font-display text-caption text-infoText">{t('lesson.tipLabel')}</Text>
          <Text className="mt-1 text-body text-ink">{t(block.text)}</Text>
        </Panel>
      );
    case 'image':
      return <LessonImage t={t} block={block} />;
    case 'video':
      return <LessonVideo t={t} block={block} />;
  }
}

/** Blocks in declared order, in a single column. */
export function LessonBlocks({ t, blocks }: { t: Translate; blocks: readonly LessonBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => (
        <LessonBlockView key={i} t={t} block={block} />
      ))}
    </>
  );
}
