import { defaultScenario } from '../../sim/config';

/** Retunable in playtests; a 70 kg Handler with a 20 kg Dog reproduces the default 0.8. */
export const PULL_TUNING = { base: defaultScenario.pullStrength, referenceRatio: 3.5, min: 0.3, max: 1.5 };

export const DOG_KG_RANGE = { min: 1, max: 80 } as const;
export const HANDLER_KG_RANGE = { min: 30, max: 200 } as const;

export const isDogKg = (kg: number) => Number.isFinite(kg) && kg >= DOG_KG_RANGE.min && kg <= DOG_KG_RANGE.max;
export const isHandlerKg = (kg: number) => Number.isFinite(kg) && kg >= HANDLER_KG_RANGE.min && kg <= HANDLER_KG_RANGE.max;

/** How strongly the Handler can pull the Dog: grows with Handler weight over Dog weight; skipped weights give the default. */
export function pullFromWeights(dogKg: number | null, handlerKg: number | null): number {
  if (dogKg === null || handlerKg === null || !isDogKg(dogKg) || !isHandlerKg(handlerKg)) return PULL_TUNING.base;
  const raw = (PULL_TUNING.base * (handlerKg / dogKg)) / PULL_TUNING.referenceRatio;
  return Math.max(PULL_TUNING.min, Math.min(PULL_TUNING.max, raw));
}

/** Reads a typed weight (comma or dot decimals); null when it is not a number. */
export function parseKg(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  return text.trim() !== '' && Number.isFinite(n) ? n : null;
}

export interface KgRange {
  min: number;
  max: number;
}

/** The slider's whole-kilogram step for a range: finer for a Dog, coarser for a Handler. */
export const KG_STEP = 1;

export const clampKg = (kg: number, range: KgRange): number => Math.max(range.min, Math.min(range.max, kg));

/** Where a weight sits along a slider track, 0 to 1; a weight outside the range pins to an end. */
export function kgToFraction(kg: number, range: KgRange): number {
  return (clampKg(kg, range) - range.min) / (range.max - range.min);
}

/** The weight a point along the track stands for, snapped to `step` kilograms. */
export function fractionToKg(fraction: number, range: KgRange, step = KG_STEP): number {
  const f = Math.max(0, Math.min(1, Number.isFinite(fraction) ? fraction : 0));
  const snapped = Math.round((range.min + f * (range.max - range.min)) / step) * step;
  return clampKg(snapped, range);
}

/** One step up or down from `kg`; an empty or out-of-range start counts from `start`. */
export function stepKg(kg: number | null, direction: 1 | -1, range: KgRange, start: number, step = KG_STEP): number {
  const from = kg !== null && Number.isFinite(kg) ? kg : start;
  return clampKg(Math.round((from + direction * step) / step) * step, range);
}

/** A weight as the short text the slider bubble and the field show: whole numbers without decimals. */
export function kgText(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : String(Math.round(kg * 10) / 10);
}

/**
 * The slider's value for the typed text: the number when it is inside the range, otherwise null so the thumb stays where it was.
 * Typing and dragging write the same text.
 */
export function kgFromText(text: string, range: KgRange): number | null {
  const kg = parseKg(text);
  return kg !== null && kg >= range.min && kg <= range.max ? kg : null;
}
