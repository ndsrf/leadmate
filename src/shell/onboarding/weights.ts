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
