import { theme, type ColorToken, type Palette } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'accent' | 'info' | 'danger';

interface VariantTokens {
  fill: ColorToken | null;
  /** Face while pressed. */
  pressedFill: ColorToken | null;
  label: ColorToken;
}

const VARIANTS: Record<ButtonVariant, VariantTokens> = {
  primary: { fill: 'brand', pressedFill: 'brand', label: 'onBrand' },
  secondary: { fill: 'surface', pressedFill: 'surfaceSunken', label: 'ink' },
  quiet: { fill: null, pressedFill: 'infoSoft', label: 'infoText' },
  accent: { fill: 'accent', pressedFill: 'flame', label: 'onAccent' },
  info: { fill: 'info', pressedFill: 'infoText', label: 'onInfo' },
  danger: { fill: 'danger', pressedFill: 'coral', label: 'onDanger' },
};

export interface ButtonStyle {
  /** Face colour; `null` for the quiet link, which has no face. */
  fill: string | null;
  /** The outline and the offset shadow share this colour. */
  edge: string;
  label: string;
  borderWidth: number;
  /** Where the solid shadow sits behind the face, in points (it never moves). */
  shadowOffset: number;
  /** How far the face travels toward its shadow while pressed, in points. */
  travel: number;
  /** Shadow still visible past the face: `shadowOffset - travel`. */
  visibleShadow: number;
  underline: boolean;
  minHeight: number;
  minWidth: number;
  borderRadius: number;
}

/** Grey out a `#rrggbb` colour by blending toward its own luminance grey. */
export function desaturate(hex: string, amount = 0.7): string {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  const grey = 0.3 * r + 0.59 * g + 0.11 * b;
  const mix = (v: number) => Math.round(v + (grey - v) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Pure style of an ink-outlined button on a solid offset shadow, in palette `color`: pressing moves the
 * face toward the shadow; disabled is flat, grey and outlined in grey; the quiet variant is a link with no face.
 */
export function buttonStyle(color: Palette, variant: ButtonVariant, state: { pressed?: boolean; disabled?: boolean } = {}): ButtonStyle {
  const tokens = VARIANTS[variant];
  const disabled = state.disabled === true;
  const pressed = state.pressed === true && !disabled;
  const quiet = variant === 'quiet';
  const flat = disabled || quiet;
  const shadowOffset = flat ? 0 : theme.depth.rest.x;
  const travel = pressed && !flat ? theme.depth.pressed.translate : 0;
  const fillToken = pressed ? tokens.pressedFill : tokens.fill;
  return {
    fill: disabled ? (quiet ? null : color.disabled) : fillToken === null ? null : color[fillToken],
    edge: disabled ? color.disabledText : quiet ? 'transparent' : color.outline,
    label: disabled ? color.disabledText : color[tokens.label],
    borderWidth: theme.border.ink,
    shadowOffset,
    travel,
    visibleShadow: shadowOffset - travel,
    underline: quiet && !disabled,
    minHeight: quiet ? theme.size.touchMin : 56,
    minWidth: theme.size.touchMin,
    borderRadius: theme.radius.md,
  };
}

/** Touchable size and the hit-slop needed to reach the minimum for a control drawn at `size` points. */
export function touchTarget(size: number): { size: number; hitSlop: number } {
  const target = Math.max(size, theme.size.touchMin);
  return { size: target, hitSlop: Math.ceil((target - size) / 2) };
}

/** Clamp a progress value to a 0-100 width percentage. */
export function progressWidth(value: number, max: number): number {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

/** The three star slots of a rating: filled up to `stars`, empty after. */
export function starSlots(stars: number, total = 3): boolean[] {
  const filled = Math.max(0, Math.min(total, Math.floor(stars)));
  return Array.from({ length: total }, (_, i) => i < filled);
}

export type BadgeTone = 'brand' | 'accent' | 'quiet' | 'info' | 'warn';

export function badgeColors(color: Palette, tone: BadgeTone): { fill: string; label: string } {
  const map: Record<BadgeTone, [ColorToken, ColorToken]> = {
    brand: ['brand', 'onBrand'],
    accent: ['accent', 'onAccent'],
    quiet: ['surfaceSunken', 'ink'],
    info: ['infoSoft', 'infoText'],
    warn: ['accentSoft', 'ink'],
  };
  const [fill, label] = map[tone];
  return { fill: color[fill], label: color[label] };
}

/** A selectable pill: the chosen one is brand green on a short shadow, the others are flat paper. */
export function choiceStyle(color: Palette, selected: boolean): { fill: string; label: string; shadowOffset: number } {
  return selected
    ? { fill: color.brand, label: color.onBrand, shadowOffset: theme.depth.sm.x - 1 }
    : { fill: color.surface, label: color.ink, shadowOffset: 0 };
}

/** The minigame pad: green while it is time to act, paper while waiting; it sinks to the shadow when held. */
export function padStyle(color: Palette, fill: 'brand' | 'quiet', pressed: boolean): { fill: string; label: string; shadowOffset: number; travel: number } {
  const go = fill === 'brand';
  const shadowOffset = theme.depth.md.x;
  return {
    fill: go ? color.brand : color.surfaceSunken,
    label: go ? color.onBrand : color.ink,
    shadowOffset,
    travel: pressed ? shadowOffset - theme.depth.pressed.x : 0,
  };
}
