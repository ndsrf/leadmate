import { Pressable, Text, View } from 'react-native';
import { handlePress } from './press';
import { badgeColors, buttonStyle, progressWidth, starSlots, touchTarget, type BadgeTone, type ButtonVariant } from './styles';
import { color, theme } from './theme';

/** A raised, pressable button: the face sinks onto its darker edge while pressed. Long labels wrap. */
export function GameButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  className = 'mt-4',
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <Pressable
      onPress={() => handlePress(onPress, disabled)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      className={className}
    >
      {({ pressed }) => {
        const s = buttonStyle(variant, { pressed, disabled });
        return (
          <View style={{ backgroundColor: s.edge, borderRadius: s.borderRadius, paddingBottom: theme.depth.edge, opacity: s.opacity }}>
            <View
              style={{
                backgroundColor: s.fill,
                borderRadius: s.borderRadius,
                minHeight: s.minHeight,
                minWidth: s.minWidth,
                paddingHorizontal: theme.space.md,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ translateY: s.offsetY }],
              }}
            >
              <Text className="font-display text-base" style={{ color: s.label, textAlign: 'center', flexShrink: 1 }}>
                {label}
              </Text>
            </View>
          </View>
        );
      }}
    </Pressable>
  );
}

const PANEL_TONES = { surface: 'bg-surface', info: 'bg-info', warn: 'bg-warn' } as const;

/** A rounded card on the screen background. */
export function Panel({ children, tone = 'surface', className = '' }: { children: React.ReactNode; tone?: keyof typeof PANEL_TONES; className?: string }) {
  return <View className={`rounded-game-lg p-4 ${PANEL_TONES[tone]} ${className}`}>{children}</View>;
}

export function ProgressBar({ value, max, tone = 'brand', className = '' }: { value: number; max: number; tone?: 'brand' | 'accent'; className?: string }) {
  return (
    <View className={`h-2.5 overflow-hidden rounded-game-pill bg-surfaceHigh ${className}`} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max, now: Math.max(0, Math.min(max, value)) }}>
      <View style={{ width: `${progressWidth(value, max)}%`, height: '100%', backgroundColor: color[tone] }} />
    </View>
  );
}

/** A small pill label. */
export function Badge({ label, tone = 'quiet' }: { label: string; tone?: BadgeTone }) {
  const c = badgeColors(tone);
  return (
    <View className="self-start rounded-game-pill px-2.5 py-0.5" style={{ backgroundColor: c.fill }}>
      <Text className="text-xs font-bold" style={{ color: c.label }}>
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
  const body = (
    <View
      className={`flex-row items-center rounded-game-pill px-3 ${highlight ? 'bg-accent' : 'bg-surface'}`}
      style={{ minHeight: theme.touchMin - 8, maxWidth: '100%' }}
    >
      {icon}
      <View className="shrink">
        {label !== undefined && (
          <Text className={`text-xs ${highlight ? 'text-onAccent' : 'text-inkDim'}`}>
            {label}
          </Text>
        )}
        {value !== undefined && (
          <Text className={`font-display text-base ${highlight ? 'text-onAccent' : 'text-ink'}`}>
            {value}
          </Text>
        )}
      </View>
    </View>
  );
  if (!onPress) return <View accessibilityLabel={accessibilityLabel}>{body}</View>;
  const target = touchTarget(theme.touchMin - 8);
  return (
    <Pressable onPress={() => handlePress(onPress)} accessibilityRole="button" accessibilityLabel={accessibilityLabel} hitSlop={target.hitSlop} style={{ minHeight: theme.touchMin, justifyContent: 'center' }}>
      {body}
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

/** A selectable pill for a short list of choices (at least 44 points tall). */
export function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => handlePress(onPress)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      className={`mr-2 mt-2 justify-center rounded-game-md px-4 py-2 ${selected ? 'bg-brand' : 'bg-surfaceHigh'}`}
      style={{ minHeight: theme.touchMin, minWidth: theme.touchMin }}
    >
      <Text className={selected ? 'font-semibold text-onBrand' : 'text-ink'}>{label}</Text>
    </Pressable>
  );
}

/** A full-width answer card. */
export function OptionCard({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={() => handlePress(onPress)} accessibilityRole="button" className="mb-3 rounded-game-lg bg-surface p-4 active:bg-surfaceHigh" style={{ minHeight: theme.touchMin }}>
      <Text className="text-base text-ink">{label}</Text>
    </Pressable>
  );
}

/** A big touch pad for a minigame; it reacts on press-in and plays no feedback of its own, so timing is untouched. */
export function Pad({ label, onPressIn, onPressOut, fill = 'brand' }: { label: string; onPressIn?: () => void; onPressOut?: () => void; fill?: 'brand' | 'quiet' }) {
  const edge = fill === 'brand' ? 'brandEdge' : 'quietEdge';
  const on = fill === 'brand' ? 'onBrand' : 'onQuiet';
  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} accessibilityRole="button" className="h-40 items-center justify-center rounded-game-lg" style={({ pressed }) => ({ backgroundColor: color[pressed ? edge : fill] })}>
      {({ pressed }) => (
        <Text className="font-display text-xl" style={{ color: pressed && fill === 'brand' ? color.ink : color[on] }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}
