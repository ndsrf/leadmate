/** Longer text must still fit: shrinks the font size until the string fits `maxWidth`. */
export const CHAR_WIDTH_EM = 0.6;
export const MIN_FONT_PX = 9;

/** Estimated rendered width of `text` at `fontPx`. */
export function textWidth(text: string, fontPx: number): number {
  return text.length * fontPx * CHAR_WIDTH_EM;
}

export function fitFontSize(text: string, maxWidth: number, basePx: number): number {
  if (text.length === 0) return basePx;
  const fit = maxWidth / (text.length * CHAR_WIDTH_EM);
  return Math.max(MIN_FONT_PX, Math.min(basePx, Math.floor(fit)));
}
