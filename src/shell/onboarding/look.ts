import { DOG_COAT_NAMES, type DogCoat, type ScenarioConfig } from '../../sim/config';
import type { DogRecord } from '../dogRecord';

export { DOG_COAT_NAMES, type DogCoat };

export const isCoat = (v: unknown): v is DogCoat => (DOG_COAT_NAMES as readonly unknown[]).includes(v);

/** The sprite size for a Dog of this weight: small dogs are drawn smaller, large ones bigger; no weight gives medium. */
export function dogScaleFromKg(kg: number | null): number {
  if (kg === null) return 1;
  if (kg <= 7) return 0.8;
  if (kg <= 15) return 0.9;
  if (kg <= 30) return 1;
  return 1.12;
}

/** How the Dog looks in a Stage (visual only): the chosen coat and a size from its weight. */
export function lookOf(record: DogRecord): NonNullable<ScenarioConfig['look']> {
  return { dogCoat: record.coat, dogScale: dogScaleFromKg(record.weights.dogKg) };
}
