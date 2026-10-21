import atlasUrl from '../assets/kenney/sprites.png';
import atlas from '../assets/kenney/sprites.json';
import type { SceneryItem } from '../../src/sim/geometry';
import type { DogCoat } from '../../src/sim/config';
import type { Vec2 } from '../../src/sim/vec';

/**
 * The sprite atlas: Kenney CC0 props (Nature Kit, Furniture Kit) and isometric renders of his Mini Characters,
 * Cube Pets, Car Kit and City Kits, made by `scripts/kenney`. Frame names and pivots come from the atlas JSON.
 */
export const ATLAS = 'kenney';
export { atlasUrl, atlas };

type Frames = Record<string, { pivot: { x: number; y: number }; res: number }>;
const frames = atlas.frames as unknown as Frames;
export const hasFrame = (name: string): boolean => name in frames;
/** How many times larger than the game scale a frame is drawn (the camera zooms in on the characters). */
export const resOf = (name: string): number => frames[name].res;
export const pivotOf = (name: string): { x: number; y: number } => frames[name].pivot;

/** The nearest of the eight facings drawn for the characters, in degrees (0 = +x of the world, up and to the right on screen). */
export function facingDegrees(v: Vec2): number {
  const deg = (Math.atan2(v.y, v.x) * 180) / Math.PI;
  return (((Math.round(deg / 45) * 45) % 360) + 360) % 360;
}

/** Which frames a prop type draws, and how its `angle` picks between them. */
interface SpriteKind {
  frames: readonly string[];
  /** `axes4`: frame_0/90/180/270; `axes2`: _still0_0/90; `long`: _still0_0/45/90/135; otherwise a single frame. */
  turn?: 'axes4' | 'axes2' | 'long';
  /** Extra scale on top of the atlas size. */
  scale?: number;
}

const CARS = ['car_sedan', 'car_suv', 'car_van', 'car_taxi'];
export const PROP_SPRITES: Record<string, SpriteKind> = {
  tree: { frames: ['tree_default', 'tree_oak', 'tree_detailed', 'tree_tall', 'tree_fat'] },
  conifer: { frames: ['tree_pineTallA', 'tree_pineRoundC', 'tree_cone', 'tree_pineSmallA'] },
  bush: { frames: ['plant_bush', 'plant_bushLarge', 'plant_bushDetailed'] },
  flower_bed: { frames: ['planter'], turn: 'axes2' },
  bench: { frames: ['bench'], turn: 'axes4', scale: 0.62 },
  sofa: { frames: ['loungeSofa'], turn: 'axes4' },
  picnic_table: { frames: ['tableCross'], turn: 'axes4', scale: 0.8 },
  parked_car: { frames: CARS, turn: 'axes2' },
  fence: { frames: ['fence'], turn: 'long' },
  lamp_post: { frames: ['lamp_post'], turn: 'axes2' },
  bin: { frames: ['trashcan'] },
  trash_can: { frames: ['trashcan'] },
  sign: { frames: ['sign'] },
  plant: { frames: ['pottedPlant'] },
  lamp: { frames: ['lampRoundFloor'] },
  coat_rack: { frames: ['coatRack'] },
  shelf: { frames: ['bookcaseClosed'] },
  cabinet: { frames: ['sideTableDrawers', 'cabinetTelevision'] },
  stool: { frames: ['stoolBar'] },
};

const nearest = (deg: number, step: number, mod: number): number => ((Math.round(deg / step) * step) % mod + mod) % mod;

export const propScale = (type: string): number => PROP_SPRITES[type]?.scale ?? 1;

/** The atlas frame for a prop, or undefined when the prop is drawn from shapes. `n` is its index, for picking a variant. */
export function propFrame(item: SceneryItem, n: number, pick: (k: number) => number): string | undefined {
  const kind = PROP_SPRITES[item.type];
  if (!kind) return undefined;
  const base = kind.frames[Math.floor(pick(n * 13 + item.pos.x) * kind.frames.length)];
  const deg = (((item.angle ?? 0) * 180) / Math.PI);
  let name: string;
  switch (kind.turn) {
    case 'axes4': name = `${base}_${nearest(deg, 90, 360)}`; break;
    case 'axes2': name = `${base}_still0_${nearest(deg, 90, 180)}`; break;
    case 'long': name = `${base}_still0_${nearest(deg, 45, 180)}`; break;
    default: name = base;
  }
  return hasFrame(name) ? name : undefined;
}

/** Dog coats: a tint over the neutral Dog sprite. */
export const DOG_COATS: Record<DogCoat, number> = {
  golden: 0xf0b45c,
  black: 0x55555c,
  chocolate: 0x9a6a4a,
  cream: 0xf6e3bc,
  white: 0xffffff,
  grey: 0xb0b6c2,
  red: 0xe2703a,
};
