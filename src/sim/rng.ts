/** Seeded random generator (mulberry32). Every random choice in a Stage comes from here. */
export interface Rng {
  /** Next float in [0, 1). */
  next(): number;
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next() {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** A fresh seed for a new Stage. Only the shell/bundle entry may call this, never the simulation. */
export function newSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}
