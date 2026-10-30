import { Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { CompareSide, LessonBlock } from '../lessons/lesson';
import { LessonImage, LessonPicture } from './LessonImage';
import { LessonVideo } from './LessonVideo';
import { Panel, Raised } from './components';
import { theme, usePalette } from './theme';

/** One Lesson-style block: a heading, text, a tip, an image, a video, steps, an example, a do / don't or takeaways. Lessons and Fixes are drawn with it. */
export function LessonBlockView({ t, block }: { t: Translate; block: LessonBlock }) {
  const color = usePalette();
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
    case 'steps':
      return (
        <View className="mt-4" accessibilityRole="list">
          {block.items.map((item, i) => (
            <View key={item} className="mt-2 flex-row" style={{ gap: theme.space[3] }}>
              <View className="items-center justify-center rounded-game-pill bg-accent" style={{ width: 32, height: 32, borderWidth: theme.border.ink, borderColor: color.ink }}>
                <Text className="font-display text-body text-onAccent" importantForAccessibility="no" accessibilityElementsHidden>{String(i + 1)}</Text>
              </View>
              <Text className="flex-1 text-bodyL text-ink" accessibilityLabel={`${i + 1}. ${t(item)}`}>{t(item)}</Text>
            </View>
          ))}
        </View>
      );
    case 'example':
      return (
        <Panel tone="warn" className="mt-6">
          <Text className="font-display text-caption text-ink">{t('lesson.exampleLabel')}</Text>
          <Text className="mt-1 font-display text-title text-ink">{t(block.title)}</Text>
          <Text className="mt-2 text-body text-ink">{t(block.text)}</Text>
        </Panel>
      );
    case 'compare':
      // side by side when there is room, stacked "do" first at narrow widths
      return (
        <View className="mt-6 flex-row flex-wrap" style={{ gap: theme.space[3] }}>
          <CompareCard t={t} side={block.do} good />
          <CompareCard t={t} side={block.dont} good={false} />
        </View>
      );
    case 'takeaways':
      return (
        <Panel className="mt-6">
          <Text className="font-display text-caption text-ink" accessibilityRole="header">{t('lesson.takeawaysLabel')}</Text>
          <View accessibilityRole="list">
            {block.items.map((item) => (
              <View key={item} className="mt-2 flex-row" style={{ gap: theme.space[2] }}>
                <Text className="text-body text-ink" importantForAccessibility="no" accessibilityElementsHidden>{'•'}</Text>
                <Text className="flex-1 text-body text-ink">{t(item)}</Text>
              </View>
            ))}
          </View>
        </Panel>
      );
  }
}

/** A check in a green disc or a cross in a red one; the shape, not the colour, tells them apart. */
function CompareIcon({ good }: { good: boolean }) {
  const color = usePalette();
  return (
    <Svg width={28} height={28} viewBox="0 0 28 28" aria-hidden>
      <Circle cx={14} cy={14} r={12} fill={good ? color.brand : color.danger} stroke={color.ink} strokeWidth={2.5} />
      <Path d={good ? 'M8 14.5l4 4 8-9' : 'M9.5 9.5l9 9M18.5 9.5l-9 9'} fill="none" stroke={color.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CompareCard({ t, side, good }: { t: Translate; side: CompareSide; good: boolean }) {
  const color = usePalette();
  const label = t(good ? 'lesson.compare.do' : 'lesson.compare.dont');
  return (
    <View style={{ flexGrow: 1, flexBasis: 240 }} accessible accessibilityLabel={`${label}. ${t(side.text)}`}>
      <Raised fill={color.surface} radius={theme.radius.lg} offset={theme.depth.sm.x} faceStyle={{ overflow: 'hidden' }}>
        {side.art !== undefined && <LessonPicture t={t} art={side.art} />}
        <View className="p-3">
          <View className="flex-row items-center" style={{ gap: theme.space[2] }}>
            <CompareIcon good={good} />
            <Text className={`font-display text-label ${good ? 'text-brandText' : 'text-dangerText'}`}>{label}</Text>
          </View>
          <Text className="mt-2 text-body text-ink">{t(side.text)}</Text>
        </View>
      </Raised>
    </View>
  );
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
