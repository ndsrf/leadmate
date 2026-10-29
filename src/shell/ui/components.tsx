import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { handlePress } from './press';
import { useMotion } from './useMotion';
import { badgeColors, buttonStyle, choiceStyle, padStyle, progressWidth, starSlots, touchTarget, type BadgeTone, type ButtonVariant } from './styles';
import { color, theme } from './theme';

/**
 * The one depth primitive: an ink-outlined face over a solid ink shadow that sits `offset` points
 * down and right. Pressing moves the face `shift` points toward the shadow (set instantly, so it
 * is also the reduced-motion form); keyboard focus draws a ring offset from the control.
 */
export function Raised({
  fill,
  edge = color.ink,
  radius = theme.radius.md,
  offset = theme.depth.rest.x,
  shift = 0,
  borderWidth = theme.border.ink,
  focused = false,
  pressable = false,
  className = '',
  faceStyle,
  children,
}: {
  fill: string | null;
  edge?: string;
  radius?: number;
  offset?: number;
  shift?: number;
  borderWidth?: number;
  focused?: boolean;
  /** Animate the face to `shift` (the press feedback); static surfaces leave this off. */
  pressable?: boolean;
  className?: string;
  faceStyle?: ViewStyle;
  children?: React.ReactNode;
}) {
  const ring = theme.depth.focusRing;
  const faceBase: ViewStyle = { backgroundColor: fill ?? undefined, borderColor: edge, borderWidth, borderRadius: radius };
  return (
    <View className={className} style={{ paddingRight: offset, paddingBottom: offset }}>
      {offset > 0 && <View pointerEvents="none" style={{ position: 'absolute', left: offset, top: offset, right: 0, bottom: 0, backgroundColor: color.ink, borderRadius: radius }} />}
      {focused && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', left: -(ring.offset + ring.width), top: -(ring.offset + ring.width), right: offset - (ring.offset + ring.width), bottom: offset - (ring.offset + ring.width), borderWidth: ring.width, borderColor: color.focus, borderRadius: radius + ring.offset }}
        />
      )}
      {pressable ? (
        <TravelFace shift={shift} style={[faceBase, faceStyle]}>
          {children}
        </TravelFace>
      ) : (
        <View style={[faceBase, faceStyle]}>{children}</View>
      )}
    </View>
  );
}

/** The face of a pressable control: it travels to `shift` in the press duration, or jumps there under reduced motion. */
function TravelFace({ shift, style, children }: { shift: number; style: ViewStyle | (ViewStyle | undefined)[]; children?: React.ReactNode }) {
  const { reduced } = useMotion();
  const travel = useSharedValue(shift);
  useEffect(() => {
    const [x1, y1, x2, y2] = theme.motion.easing.press;
    travel.value = reduced ? shift : withTiming(shift, { duration: theme.motion.duration.press, easing: Easing.bezier(x1, y1, x2, y2) });
  }, [shift, reduced, travel]);
  const moved = useAnimatedStyle(() => ({ transform: [{ translateX: travel.value }, { translateY: travel.value }] }));
  return <Animated.View style={[style, moved]}>{children}</Animated.View>;
}

/** Track keyboard or switch focus so a control can show its ring. */
export function useFocus() {
  const [focused, setFocused] = useState(false);
  return { focused, onFocus: () => setFocused(true), onBlur: () => setFocused(false) };
}

/** A raised, pressable button: the face sinks into its shadow while pressed. Long labels wrap and the button grows. */
export function GameButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = 'mt-4',
  accessibilityLabel,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
  /** What a screen reader announces, when it must say more than the label. */
  accessibilityLabel?: string;
}) {
  const focus = useFocus();
  return (
    <Pressable
      onPress={() => handlePress(onPress, disabled)}
      disabled={disabled}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      className={className}
    >
      {({ pressed }) => {
        const s = buttonStyle(variant, { pressed, disabled });
        return (
          <Raised fill={s.fill} edge={s.edge} radius={s.borderRadius} offset={s.shadowOffset} shift={s.travel} focused={focus.focused} pressable
            faceStyle={{ minHeight: s.minHeight, minWidth: s.minWidth, paddingHorizontal: theme.space[5], paddingVertical: theme.space[2], alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-display text-button" style={{ color: s.label, textAlign: 'center', flexShrink: 1, textDecorationLine: s.underline ? 'underline' : 'none' }}>
              {label}
            </Text>
          </Raised>
        );
      }}
    </Pressable>
  );
}

const PANEL_FILLS = { surface: color.surface, info: color.infoSoft, warn: color.accentSoft } as const;

/** A paper card: ink outline on a short solid shadow. */
export function Panel({ children, tone = 'surface', className = '' }: { children: React.ReactNode; tone?: keyof typeof PANEL_FILLS; className?: string }) {
  return (
    <Raised fill={PANEL_FILLS[tone]} radius={theme.radius.lg} offset={theme.depth.sm.x} className={className} faceStyle={{ padding: theme.space[4] }}>
      {children}
    </Raised>
  );
}

export function ProgressBar({
  value,
  max,
  tone = 'brand',
  className = '',
  runDown,
}: {
  value: number;
  max: number;
  tone?: 'brand' | 'accent';
  className?: string;
  /**
   * A countdown bar: from its first `value`, it runs down to 0 over that many seconds on the UI thread, standing
   * still while not `live`. Purely visual; later `value`s only feed accessibility. Under reduced motion it steps
   * with `value` instead.
   */
  runDown?: { live: boolean };
}) {
  const { reduced } = useMotion();
  const pct = progressWidth(value, max);
  const capped = pct >= 1 && pct <= 99;
  return (
    <View
      className={`overflow-hidden rounded-game-pill bg-surfaceSunken ${className}`}
      style={{ height: 14, borderWidth: theme.border.ink, borderColor: color.ink }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max, now: Math.max(0, Math.min(max, value)) }}
    >
      {runDown && !reduced ? (
        <RunDownFill start={pct} max={max} live={runDown.live} tone={tone} />
      ) : (
        <View style={{ width: `${pct}%`, height: '100%', backgroundColor: color[tone], borderRightWidth: capped ? theme.border.ink : 0, borderRightColor: color.ink }} />
      )}
    </View>
  );
}

/** The fill of a running-down ProgressBar: from `start` percent to 0, at `max` seconds for the full bar. */
function RunDownFill({ start, max, live, tone }: { start: number; max: number; live: boolean; tone: 'brand' | 'accent' }) {
  const pct = useSharedValue(start);
  useEffect(() => {
    if (!live) return void cancelAnimation(pct); // keeps where it is, and goes on from there
    pct.value = withTiming(0, { duration: (pct.value / 100) * max * 1000, easing: Easing.linear });
    return () => cancelAnimation(pct);
  }, [live, max, pct]);
  const style = useAnimatedStyle(() => ({ width: `${pct.value}%`, borderRightWidth: pct.value >= 1 && pct.value <= 99 ? theme.border.ink : 0 }));
  return <Animated.View style={[{ height: '100%', backgroundColor: color[tone], borderRightColor: color.ink }, style]} />;
}

/** A small pill label. */
export function Badge({ label, tone = 'quiet' }: { label: string; tone?: BadgeTone }) {
  const c = badgeColors(tone);
  return (
    <View className="self-start rounded-game-pill px-2.5 py-0.5" style={{ backgroundColor: c.fill }}>
      <Text className="font-display text-caption" style={{ color: c.label }}>
        {label}
      </Text>
    </View>
  );
}

/** A status pill with an optional leading icon, a label and a value; pressable when `onPress` is given (then at least 44 points tall). */
export function Chip({
  label,
  value,
  icon,
  highlight = false,
  onPress,
  accessibilityLabel,
}: {
  label?: string;
  value?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const focus = useFocus();
  const face = (shift: number) => (
    <Raised fill={highlight ? color.accent : color.surface} radius={theme.radius.pill} offset={theme.depth.sm.x} shift={shift} focused={focus.focused} pressable={onPress !== undefined} faceStyle={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.space[3], minHeight: theme.size.touchMin - 8 }}>
      {icon}
      <View className="shrink">
        {label !== undefined && <Text className="text-caption text-inkMuted">{label}</Text>}
        {value !== undefined && <Text className="font-display text-button text-ink">{value}</Text>}
      </View>
    </Raised>
  );
  if (!onPress) return <View accessibilityLabel={accessibilityLabel} style={{ maxWidth: '100%' }}>{face(0)}</View>;
  const target = touchTarget(theme.size.touchMin - 8);
  return (
    <Pressable
      onPress={() => handlePress(onPress)}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={target.hitSlop}
      style={{ minHeight: theme.size.touchMin, justifyContent: 'center', maxWidth: '100%' }}
    >
      {({ pressed }) => face(pressed ? theme.depth.pressed.translate - 1 : 0)}
    </Pressable>
  );
}

/** Three star slots, filled up to `stars`; the label names the rating for screen readers (colour is never the only signal: empty stars are outlined). */
export function StarRow({ stars, size = 20, label }: { stars: number; size?: number; label?: string }) {
  return (
    <View className="flex-row" accessibilityLabel={label}>
      {starSlots(stars).map((filled, i) => (
        <Text key={i} style={{ fontSize: size, lineHeight: size * 1.15, color: filled ? color.star : color.starEmpty, marginHorizontal: 1 }}>
          {filled ? '★' : '☆'}
        </Text>
      ))}
    </View>
  );
}

/** A selectable pill for a short list of choices (at least 44 points tall); the chosen one is brand green with a short shadow. */
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const focus = useFocus();
  const c = choiceStyle(selected);
  return (
    <Pressable
      onPress={() => handlePress(onPress)}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className="mr-2 mt-2"
      style={{ minHeight: theme.size.touchMin, minWidth: theme.size.touchMin }}
    >
      <Raised fill={c.fill} radius={theme.radius.sm} offset={c.shadowOffset} focused={focus.focused} faceStyle={{ minHeight: theme.size.touchMin - c.shadowOffset, minWidth: theme.size.touchMin - c.shadowOffset, justifyContent: 'center', paddingHorizontal: theme.space[4] }}>
        <Text className="font-display text-body" style={{ color: c.label, textAlign: 'center' }}>
          {label}
        </Text>
      </Raised>
    </Pressable>
  );
}

/** A full-width answer card. */
export function OptionCard({ label, onPress }: { label: string; onPress: () => void }) {
  const focus = useFocus();
  return (
    <Pressable onPress={() => handlePress(onPress)} onFocus={focus.onFocus} onBlur={focus.onBlur} accessibilityRole="button" className="mb-3" style={{ minHeight: theme.size.touchMin }}>
      {({ pressed }) => (
        <Raised fill={pressed ? color.surfaceSunken : color.surface} radius={theme.radius.lg} offset={theme.depth.sm.x} shift={pressed ? theme.depth.pressed.translate - 1 : 0} focused={focus.focused} pressable faceStyle={{ padding: theme.space[4], minHeight: theme.size.touchMin }}>
          <Text className="text-bodyL text-ink">{label}</Text>
        </Raised>
      )}
    </Pressable>
  );
}

/** An on/off switch: a pill track with a round thumb, both ink-outlined (60 by 34, inside a 44 point target). */
export function Toggle({ value, onChange, label }: { value: boolean; onChange: (next: boolean) => void; label: string }) {
  const focus = useFocus();
  return (
    <Pressable
      onPress={() => handlePress(() => onChange(!value))}
      onFocus={focus.onFocus}
      onBlur={focus.onBlur}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={{ minHeight: theme.size.touchMin, minWidth: theme.size.touchMin, justifyContent: 'center' }}
    >
      <Raised fill={value ? color.brand : color.surfaceSunken} radius={theme.radius.pill} offset={2} focused={focus.focused} faceStyle={{ width: 60, height: 34, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', top: 1.5, left: value ? 27 : 1.5, width: 25, height: 25, borderRadius: theme.radius.pill, backgroundColor: color.surface, borderWidth: theme.border.ink, borderColor: color.ink }} />
      </Raised>
    </Pressable>
  );
}

/** A single-line text input with a visible label above it; the field is an ink-outlined paper box with a focus ring. */
export function TextField({ label, ...input }: { label?: string } & TextInputProps) {
  const focus = useFocus();
  const ring = theme.depth.focusRing;
  return (
    <View className="mt-1">
      {label !== undefined && <Text className="mb-1 font-display text-label text-ink">{label}</Text>}
      <View>
        {focus.focused && <View pointerEvents="none" style={{ position: 'absolute', left: -ring.offset + 1, top: -ring.offset + 1, right: -ring.offset + 1, bottom: -ring.offset + 1, borderWidth: ring.width, borderColor: color.focus, borderRadius: theme.radius.md + 2 }} />}
        <TextInput
          accessibilityLabel={label}
          {...input}
          onFocus={(e) => {
            focus.onFocus();
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.onBlur();
            input.onBlur?.(e);
          }}
          placeholderTextColor={color.inkMuted}
          style={[{ minHeight: 52, borderWidth: theme.border.ink, borderColor: color.ink, borderRadius: theme.radius.md - 2, backgroundColor: color.surface, paddingHorizontal: 14, fontSize: 16, color: color.ink }, input.style]}
        />
      </View>
    </View>
  );
}

/** A big touch pad for a minigame; it reacts on press-in and plays no feedback of its own, so timing is untouched. */
export function Pad({ label, onPressIn, onPressOut, fill = 'brand' }: { label: string; onPressIn?: () => void; onPressOut?: () => void; fill?: 'brand' | 'quiet' }) {
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button">
      {({ pressed }) => {
        const p = padStyle(fill, pressed);
        return (
          <Raised fill={p.fill} radius={theme.radius.lg} offset={p.shadowOffset} shift={p.travel} pressable faceStyle={{ height: 160 - p.shadowOffset, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="font-display text-displayM" style={{ color: p.label }}>
              {label}
            </Text>
          </Raised>
        );
      }}
    </Pressable>
  );
}
