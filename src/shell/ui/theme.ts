import tokens from './tokens.json';

/**
 * The one source of colour, type, radius, depth and spacing for the shell and the Stage HUD. The
 * values live in `tokens.json` so `tailwind.config.js` (plain Node) and the HUD token generator can
 * read them too; restyling the game is a change to that file.
 */
export const theme = tokens;
export type ColorToken = keyof typeof tokens.color;
export const color = tokens.color;

/** A text/background pair the kit draws; `theme.test.ts` checks each against `MIN_CONTRAST`. */
export const TEXT_PAIRS: readonly (readonly [text: ColorToken, background: ColorToken])[] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['inkMuted', 'surface'],
  ['inkMuted', 'bg'],
  ['inkDim', 'surface'],
  ['inkDim', 'bg'],
  ['onBrand', 'brand'],
  ['onQuiet', 'quiet'],
  ['onAccent', 'accent'],
  ['onInfo', 'info'],
  ['onWarn', 'warn'],
  ['onLocked', 'locked'],
  ['ink', 'surfaceHigh'],
  ['accent', 'surface'],
  ['brand', 'surface'],
];

export const MIN_CONTRAST = 4.5;

function channel(v: number): number {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG contrast ratio of two `#rrggbb` colours, 1 to 21. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
