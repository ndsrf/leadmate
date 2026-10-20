import { color, theme, type ColorToken } from './theme';

export type ButtonVariant = 'primary' | 'quiet' | 'accent' | 'info';

interface Palette {
  fill: ColorToken;
  edge: ColorToken;
  label: ColorToken;
}

const PALETTES: Record<ButtonVariant, Palette> = {
  primary: { fill: 'brand', edge: 'brandEdge', label: 'onBrand' },
  quiet: { fill: 'quiet', edge: 'quietEdge', label: 'onQuiet' },
  accent: { fill: 'accent', edge: 'accentEdge', label: 'onAccent' },
  info: { fill: 'info', edge: 'infoEdge', label: 'onInfo' },
};

export interface ButtonStyle {
  fill: string;
  edge: string;
  label: string;
  /** Height of the darker bottom edge; it collapses when pressed. */
  edgeHeight: number;
  /** How far the face sinks down, in points. */
  offsetY: number;
  opacity: number;
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

/** Pure style of a raised button: the face sinks by the edge height while pressed; disabled is desaturated. */
export function buttonStyle(variant: ButtonVariant, state: { pressed?: boolean; disabled?: boolean } = {}): ButtonStyle {
  const palette = PALETTES[variant];
  const disabled = state.disabled === true;
  const pressed = state.pressed === true && !disabled;
  const edge = theme.depth.edge;
  return {
    fill: disabled ? desaturate(color[palette.fill]) : color[palette.fill],
    edge: disabled ? desaturate(color[palette.edge]) : color[palette.edge],
    label: color[palette.label],
    edgeHeight: pressed ? 0 : edge,
    offsetY: pressed ? edge : 0,
    opacity: disabled ? 0.6 : 1,
    minHeight: theme.touchMin,
    minWidth: theme.touchMin,
    borderRadius: theme.radius.md,
  };
}

/** Touchable size and the hit-slop needed to reach the minimum for a control drawn at `size` points. */
export function touchTarget(size: number): { size: number; hitSlop: number } {
  const target = Math.max(size, theme.touchMin);
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

export function badgeColors(tone: BadgeTone): { fill: string; label: string } {
  const map: Record<BadgeTone, [ColorToken, ColorToken]> = {
    brand: ['brand', 'onBrand'],
    accent: ['accent', 'onAccent'],
    quiet: ['quiet', 'onQuiet'],
    info: ['info', 'onInfo'],
    warn: ['warn', 'onWarn'],
  };
  const [fill, label] = map[tone];
  return { fill: color[fill], label: color[label] };
}
