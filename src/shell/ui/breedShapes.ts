import type { BreedId } from '../onboarding/breeds';

export type EarKind = 'prick' | 'floppy' | 'bat' | 'long' | 'rose';
export type TailKind = 'sickle' | 'curl' | 'straight' | 'plume' | 'stub' | 'pom';

/**
 * What makes one breed's silhouette differ from another's, in `BREED_VIEW` units (side view facing right,
 * ground at y = 100). `BreedArt` composes every breed from the same parts, so a new breed is one entry here.
 */
export interface BreedShape {
  bodyRx: number;
  bodyRy: number;
  /** Visible leg length under the body. */
  legH: number;
  legW: number;
  headR: number;
  /** Muzzle length and height. */
  snout: { l: number; h: number };
  ears: { kind: EarKind; size: number };
  tail: { kind: TailKind; size: number };
  /** Feathering on the chest, belly and legs. */
  fluff?: boolean;
  /** A rounded tuft on top of the head. */
  topknot?: boolean;
  /** The back falls toward the rear. */
  sloped?: boolean;
  /** How far the head sits above the shoulders (more is a prouder neck). */
  neck: number;
}

export const BREED_VIEW = { w: 160, h: 110 } as const;
export const GROUND_Y = 100;

export const BREED_SHAPES: Record<BreedId, BreedShape> = {
  labrador: { bodyRx: 42, bodyRy: 21, legH: 26, legW: 11, headR: 15, snout: { l: 18, h: 13 }, ears: { kind: 'floppy', size: 1 }, tail: { kind: 'straight', size: 1 }, neck: 12 },
  golden: { bodyRx: 42, bodyRy: 21, legH: 26, legW: 11, headR: 15, snout: { l: 18, h: 12 }, ears: { kind: 'floppy', size: 1.05 }, tail: { kind: 'plume', size: 1 }, fluff: true, neck: 12 },
  pastor: { bodyRx: 44, bodyRy: 20, legH: 30, legW: 10, headR: 14, snout: { l: 20, h: 11 }, ears: { kind: 'prick', size: 1.15 }, tail: { kind: 'plume', size: 1 }, sloped: true, neck: 12 },
  collie: { bodyRx: 38, bodyRy: 17, legH: 30, legW: 8, headR: 13, snout: { l: 19, h: 10 }, ears: { kind: 'rose', size: 1 }, tail: { kind: 'plume', size: 1.1 }, fluff: true, neck: 13 },
  frances: { bodyRx: 32, bodyRy: 20, legH: 20, legW: 11, headR: 16, snout: { l: 8, h: 11 }, ears: { kind: 'bat', size: 1.1 }, tail: { kind: 'stub', size: 1 }, neck: 8 },
  chihuahua: { bodyRx: 24, bodyRy: 13, legH: 24, legW: 6, headR: 15, snout: { l: 9, h: 8 }, ears: { kind: 'bat', size: 1.3 }, tail: { kind: 'sickle', size: 0.8 }, neck: 10 },
  yorkshire: { bodyRx: 26, bodyRy: 15, legH: 20, legW: 7, headR: 13, snout: { l: 10, h: 9 }, ears: { kind: 'prick', size: 0.9 }, tail: { kind: 'sickle', size: 0.9 }, fluff: true, topknot: true, neck: 8 },
  caniche: { bodyRx: 30, bodyRy: 17, legH: 28, legW: 7, headR: 13, snout: { l: 17, h: 9 }, ears: { kind: 'long', size: 0.9 }, tail: { kind: 'pom', size: 1 }, fluff: true, topknot: true, neck: 13 },
  teckel: { bodyRx: 46, bodyRy: 14, legH: 12, legW: 8, headR: 13, snout: { l: 20, h: 10 }, ears: { kind: 'long', size: 1 }, tail: { kind: 'straight', size: 0.9 }, neck: 7 },
  beagle: { bodyRx: 36, bodyRy: 18, legH: 24, legW: 9, headR: 14, snout: { l: 16, h: 11 }, ears: { kind: 'long', size: 1 }, tail: { kind: 'sickle', size: 1 }, neck: 10 },
  cocker: { bodyRx: 34, bodyRy: 18, legH: 20, legW: 9, headR: 14, snout: { l: 16, h: 11 }, ears: { kind: 'long', size: 1.25 }, tail: { kind: 'plume', size: 0.8 }, fluff: true, neck: 9 },
  husky: { bodyRx: 38, bodyRy: 19, legH: 27, legW: 10, headR: 14, snout: { l: 16, h: 10 }, ears: { kind: 'prick', size: 1 }, tail: { kind: 'curl', size: 1.1 }, fluff: true, neck: 11 },
  boxer: { bodyRx: 38, bodyRy: 20, legH: 30, legW: 10, headR: 15, snout: { l: 9, h: 13 }, ears: { kind: 'rose', size: 1.1 }, tail: { kind: 'stub', size: 1 }, neck: 12 },
  jackrussell: { bodyRx: 30, bodyRy: 15, legH: 24, legW: 7, headR: 12, snout: { l: 14, h: 9 }, ears: { kind: 'rose', size: 0.95 }, tail: { kind: 'sickle', size: 0.9 }, neck: 9 },
  podenco: { bodyRx: 38, bodyRy: 14, legH: 36, legW: 7, headR: 12, snout: { l: 24, h: 8 }, ears: { kind: 'prick', size: 1.5 }, tail: { kind: 'sickle', size: 1.1 }, neck: 14 },
  mestizo: { bodyRx: 36, bodyRy: 18, legH: 25, legW: 9, headR: 14, snout: { l: 15, h: 11 }, ears: { kind: 'rose', size: 1.1 }, tail: { kind: 'sickle', size: 1 }, neck: 11 },
  otra: { bodyRx: 36, bodyRy: 18, legH: 25, legW: 9, headR: 14, snout: { l: 15, h: 11 }, ears: { kind: 'rose', size: 1.1 }, tail: { kind: 'sickle', size: 1 }, neck: 11 },
};

/** `otra` is drawn as `mestizo`. */
export const artBreed = (breed: BreedId): BreedId => (breed === 'otra' ? 'mestizo' : breed);

export interface BreedGeometry {
  bodyCx: number;
  bodyCy: number;
  bodyTop: number;
  head: { x: number; y: number };
  snout: { x: number; y: number };
  rump: { x: number; y: number };
  legX: { front: number; back: number };
}

/** Where the parts sit for a shape; pure so tests can check no breed draws outside the view. */
export function geometryOf(s: BreedShape): BreedGeometry {
  const bodyCy = GROUND_Y - s.legH - s.bodyRy + 4;
  const bodyCx = 70;
  const bodyTop = bodyCy - s.bodyRy;
  const head = { x: Math.min(bodyCx + s.bodyRx + s.headR * 0.2, BREED_VIEW.w - s.headR - s.snout.l - 6), y: bodyTop - s.neck + s.headR * 0.4 };
  return {
    bodyCx,
    bodyCy,
    bodyTop,
    head,
    snout: { x: head.x + s.headR * 0.45, y: head.y + s.headR * 0.25 },
    rump: { x: bodyCx - s.bodyRx + 3, y: bodyCy - s.bodyRy * (s.sloped ? 0.1 : 0.45) },
    legX: { front: bodyCx + s.bodyRx * 0.55, back: bodyCx - s.bodyRx * 0.55 },
  };
}

const EAR_RISE: Record<BreedShape['ears']['kind'], number> = { prick: 22, bat: 22, rose: 8, floppy: 0, long: 0 };

/** The extent of a drawn breed before fitting: tall ears, tails and long muzzles can leave the view. */
export function extentOf(s: BreedShape): { left: number; right: number; top: number } {
  const g = geometryOf(s);
  return {
    left: g.bodyCx - s.bodyRx - 24 * s.tail.size,
    right: g.snout.x + s.snout.l + s.headR * 0.5 + 2,
    top: g.head.y - s.headR - Math.max(EAR_RISE[s.ears.kind] * s.ears.size, s.topknot ? s.headR * 0.9 : 0),
  };
}

const MARGIN = 4;
const PIVOT = { x: BREED_VIEW.w / 2, y: GROUND_Y };

/** The scale, about the middle of the ground line, that keeps the whole silhouette inside the view. */
export function fitScale(s: BreedShape): number {
  const e = extentOf(s);
  const byTop = (GROUND_Y - MARGIN) / (GROUND_Y - e.top);
  const byLeft = (PIVOT.x - MARGIN) / (PIVOT.x - e.left);
  const byRight = (BREED_VIEW.w - MARGIN - PIVOT.x) / (e.right - PIVOT.x);
  return Math.min(1, byTop, byLeft, byRight);
}

export const FIT_PIVOT = PIVOT;
