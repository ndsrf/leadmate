import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { ARROW_LENGTH, coachMarks, edgeArrow, type CoachMark } from '../hud/coach';
import type { Translate } from '../i18n';
import { GameButton, LightRegion, Panel } from './ui/components';
import type { ButtonVariant } from './ui/styles';
// The overlays over a running Stage stay Light whatever the Appearance; `Button` and `Row` are shared UI chrome.
import { lightColor, usePalette } from './ui/theme';

/** The shell's standard button, drawn by the game kit; `secondary` sits beside a primary, `quiet` is a link. */
export function Button({ label, onPress, tone = 'primary', disabled }: { label: string; onPress: () => void; tone?: ButtonVariant; disabled?: boolean }) {
  return <GameButton label={label} onPress={onPress} variant={tone} disabled={disabled} />;
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
      <Button label={t('node.back')} tone="quiet" onPress={onExit} />
    </Backdrop>
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
