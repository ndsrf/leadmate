import type { DogCoat } from './look';

export type SizeBand = 'mini' | 'small' | 'medium' | 'large';

export interface Breed {
  id: string;
  size: SizeBand;
  /** Typical adult weight in kilograms; null when there is no typical range. */
  kg: readonly [min: number, max: number] | null;
  defaultCoat: DogCoat;
}

/** The launch breeds in the order the picker shows them (the first six are the ones visible before expanding), then Mestizo and "Otra raza". */
export const BREEDS = [
  { id: 'labrador', size: 'large', kg: [25, 36], defaultCoat: 'golden' },
  { id: 'golden', size: 'large', kg: [25, 34], defaultCoat: 'golden' },
  { id: 'pastor', size: 'large', kg: [22, 40], defaultCoat: 'black' },
  { id: 'collie', size: 'medium', kg: [14, 20], defaultCoat: 'black' },
  { id: 'frances', size: 'small', kg: [8, 14], defaultCoat: 'cream' },
  { id: 'chihuahua', size: 'mini', kg: [1.5, 3], defaultCoat: 'cream' },
  { id: 'yorkshire', size: 'mini', kg: [2, 3.5], defaultCoat: 'grey' },
  { id: 'caniche', size: 'small', kg: [5, 10], defaultCoat: 'white' },
  { id: 'teckel', size: 'small', kg: [7, 14], defaultCoat: 'chocolate' },
  { id: 'beagle', size: 'small', kg: [9, 14], defaultCoat: 'cream' },
  { id: 'cocker', size: 'small', kg: [12, 15], defaultCoat: 'golden' },
  { id: 'husky', size: 'medium', kg: [16, 27], defaultCoat: 'grey' },
  { id: 'boxer', size: 'large', kg: [25, 32], defaultCoat: 'red' },
  { id: 'jackrussell', size: 'small', kg: [5, 8], defaultCoat: 'white' },
  { id: 'podenco', size: 'medium', kg: [18, 28], defaultCoat: 'red' },
  { id: 'mestizo', size: 'medium', kg: [5, 35], defaultCoat: 'golden' },
  { id: 'otra', size: 'medium', kg: null, defaultCoat: 'golden' },
] as const satisfies readonly Breed[];

export type BreedId = (typeof BREEDS)[number]['id'];

export const DEFAULT_BREED: BreedId = 'mestizo';

/** How many breeds the picker shows before it is expanded. */
export const BREEDS_COLLAPSED = 6;

export const isBreed = (v: unknown): v is BreedId => BREEDS.some((b) => b.id === v);

export function breedOf(id: BreedId): (typeof BREEDS)[number] {
  return BREEDS.find((b) => b.id === id)!;
}

/** The middle of the breed's typical weight, to one decimal; null for a breed with no range. */
export function breedWeightMid(id: BreedId): number | null {
  const kg = breedOf(id).kg;
  return kg === null ? null : Math.round(((kg[0] + kg[1]) / 2) * 10) / 10;
}
