import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { BACK_BUTTON } from '../hud/layout';
import { ARROW_LENGTH, closeCoachMarks, coachMarks, edgeArrow, type CoachMark } from '../hud/coach';
import type { Translate } from '../i18n';
import { GameButton, LightRegion, Panel } from './ui/components';
import { EncounterPaws } from './ui/EncounterPaws';
import type { ButtonVariant } from './ui/styles';
// The overlays over a running Stage stay Light whatever the Appearance; `Button` and `Row` are shared UI chrome.
import { lightColor, usePalette } from './ui/theme';

/** The shell's standard button, drawn by the game kit; `secondary` sits beside a primary, `quiet` is a link. */
export function Button({ label, onPress, tone = 'primary', disabled, accessibilityLabel, testID }: { label: string; onPress: () => void; tone?: ButtonVariant; disabled?: boolean; accessibilityLabel?: string; testID?: string }) {
  return <GameButton label={label} onPress={onPress} variant={tone} disabled={disabled} accessibilityLabel={accessibilityLabel} testID={testID} />;
}

export function Backdrop({ children }: { children: React.ReactNode }) {
  return (
    <LightRegion className="absolute inset-0 items-center justify-center bg-outline/70 p-4">
      <Panel className="max-h-full w-full max-w-sm">{children}</Panel>
    </LightRegion>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  const color = usePalette();
  return (
    <View className="flex-row items-center justify-between gap-4 py-2" style={{ borderBottomWidth: 2, borderStyle: 'dashed', borderColor: color.edge }}>
      <Text className="flex-1 text-body text-inkMuted">{label}</Text>
      <Text className="shrink text-right font-display text-body text-ink">{value}</Text>
    </View>
  );
}

export function ResumeOverlay({ t, onResume, onExit }: { t: Translate; onResume: () => void; onExit: () => void }) {
  return (
    <Backdrop>
      <Text className="font-display text-displayM text-ink">{t('pause.title')}</Text>
      <Button label={t('pause.resume')} onPress={onResume} />
      <Button label={t('pause.skip')} tone="quiet" onPress={onExit} />
    </Backdrop>
  );
}

/** An on-screen back button pinned to the top-left safe area of an active simulation (ADR 0021). */
export function SimulatorBackButton({ onPress, label = 'Atrás' }: { onPress: () => void; label?: string }) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets?.top ?? 0, 12);
  const left = Math.max(insets?.left ?? 0, 12);
  return (
    <LightRegion pointerEvents="box-none" className="absolute inset-0">
      <View style={{ position: 'absolute', top, left, zIndex: 20 }}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={label}
          aria-label={label}
          style={{
            width: BACK_BUTTON.width,
            height: BACK_BUTTON.height,
            borderRadius: BACK_BUTTON.width / 2,
            backgroundColor: lightColor.surface,
            borderWidth: 2,
            borderColor: lightColor.outline,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: lightColor.outline,
            shadowOffset: { width: 2, height: 2 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 3,
          }}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24">
            <Path d="M15 5l-7 7 7 7" fill="none" stroke={lightColor.ink} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
    </LightRegion>
  );
}

export function ErrorOverlay({ t, onRetry }: { t: Translate; onRetry: () => void }) {
  return (
    <Backdrop>
      <Text className="text-bodyL text-ink">{t('error.loadFailed')}</Text>
      <Button label={t('error.retry')} onPress={onRetry} />
    </Backdrop>
  );
}

export function LoadingOverlay({ t }: { t: Translate }) {
  return (
    <LightRegion className="absolute inset-0 items-center justify-center bg-bg">
      <Text className="font-display text-title text-inkMuted">{t('hud.loading')}</Text>
    </LightRegion>
  );
}

/** A one-shot hint over the Stage: it never takes a touch, so play goes on underneath. */
export function HintOverlay({ text }: { text: string }) {
  return (
    <LightRegion pointerEvents="none" className="absolute inset-x-0 top-16 items-center px-4">
      <Panel className="w-full max-w-md">
        <Text className="text-bodyL text-ink">{text}</Text>
      </Panel>
    </LightRegion>
  );
}

/** A pointer: an ink-outlined arrow with its tip at (0, 0) of its box, pointing along `angle` (radians). */
function Arrow({ tip, angle, fill }: { tip: { x: number; y: number }; angle: number; fill: string }) {
  const size = ARROW_LENGTH;
  // drawn pointing right with the tip at the middle of the right edge; rotated about that tip
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', left: tip.x - size, top: tip.y - size / 2, width: size, height: size, transform: [{ translateX: size / 2 }, { rotate: `${angle}rad` }, { translateX: -size / 2 }] }}
    >
      <Svg width={size} height={size} viewBox="0 0 30 30">
        <Path d="M2 10 H16 V3 L28 15 L16 27 V20 H2 Z" fill={fill} stroke={lightColor.outline} strokeWidth={2.5} strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function CoachLabel({ mark, text }: { mark: CoachMark; text: string }) {
  const isNarrow = mark.label.width < 120;
  return (
    <View
      pointerEvents="none"
      className="absolute items-center justify-center rounded-lg bg-surface px-3"
      style={{ left: mark.label.x, top: mark.label.y, width: mark.label.width, height: mark.label.height, borderWidth: 2, borderColor: lightColor.outline }}
    >
      <Text className={`text-center font-display ${isNarrow ? 'text-body' : 'text-bodyL'} text-ink`}>{text}</Text>
    </View>
  );
}

/**
 * The drawn Coach marks over the Stage's controls. They take no touch, so play goes on underneath;
 * the shell decides which are on (`showMove`, `showMark`).
 */
export function CoachMarksOverlay({ moveText, markText, showMove, showMark }: { moveText: string; markText: string; showMove: boolean; showMark: boolean }) {
  const { width, height } = useWindowDimensions();
  const { move, mark } = coachMarks(width, height);
  return (
    <LightRegion pointerEvents="none" className="absolute inset-0">
      {showMove && (
        <>
          <CoachLabel mark={move} text={moveText} />
          <Arrow tip={move.tip} angle={move.angle} fill={lightColor.accent} />
        </>
      )}
      {showMark && (
        <>
          <CoachLabel mark={mark} text={markText} />
          <Arrow tip={mark.tip} angle={mark.angle} fill={lightColor.accent} />
        </>
      )}
    </LightRegion>
  );
}

/** The close view's Coach marks (Gather, Poste, Marker). Like the walking ones they take no touch. */
export function CloseCoachMarksOverlay({ texts, show }: { texts: { gather: string; poste: string; marker: string }; show: { gather: boolean; poste: boolean; marker: boolean } }) {
  const { width, height } = useWindowDimensions();
  const marks = closeCoachMarks(width, height);
  return (
    <LightRegion pointerEvents="none" className="absolute inset-0">
      {(['gather', 'poste', 'marker'] as const).map(
        (key) =>
          show[key] && (
            <View key={key} pointerEvents="none" className="absolute inset-0">
              <CoachLabel mark={marks[key]} text={texts[key]} />
              <Arrow tip={marks[key].tip} angle={marks[key].angle} fill={lightColor.accent} />
            </View>
          ),
      )}
    </LightRegion>
  );
}

/** The approaching-dog warning: it only warns, with an arrow at the screen edge toward the dog. Never takes a touch. */
export function DogWarningOverlay({ text, bearing }: { text: string; bearing: number | null }) {
  const { width, height } = useWindowDimensions();
  const arrow = bearing === null ? null : edgeArrow(width, height, bearing);
  return (
    <LightRegion pointerEvents="none" className="absolute inset-0">
      <HintOverlay text={text} />
      {arrow && <Arrow tip={arrow.position} angle={arrow.angle} fill={lightColor.danger} />}
    </LightRegion>
  );
}

/** `{n}`-style catalog text with its values filled in. */
const fill = (text: string, values: Record<string, string | number>) => Object.entries(values).reduce((acc, [k, v]) => acc.split(`{${k}}`).join(String(v)), text);

/**
 * The result card of an ended Encounter attempt, over the ended Stage ("Encounters — Paw result card" board):
 * title, 1 to 3 Paws, one line on what the next Paw needs (or "done perfectly" at 3), Retry and Next.
 * Next is always enabled, whatever the Paws.
 */
export function EncounterResultOverlay({ t, title, paws, hint, onRetry, onNext }: { t: Translate; title: string; paws: 1 | 2 | 3; hint: string | null; onRetry: () => void; onNext: () => void }) {
  const pawsLabel = fill(t('encounter.paws'), { n: paws });
  return (
    <Backdrop>
      <View testID="encounter-result" className="items-center gap-3">
        <Text className="text-center font-display text-title text-ink">{title}</Text>
        <EncounterPaws paws={paws} label={pawsLabel} testID="encounter-paws" />
        <Text className="text-center text-label text-inkMuted">{pawsLabel}</Text>
        <Text testID="encounter-hint" className="text-center text-body text-ink">
          {paws === 3 ? t('encounter.perfect') : hint ?? ''}
        </Text>
        <View className="w-full flex-row gap-3">
          <View className="flex-1">
            <Button label={t('encounter.retry')} tone="secondary" onPress={onRetry} testID="encounter-retry" />
          </View>
          <View className="flex-1">
            <Button label={t('encounter.next')} onPress={onNext} testID="encounter-next" />
          </View>
        </View>
      </View>
    </Backdrop>
  );
}

/**
 * The Series progress strip in the Stage chrome, right of the back button: "Encounter n of total" and the kept Paws of the
 * Encounters already played (a gold Paw and its count); the rest are hollow dots. It never takes a touch.
 */
export function SeriesProgressStrip({ t, index, total, kept }: { t: Translate; index: number; total: number; kept: number[] }) {
  const insets = useSafeAreaInsets();
  const top = Math.max(insets?.top ?? 0, 12);
  const left = Math.max(insets?.left ?? 0, 12) + BACK_BUTTON.width + 10;
  const label = fill(t('encounter.progress'), { n: index, total });
  return (
    <LightRegion pointerEvents="none" className="absolute inset-0">
      <View
        testID="series-strip"
        accessible
        accessibilityLabel={label}
        className="flex-row items-center rounded-full bg-surface px-3"
        style={{ position: 'absolute', top, left, minHeight: 44, gap: 8, borderWidth: 2.5, borderColor: lightColor.outline }}
      >
        <Text className="font-display text-body text-ink">{label}</Text>
        {Array.from({ length: total }, (_, i) =>
          kept[i] !== undefined ? (
            <View key={i} testID="series-kept" accessible accessibilityLabel={fill(t('encounter.paws'), { n: kept[i] })} className="flex-row items-center" style={{ gap: 2 }}>
              <EncounterPaws paws={1} size={16} />
              <Text className="font-display text-label text-ink">{kept[i]}</Text>
            </View>
          ) : (
            <View key={i} testID="series-pending" style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: lightColor.outline }} />
          ),
        )}
      </View>
    </LightRegion>
  );
}
