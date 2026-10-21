import grass from '../assets/kenney/grass.png';
import roadEW from '../assets/kenney/roadEW.png';
import roadNS from '../assets/kenney/roadNS.png';

/** Kenney "Isometric Roads" ground tiles (CC0), inlined into the single-file bundle. The props and characters are in the atlas (`sprites.ts`). */
export const TEXTURES = { grass, roadEW, roadNS } as const;
export type TextureKey = keyof typeof TEXTURES;

/** Ground tiles are 100x65 px; the top face is a 100x50 diamond. */
export const TILE_ORIGIN_Y = 25 / 65;
