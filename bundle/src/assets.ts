import coniferTall from '../assets/kenney/coniferTall.png';
import coniferShort from '../assets/kenney/coniferShort.png';
import grass from '../assets/kenney/grass.png';
import roadEW from '../assets/kenney/roadEW.png';
import roadNS from '../assets/kenney/roadNS.png';
import treeAltShort from '../assets/kenney/treeAltShort.png';
import treeShort from '../assets/kenney/treeShort.png';
import treeTall from '../assets/kenney/treeTall.png';

/** Kenney "Isometric Roads" (CC0), inlined into the single-file bundle. */
export const TEXTURES = { grass, roadEW, roadNS, treeShort, treeTall, treeAltShort, coniferShort, coniferTall } as const;
export type TextureKey = keyof typeof TEXTURES;
export const TREES: TextureKey[] = ['treeShort', 'treeTall', 'treeAltShort', 'coniferShort', 'coniferTall'];

/** Ground tiles are 100x65 px; the top face is a 100x50 diamond. */
export const TILE_ORIGIN_Y = 25 / 65;
