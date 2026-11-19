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
