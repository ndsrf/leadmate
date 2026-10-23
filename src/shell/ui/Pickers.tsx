import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Translate } from '../../i18n';
import type { DogCoat } from '../../sim/config';
import type { BreedId } from '../onboarding/breeds';
import { BreedArt } from './BreedArt';
import { COAT_PALETTE } from './canine';
import { Raised, useFocus } from './components';
import { handlePress } from './press';
import { choiceStyle } from './styles';
import { color, theme } from './theme';

/** A check mark in a circle of the given size; selection is never colour alone. */
export function CheckMark({ size = 20, fill = color.brand }: { size?: number; fill?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <Path d="M10 1.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z" fill={fill} stroke={color.ink} strokeWidth={1.8} />
      <Path d="M5.8 10.3l3 3 5.6-6.2" fill="none" stroke={color.ink} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** "n of total" with a segment per step, and a back control when there is somewhere to go back to. */
export function StepHeader({ t, step, total, onBack }: { t: Translate; step: number; total: number; onBack?: () => void }) {
  const text = t('step.of').split('{n}').join(String(step)).split('{total}').join(String(total));
  return (
    <View className="mb-4 flex-row items-center" style={{ gap: theme.space[3] }}>
      {onBack ? (
        <Pressable onPress={() => handlePress(onBack)} accessibilityRole="button" accessibilityLabel={t('step.back')} style={{ width: theme.size.touchMin, height: theme.size.touchMin, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={24} height={24} viewBox="0 0 24 24" aria-hidden>
            <Path d="M15 5l-7 7 7 7" fill="none" stroke={color.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      ) : null}
      <View className="flex-1 flex-row" style={{ gap: theme.space[1] }} accessible accessibilityRole="progressbar" accessibilityLabel={text} accessibilityValue={{ min: 1, max: total, now: step }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 10, borderRadius: theme.radius.pill, borderWidth: 2, borderColor: color.ink, backgroundColor: i < step ? color.brand : color.surfaceSunken }} />
        ))}
      </View>
      <Text className="font-display text-label text-inkMuted">{text}</Text>
    </View>
  );
}

/** One breed in the picker: its silhouette in the chosen coat over its name; the selected tile has a check and a warm fill. */
export function BreedTile({ breed, coat, label, selected, onPress }: { breed: BreedId; coat: DogCoat; label: string; selected: boolean; onPress: () => void }) {
  const focus = useFocus();
  return (
    <Pressable onPress={() => handlePress(onPress)} onFocus={focus.onFocus} onBlur={focus.onBlur} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ minHeight: theme.size.touchMin }}>
      <Raised fill={selected ? color.accentSoft : color.surface} radius={theme.radius.md} offset={selected ? theme.depth.sm.x : 0} focused={focus.focused} faceStyle={{ alignItems: 'center', paddingVertical: theme.space[2], paddingHorizontal: theme.space[1] }}>
        <BreedArt breed={breed} coat={coat} width={92} />
        <Text className="text-center font-display text-caption text-ink">{label}</Text>
        {selected && (
          <View style={{ position: 'absolute', top: 4, right: 4 }}>
            <CheckMark size={18} />
          </View>
        )}
      </Raised>
    </Pressable>
  );
}

/** One coat: a round colour with its name under it as text, and a check on the selected one. */
export function CoatSwatch({ coat, label, selected, onPress }: { coat: DogCoat; label: string; selected: boolean; onPress: () => void }) {
  const focus = useFocus();
  return (
    <Pressable onPress={() => handlePress(onPress)} onFocus={focus.onFocus} onBlur={focus.onBlur} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} style={{ minHeight: theme.size.touchMin, minWidth: theme.size.touchMin, alignItems: 'center' }}>
      <Raised fill={COAT_PALETTE[coat].fill} radius={theme.radius.pill} offset={selected ? theme.depth.sm.x : 0} focused={focus.focused} borderWidth={selected ? theme.border.hud : theme.border.ink} faceStyle={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        {selected && <CheckMark size={22} fill={color.surface} />}
      </Raised>
      <Text className="mt-1 text-center font-display text-caption text-ink">{label}</Text>
    </Pressable>
  );
}

/** A selectable chip for "pick any of these": brand green with a check when on, flat paper when off. */
export function SelectChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const focus = useFocus();
  const c = choiceStyle(selected);
  return (
    <Pressable onPress={() => handlePress(onPress)} onFocus={focus.onFocus} onBlur={focus.onBlur} accessibilityRole="button" accessibilityState={{ selected }} className="mr-2 mt-2" style={{ minHeight: theme.size.touchMin }}>
      <Raised fill={c.fill} radius={theme.radius.pill} offset={c.shadowOffset} focused={focus.focused} faceStyle={{ minHeight: theme.size.touchMin - c.shadowOffset, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space[4], gap: theme.space[2] }}>
        {selected && <CheckMark size={18} fill={color.surface} />}
        <Text className="font-display text-body" style={{ color: c.label }}>
          {label}
        </Text>
      </Raised>
    </Pressable>
  );
}

/** Two to four joined options of one choice (such as an intensity); the selected one is brand green. */
export function Segmented<T extends string>({ options, value, onChange, label }: { options: readonly { id: T; label: string }[]; value: T; onChange: (id: T) => void; label?: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row" style={{ gap: theme.space[1] }}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable key={o.id} onPress={() => handlePress(() => onChange(o.id))} accessibilityRole="radio" accessibilityState={{ checked: selected }} style={{ flex: 1, minHeight: theme.size.touchMin }}>
            <View style={{ flex: 1, minHeight: theme.size.touchMin, alignItems: 'center', justifyContent: 'center', paddingHorizontal: theme.space[1], borderRadius: theme.radius.sm, borderWidth: theme.border.ink, borderColor: color.ink, backgroundColor: selected ? color.brand : color.surface }}>
              <Text className="text-center font-display text-label" style={{ color: selected ? color.onBrand : color.ink }}>
                {o.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The collar (a ring with a tag) or the Y-harness (a Y of straps over a chest plate), drawn in ink on paper. */
function EquipmentArt({ kind }: { kind: 'collar' | 'harness' }) {
  const strap = { stroke: color.ink, strokeWidth: 3, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={72} height={72} viewBox="0 0 72 72" aria-hidden>
      {kind === 'collar' ? (
        <>
          <Path d="M10 30 Q36 52 62 30 L62 42 Q36 64 10 42 Z" fill={color.info} stroke={color.ink} strokeWidth={3} strokeLinejoin="round" />
          <Path d="M36 53 L36 58" {...strap} />
          <Path d="M36 56 a6 6 0 1 0 0.1 0 z" fill={color.accent} stroke={color.ink} strokeWidth={3} />
        </>
      ) : (
        <>
          <Path d="M14 16 L36 40 L58 16" {...strap} stroke={color.coral} strokeWidth={9} />
          <Path d="M36 40 L36 62" {...strap} stroke={color.coral} strokeWidth={9} />
          <Path d="M20 50 Q36 44 52 50" {...strap} stroke={color.coral} strokeWidth={9} />
          <Path d="M36 40 a5 5 0 1 0 0.1 0 z" fill={color.accent} stroke={color.ink} strokeWidth={3} />
        </>
      )}
    </Svg>
  );
}

/** An illustrated choice with a name and a one-line note; the selected card has a check and a warm fill. */
export function EquipmentCard({ kind, label, note, selected, onPress }: { kind: 'collar' | 'harness'; label: string; note: string; selected: boolean; onPress: () => void }) {
  const focus = useFocus();
  return (
    <Pressable onPress={() => handlePress(onPress)} onFocus={focus.onFocus} onBlur={focus.onBlur} accessibilityRole="button" accessibilityLabel={`${label}. ${note}`} accessibilityState={{ selected }} style={{ flex: 1, minHeight: theme.size.touchMin }}>
      <Raised fill={selected ? color.accentSoft : color.surface} radius={theme.radius.lg} offset={selected ? theme.depth.sm.x : 0} focused={focus.focused} faceStyle={{ alignItems: 'center', padding: theme.space[3] }}>
        <EquipmentArt kind={kind} />
        <Text className="mt-1 text-center font-display text-body text-ink">{label}</Text>
        <Text className="mt-1 text-center text-caption text-inkMuted">{note}</Text>
        {selected && (
          <View style={{ position: 'absolute', top: 6, right: 6 }}>
            <CheckMark size={22} />
          </View>
        )}
      </Raised>
    </Pressable>
  );
}
