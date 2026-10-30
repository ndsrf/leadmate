import { useState } from 'react';
import { Pressable, Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import type { Translate } from '../../i18n';
import { fractionToKg, kgText, kgToFraction, stepKg, type KgRange } from '../onboarding/weights';
import { Raised } from './components';
import { handlePress } from './press';
import { theme, usePalette } from './theme';

const THUMB = 28;
const TRACK = 14;

function StepButton({ label, glyph, onPress }: { label: string; glyph: '-' | '+'; onPress: () => void }) {
  const color = usePalette();
  return (
    <Pressable onPress={() => handlePress(onPress)} accessibilityRole="button" accessibilityLabel={label} style={{ width: theme.size.touchMin, height: theme.size.touchMin, alignItems: 'center', justifyContent: 'center' }}>
      <Raised fill={color.surface} radius={theme.radius.pill} offset={2} faceStyle={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 14, height: 3, borderRadius: 2, backgroundColor: color.ink }} />
        {glyph === '+' && <View style={{ position: 'absolute', width: 3, height: 14, borderRadius: 2, backgroundColor: color.ink }} />}
      </Raised>
    </Pressable>
  );
}

/**
 * A kilogram slider: a track with a thumb and a value bubble, dragged or tapped, with step buttons and the `adjustable`
 * accessibility actions so it works without dragging. `value` is null until a weight is chosen (the thumb then rests at `start`).
 * The breed range, when given, is drawn as a band on the track: a hint, never a limit.
 */
export function WeightSlider({
  t,
  label,
  value,
  range,
  start,
  hint,
  onChange,
}: {
  t: Translate;
  label: string;
  value: number | null;
  range: KgRange;
  /** Where the thumb rests and where a first step counts from while there is no value. */
  start: number;
  hint?: readonly [min: number, max: number] | null;
  onChange: (kg: number) => void;
}) {
  const color = usePalette();
  const [width, setWidth] = useState(0);
  const shown = value ?? start;
  const travel = Math.max(0, width - THUMB);
  const left = kgToFraction(shown, range) * travel;
  const text = value === null ? t('weight.unset') : `${kgText(value)} ${t('weight.unit')}`;
  const at = (e: GestureResponderEvent) => {
    if (travel <= 0) return;
    onChange(fractionToKg((e.nativeEvent.locationX - THUMB / 2) / travel, range));
  };
  const step = (direction: 1 | -1) => onChange(stepKg(value, direction, range, start));
  const band = hint ? { left: kgToFraction(hint[0], range) * travel + THUMB / 2, right: travel - kgToFraction(hint[1], range) * travel + THUMB / 2 } : null;
  return (
    <View className="mt-3">
      <Text className="mb-1 font-display text-label text-ink">{label}</Text>
      <View className="flex-row items-center">
        <StepButton label={t('weight.less')} glyph="-" onPress={() => step(-1)} />
        <View
          className="flex-1"
          style={{ height: 64, justifyContent: 'flex-end' }}
          onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityValue={{ min: range.min, max: range.max, now: shown, text }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(e) => step(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderGrant={at}
          onResponderMove={at}
        >
          <View pointerEvents="none" style={{ position: 'absolute', left, top: 0, minWidth: THUMB + 20, marginLeft: -10, alignItems: 'center' }}>
            <View style={{ paddingHorizontal: theme.space[2], paddingVertical: 2, borderRadius: theme.radius.sm, borderWidth: theme.border.ink, borderColor: color.outline, backgroundColor: color.accent }}>
              <Text className="font-display text-label" style={{ color: color.onAccent }}>
                {text}
              </Text>
            </View>
          </View>
          <View pointerEvents="none" style={{ height: THUMB, justifyContent: 'center' }}>
            <View style={{ height: TRACK, borderRadius: TRACK / 2, borderWidth: theme.border.ink, borderColor: color.outline, backgroundColor: color.surfaceSunken, overflow: 'hidden' }}>
              {band && <View style={{ position: 'absolute', left: band.left, right: band.right, top: 0, bottom: 0, backgroundColor: color.brand, opacity: 0.45 }} />}
              <View style={{ width: left + THUMB / 2, height: '100%', backgroundColor: value === null ? color.edge : color.brand }} />
            </View>
            <View style={{ position: 'absolute', left, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: theme.border.ink, borderColor: color.outline, backgroundColor: color.surface }} />
          </View>
        </View>
        <StepButton label={t('weight.more')} glyph="+" onPress={() => step(1)} />
      </View>
    </View>
  );
}
