import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';
import type { TextKey, Translate } from '../../i18n';
import type { FeedbackActionKind, FeedbackPolarity } from '../../sim/feedbackKinds';
import type { SimulationDebriefPayload } from '../../sim/payload';
import type { TimelineEntry } from '../../sim/scentWalk';
import { summarizeScentWalk } from '../../sim/debriefSummary';
import { usePalette } from '../ui/theme';
import { Panel } from '../ui/components';

export type TimelineIconName = 'paw' | 'eye' | 'heart' | 'nose' | 'hourglass' | 'sparkle' | 'star' | 'mark' | 'puff';

export function iconNameForKind(kind: FeedbackActionKind): TimelineIconName {
  switch (kind) {
    case 'followed-turn':
      return 'paw';
    case 'check-in-hit':
    case 'check-in-after-change':
    case 'disengagement':
    case 'missed-opportunity':
      return 'eye';
    case 'sintonia':
      return 'heart';
    case 'go-sniff':
    case 'granted-sniff':
    case 'empty-sniff':
    case 'food-eaten':
    case 'scent-dragged-past':
      return 'nose';
    case 'poste':
    case 'waited-plant':
    case 'waited-marking':
    case 'dragged-plant':
    case 'interrupted-marking':
      return 'hourglass';
    case 'fresh-move':
    case 'repeated-move-ignored':
      return 'sparkle';
    case 'chain':
    case 'smart-jackpot':
    case 'wasted-jackpot':
      return 'star';
    case 'marker-hit':
    case 'wasted-marker':
    case 'missed-reward-window':
    case 'late-marker-press':
    case 'reactive-marker':
    case 'wrong-cue':
    case 'harsh-stop':
    case 'rigid-pull':
    case 'go-sniff-cut-short':
    case 'leave-it-food':
    default:
      return 'mark';
  }
}

/** SVG glyph for the kind's HUD icon silhouette. */
export function TimelineIcon({ kind, size = 16, color }: { kind: FeedbackActionKind; size?: number; color: string }) {
  const icon = iconNameForKind(kind);
  switch (icon) {
    case 'paw':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <G fill={color}>
            <Ellipse cx={14} cy={30} rx={6.5} ry={8} transform="rotate(-25 14 30)" />
            <Ellipse cx={25} cy={18} rx={6.5} ry={8.5} />
            <Ellipse cx={39} cy={18} rx={6.5} ry={8.5} />
            <Ellipse cx={50} cy={30} rx={6.5} ry={8} transform="rotate(25 50 30)" />
            <Path d="M32 29C42 29 52 42 50 50C48 57 40 55 32 55C24 55 16 57 14 50C12 42 22 29 32 29Z" />
          </G>
        </Svg>
      );
    case 'eye':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M3 32Q32 6 61 32Q32 58 3 32Z" fill="none" stroke={color} strokeWidth={6} strokeLinejoin="round" />
          <Circle cx={32} cy={32} r={9} fill={color} />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M32 57C8 40 4 24 14 14C22 7 30 12 32 19C34 12 42 7 50 14C60 24 56 40 32 57Z" fill={color} />
        </Svg>
      );
    case 'nose':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M8 20Q32 8 56 20Q60 36 46 48Q32 58 18 48Q4 36 8 20Z" fill={color} />
          <Ellipse cx={21} cy={30} rx={6} ry={3} fill={color} />
          <Ellipse cx={43} cy={30} rx={6} ry={3} fill={color} />
          <Path d="M32 32V44" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      );
    case 'hourglass':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M16 10H48C48 27 36 28 36 32C36 36 48 37 48 54H16C16 37 28 36 28 32C28 28 16 27 16 10Z" fill="none" stroke={color} strokeWidth={5} strokeLinejoin="round" />
          <Rect x={10} y={6} width={44} height={6} rx={3} fill={color} />
          <Rect x={10} y={52} width={44} height={6} rx={3} fill={color} />
          <Path d="M22 18H42L32 30Z" fill={color} />
        </Svg>
      );
    case 'sparkle':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M28 11Q33 31 53 36Q33 41 28 61Q23 41 3 36Q23 31 28 11Z" fill={color} />
          <Path d="M52 4Q53 10 59 12Q53 14 52 20Q51 14 45 12Q51 10 52 4Z" fill={color} />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M32 6L39 23L57 23L42 34L48 51L32 40L16 51L22 34L7 23L25 23Z" fill={color} />
        </Svg>
      );
    case 'puff':
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Circle cx={22} cy={38} r={12} fill={color} />
          <Circle cx={38} cy={34} r={15} fill={color} />
          <Circle cx={46} cy={44} r={10} fill={color} />
          <Rect x={14} y={40} width={40} height={14} rx={7} fill={color} />
        </Svg>
      );
    case 'mark':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
          <Path d="M10 44C10 34 20 28 32 28C44 28 54 34 54 44V50C54 55 44 58 32 58C20 58 10 55 10 50Z" fill={color} />
          <Ellipse cx={32} cy={42} rx={18} ry={10} fill="none" stroke={color} strokeWidth={4} />
          <Path d="M16 16L21 24M32 10V20M48 16L43 24" stroke={color} strokeWidth={4} strokeLinecap="round" />
        </Svg>
      );
  }
}

/**
 * A moment badge on the timeline track:
 * - Right polarity: Circle shape, brand colour
 * - Wrong polarity: Diamond shape, danger colour
 * - Inside: icon glyph corresponding to the kind
 */
function MomentBadge({
  entry,
  selected,
  size = 32,
}: {
  entry: TimelineEntry;
  selected: boolean;
  size?: number;
}) {
  const color = usePalette();
  const isRight = entry.polarity === 'right';
  const fill = isRight ? color.brand : color.danger;
  const stroke = selected ? color.focus : isRight ? color.brandDeep : color.dangerText;
  const strokeWidth = selected ? 3 : 2;
  const iconColor = color.surface;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 32 32" style={{ position: 'absolute', top: 0, left: 0 }} aria-hidden>
        {isRight ? (
          <Circle cx={16} cy={16} r={14} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        ) : (
          <Path d="M16 2L30 16L16 30L2 16Z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
        )}
      </Svg>
      <View style={{ width: size * 0.55, height: size * 0.55, alignItems: 'center', justifyContent: 'center' }}>
        <TimelineIcon kind={entry.kind} size={size * 0.55} color={iconColor} />
      </View>
    </View>
  );
}

export function DebriefTimelineSection({
  t,
  payload,
  initialMoment = null,
}: {
  t: Translate;
  payload: SimulationDebriefPayload;
  initialMoment?: TimelineEntry | null;
}) {
  const color = usePalette();
  const timeline = payload.timeline ?? [];
  const duration = Math.max(1, payload.durationSeconds || 1);
  const [selected, setSelected] = useState<TimelineEntry | null>(initialMoment);

  const summary = useMemo(() => summarizeScentWalk(payload), [payload]);
  const hasTimeline = timeline.length > 0;

  return (
    <View className="mb-4">
      {/* 1. Timeline Track & Moments */}
      <Panel tone="surface" className="mb-3">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="font-display text-label text-ink">{t('debrief.timeline.title')}</Text>
          <Text className="font-display text-caption text-inkMuted">{`${duration} ${t('results.seconds')}`}</Text>
        </View>

        {!hasTimeline ? (
          <Text testID="timeline-empty-note" className="py-3 text-center text-body text-inkMuted">
            {t('debrief.timeline.empty')}
          </Text>
        ) : (
          <View className="py-3">
            <View style={{ width: '100%', height: 48, justifyContent: 'center', paddingHorizontal: 16 }}>
              {/* Horizontal guide rail */}
              <View
                style={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: color.surfaceSunken,
                  borderColor: color.edge,
                  borderWidth: 1,
                  width: '100%',
                }}
              />

              {/* Moment Buttons placed along the track */}
              {timeline.map((entry, index) => {
                const fraction = Math.max(0, Math.min(1, entry.t / duration));
                const isSelected = selected === entry;
                const a11yLabel = `${t(entry.polarity === 'right' ? 'debrief.timeline.right' : 'debrief.timeline.wrong')}, ${entry.t} s: ${t(`feedback.${entry.kind}.short` as TextKey)}`;

                return (
                  <View
                    key={`${index}:${entry.t}:${entry.kind}`}
                    style={{
                      position: 'absolute',
                      left: 16,
                      right: 16,
                      top: 8,
                      pointerEvents: 'box-none',
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        left: `${fraction * 100}%`,
                        marginLeft: -16,
                        zIndex: isSelected ? 10 : 1,
                      }}
                    >
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={a11yLabel}
                        accessibilityState={{ selected: isSelected }}
                        data-moment-index={index}
                        data-polarity={entry.polarity}
                        data-shape={entry.polarity === 'right' ? 'circle' : 'diamond'}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        onPress={() => setSelected(entry)}
                        style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
                      >
                        <MomentBadge entry={entry} selected={isSelected} size={32} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Selected Moment Inspection */}
        {selected ? (
          <View
            testID="timeline-selected-panel"
            className="mt-3 p-3 rounded-lg"
            style={{
              backgroundColor: color.surfaceSunken,
              borderColor: selected.polarity === 'right' ? color.brandDeep : color.dangerText,
              borderWidth: 1,
            }}
          >
            <View className="flex-row items-center justify-between mb-1">
              <View
                style={{
                  backgroundColor: selected.polarity === 'right' ? color.brand : color.danger,
                  borderRadius: 9999,
                  paddingHorizontal: 10,
                  paddingVertical: 2,
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  className="font-display text-caption"
                  style={{ color: selected.polarity === 'right' ? color.onBrand : color.onDanger }}
                >
                  {t(selected.polarity === 'right' ? 'debrief.timeline.right' : 'debrief.timeline.wrong')}
                </Text>
              </View>
              <Text testID="timeline-selected-time" className="font-display text-label text-inkMuted">
                {`${selected.t} ${t('results.seconds')}`}
              </Text>
            </View>
            <Text testID="timeline-selected-message" className="font-display text-bodyL text-ink mt-1">
              {t(`feedback.${selected.kind}.short` as TextKey)}
            </Text>
          </View>
        ) : (
          hasTimeline && (
            <Text className="mt-2 text-center text-caption text-inkMuted">
              {t('debrief.timeline.tapHint')}
            </Text>
          )
        )}
      </Panel>

      {/* 2. Done Well / Try Next Summary */}
      <Panel tone="surface" className="mb-1">
        {/* Done Well (up to 2) */}
        {summary.doneWell.length > 0 && (
          <View className="mb-3">
            <Text className="font-display text-label text-brandText mb-2">
              {t('debrief.summary.doneWell')}
            </Text>
            {summary.doneWell.map((kind) => (
              <View
                key={kind}
                testID={`debrief-done-well-${kind}`}
                className="flex-row items-center p-2 rounded-md mb-1.5"
                style={{ backgroundColor: color.surfaceSunken }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: color.brand,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                >
                  <TimelineIcon kind={kind} size={14} color={color.surface} />
                </View>
                <Text className="font-display text-body text-ink flex-1">
                  {t(`feedback.${kind}.short` as TextKey)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Try Next (at most 1) */}
        <View>
          <Text className="font-display text-label text-dangerText mb-2">
            {t('debrief.summary.tryNext')}
          </Text>
          {summary.tryNext.length > 0 ? (
            summary.tryNext.map((kind) => (
              <View
                key={kind}
                testID="debrief-try-next"
                className="flex-row items-center p-2 rounded-md"
                style={{ backgroundColor: color.surfaceSunken }}
              >
                <View
                  style={{
                    width: 24,
                    height: 24,
                    transform: [{ rotate: '45deg' }],
                    backgroundColor: color.danger,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                  }}
                >
                  <View style={{ transform: [{ rotate: '-45deg' }] }}>
                    <TimelineIcon kind={kind} size={14} color={color.surface} />
                  </View>
                </View>
                <Text className="font-display text-body text-ink flex-1">
                  {t(`feedback.${kind}.short` as TextKey)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-body text-inkMuted py-1">
              {t('debrief.summary.noMistakes')}
            </Text>
          )}
        </View>
      </Panel>
    </View>
  );
}
