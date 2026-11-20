import { isGoSniffAvailable, type SimState } from '../../src/sim/sim';

/**
 * The Introduced actions a started Stage carries (GLOSSARY: "Introduced action"). An absent field means every
 * kind is Introduced, so old shells, sim tests and other harnesses behave as before. Presentation only.
 */
export function resolveIntroducedKinds(
  options: readonly string[] | undefined,
  lastStart: readonly string[] | undefined,
): readonly string[] | undefined {
  return options ?? lastStart;
}

/** True when the kind is Introduced; an absent set Introduces everything. */
export function isIntroduced(set: readonly string[] | undefined, kind: string): boolean {
  return !set || set.includes(kind);
}

/**
 * Whether the Go Sniff button and prompt are on the HUD: the sim offers it and `go-sniff` is Introduced.
 * The sim's own availability check is unchanged (ADR 0036).
 */
export function goSniffOffered(set: readonly string[] | undefined, sim: SimState): boolean {
  return isIntroduced(set, 'go-sniff') && isGoSniffAvailable(sim);
}

/** The `sniff` input of a tick: a press (button or keyboard) counts only when `go-sniff` is Introduced. */
export function goSniffInput(pressed: boolean, set: readonly string[] | undefined): boolean {
  return pressed && isIntroduced(set, 'go-sniff');
}
